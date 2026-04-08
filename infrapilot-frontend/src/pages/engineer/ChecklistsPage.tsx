import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";


const checklists = [
  {
    id: 1, name: "Daily Site Checklist", type: "Daily", date: "2025-04-04",
    items: [
      { id: 1, item: "Site gate locked at end of day", done: true, remark: "" },
      { id: 2, item: "All equipment switched off", done: true, remark: "" },
      { id: 3, item: "Material store secured", done: false, remark: "Store gate hinge broken" },
      { id: 4, item: "Site diary updated", done: true, remark: "" },
      { id: 5, item: "Waste disposed at designated area", done: false, remark: "" },
    ]
  },
  {
    id: 2, name: "Column Casting Checklist", type: "Activity", date: "2025-04-03",
    items: [
      { id: 1, item: "Reinforcement as per drawing", done: true, remark: "" },
      { id: 2, item: "Concrete cover maintained (25mm)", done: false, remark: "22mm found in C3, rectify" },
      { id: 3, item: "Shuttering properly oiled", done: true, remark: "" },
      { id: 4, item: "Slump test conducted", done: true, remark: "80mm – OK" },
      { id: 5, item: "Cube samples collected", done: true, remark: "3 cubes at 28 days" },
      { id: 6, item: "Vibrator used properly", done: true, remark: "" },
    ]
  },
];

const ChecklistsPage = () => {
  const [selectedChecklist, setSelectedChecklist] = useState<number | null>(null);
  const [listData, setListData] = useState(checklists);
  const [showAdd, setShowAdd] = useState(false);

  const current = listData.find(c => c.id === selectedChecklist);

  const toggleItem = (checklistId: number, itemId: number) => {
    setListData(listData.map(cl => cl.id === checklistId ? {
      ...cl, items: cl.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it)
    } : cl));
  };

  return (
    <DashboardLayout>
      <Navbar title="Checklists" breadcrumb={["InfraPilot", "Engineer", "Checklists"]}
        action={{ label: "+ New Checklist", onClick: () => setShowAdd(true) }} />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        {!selectedChecklist ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Lists", value: listData.length, icon: "☑️", color: "bg-blue-50 text-blue-600" },
                { label: "Daily Type", value: listData.filter(c => c.type === "Daily").length, icon: "📅", color: "bg-green-50 text-green-600" },
                { label: "Activity Type", value: listData.filter(c => c.type === "Activity").length, icon: "🏗️", color: "bg-purple-50 text-purple-600" },
                { label: "Pending Items", value: listData.reduce((s, c) => s + c.items.filter(i => !i.done).length, 0), icon: "⏳", color: "bg-orange-50 text-orange-600" },
              ].map((c, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
                  <span className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center text-lg`}>{c.icon}</span>
                  <div>
                    <p className="text-xl font-bold text-slate-800 leading-none">{c.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {listData.map(cl => {
                const done = cl.items.filter(i => i.done).length;
                const pct = Math.round((done / cl.items.length) * 100);
                return (
                  <button key={cl.id} onClick={() => setSelectedChecklist(cl.id)}
                    className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left hover:border-primary/30 transition-all active:scale-[0.99]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{cl.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cl.type === "Daily" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>{cl.type}</span>
                          <span className="text-[10px] text-slate-400">{cl.date}</span>
                        </div>
                      </div>
                      <span className="text-slate-300 text-xl">›</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct === 100 ? "bg-success" : pct > 50 ? "bg-primary" : "bg-warning"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{done}/{cl.items.length}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          current && (
            <div>
              <button onClick={() => setSelectedChecklist(null)}
                className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-6 hover:underline">
                ← Back to Checklists
              </button>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{current.type} Checklist · {current.date}</p>
                  <h2 className="text-lg font-bold text-slate-800">{current.name}</h2>
                  <div className="mt-3">
                    {(() => { const done = current.items.filter(i => i.done).length; const pct = Math.round((done / current.items.length) * 100);
                      return (
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>{done} of {current.items.length} done</span><span>{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct === 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {current.items.map(item => (
                    <div key={item.id} className="p-4 flex items-start gap-4 cursor-pointer active:bg-slate-50"
                      onClick={() => toggleItem(current.id, item.id)}>
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${item.done ? "bg-primary border-primary" : "border-slate-200"}`}>
                        {item.done && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${item.done ? "text-slate-300 line-through" : "text-slate-700"}`}>{item.item}</p>
                        {item.remark && <p className="text-[10px] text-orange-500 font-medium mt-0.5">⚠️ {item.remark}</p>}
                        <div className="mt-2">
                          <input type="text" placeholder="Add remark..." className="w-full bg-slate-50 rounded-lg px-3 py-1.5 text-xs text-slate-600 border-none"
                            onClick={e => e.stopPropagation()} defaultValue={item.remark} />
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.done ? "bg-green-50 text-success" : "bg-slate-50 text-slate-400"}`}>
                        {item.done ? "Done" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">New Checklist</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Checklist Name</label>
                <input type="text" placeholder="e.g. Brickwork Activity Checklist" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Type</label>
                <div className="flex gap-3">
                  {["Daily", "Activity"].map(t => (
                    <button key={t} className="flex-1 py-3 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">{t}</button>
                  ))}
                </div>
              </div>
              <button className="w-full py-4 bg-primary text-white rounded-2xl text-base font-bold shadow-xl shadow-primary/30"
                onClick={() => setShowAdd(false)}>Create Checklist</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default ChecklistsPage;
