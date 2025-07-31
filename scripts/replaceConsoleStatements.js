#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to process
const SOURCE_DIR = path.join(__dirname, '..', 'src');
const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', '__tests__'];
const EXCLUDE_FILES = ['devLogger.ts', 'devLogger.tsx'];

// Counter for replacements
let totalReplacements = 0;
let filesModified = 0;

/**
 * Check if path should be excluded
 */
function shouldExclude(filePath) {
  const fileName = path.basename(filePath);
  if (EXCLUDE_FILES.includes(fileName)) return true;
  
  for (const dir of EXCLUDE_DIRS) {
    if (filePath.includes(dir)) return true;
  }
  
  return false;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  if (shouldExclude(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let replacements = 0;
  
  // Check if devLogger is already imported
  const hasDevLoggerImport = content.includes("from './devLogger'") || 
                             content.includes('from "./devLogger"') ||
                             content.includes("from '../utils/devLogger'") ||
                             content.includes('from "../utils/devLogger"') ||
                             content.includes("from '@/utils/devLogger'") ||
                             content.includes('from "@/utils/devLogger"');
  
  // Replace console statements
  const patterns = [
    { from: /console\.log\(/g, to: 'devLog.log(' },
    { from: /console\.warn\(/g, to: 'devLog.warn(' },
    { from: /console\.info\(/g, to: 'devLog.info(' },
    { from: /console\.debug\(/g, to: 'devLog.debug(' },
    // Keep console.error as prodLog.error for production logging
    { from: /console\.error\(/g, to: 'prodLog.error(' }
  ];
  
  let needsImport = false;
  
  patterns.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      replacements += matches.length;
      needsImport = true;
    }
  });
  
  // If we made replacements and don't have the import, add it
  if (needsImport && !hasDevLoggerImport) {
    // Determine the correct import path based on file location
    const fileDir = path.dirname(filePath);
    const relativePath = path.relative(fileDir, path.join(SOURCE_DIR, 'utils', 'devLogger')).replace(/\\/g, '/');
    const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
    
    // Find where to insert the import (after other imports)
    const importMatch = content.match(/^(import[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)+/m);
    if (importMatch) {
      const lastImportEnd = importMatch.index + importMatch[0].length;
      content = content.slice(0, lastImportEnd) + 
                `import { devLog, prodLog } from '${importPath}';\n` +
                content.slice(lastImportEnd);
    } else {
      // No imports found, add at the beginning
      content = `import { devLog, prodLog } from '${importPath}';\n\n` + content;
    }
  }
  
  // Write back if changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    totalReplacements += replacements;
    filesModified++;
    console.log(`✓ ${filePath}: ${replacements} replacements`);
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !shouldExclude(fullPath)) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      processFile(fullPath);
    }
  });
}

// Main execution
console.log('🔧 Replacing console statements with devLogger...\n');

try {
  processDirectory(SOURCE_DIR);
  
  console.log('\n✅ Complete!');
  console.log(`📊 Modified ${filesModified} files`);
  console.log(`🔄 Made ${totalReplacements} replacements`);
  
  // Run prettier to fix any formatting issues
  console.log('\n🎨 Running prettier...');
  try {
    execSync('npx prettier --write src/**/*.{ts,tsx}', { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️  Prettier not available or failed');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}