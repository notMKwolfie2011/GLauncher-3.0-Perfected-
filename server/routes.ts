import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertGameFileSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";

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
    // Accept HTML files
    if (file.mimetype === 'text/html' || 
        file.originalname.toLowerCase().endsWith('.html') || 
        file.originalname.toLowerCase().endsWith('.htm')) {
      cb(null, true);
    } else {
      cb(new Error('Only HTML files are allowed'), false);
    }
  }
});

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

      const fileData = {
        name: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype || 'text/html',
        filePath: req.file.path,
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
