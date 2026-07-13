#!/usr/bin/env node

/**
 * Verification script to detect circular fetch() calls
 * in server-side code (libraries, utilities)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT_DIR = process.cwd();

// Directories that should NOT contain fetch() calls to own API
const SERVER_SIDE_DIRS = [
  join(ROOT_DIR, 'src', 'lib'),
  join(ROOT_DIR, 'src', 'utils'),
];

// Directories where fetch() is acceptable (client-side)
const CLIENT_SIDE_DIRS = [
  join(ROOT_DIR, 'src', 'components'),
  join(ROOT_DIR, 'src', 'app'), // Client components in App Router
];

let hasErrors = false;
let filesChecked = 0;
let fetchCallsFound = [];

function getAllTsFiles(dir, fileList = []) {
  if (!statSync(dir).isDirectory()) {
    return fileList;
  }

  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, .next
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function checkFileForCircularFetch(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = relative(ROOT_DIR, filePath);
  
  filesChecked++;
  
  // Check for fetch() calls to own API (relative URLs starting with /api)
  const fetchApiPattern = /fetch\s*\(\s*['"`]\/api[^'"`]*['"`]/g;
  const matches = content.match(fetchApiPattern);
  
  if (matches) {
    // Get line numbers
    const lines = content.split('\n');
    const issues = [];
    
    matches.forEach(match => {
      const matchIndex = content.indexOf(match);
      const lineNumber = content.substring(0, matchIndex).split('\n').length;
      const line = lines[lineNumber - 1].trim();
      
      issues.push({
        file: relativePath,
        line: lineNumber,
        code: line,
        match: match,
      });
    });
    
    fetchCallsFound.push(...issues);
    hasErrors = true;
  }
}

console.log('🔍 Checking for circular fetch() calls in server-side code...\n');

// Check server-side directories
SERVER_SIDE_DIRS.forEach(dir => {
  try {
    const files = getAllTsFiles(dir);
    console.log(`📁 Checking ${relative(ROOT_DIR, dir)}/ (${files.length} files)...`);
    files.forEach(checkFileForCircularFetch);
  } catch (err) {
    // Directory might not exist, skip it
    console.log(`   ⚠️  Directory not found: ${relative(ROOT_DIR, dir)}`);
  }
});

console.log(`\n✅ Files checked: ${filesChecked}\n`);

// Report results
if (hasErrors) {
  console.log('❌ CIRCULAR FETCH() CALLS FOUND:\n');
  
  // Group by file
  const byFile = {};
  fetchCallsFound.forEach(issue => {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  });
  
  Object.keys(byFile).forEach(file => {
    console.log(`   📄 ${file}`);
    byFile[file].forEach(issue => {
      console.log(`      Line ${issue.line}: ${issue.match}`);
      console.log(`      → ${issue.code}`);
    });
    console.log('');
  });
  
  console.log('💡 Solution:');
  console.log('   1. Extract the API route logic to a shared function in src/lib/');
  console.log('   2. Import and use that function directly instead of fetch()');
  console.log('   3. See FETCH_ANTIPATTERN_GUIDE.md for detailed instructions\n');
  
  console.log('❌ Verification FAILED - Circular fetch() calls found\n');
  process.exit(1);
} else {
  console.log('✅ No circular fetch() calls found in server-side code');
  console.log('✅ All server-side functions use direct imports');
  console.log('\n🎉 Verification PASSED!\n');
  process.exit(0);
}
