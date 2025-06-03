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
    // Accept HTML files and ZIP files
    const isHtml = file.mimetype === 'text/html' || 
                   file.originalname.toLowerCase().endsWith('.html') || 
                   file.originalname.toLowerCase().endsWith('.htm');
    
    const isZip = file.mimetype === 'application/zip' ||
                  file.mimetype === 'application/x-zip-compressed' ||
                  file.originalname.toLowerCase().endsWith('.zip');
    
    if (isHtml || isZip) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Helper function to extract ZIP files and find main HTML file
async function extractZipAndFindHtml(zipPath: string, extractDir: string): Promise<{ 
  htmlPath: string; 
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

        // Check if it's an HTML file
        if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
          htmlFiles.push(fileName);
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
        if (htmlFiles.length === 0) {
          reject(new Error('No HTML files found in ZIP archive'));
          return;
        }

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

        let mainHtml = null;
        
        // First, look for exact matches in root directory
        for (const pattern of priorityPatterns) {
          mainHtml = htmlFiles.find(f => {
            const fileName = f.split('/').pop() || '';
            return pattern.test(fileName) && !f.includes('/');
          });
          if (mainHtml) break;
        }

        // If no exact match, look for files containing these keywords
        if (!mainHtml) {
          const keywordPatterns = ['index', 'main', 'game', 'client', 'eaglercraft', 'launcher'];
          for (const keyword of keywordPatterns) {
            mainHtml = htmlFiles.find(f => {
              const fileName = f.split('/').pop() || '';
              return fileName.toLowerCase().includes(keyword) && fileName.toLowerCase().endsWith('.html');
            });
            if (mainHtml) break;
          }
        }

        // If still no main file, use the first HTML file in root directory
        if (!mainHtml) {
          mainHtml = htmlFiles.find(f => !f.includes('/')) || htmlFiles[0];
        }

        const htmlPath = path.join(extractDir, mainHtml);
        const originalName = path.basename(mainHtml);

        // Generate warnings based on file structure analysis
        const warnings: string[] = [];
        
        // Check for common issues
        if (htmlFiles.length > 5) {
          warnings.push(`Found ${htmlFiles.length} HTML files - may indicate complex structure`);
        }
        
        if (mainHtml.includes('/')) {
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

        resolve({ 
          htmlPath, 
          originalName,
          extractedFiles: allFiles.length,
          detectionMethod: mainHtml === htmlFiles[0] ? 'fallback' : 'pattern-match',
          warnings,
          fileTypes,
          structure: allFiles.slice(0, 20) // First 20 files for structure preview
        });
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

      // Check if uploaded file is a ZIP
      const isZip = req.file.mimetype === 'application/zip' ||
                   req.file.mimetype === 'application/x-zip-compressed' ||
                   req.file.originalname.toLowerCase().endsWith('.zip');

      if (isZip) {
        try {
          // Create extraction directory
          const extractDir = path.join(uploadDir, `extracted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
          fs.mkdirSync(extractDir, { recursive: true });

          // Extract ZIP and find main HTML file
          const result = await extractZipAndFindHtml(req.file.path, extractDir);
          
          if (!result) {
            // Clean up
            fs.rmSync(extractDir, { recursive: true, force: true });
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "No HTML files found in ZIP archive" });
          }

          // Update file data to point to extracted HTML file
          finalFilePath = result.htmlPath;
          finalOriginalName = result.originalName;
          finalContentType = 'text/html';

          // Clean up original ZIP file
          fs.unlinkSync(req.file.path);

        } catch (zipError) {
          console.error("Error extracting ZIP:", zipError);
          // Clean up on error
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ 
            message: "Failed to extract ZIP file. Please ensure it contains valid HTML files." 
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

      const content = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
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
        fs.unlinkSync(file.filePath);
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
          fs.unlinkSync(file.filePath);
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
