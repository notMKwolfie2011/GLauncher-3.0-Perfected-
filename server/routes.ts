import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertGameFileSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";
import yauzl from "yauzl";
import { promisify } from "util";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
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
async function extractZipAndFindHtml(zipPath: string, extractDir: string): Promise<{ htmlPath: string; originalName: string } | null> {
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

        // Find the main HTML file using common naming patterns
        let mainHtml = htmlFiles.find(f => 
          f.toLowerCase().includes('index.html') ||
          f.toLowerCase().includes('main.html') ||
          f.toLowerCase().includes('game.html') ||
          f.toLowerCase().includes('client.html') ||
          f.toLowerCase().includes('eaglercraft.html')
        );

        // If no obvious main file, use the first HTML file in root directory
        if (!mainHtml) {
          mainHtml = htmlFiles.find(f => !f.includes('/')) || htmlFiles[0];
        }

        const htmlPath = path.join(extractDir, mainHtml);
        const originalName = path.basename(mainHtml);

        resolve({ htmlPath, originalName });
      });

      zipfile.on("error", (err) => {
        reject(err);
      });
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

      const fileData = {
        name: path.basename(finalFilePath),
        originalName: finalOriginalName,
        size: fs.statSync(finalFilePath).size,
        contentType: finalContentType,
        filePath: finalFilePath,
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
          res.status(400).json({ message: "File too large. Maximum size is 50MB." });
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

  const httpServer = createServer(app);
  return httpServer;
}
