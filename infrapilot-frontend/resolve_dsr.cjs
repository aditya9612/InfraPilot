const fs = require('fs');

const path = 'src/services/dsrService.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /<<<<<<< HEAD\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> [0-9a-f]+\n?/;
const match = content.match(regex);

if (match) {
  const headBlock = match[1];
  const theirBlock = match[2];
  
  // Combine: We keep our getProjectDsr (headBlock) but we also want the other methods from testing (theirBlock).
  // Wait, theirBlock has getDsr, createDsr, getDsrByProject, etc.
  // Their getDsrByProject conflicts with our getProjectDsr.
  // Let's strip their getDsrByProject from theirBlock.
  let cleanTheirBlock = theirBlock.replace(/\/\*\*\n\s*\* Get all DSRs for a project\n[\s\S]*?return response\.data;\n  \},/m, '');
  
  // Our createDsr is further down, so keeping their createDsr is fine (we will replace our createDsr later).
  // We'll replace the conflict with our getProjectDsr + their new methods.
  const merged = headBlock + cleanTheirBlock;
  content = content.replace(regex, merged);
  fs.writeFileSync(path, content);
}
