import Navbar from "../../../components/common/Navbar";

const announcements = [
  { id: 1, title: "Upcoming Site Visit — Wing A & B", type: "Project Site", date: "05 Apr 2026", priority: "High", content: "Management and safety leads will conduct a joint audit of the Wing A structural completion. All subcontractors must ensure full safety compliance by 08:00 AM.", author: "Rajesh Mehta", files: ["Site_Safety_Protocol.pdf"] },
  { id: 2, title: "Phase 3 Mobilization Notice", type: "Operations", date: "01 Apr 2026", priority: "Medium", content: "Mobilization for Phase 3 (Interior Finishes) has officially begun. Expected influx of specialized finishing material and labor force over the next 10 days.", author: "Rajesh Mehta", files: ["Mobilization_Schedule.xlsx"] },
  { id: 3, title: "New Material Selection Catalog", type: "Design", date: "28 Mar 2026", priority: "Low", content: "The updated finishing catalog for Flooring and MEP fixtures is now available in the Document Vault. Please review and provide selections by EOW.", author: "Anjali Desai", files: [] },
  { id: 4, title: "Quarterly Safety Compliance Award", type: "Safety", date: "15 Mar 2026", priority: "Medium", content: "InfraPilot is proud to announce that the Project Site has achieved 100,000 Safe Man Hours. Congratulations to the field team and subcontractors.", author: "Safety Officer", files: ["Safety_Certificate.pdf"] },
];

const ClientAnnouncementsPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Communication", "Announcements"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Official Project Announcements</h1>
        <p className="text-slate-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Important project updates, mobilization notices, and official company communications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {announcements.map((ann, i) => (
          <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-blue-500/5 group relative overflow-hidden flex flex-col">
            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-[9px] font-bold uppercase tracking-widest ${
              ann.priority === 'High' ? 'bg-red-50 text-red-600' : 
              ann.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
            }`}>
               {ann.priority} Priority
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                 <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ann.type}</p>
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">{ann.title}</h2>
              <p className="text-[10px] text-slate-400 font-bold mt-1">{ann.date} • Published by {ann.author}</p>
            </div>

            <div className="flex-1 mb-8">
               <p className="text-sm text-slate-600 font-medium leading-relaxed">{ann.content}</p>
            </div>

            {ann.files.length > 0 && (
              <div className="pt-6 border-t border-slate-50 space-y-3">
                 {ann.files.map((file, j) => (
                   <div key={j} className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 group/file">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xs">📄</div>
                         <p className="text-xs font-bold text-slate-700">{file}</p>
                      </div>
                      <button className="text-[9px] font-bold text-primary uppercase tracking-widest opacity-0 group-hover/file:opacity-100 transition-opacity">Download</button>
                   </div>
                 ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </>
);

export default ClientAnnouncementsPage;
