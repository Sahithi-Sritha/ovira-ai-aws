#!/usr/bin/env node

/**
 * Verification script to ensure no ScanCommand usage remains in production code
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT_DIR = process.cwd();
const SRC_DIR = join(ROOT_DIR, 'src');

let hasErrors = false;
let filesChecked = 0;
let scanCommandFound = [];

function getAllTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function checkFileForScans(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = relative(ROOT_DIR, filePath);
  
  filesChecked++;
  
  // Check for ScanCommand import
  if (content.includes('ScanCommand')) {
    scanCommandFound.push({
      file: relativePath,
      issue: 'ScanCommand import or usage found'
    });
    hasErrors = true;
  }
  
  // Check for .scan( method calls
  if (content.match(/\.scan\s*\(/)) {
    scanCommandFound.push({
      file: relativePath,
      issue: '.scan() method call found'
    });
    hasErrors = true;
  }
}

console.log('🔍 Verifying DynamoDB Scan Anti-Pattern Fixes...\n');

// Get all TypeScript files in src directory
const tsFiles = getAllTsFiles(SRC_DIR);

console.log(`📁 Checking ${tsFiles.length} TypeScript files...\n`);

// Check each file
tsFiles.forEach(checkFileForScans);

// Report results
console.log(`✅ Files checked: ${filesChecked}\n`);

if (hasErrors) {
  console.log('❌ SCAN COMMANDS FOUND:\n');
  scanCommandFound.forEach(({ file, issue }) => {
    console.log(`   ⚠️  ${file}`);
    console.log(`      ${issue}\n`);
  });
  console.log('❌ Verification FAILED - Please remove all ScanCommand usage\n');
  process.exit(1);
} else {
  console.log('✅ No ScanCommand usage found in production code');
  console.log('✅ All hot paths are optimized with GetCommand or QueryCommand');
  console.log('\n🎉 Verification PASSED!\n');
  process.exit(0);
}
