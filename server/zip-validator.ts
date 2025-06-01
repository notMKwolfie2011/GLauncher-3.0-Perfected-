import * as fs from 'fs';
import * as path from 'path';

export interface ZipValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileCount: number;
  estimatedSize: number;
}

export async function validateZipFile(zipPath: string): Promise<ZipValidationResult> {
  const result: ZipValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    fileCount: 0,
    estimatedSize: 0
  };

  try {
    // Check file exists and is readable
    const stats = await fs.promises.stat(zipPath);
    result.estimatedSize = stats.size;

    // Basic size validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (stats.size > maxSize) {
      result.errors.push(`File size ${(stats.size / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed size of 50MB`);
      result.isValid = false;
    }

    if (stats.size < 100) {
      result.errors.push('File appears to be too small to be a valid ZIP archive');
      result.isValid = false;
    }

    // Check file header for ZIP signature
    const buffer = Buffer.alloc(4);
    const fd = await fs.promises.open(zipPath, 'r');
    await fd.read(buffer, 0, 4, 0);
    await fd.close();

    const zipSignature = buffer.toString('hex');
    const validSignatures = ['504b0304', '504b0506', '504b0708']; // ZIP file signatures
    
    if (!validSignatures.includes(zipSignature.toLowerCase())) {
      result.errors.push('File does not appear to be a valid ZIP archive');
      result.isValid = false;
    }

    // Additional security checks
    const fileName = path.basename(zipPath);
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|vbs|js|jar)$/i,
      /[<>:"|?*]/,
      /^\./
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileName)) {
        result.warnings.push(`Suspicious file name pattern detected: ${fileName}`);
        break;
      }
    }

  } catch (error) {
    result.errors.push(`Failed to validate ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.isValid = false;
  }

  return result;
}

export function sanitizeFileName(fileName: string): string {
  // Remove potentially dangerous characters and normalize
  return fileName
    .replace(/[<>:"|?*]/g, '_')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .substring(0, 255); // Limit length
}

export function isPathSafe(filePath: string): boolean {
  // Prevent directory traversal attacks
  const normalizedPath = path.normalize(filePath);
  return !normalizedPath.includes('..') && 
         !normalizedPath.startsWith('/') && 
         !normalizedPath.includes('\0');
}