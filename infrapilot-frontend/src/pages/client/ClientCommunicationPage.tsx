import Navbar from "../../components/common/Navbar";
import { useState } from "react";

const threads = [
  { id: 1, from: "Rajesh Mehta", role: "Project Manager", avatar: "R", color: "bg-blue-500", message: "Phase 3 slab casting will begin Monday. Please approve the variation order today.", time: "2h ago", unread: true },
  { id: 2, from: "Anjali Desai", role: "Site Engineer", avatar: "A", color: "bg-emerald-500", message: "Weekly progress report attached. 68% overall completion confirmed.", time: "Yesterday", unread: false },
  { id: 3, from: "Vikram Build Co.", role: "Contractor", avatar: "V", color: "bg-purple-500", message: "Requesting reschedule of site visit to 5 Apr instead of 3 Apr.", time: "3d ago", unread: false },
];

const initMessages = [
  { id: 1, text: "Phase 3 slab casting will begin Monday. Please ensure the approval for the variation order is sent today.", from: "Rajesh Mehta", time: "2:15 PM", mine: false },
  { id: 2, text: "Understood. Reviewing the variation order now. Will revert by EOD.", from: "Mr. Sharma", time: "2:32 PM", mine: true },
  { id: 3, text: "Thank you. Also attaching the updated casting schedule for reference.", from: "Rajesh Mehta", time: "2:35 PM", mine: false },
];

const ClientCommunicationPage = () => {
  const [selected, setSelected] = useState(threads[0]);

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Communication"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Communication</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Direct messaging with your project team</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
          {/* Thread List */}
          <div className="w-72 border-r border-slate-100 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2" /><path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" /></svg>
                <input placeholder="Search messages..." className="text-xs text-slate-500 outline-none bg-transparent w-full placeholder:text-slate-400" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {threads.map(t => (
                <button key={t.id} onClick={() => setSelected(t)} className={`w-full text-left px-4 py-4 border-b border-slate-50 transition-colors ${selected.id === t.id ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white font-black text-sm shrink-0`}>{t.avatar}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-800">{t.from}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{t.time}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">{t.message}</p>
                    </div>
                    {t.unread && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${selected.color} flex items-center justify-center text-white font-black text-sm`}>{selected.avatar}</div>
              <div>
                <p className="text-sm font-black text-slate-800">{selected.from}</p>
                <p className="text-[10px] text-slate-400 font-bold">{selected.role}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {initMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-sm px-4 py-3 rounded-2xl ${msg.mine ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] font-bold mt-1 ${msg.mine ? "text-blue-200" : "text-slate-400"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                <input placeholder="Type a message..." className="flex-1 text-sm text-slate-700 outline-none bg-transparent placeholder:text-slate-400" />
                <button className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" strokeWidth="2" /><polygon points="22 2 15 22 11 13 2 9 22 2" strokeWidth="2" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientCommunicationPage;
