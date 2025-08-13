import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertGameFileSchema, insertCommunityThemeSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";
import yauzl from "yauzl";
import { promisify } from "util";
import { detectClientVersion } from "./client-detector";
import { validateZipFile, sanitizeFileName, isPathSafe } from "./zip-validator";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 80 * 1024 * 1024, // 80MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept HTML, ZIP, JAR, and JSON files
    const isHtml = file.mimetype === 'text/html' || 
                   file.originalname.toLowerCase().endsWith('.html') || 
                   file.originalname.toLowerCase().endsWith('.htm');

    const isZip = file.mimetype === 'application/zip' ||
                  file.mimetype === 'application/x-zip-compressed' ||
                  file.originalname.toLowerCase().endsWith('.zip');

    const isJar = file.mimetype === 'application/java-archive' ||
                  file.originalname.toLowerCase().endsWith('.jar');

    const isJson = file.mimetype === 'application/json' ||
                   file.mimetype === 'text/json' ||
                   file.originalname.toLowerCase().endsWith('.json');

    const isExe = file.mimetype === 'application/x-msdownload' ||
                  file.mimetype === 'application/x-executable' ||
                  file.mimetype === 'application/octet-stream' ||
                  file.originalname.toLowerCase().endsWith('.exe');

    if (isHtml || isZip || isJar || isJson || isExe) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Helper function to extract ZIP files and analyze contents
