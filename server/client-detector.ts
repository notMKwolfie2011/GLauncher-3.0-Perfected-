import * as fs from 'fs';
import * as path from 'path';

export interface ClientDetectionResult {
  clientVersion?: string;
  minecraftVersion?: string;
  clientType?: string;
  compatibilityWarnings: string[];
}

export async function detectClientVersion(htmlPath: string): Promise<ClientDetectionResult> {
  try {
    const htmlContent = await fs.promises.readFile(htmlPath, 'utf-8');
    
    const result: ClientDetectionResult = {
      compatibilityWarnings: []
    };

    // Detect Eaglercraft version patterns
    const versionPatterns = [
      /eaglercraft[_\s]*(?:version|v)[_\s]*([0-9]+(?:\.[0-9]+)*(?:[a-z]+[0-9]*)?)/i,
      /eagler[_\s]*([0-9]+(?:\.[0-9]+)*(?:[a-z]+[0-9]*)?)/i,
      /version[_\s]*:?[_\s]*["']?([0-9]+(?:\.[0-9]+)*(?:[a-z]+[0-9]*)?)/i,
      /eagle[_\s]*([0-9]+(?:\.[0-9]+)*)/i
    ];

    // Detect Minecraft version patterns
    const mcVersionPatterns = [
      /minecraft[_\s]*(?:version|v)[_\s]*([0-9]+(?:\.[0-9]+)*)/i,
      /mc[_\s]*([0-9]+(?:\.[0-9]+)*)/i,
      /"version":\s*"([0-9]+(?:\.[0-9]+)*)"/i
    ];

    // Detect client type patterns
    const clientTypePatterns = [
      { pattern: /eaglercraft.*1\.5/i, type: 'Eaglercraft 1.5.2' },
      { pattern: /eaglercraft.*1\.8/i, type: 'Eaglercraft 1.8.8' },
      { pattern: /eaglercraft.*1\.12/i, type: 'Eaglercraft 1.12.2' },
      { pattern: /eaglercraft.*beta/i, type: 'Eaglercraft Beta' },
      { pattern: /eaglercraft.*alpha/i, type: 'Eaglercraft Alpha' },
      { pattern: /eaglerx/i, type: 'EaglerX' },
      { pattern: /resent/i, type: 'Resent Client' },
      { pattern: /precision/i, type: 'Precision Client' },
      { pattern: /ayunami/i, type: 'Ayunami Client' }
    ];

    // Extract version information
    for (const pattern of versionPatterns) {
      const match = htmlContent.match(pattern);
      if (match && match[1]) {
        result.clientVersion = match[1];
        break;
      }
    }

    for (const pattern of mcVersionPatterns) {
      const match = htmlContent.match(pattern);
      if (match && match[1]) {
        result.minecraftVersion = match[1];
        break;
      }
    }

    for (const { pattern, type } of clientTypePatterns) {
      if (pattern.test(htmlContent)) {
        result.clientType = type;
        break;
      }
    }

    // Generate compatibility warnings
    result.compatibilityWarnings = generateCompatibilityWarnings(htmlContent, result);

    // Fallback detection if no specific patterns found
    if (!result.clientType && htmlContent.toLowerCase().includes('eaglercraft')) {
      result.clientType = 'Eaglercraft (Unknown Version)';
    }

    return result;
  } catch (error) {
    console.error('Error detecting client version:', error);
    return {
      compatibilityWarnings: ['Could not analyze client file for version information']
    };
  }
}

function generateCompatibilityWarnings(htmlContent: string, detection: ClientDetectionResult): string[] {
  const warnings: string[] = [];

  // Check for outdated versions
  if (detection.minecraftVersion) {
    const version = parseFloat(detection.minecraftVersion);
    if (version < 1.5) {
      warnings.push('This client uses a very old Minecraft version and may have limited compatibility');
    }
  }

  // Check for known issues
  if (htmlContent.includes('WebGL') && !htmlContent.includes('webgl2')) {
    warnings.push('This client may require WebGL support - ensure your browser supports WebGL');
  }

  if (htmlContent.includes('localStorage') || htmlContent.includes('sessionStorage')) {
    warnings.push('This client uses browser storage - data may persist between sessions');
  }

  if (htmlContent.includes('navigator.mediaDevices') || htmlContent.includes('getUserMedia')) {
    warnings.push('This client may request camera/microphone permissions');
  }

  if (htmlContent.includes('fullscreen') || htmlContent.includes('requestFullscreen')) {
    warnings.push('This client supports fullscreen mode - use F11 or the fullscreen button');
  }

  // Check for beta/alpha versions
  if (detection.clientType?.toLowerCase().includes('beta')) {
    warnings.push('Beta client - may contain bugs or incomplete features');
  }

  if (detection.clientType?.toLowerCase().includes('alpha')) {
    warnings.push('Alpha client - experimental version with potential stability issues');
  }

  // Check for specific client warnings
  if (detection.clientType?.toLowerCase().includes('resent')) {
    warnings.push('Resent client detected - includes additional mods and features');
  }

  if (detection.clientType?.toLowerCase().includes('precision')) {
    warnings.push('Precision client detected - optimized for PvP gameplay');
  }

  // Check for large file size (if we can determine it)
  const scriptTags = htmlContent.match(/<script[^>]*>/gi);
  if (scriptTags && scriptTags.length > 10) {
    warnings.push('Large client detected - may take longer to load');
  }

  return warnings;
}