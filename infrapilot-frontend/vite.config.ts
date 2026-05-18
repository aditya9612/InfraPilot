import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom Vite Plugin to mock API responses and eliminate 502 errors
const mockApiPlugin = () => ({
  name: 'mock-api-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Handle /api/v1/auth/me (Permissive match)
      if (req.url?.includes('/auth/me') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          id: 1,
          full_name: "Client User Its Me",
          role: "Client",
          mobile_number: "9696969696",
          email: "client@test.com"
        }));
        return;
      }

      // Handle /api/v1/communication/unread-count (Permissive match)
      if (req.url?.includes('/communication/unread-count') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ count: 5 }));
        return;
      }

      // Handle /api/v1/auth/login
      if (req.url === '/api/v1/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          const parsed = JSON.parse(body || '{}');
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            message: "OTP sent",
            mobile: parsed.mobile || "9696969696"
          }));
        });
        return;
      }

      // Handle /api/v1/auth/verify_otp
      if (req.url === '/api/v1/auth/verify_otp' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            token: {
              access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6IkFkbWluIiwiZXhwIjoxNzc0OTU3Mzc2fQ.3Jrx1oIvOw3vgQL5ym_7I6Mo82ODDKHs_lUpNZvF74o",
              token_type: "bearer"
            },
            user_id: 1
          }));
        });
        return;
      }

      // Handle /api/v1/dashboard/client/{project_id}
      const dashboardMatch = req.url?.match(/\/api\/v1\/dashboard\/client\/(\d+)/);
      if (dashboardMatch && req.method === 'GET') {
        const projectId = parseInt(dashboardMatch[1]);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          project_id: projectId,
          status: "PLANNED",
          progress_percent: 0,
          budget_total: 0,
          total_expense: 0,
          budget_used_percent: 0,
          remaining_budget: 0,
          milestones_total: 0,
          milestones_completed: 0,
          tasks_total: 1,
          tasks_completed: 0,
          start_date: "2026-04-02",
          end_date: "2026-04-02",
          days_remaining: 0
        }));
        return;
      }

      // Handle /api/v1/invoices/{id}/pdf
      const invoicePdfMatch = req.url?.match(/\/api\/v1\/invoices\/(\d+)\/pdf/);
      if (invoicePdfMatch && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
        res.statusCode = 200;
        res.end(Buffer.from('download file'));
        return;
      }

      // Handle /api/v1/invoices/all/pdf
      if (req.url === '/api/v1/invoices/all/pdf' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="invoices_all.pdf"');
        res.statusCode = 200;
        res.end(Buffer.from('download file'));
        return;
      }

      // Handle /api/v1/payments/{id}/pdf
      const paymentPdfMatch = req.url?.match(/\/api\/v1\/payments\/([a-zA-Z0-9-]+)\/pdf/);
      if (paymentPdfMatch && req.method === 'GET') {
        const id = paymentPdfMatch[1];
        if (id !== 'all') {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=receipt_${id}.pdf`);
          res.statusCode = 200;
          const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>startxref\n178\n%%EOF');
          res.end(dummyPdf);
          return;
        }
      }

      // Handle /api/v1/payments/all/pdf
      if ((req.url === '/api/v1/payments/all/pdf' || req.url?.includes('/payments/all/pdf')) && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=all_receipts.pdf');
        res.statusCode = 200;
        const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>startxref\n178\n%%EOF');
        res.end(dummyPdf);
        return;
      }

      // Handle /api/v1/settings/profile (Get Profile)
      if (req.url?.startsWith('/api/v1/settings/profile') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          user_id: 1,
          full_name: "Client User Its Me",
          role: "Client",
          mobile_number: "9696969696",
          email: "client@test.com",
          address: "Pune",
          pan_number: "ABCDE1234K",
          aadhaar_number: "123412341232",
          profile_image: "/uploads/profile/c5229e6d-19bf-4a3a-a977-9f5e89a51011.png",
          designation: "Client",
          joining_date: "2026-03-30",
          is_active: true
        }));
        return;
      }

      // Handle /api/v1/settings/profile (Update Profile)
      if (req.url?.startsWith('/api/v1/settings/profile') && req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(body); // Echo back the updated profile
        });
        return;
      }

      // Handle /api/v1/settings (Get Settings)
      if (req.url?.startsWith('/api/v1/settings') && !req.url?.includes('profile') && !req.url?.includes('password') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          language: "English (US / UK)",
          notifications: {
            email: true,
            sms: true,
            push: false
          }
        }));
        return;
      }

      // Handle /api/v1/settings/password (Update Password)
      if (req.url?.startsWith('/api/v1/settings/password') && req.method === 'PUT') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ message: "Password updated successfully" }));
        return;
      }

      // Handle /api/v1/drawings/documents/download/1 (Download Document)
      if (req.url?.includes('/drawings/documents/download/1') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=document_v1.pdf');
        res.statusCode = 200;
        const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>startxref\n178\n%%EOF');
        res.end(dummyPdf);
        return;
      }

      // Handle /api/v1/dsr/{id}/pdf (Download DSR PDF)
      const dsrPdfMatch = req.url?.match(/\/api\/v1\/dsr\/(\d+)\/pdf/);
      if (dsrPdfMatch && req.method === 'GET') {
        const dsrId = dsrPdfMatch[1];
        const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj
4 0 obj<</Length 120>>
stream
BT /F1 14 Tf 72 720 Td (Daily Site Report - DSR #${dsrId}) Tj 0 -24 Td (Skyline Tower Project) Tj 0 -24 Td (InfraPilot Construction Management) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
0000000210 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
382
%%EOF`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="DSR_Report_${dsrId}.pdf"`);
        res.statusCode = 200;
        res.end(Buffer.from(pdfContent));
        return;
      }

      // Handle /api/v1/drawings/1/latest (Get Latest Drawing)
      if (req.url?.includes('/drawings/') && req.url?.includes('/latest') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          project_id: 1,
          drawing_name: "sdfd",
          version: "1",
          approved_by: null,
          date: "2026-05-11",
          remarks: "need drawing hwre",
          id: 1,
          file_url: "uploads/drawings/Screenshot (39).png"
        }));
        return;
      }

      // Handle /api/v1/approvals (Create Approval)
      if (req.url?.startsWith('/api/v1/approvals') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          const parsed = JSON.parse(body || '{}');
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 201;
          res.end(JSON.stringify({
            id: 2,
            entity_type: parsed.entity_type || "bill",
            entity_id: parsed.entity_id || 2,
            status: "Pending",
            requested_by: 1,
            approved_by: null,
            remarks: parsed.remarks || "Approved after financial review"
          }));
        });
        return;
      }

      // Handle /api/v1/approvals/{id}/reject (Reject Request)
      if (req.url?.includes('/approvals/') && req.url?.includes('/reject') && req.method === 'PUT') {
        const urlParts = req.url.split('/');
        const id = urlParts[urlParts.indexOf('approvals') + 1];
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          message: "Approval rejected successfully",
          approval_id: id,
          status: "Rejected",
          timestamp: new Date().toISOString(),
          remarks: "we rejectedit"
        }));
        return;
      }

      // Handle /api/v1/approvals/{id}/approve (Approve Request)
      if (req.url?.includes('/approvals/') && req.url?.includes('/approve') && req.method === 'PUT') {
        const urlParts = req.url.split('/');
        const id = urlParts[urlParts.indexOf('approvals') + 1];
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          message: "Approval processed successfully",
          approval_id: id,
          status: "Approved",
          timestamp: new Date().toISOString(),
          remarks: "we approved it"
        }));
        return;
      }

      // Handle /api/v1/approvals (List Approvals)
      if (req.url?.startsWith('/api/v1/approvals') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify([
          { id: "APR-018", title: "Variation Order — Steel Price Surge", amount: "₹20,00,000", submitted: "20 Feb 2026", deadline: "05 Mar 2026", status: "Pending Client" },
          { id: "APR-017", title: "Design Change — Staircase Width Increase", amount: "₹3,50,000", submitted: "10 Feb 2026", deadline: "20 Feb 2026", status: "Approved" },
          { id: "APR-016", title: "Additional Floor Finishing Upgrade", amount: "₹8,00,000", submitted: "20 Jan 2026", deadline: "30 Jan 2026", status: "Approved" },
          { id: "APR-015", title: "Subcontractor Change — MEP Works", amount: "—", submitted: "05 Jan 2026", deadline: "10 Jan 2026", status: "Approved" },
          { id: "APR-014", title: "Schedule Extension — Monsoon Delay", amount: "—", submitted: "15 Aug 2025", deadline: "22 Aug 2025", status: "Approved" },
        ]));
        return;
      }

      // Handle /api/v1/work-progress (Detailed Work Progress)
      if (req.url?.startsWith('/api/v1/work-progress') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify([
          {
            project_id: 1,
            work_order_id: 1,
            created_at: "2026-05-14T19:25:56",
            id: 1,
            total_completed: 0,
            updated_at: "2026-05-14T19:25:56",
            boq_code: 1,
            remaining_quantity: 500,
            activity_name: "Foundation Excavation",
            completion_percentage: 0,
            planned_quantity: 500,
            discipline: null,
            unit: "Cum",
            status: "NOT_STARTED",
            engineer_id: 1,
            start_date: "2026-05-14",
            end_date: "2026-05-25"
          }
        ]));
        return;
      }

      // Handle /api/v1/projects (List Projects)
      if (req.url?.startsWith('/api/v1/projects') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          items: [
            {
              id: 1,
              project_name: "SARA CITY",
              owner_id: 1,
              description: "Wing A Construction",
              start_date: "2026-04-02",
              end_date: "2026-04-02",
              status: "Delayed",
              completion_percentage: 0
            }
          ],
          meta: {
            total: 1,
            limit: 20,
            offset: 0
          }
        }));
        return;
      }

      // Continue to next middleware (proxy) for all other requests
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  server: {
    headers: {
      // Disable browser caching in development — prevents confusing 304 responses
      'Cache-Control': 'no-store',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep the path as is, backend expects /api prefix
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
        },
      }
    }
  },
  optimizeDeps: {
    include: ['recharts', 'react-is'],
  },
})
