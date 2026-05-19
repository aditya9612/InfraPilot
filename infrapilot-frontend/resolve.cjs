const fs = require('fs');
const files = [
  'src/components/forms/CreateMasterDataModal.tsx',
  'src/pages/admin/InventoryPage.tsx',
  'src/pages/admin/BOQPage.tsx',
  'src/pages/projects/ProjectDetailsPage.tsx',
  'src/pages/dashboard/AdminDashboard.tsx',
  'src/routes/AppRoutes.tsx',
  'src/services/api.ts',
  'src/services/dsrService.ts',
  'src/services/financeService.ts',
  'src/services/issueService.ts',
  'src/services/settingsService.ts',
  'src/services/workProgressService.ts'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/<<<<<<< HEAD\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> [0-9a-f]+\n?/g, '$1\n$2');
  fs.writeFileSync(f, c);
});
