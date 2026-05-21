const fs = require('fs');
const path = require('path');

const dirsToProcess = [
  path.join(__dirname, 'src', 'pages', 'engineer'),
  path.join(__dirname, 'src', 'services')
];

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      // Replace boundary 36 with 92
      content = content.replace(/\b36\b/g, '92');
      
      // We don't need to do "\b\"36\"\b" separately because \b36\b already matches 36 inside "36"
      // since " is a non-word character!
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

dirsToProcess.forEach(processDirectory);
console.log('Done.');