async function extractZipAndAnalyzeContents(zipPath: string, extractDir: string): Promise<{ 
  type: 'html' | 'jar';
  htmlPath?: string; 
  jarFiles?: string[];
  originalName: string; 
  extractedFiles?: number; 
  detectionMethod?: string; 
  warnings?: string[];
  fileTypes?: Record<string, number>;
  structure?: string[];
} | null> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(err);
        return;
      }

      if (!zipfile) {
        reject(new Error('Failed to open ZIP file'));
        return;
      }

      const htmlFiles: string[] = [];
      const jarFiles: string[] = [];
      const allFiles: string[] = [];

      zipfile.readEntry();

      zipfile.on("entry", (entry) => {
        const fileName = entry.fileName;
        allFiles.push(fileName);

        // Skip directories
        if (/\/$/.test(fileName)) {
          zipfile.readEntry();
          return;
        }

        // Check file types
        if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
          htmlFiles.push(fileName);
        } else if (fileName.toLowerCase().endsWith('.jar')) {
          jarFiles.push(fileName);
        }

        // Extract all files
        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) {
            reject(err);
            return;
          }

          if (!readStream) {
            zipfile.readEntry();
            return;
          }

          const outputPath = path.join(extractDir, fileName);
          const outputDir = path.dirname(outputPath);

          // Create directory if it doesn't exist
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const writeStream = fs.createWriteStream(outputPath);
          readStream.pipe(writeStream);

          writeStream.on('close', () => {
            zipfile.readEntry();
          });
        });
      });

      zipfile.on("end", () => {
        // Determine client type based on extracted files
        let clientType: 'html' | 'jar' | null = null;
        let mainFile = null;
        let originalName = '';
        let mainHtml: string | null = null;

        if (htmlFiles.length > 0) {
          clientType = 'html';

          // Enhanced main HTML file detection with priority system
          const priorityPatterns = [
            /^index\.html?$/i,
            /^main\.html?$/i,
            /^game\.html?$/i,
            /^client\.html?$/i,
            /^eaglercraft\.html?$/i,
            /^launcher\.html?$/i,
            /^start\.html?$/i,
            /^play\.html?$/i
          ];

          // First, look for exact matches in root directory
          for (const pattern of priorityPatterns) {
            mainHtml = htmlFiles.find(f => {
              const fileName = f.split('/').pop() || '';
              return pattern.test(fileName) && !f.includes('/');
            }) || null;
            if (mainHtml) break;
          }

          // If no exact match, look for files containing these keywords
          if (!mainHtml) {
            const keywordPatterns = ['index', 'main', 'game', 'client', 'eaglercraft', 'launcher'];
            for (const keyword of keywordPatterns) {
              mainHtml = htmlFiles.find(f => {
                const fileName = f.split('/').pop() || '';
                return fileName.toLowerCase().includes(keyword) && fileName.toLowerCase().endsWith('.html');
              }) || null;
              if (mainHtml) break;
            }
          }

          // If still no main file, use the first HTML file in root directory
          if (!mainHtml) {
            mainHtml = htmlFiles.find(f => !f.includes('/')) || htmlFiles[0] || null;
          }

          if (mainHtml) {
            mainFile = path.join(extractDir, mainHtml);
            originalName = path.basename(mainHtml);
          }
        } else if (jarFiles.length > 0) {
          clientType = 'jar';
          // For JAR clients, use the ZIP name as the original name
          originalName = path.basename(zipPath, '.zip');
        } else {
          // Check if we have any other supported files
          const jsonFiles = allFiles.filter(f => f.toLowerCase().endsWith('.json'));
          if (jsonFiles.length > 0) {
            // If we have JSON files but no JAR/HTML, treat as configuration
            reject(new Error('ZIP contains configuration files but no executable client files (HTML or JAR)'));
          } else {
            reject(new Error('No supported files (HTML or JAR) found in ZIP archive'));
          }
          return;
        }

        // Generate warnings based on file structure analysis
        const warnings: string[] = [];

        // Check for common issues
        if (htmlFiles.length > 5) {
          warnings.push(`Found ${htmlFiles.length} HTML files - may indicate complex structure`);
        }

        if (mainHtml && mainHtml.includes('/')) {
          warnings.push('Main HTML file found in subdirectory - may affect relative paths');
        }

        // Analyze file types for better insights
        const fileTypes: Record<string, number> = {};
        allFiles.forEach(f => {
          const ext = f.split('.').pop()?.toLowerCase() || 'unknown';
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        });

        const hasAssets = allFiles.some(f => 
          f.toLowerCase().includes('.js') || 
          f.toLowerCase().includes('.css') || 
          f.toLowerCase().includes('.png') ||
          f.toLowerCase().includes('.jpg') ||
          f.toLowerCase().includes('.gif') ||
          f.toLowerCase().includes('.ico')
        );

        if (!hasAssets) {
          warnings.push('No common asset files detected - game may not function properly');
        }

        // Check for potential Eaglercraft-specific indicators
        const hasEaglerAssets = allFiles.some(f => 
          f.toLowerCase().includes('eagler') ||
          f.toLowerCase().includes('classes.js') ||
          f.toLowerCase().includes('assets/minecraft')
        );

        if (hasEaglerAssets) {
          warnings.unshift('Eaglercraft client detected - optimized loading enabled');
        }

        // Additional structure warnings
        const nestedLevel = Math.max(...allFiles.map(f => f.split('/').length - 1));
        if (nestedLevel > 3) {
          warnings.push(`Deep directory structure (${nestedLevel} levels) - may cause loading issues`);
        }

        // Clear timeout on successful completion
        clearTimeout(timeout);

        // Log detection results for debugging
        console.log(`ZIP extraction: Found ${htmlFiles.length} HTML files, selected: ${mainHtml}`);

        const result = {
          type: clientType as 'html' | 'jar',
          originalName,
          extractedFiles: allFiles.length,
          warnings,
          fileTypes,
          structure: allFiles.slice(0, 20) // First 20 files for structure preview
        };

        if (clientType === 'html') {
          (result as any).htmlPath = mainFile;
          (result as any).detectionMethod = mainFile === htmlFiles[0] ? 'fallback' : 'pattern-match';
        } else if (clientType === 'jar') {
          (result as any).jarFiles = jarFiles;
          (result as any).detectionMethod = 'jar-detected';
        }

        resolve(result);
      });

      zipfile.on("error", (err) => {
        console.error('ZIP extraction error:', err);
        reject(new Error(`Failed to extract ZIP file: ${err.message}`));
      });

      // Add timeout for extraction process
      const timeout = setTimeout(() => {
        reject(new Error('ZIP extraction timed out after 30 seconds'));
      }, 30000);
    });
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all uploaded files
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.getAllGameFiles();
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Upload a new file
  app.post("/api/files/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let finalFilePath = req.file.path;
      let finalOriginalName = req.file.originalname;
      let finalContentType = req.file.mimetype || 'text/html';

      // Set appropriate content type for JAR, JSON, EXE, and Linux executable files
      if (req.file.originalname.toLowerCase().endsWith('.jar')) {
        finalContentType = 'application/java-archive';
      } else if (req.file.originalname.toLowerCase().endsWith('.json')) {
        finalContentType = 'application/json';
      } else if (req.file.originalname.toLowerCase().endsWith('.exe')) {
        finalContentType = 'application/x-msdownload';
      } else if (req.file.originalname.toLowerCase().endsWith('.appimage')) {
        finalContentType = 'application/x-appimage';
      } else if (req.file.originalname.toLowerCase().endsWith('.run')) {
        finalContentType = 'application/x-executable';
      } else if (req.file.mimetype === 'application/x-executable' || 
                 req.file.mimetype === 'application/x-elf') {
        finalContentType = 'application/x-executable';
      }

      // Check if uploaded file is a ZIP
      const isZip = req.file.mimetype === 'application/zip' ||
                   req.file.mimetype === 'application/x-zip-compressed' ||
                   req.file.originalname.toLowerCase().endsWith('.zip');

      if (isZip) {
        try {
          // Create extraction directory
          const extractDir = path.join(uploadDir, `extracted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
          fs.mkdirSync(extractDir, { recursive: true });

          // Extract ZIP and analyze contents
          const result = await extractZipAndAnalyzeContents(req.file.path, extractDir);

          if (!result) {
            // Clean up
            fs.rmSync(extractDir, { recursive: true, force: true });
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "No supported files found in ZIP archive" });
          }

          // Update file data based on extracted content type
          if (result.type === 'html') {
            finalFilePath = result.htmlPath!;
            finalOriginalName = result.originalName;
            finalContentType = 'text/html';
          } else if (result.type === 'jar') {
            // For JAR clients, keep ZIP structure but mark as JAR type
            finalFilePath = extractDir; // Store directory path for JAR clients
            finalOriginalName = req.file.originalname;
            finalContentType = 'application/java-archive';
          }

          // Clean up original ZIP file
          fs.unlinkSync(req.file.path);

        } catch (zipError) {
          console.error("Error extracting ZIP:", zipError);
          // Clean up on error
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ 
            message: "Failed to extract ZIP file. Please ensure it contains valid game files." 
          });
        }
      }

      // Detect client version and compatibility information
      const detectionResult = await detectClientVersion(finalFilePath);

      const fileData = {
        name: path.basename(finalFilePath),
        originalName: finalOriginalName,
        size: fs.statSync(finalFilePath).size,
        contentType: finalContentType,
        filePath: finalFilePath,
        clientVersion: detectionResult.clientVersion,
        minecraftVersion: detectionResult.minecraftVersion,
        clientType: detectionResult.clientType,
        compatibilityWarnings: detectionResult.compatibilityWarnings,
      };

      const validatedData = insertGameFileSchema.parse(fileData);
      const savedFile = await storage.createGameFile(validatedData);

      res.json(savedFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid file data", errors: error.errors });
      } else if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ message: "File too large. Maximum size is 80MB." });
        } else {
          res.status(400).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: "Failed to upload file" });
      }
    }
  });

  // Download individual files from extracted archives
  app.get('/api/files/:id/download/:filename', async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const filename = decodeURIComponent(req.params.filename);

      const file = await storage.getGameFile(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // For JAR clients, the filePath is the extracted directory
      let searchPath = file.filePath;
      let filePath = '';

      // Find the file in the extracted directory structure
      const findFileRecursively = (dir: string, targetFile: string): string | null => {
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
          const fullPath = path.join(dir, file.name);

          if (file.isDirectory()) {
            const result = findFileRecursively(fullPath, targetFile);
            if (result) return result;
          } else if (file.name === targetFile) {
            return fullPath;
          }
        }
        return null;
      };

      const foundPath = findFileRecursively(searchPath, filename);
      if (!foundPath) {
        return res.status(404).json({ error: 'File not found in archive' });
      }

      filePath = foundPath;

      // Security check - ensure file is within the extracted directory
      if (!filePath.startsWith(searchPath)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) {
        return res.status(404).json({ error: 'Not a file' });
      }

      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
      res.setHeader('Content-Length', stat.size);

      // Set content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.jar') {
        res.setHeader('Content-Type', 'application/java-archive');
      } else if (ext === '.json') {
        res.setHeader('Content-Type', 'application/json');
      } else {
        res.setHeader('Content-Type', 'application/octet-stream');
      }

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  });

  // Get file content for playing
  app.get("/api/files/:id/content", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getGameFile(fileId);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const filePath = file.filePath;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File content not found" });
      }

      // Handle JAR clients differently
      if (file.contentType === 'application/java-archive') {
        // Generate a download page for JAR clients
        const files = fs.readdirSync(filePath, { recursive: true });
        const jarFiles = files.filter(f => f.toString().toLowerCase().endsWith('.jar'));
        const jsonFiles = files.filter(f => f.toString().toLowerCase().endsWith('.json'));

        const downloadPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${file.originalName} - JAR Client</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 40px; min-height: 100vh; 
            display: flex; align-items: center; justify-content: center;
        }
        .container { 
            background: white; padding: 40px; border-radius: 15px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.1); max-width: 600px; text-align: center;
        }
        .icon { font-size: 4rem; color: #667eea; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 30px; line-height: 1.6; }
        .download-btn { 
            display: inline-block; background: #667eea; color: white; 
            padding: 15px 30px; text-decoration: none; border-radius: 8px; 
            margin: 10px; font-weight: bold; transition: all 0.3s;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }
        .download-btn:hover { 
            background: #5a6fd8; transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .file-list { 
            background: #f8f9fa; padding: 20px; border-radius: 8px; 
            margin: 20px 0; text-align: left; 
        }
        .file-item { 
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 0; border-bottom: 1px solid #eee;
        }
        .file-item:last-child { border-bottom: none; }
        .file-name { font-weight: 500; color: #333; }
        .file-type { 
            background: #667eea; color: white; padding: 4px 8px; 
            border-radius: 4px; font-size: 0.8em; 
        }
        .instructions { 
            background: #e3f2fd; padding: 20px; border-radius: 8px; 
            margin: 20px 0; border-left: 4px solid #2196f3; 
        }
        .instructions h3 { color: #1976d2; margin-top: 0; }
        .instructions ol { text-align: left; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">☕</div>
        <h1>${file.originalName}</h1>
        <p>This is a Java-based Minecraft client that requires download and local execution.</p>

        <div class="file-list">
            <h3>Available Files:</h3>
            ${jarFiles.map(f => `
                <div class="file-item">
                    <span class="file-name">${f}</span>
                    <span class="file-type">JAR</span>
                </div>
            `).join('')}
            ${jsonFiles.map(f => `
                <div class="file-item">
                    <span class="file-name">${f}</span>
                    <span class="file-type">JSON</span>
                </div>
            `).join('')}
        </div>

        <div class="instructions">
            <h3>How to Run:</h3>
            <ol>
                <li>Download the JAR file below</li>
                <li>Make sure you have Java installed on your computer</li>
                <li>Double-click the JAR file or run: <code>java -jar filename.jar</code></li>
                <li>Follow any additional setup instructions</li>
            </ol>
        </div>

        ${jarFiles.map(f => `
            <a href="/api/files/${fileId}/download/${encodeURIComponent(f.toString())}" class="download-btn">
                📥 Download ${f}
            </a>
        `).join('')}
        ${jsonFiles.map(f => `
            <a href="/api/files/${fileId}/download/${encodeURIComponent(f.toString())}" class="download-btn">
                📄 Download ${f}
            </a>
        `).join('')}
    </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.send(downloadPage);
      } else {
        // Handle HTML files normally
        const content = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(content);
      }
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Delete a file
  app.delete("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getGameFile(fileId);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Delete file from filesystem
      if (fs.existsSync(file.filePath)) {
        const stat = fs.statSync(file.filePath);
        if (stat.isDirectory()) {
          // For JAR clients, filePath is a directory - remove recursively
          fs.rmSync(file.filePath, { recursive: true, force: true });
        } else {
          // For HTML files, filePath is a file - remove normally
          fs.unlinkSync(file.filePath);
        }
      }

      // Delete from storage
      const deleted = await storage.deleteGameFile(fileId);

      if (deleted) {
        res.json({ message: "File deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete file" });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Clear all files
  app.delete("/api/files", async (req, res) => {
    try {
      const files = await storage.getAllGameFiles();

      // Delete all files from filesystem
      for (const file of files) {
        if (fs.existsSync(file.filePath)) {
          const stat = fs.statSync(file.filePath);
          if (stat.isDirectory()) {
            // For JAR clients, filePath is a directory - remove recursively
            fs.rmSync(file.filePath, { recursive: true, force: true });
          } else {
            // For HTML files, filePath is a file - remove normally
            fs.unlinkSync(file.filePath);
          }
        }
        await storage.deleteGameFile(file.id);
      }

      res.json({ message: "All files deleted successfully" });
    } catch (error) {
      console.error("Error clearing files:", error);
      res.status(500).json({ message: "Failed to clear files" });
    }
  });

  // Community Themes API routes
  app.get("/api/themes", async (req, res) => {
    try {
      const themes = await storage.getAllCommunityThemes();
      res.json(themes);
    } catch (error) {
      console.error("Get themes error:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  app.get("/api/themes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const theme = await storage.getCommunityTheme(id);

      if (theme) {
        res.json(theme);
      } else {
        res.status(404).json({ message: "Theme not found" });
      }
    } catch (error) {
      console.error("Get theme error:", error);
      res.status(500).json({ message: "Failed to fetch theme" });
    }
  });

  app.post("/api/themes", async (req, res) => {
    try {
      const validatedData = insertCommunityThemeSchema.parse(req.body);
      const theme = await storage.createCommunityTheme(validatedData);
      res.status(201).json(theme);
    } catch (error) {
      console.error("Create theme error:", error);
      res.status(400).json({ message: "Invalid theme data" });
    }
  });

  app.post("/api/themes/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateThemeDownloads(id);
      res.json({ message: "Download count updated" });
    } catch (error) {
      console.error("Update downloads error:", error);
      res.status(500).json({ message: "Failed to update downloads" });
    }
  });

  app.post("/api/themes/:id/rate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rating } = req.body;

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      await storage.rateTheme(id, rating);
      res.json({ message: "Rating submitted" });
    } catch (error) {
      console.error("Rate theme error:", error);
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });

  app.get("/api/themes/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const themes = await storage.searchThemes(query);
      res.json(themes);
    } catch (error) {
      console.error("Search themes error:", error);
      res.status(500).json({ message: "Failed to search themes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}