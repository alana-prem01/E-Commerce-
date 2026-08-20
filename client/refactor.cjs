const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, 'src', 'css');
const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /['"]?Cormorant Garamond['"]?,\s*(?:Georgia,\s*)?serif/gi, replacement: 'var(--heading-font)' },
  { regex: /['"]?Poppins['"]?,\s*(?:-apple-system,\s*)?sans-serif/gi, replacement: 'var(--body-font)' },
  { regex: /#046A5A/gi, replacement: 'var(--primary-color)' },
  { regex: /#014D40/gi, replacement: 'var(--secondary-color)' },
  { regex: /#2B2B2B/gi, replacement: 'var(--body-color)' },
  { regex: /#8A8A8A/gi, replacement: 'var(--text-muted)' },
  { regex: /#E5E7EB/gi, replacement: 'var(--border-color)' },
  { regex: /#FAF9F6/gi, replacement: 'var(--bg-light)' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.css') || fullPath.endsWith('.jsx')) {
      // Don't refactor index.css variables definition itself
      if (fullPath.endsWith('index.css')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let lines = content.split('\n');
        let changed = false;
        
        for (let i=0; i<lines.length; i++) {
           // skip replacing if it's the declaration of the variable
           if (lines[i].includes('--primary-color:') || 
               lines[i].includes('--secondary-color:') ||
               lines[i].includes('--body-color:') ||
               lines[i].includes('--text-muted:') ||
               lines[i].includes('--border-color:') ||
               lines[i].includes('--bg-light:') ||
               lines[i].includes('--heading-font:') ||
               lines[i].includes('--body-font:')) {
               continue;
           }
           
           let oldLine = lines[i];
           for (const { regex, replacement } of replacements) {
             // We have to recreate RegExp to avoid global state issues if we used a global flag, 
             // but our regexes have 'gi' so we can just use replace directly on string.
             lines[i] = lines[i].replace(regex, replacement);
           }
           if (oldLine !== lines[i]) changed = true;
        }
        if (changed) {
          fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
          console.log(`Updated ${fullPath}`);
        }
      } else {
        processFile(fullPath);
      }
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const { regex, replacement } of replacements) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

console.log('Starting refactor...');
processDirectory(srcDir);
console.log('Refactor complete.');
