const fs = require('fs');
const path = './src/pages/admin/CreateInvoicePage.tsx';

let content = fs.readFileSync(path, 'utf8');

// The goal is to replace `bg-slate-50 border border-slate-100` with `bg-white border border-slate-300 hover:border-slate-400`
// Also `focus:ring-[color]-100` -> `focus:ring-[color]-200`

content = content.replace(/bg-slate-50 border(?!-)/g, 'bg-white border');
content = content.replace(/border-slate-100/g, 'border-slate-300');
content = content.replace(/focus:ring-indigo-100/g, 'focus:ring-indigo-200 hover:border-slate-400');
content = content.replace(/focus:ring-blue-100/g, 'focus:ring-blue-200 hover:border-slate-400');
content = content.replace(/focus:ring-emerald-100/g, 'focus:ring-emerald-200 hover:border-slate-400');

// Fix border-slate-200 that might have been used in some other inputs
content = content.replace(/bg-slate-50 border border-slate-200/g, 'bg-white border border-slate-300');
content = content.replace(/border-slate-200 focus:ring-indigo-100/g, 'border-slate-300 focus:ring-indigo-200 hover:border-slate-400');

fs.writeFileSync(path, content);
console.log("Fixed CreateInvoicePage.tsx borders");
