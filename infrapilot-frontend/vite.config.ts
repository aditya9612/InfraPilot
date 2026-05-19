import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom Vite Plugin to mock API responses and eliminate 502 errors
const mockApiPlugin = () => ({
  name: 'mock-api-plugin',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      // Handle /api/v1/auth/me or /users/me (Permissive match)
      if ((req.url?.includes('/auth/me') || req.url?.includes('/users/me')) && req.method === 'GET') {
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
      if (req.url?.includes('/unread-count') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ count: 5 }));
        return;
      }

      // Handle /api/v1/auth/login
      if (req.url === '/api/v1/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
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
        req.on('data', (chunk: any) => { body += chunk.toString(); });
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

      // Handle /api/v1/invoices (List Invoices)
      if (req.url?.startsWith('/api/v1/invoices') && !req.url?.includes('/pdf') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          items: [
            {
              id: 1,
              project_id: 1,
              owner_id: 1,
              reference_id: 101,
              invoice_number: "INV-2026-001",
              type: "material",
              description: "Structural Phase II — Concrete & Formwork",
              invoice_date: "2026-03-15",
              due_date: "2026-04-15",
              amount: 1200000,
              gst_percent: 18,
              gst_amount: 216000,
              tax_percent: 0,
              tax_amount: 0,
              total_amount: 1416000,
              status: "paid",
              created_at: "2026-03-15T10:00:00",
            },
            {
              id: 2,
              project_id: 1,
              owner_id: 1,
              reference_id: 102,
              invoice_number: "INV-2026-002",
              type: "labour",
              description: "MEP Roughing-In — Electrical & Plumbing Phase III",
              invoice_date: "2026-04-01",
              due_date: "2026-05-01",
              amount: 850000,
              gst_percent: 18,
              gst_amount: 153000,
              tax_percent: 0,
              tax_amount: 0,
              total_amount: 1003000,
              status: "pending",
              created_at: "2026-04-01T09:30:00",
            },
            {
              id: 3,
              project_id: 1,
              owner_id: 1,
              reference_id: 103,
              invoice_number: "INV-2026-003",
              type: "material",
              description: "Roof Slab Rebar & Casting — North Wing",
              invoice_date: "2026-04-16",
              due_date: "2026-05-16",
              amount: 2200000,
              gst_percent: 18,
              gst_amount: 396000,
              tax_percent: 0,
              tax_amount: 0,
              total_amount: 2596000,
              status: "pending",
              created_at: "2026-04-16T11:00:00",
            }
          ],
          meta: {
            total: 3,
            limit: 20,
            offset: 0
          }
        }));
        return;
      }

      // Handle /api/v1/invoices/{id}/pdf
      const invoicePdfMatch = req.url?.match(/\/api\/v1\/invoices\/(\d+)\/pdf/);
      if (invoicePdfMatch && req.method === 'GET') {
        const id = invoicePdfMatch[1];
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice_${id}.pdf"`);
        res.statusCode = 200;
        res.end("download file");
        return;
      }

      // Handle /api/v1/invoices/all/pdf
      if (req.url === '/api/v1/invoices/all/pdf' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="invoices_all.pdf"');
        res.statusCode = 200;
        res.end("download file");
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
        req.on('data', (chunk: any) => { body += chunk.toString(); });
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
        req.on('data', (chunk: any) => { body += chunk.toString(); });
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

      // Handle /api/v1/dsr/project/{project_id}
      const dsrProjectMatch = req.url?.match(/\/api\/v1\/dsr\/project\/(\d+)/);
      if (dsrProjectMatch && req.method === 'GET') {
        const projectId = parseInt(dsrProjectMatch[1]);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          items: [
            {
              project_id: projectId,
              report_date: "2026-05-11",
              site_location: "Pune",
              contractor_id: 1,
              weather: "Sunny",
              work_done: "Completed electrical conduit laying in ground floor. Vibrators used during pour.",
              work_planned: "Start wiring work for first floor and prepare column shuttering.",
              machinery_used: "Concrete mixer, drilling machine",
              material_received: "PVC pipes - 200 units",
              material_used: "PVC pipes - 150 units, Cement: 80 bags, Steel: 1.2 Tons",
              issues: "Slight delay in material delivery in the morning. Resolved by 10 AM.",
              safety_observations: "All workers wearing helmets and gloves. No safety incidents.",
              remarks: "Work progressing as per schedule. Slab finish achieved as per specifications.",
              id: 1,
              business_id: "DSR001",
              created_at: "2026-05-11T18:13:39",
              updated_at: "2026-05-11T18:13:39",
              created_by_id: 1,
              created_by_name: "Admin User",
              status: "Active",
              latitude: 18.5204,
              longitude: 73.8567,
              contractor_name: "Sai Infra",
              total_labour: 28,
              skilled_labour: 12,
              unskilled_labour: 16,
              photos: [
                {
                  id: 1,
                  file_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop"
                }
              ]
            },
            {
              project_id: projectId,
              report_date: "2026-05-10",
              site_location: "Pune",
              contractor_id: 1,
              weather: "Partly Cloudy",
              work_done: "Shuttering and formwork for Ground Floor slab. Brickwork on Level 1 Apartments A & B.",
              work_planned: "Electrical conduit laying in ground floor.",
              machinery_used: "Tower crane, concrete pump",
              material_received: "Steel reinforcement bars - 5 Tons",
              material_used: "Plywood: 15 sheets, Bricks: 2500, Cement: 12 bags",
              issues: "None",
              safety_observations: "Safety briefing conducted in morning. All PPE compliance confirmed.",
              remarks: "Wait for plumbing layout approval for Level 1 bathroom shafts.",
              id: 2,
              business_id: "DSR002",
              created_at: "2026-05-10T17:45:00",
              updated_at: "2026-05-10T17:45:00",
              created_by_id: 1,
              created_by_name: "Admin User",
              status: "Active",
              latitude: 18.5204,
              longitude: 73.8567,
              contractor_name: "Sai Infra",
              total_labour: 22,
              skilled_labour: 10,
              unskilled_labour: 12,
              photos: [
                {
                  id: 2,
                  file_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400&h=300&fit=crop"
                },
                {
                  id: 3,
                  file_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"
                }
              ]
            }
          ],
          meta: {
            total: 2,
            limit: 20,
            offset: 0
          }
        }));
        return;
      }

      // Handle /api/v1/issues/project/{project_id}
      const issuesMatch = req.url?.match(/\/api\/v1\/issues\/project\/(\d+)/);
      if (issuesMatch && req.method === 'GET') {
        const projectId = parseInt(issuesMatch[1]);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          items: [
            {
              project_id: projectId,
              title: "Sand delivery delay",
              category: "Material",
              description: "Sand supply was delayed by 4HR",
              reported_date: "2026-04-02",
              priority: "High",
              id: 1,
              business_id: "ISS001",
              status: "Open",
              assigned_to: null,
              resolution: null
            },
            {
              project_id: projectId,
              title: "Concrete quality issue",
              category: "Delay",
              description: "Concrete mix failed slump test at site",
              reported_date: "2026-04-10",
              priority: "High",
              id: 2,
              business_id: "ISS002",
              status: "Open",
              assigned_to: null,
              resolution: null
            }
          ],
          meta: {
            total: 2,
            limit: 20,
            offset: 0
          }
        }));
        return;
      }

      // Handle /api/v1/issues (Create Issue)
      if (req.url === '/api/v1/issues' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', () => {
          const parsed = JSON.parse(body || '{}');
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            project_id: parsed.project_id || 1,
            title: parsed.title || "Sand delivery delay",
            category: parsed.category || "Material",
            description: parsed.description || "Sand supply was delayed by 4HR",
            reported_date: parsed.reported_date || "2026-04-02",
            priority: parsed.priority || "High",
            id: Math.floor(Math.random() * 1000) + 10,
            business_id: `ISS${Math.floor(Math.random() * 900) + 100}`,
            status: "Open",
            assigned_to: null,
            resolution: null
          }));
        });
        return;
      }

      // Handle /api/v1/site-photos/upload GET (List Photos)
      if (req.url?.startsWith('/api/v1/site-photos/upload') && req.method === 'GET') {
        const urlObj = new URL(req.url, 'http://localhost');
        const activityTag = urlObj.searchParams.get('activity_tag');

        const allPhotos = [
          // Structure
          {
            id: 1,
            project_id: 1,
            date: "31 Mar 2026",
            time: "14:30:00",
            activity_tag: "Structure",
            location_tag: "Block A – Ground Floor",
            description: "Roof slab reinforcement and steel tying progress for Phase 3 casting.",
            uploaded_by: "John Doe",
            photo_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            created_at: "2026-03-31T14:30:00"
          },
          {
            id: 2,
            project_id: 1,
            date: "24 Mar 2026",
            time: "11:15:00",
            activity_tag: "Structure",
            location_tag: "Block B – First Floor",
            description: "Main concrete pour for the central support columns on the 3rd floor.",
            uploaded_by: "Jane Smith",
            photo_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            created_at: "2026-03-24T11:15:00"
          },
          // Foundation
          {
            id: 5,
            project_id: 1,
            date: "29 Mar 2026",
            time: "10:30:00",
            activity_tag: "Foundation",
            location_tag: "Block A – Ground Floor",
            description: "Pile boring operations and rebar grid layout for the northern block foundation.",
            uploaded_by: "John Doe",
            photo_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            created_at: "2026-03-29T10:30:00"
          },
          {
            id: 6,
            project_id: 1,
            date: "22 Mar 2026",
            time: "12:15:00",
            activity_tag: "Foundation",
            location_tag: "Block B – First Floor",
            description: "Reinforced concrete foundation slab curing for the main structure footprint.",
            uploaded_by: "Jane Smith",
            photo_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            created_at: "2026-03-22T12:15:00"
          },
          // Masonry
          {
            id: 9,
            project_id: 1,
            date: "28 Mar 2026",
            time: "15:00:00",
            activity_tag: "Masonry",
            location_tag: "North Zone",
            description: "Detailed brick-by-brick wall construction on the Level 1 block.",
            uploaded_by: "Alice Green",
            photo_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            created_at: "2026-03-28T15:00:00"
          },
          // Safety
          {
            id: 17,
            project_id: 1,
            date: "25 Mar 2026",
            time: "09:00:00",
            activity_tag: "Safety",
            location_tag: "Site Office",
            description: "Safety officers conducting PPE inspection and site walk-through with crew.",
            uploaded_by: "Charlie White",
            photo_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
            url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
            created_at: "2026-03-25T09:00:00"
          },
          // Equipment
          {
            id: 13,
            project_id: 1,
            date: "26 Mar 2026",
            time: "16:20:00",
            activity_tag: "Equipment",
            location_tag: "Material Yard",
            description: "Tower crane and heavy equipment fleet operational for Phase 3 lifts.",
            uploaded_by: "Bob Brown",
            photo_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            created_at: "2026-03-26T16:20:00"
          }
        ];

        const filtered = activityTag 
          ? allPhotos.filter(p => p.activity_tag.toLowerCase() === activityTag.toLowerCase())
          : allPhotos;

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ items: filtered }));
        return;
      }

      // Handle /api/v1/site-photos/upload POST (Upload Photo)
      if (req.url?.startsWith('/api/v1/site-photos/upload') && req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          id: Math.floor(Math.random() * 1000) + 10,
          project_id: 1,
          task_id: null,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          activity_tag: "General",
          location_tag: "Site Area",
          description: "Photo uploaded successfully.",
          uploaded_by: "Engineer",
          photo_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
          url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
          created_at: new Date().toISOString()
        }));
        return;
      }

      // Handle /api/v1/site-photos GET (Legacy / alternative list path)
      if (req.url?.startsWith('/api/v1/site-photos') && !req.url?.includes('/upload') && req.method === 'GET') {
        const urlObj = new URL(req.url, 'http://localhost');
        const activityTag = urlObj.searchParams.get('activity_tag');

        const allPhotos = [
          // Structure
          {
            id: 1,
            project_id: 1,
            date: "31 Mar 2026",
            time: "14:30:00",
            activity_tag: "Structure",
            location_tag: "Block A – Ground Floor",
            description: "Roof slab reinforcement and steel tying progress for Phase 3 casting.",
            uploaded_by: "John Doe",
            photo_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            created_at: "2026-03-31T14:30:00"
          },
          {
            id: 2,
            project_id: 1,
            date: "24 Mar 2026",
            time: "11:15:00",
            activity_tag: "Structure",
            location_tag: "Block B – First Floor",
            description: "Main concrete pour for the central support columns on the 3rd floor.",
            uploaded_by: "Jane Smith",
            photo_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            created_at: "2026-03-24T11:15:00"
          },
          // Foundation
          {
            id: 5,
            project_id: 1,
            date: "29 Mar 2026",
            time: "10:30:00",
            activity_tag: "Foundation",
            location_tag: "Block A – Ground Floor",
            description: "Pile boring operations and rebar grid layout for the northern block foundation.",
            uploaded_by: "John Doe",
            photo_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            created_at: "2026-03-29T10:30:00"
          },
          {
            id: 6,
            project_id: 1,
            date: "22 Mar 2026",
            time: "12:15:00",
            activity_tag: "Foundation",
            location_tag: "Block B – First Floor",
            description: "Reinforced concrete foundation slab curing for the main structure footprint.",
            uploaded_by: "Jane Smith",
            photo_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            created_at: "2026-03-22T12:15:00"
          },
          // Masonry
          {
            id: 9,
            project_id: 1,
            date: "28 Mar 2026",
            time: "15:00:00",
            activity_tag: "Masonry",
            location_tag: "North Zone",
            description: "Detailed brick-by-brick wall construction on the Level 1 block.",
            uploaded_by: "Alice Green",
            photo_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
            created_at: "2026-03-28T15:00:00"
          },
          // Safety
          {
            id: 17,
            project_id: 1,
            date: "25 Mar 2026",
            time: "09:00:00",
            activity_tag: "Safety",
            location_tag: "Site Office",
            description: "Safety officers conducting PPE inspection and site walk-through with crew.",
            uploaded_by: "Charlie White",
            photo_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
            url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
            created_at: "2026-03-25T09:00:00"
          },
          // Equipment
          {
            id: 13,
            project_id: 1,
            date: "26 Mar 2026",
            time: "16:20:00",
            activity_tag: "Equipment",
            location_tag: "Material Yard",
            description: "Tower crane and heavy equipment fleet operational for Phase 3 lifts.",
            uploaded_by: "Bob Brown",
            photo_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
            created_at: "2026-03-26T16:20:00"
          }
        ];

        const filtered = activityTag 
          ? allPhotos.filter(p => p.activity_tag.toLowerCase() === activityTag.toLowerCase())
          : allPhotos;

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ items: filtered }));
        return;
      }

      // Handle DELETE /api/v1/site-photos/{id}
      const deletePhotoMatch = req.url?.match(/\/api\/v1\/site-photos\/(\d+)/);
      if (deletePhotoMatch && req.method === 'DELETE') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, message: "Photo deleted" }));
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
