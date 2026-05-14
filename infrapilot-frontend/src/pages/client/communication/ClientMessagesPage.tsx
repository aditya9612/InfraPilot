import Navbar from "../../../components/common/Navbar";
import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  text: string;
  from: string;
  time: string;
  mine: boolean;
  attachment: string | null;
}

interface Thread {
  id: number;
  from: string;
  role: string;
  avatar: string;
  color: string;
  unread: boolean;
  time: string;
}

// ── Initial per-contact messages ──────────────────────────────────────────────
const initialThreadMessages: Record<number, Message[]> = {
  1: [
    { id: 1, text: "Phase 3 slab casting will begin Monday. Please ensure the approval for the variation order is sent today.", from: "Rajesh Mehta", time: "02 Apr 2026 • 2:15 PM", mine: false, attachment: "Casting_Schedule_V3.pdf" },
    { id: 2, text: "Understood. Reviewing the variation order now. Will revert by EOD.", from: "Mr. Sharma", time: "02 Apr 2026 • 2:32 PM", mine: true, attachment: null },
    { id: 3, text: "Thank you. Also attaching the updated material procurement list for your reference.", from: "Rajesh Mehta", time: "02 Apr 2026 • 2:35 PM", mine: false, attachment: "Steel_Procurement_Phase3.xlsx" },
  ],
  2: [
    { id: 1, text: "Weekly progress report attached. Overall site completion stands at 68% as of this week.", from: "Anjali Desai", time: "Yesterday • 10:05 AM", mine: false, attachment: "Weekly_Progress_Report.pdf" },
    { id: 2, text: "Thanks Anjali. I'll review and share feedback by tomorrow.", from: "Mr. Sharma", time: "Yesterday • 10:20 AM", mine: true, attachment: null },
  ],
  3: [
    { id: 1, text: "We'd like to request a reschedule of the site visit from 3 Apr to 5 Apr due to equipment delivery delays.", from: "Vikram Build Co.", time: "3d ago • 9:00 AM", mine: false, attachment: null },
    { id: 2, text: "Understood. 5 Apr works for us. Please confirm the time slot.", from: "Mr. Sharma", time: "3d ago • 11:30 AM", mine: true, attachment: null },
    { id: 3, text: "We'll confirm by tomorrow. Thank you for the flexibility.", from: "Vikram Build Co.", time: "3d ago • 11:45 AM", mine: false, attachment: null },
  ],
};

// ── Contacts list ─────────────────────────────────────────────────────────────
const contacts: Thread[] = [
  { id: 1, from: "Rajesh Mehta",    role: "Project Manager", avatar: "R", color: "bg-blue-500",    unread: true,  time: "2h ago" },
  { id: 2, from: "Anjali Desai",    role: "Site Engineer",   avatar: "A", color: "bg-emerald-500", unread: false, time: "Yesterday" },
  { id: 3, from: "Vikram Build Co.", role: "Contractor",     avatar: "V", color: "bg-purple-500",  unread: false, time: "3d ago" },
];

// ── Helper: current time string ───────────────────────────────────────────────
const nowTimeStr = () => {
  const d = new Date();
  return `Today • ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};

// ── Component ─────────────────────────────────────────────────────────────────
import toast from "react-hot-toast";

const ClientMessagesPage = () => {
  const [threads, setThreads] = useState<Thread[]>(contacts);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [threadMessages, setThreadMessages] = useState<Record<number, Message[]>>(initialThreadMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const fetchMessages = async () => {
    // No-op or artificial delay to simulate network
    console.log("Mock Fetch Messages");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contactId = params.get("contactId");
    if (contactId) {
      const idNum = parseInt(contactId);
      if (contacts.some(c => c.id === idNum)) {
        setSelectedId(idNum);
      }
    }
    fetchMessages();
  }, []);

  const selected = threads.find((t) => t.id === selectedId)!;
  const messages = threadMessages[selectedId] ?? [];

  // Auto-scroll to latest message whenever messages or selected thread changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  // Open a contact thread — clear unread badge
  const openThread = (id: number) => {
    setSelectedId(id);
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: false } : t))
    );
  };

  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setTimeout(() => {
      const newMsg: Message = {
        id: Date.now(),
        text: replyTo ? `↳ Reply to ${replyTo.from}: ${text}` : text,
        from: "Mr. Sharma",
        time: nowTimeStr(),
        mine: true,
        attachment: null
      };

      if (editingMessage) {
        setThreadMessages(prev => ({
          ...prev,
          [selectedId]: prev[selectedId].map(m => m.id === editingMessage.id ? { ...m, text } : m)
        }));
        toast.success("Message updated");
      } else {
        setThreadMessages(prev => ({
          ...prev,
          [selectedId]: [...(prev[selectedId] || []), newMsg]
        }));
      }

      setInput("");
      setReplyTo(null);
      setEditingMessage(null);
      setIsSending(false);
    }, 500);
  };

  const handleEditMessage = (msg: Message) => {
    setEditingMessage(msg);
    setInput(msg.text);
    setReplyTo(null);
  };

  const handleDeleteMessage = async (id: number) => {
    setThreadMessages(prev => ({
      ...prev,
      [selectedId]: prev[selectedId].filter(m => m.id !== id)
    }));
    toast.success("Message deleted");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Communication", "Messages"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Messaging</h1>
          <p className="text-slate-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Real-time threaded communication with your project leads</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>

          {/* ── Thread / Contact List ───────────────────────────────────────── */}
          <div className="w-80 border-r border-slate-100 flex flex-col shrink-0">
            {/* Search */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-200/50">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2.5" />
                  <path strokeLinecap="round" strokeWidth="2.5" d="M21 21l-4.35-4.35" />
                </svg>
                <input placeholder="Search contacts..." className="text-sm text-slate-600 outline-none bg-transparent w-full placeholder:text-slate-400 font-medium" />
              </div>
            </div>

            {/* Contacts */}
            <div className="overflow-y-auto flex-1">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openThread(t.id)}
                  className={`w-full text-left px-6 py-5 border-b border-slate-50 transition-all ${
                    selectedId === t.id
                      ? "bg-blue-50 border-l-4 border-l-blue-600"
                      : "hover:bg-slate-50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl ${t.color} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-blue-500/10`}>
                      {t.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 tracking-tight">{t.from}</p>
                        <p className="text-[10px] text-slate-400 font-bold whitespace-nowrap ml-2">{t.time}</p>
                      </div>
                      <p className={`text-[11px] font-bold truncate mt-1 ${t.unread ? "text-slate-800" : "text-slate-400"}`}>
                        {(threadMessages[t.id] ?? []).at(-1)?.text ?? ""}
                      </p>
                    </div>
                    {t.unread && <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 shadow-lg shadow-blue-500/20" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Chat Area ──────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">

            {/* Chat header */}
            <div className="px-8 py-5 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${selected.color} flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-blue-500/10`}>
                  {selected.avatar}
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800 tracking-tight">{selected.from}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selected.role}</p>
                  </div>
                </div>
              </div>
              <button className="p-2.5 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 flex flex-col">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col gap-1">
                    <p className={`text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 ${msg.mine ? "text-right" : "text-left"}`}>
                      {msg.mine ? "You" : msg.from} • {msg.time.split("•")[0]}
                    </p>
                    <div className={`max-w-md shadow-sm px-6 py-4 rounded-[28px] relative group ${msg.mine ? "bg-slate-900 text-white rounded-br-sm" : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"}`}>
                      <p className="text-[13px] font-bold leading-relaxed">{msg.text}</p>
                      
                      {/* Edit/Delete Buttons for mine (visible on hover) */}
                      {msg.mine && (
                        <div className="absolute -left-20 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                          <button 
                            onClick={() => handleEditMessage(msg)}
                            className="p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-blue-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Reply Button (visible on hover) */}
                      {!msg.mine && (
                        <button 
                          onClick={() => setReplyTo(msg)}
                          className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                      )}

                      {/* Attachment */}
                      {msg.attachment && (
                        <div className={`mt-4 p-4 rounded-2xl border flex items-center justify-between gap-4 ${msg.mine ? "bg-slate-800 border-white/10" : "bg-slate-50 border-slate-100"}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-xs border border-white/5">📄</div>
                            <p className={`text-[10px] font-bold truncate max-w-[150px] ${msg.mine ? "text-slate-300" : "text-slate-600"}`}>{msg.attachment}</p>
                          </div>
                          <button className={`text-[9px] font-bold uppercase tracking-widest ${msg.mine ? "text-blue-400" : "text-primary"} hover:underline`}>Download</button>
                        </div>
                      )}

                      {/* Time + tick */}
                      <div className={`flex items-center gap-1.5 mt-2 justify-end text-slate-400`}>
                        <p className="text-[9px] font-bold uppercase tracking-widest">{msg.time.split("•")[1]}</p>
                        {msg.mine && (
                          <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Scroll anchor */}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="px-8 py-6 bg-white border-t border-slate-100">
              {/* Reply/Edit Indicator */}
              {replyTo && (
                <div className="mb-3 px-4 py-2 bg-blue-50 border-l-4 border-l-blue-600 rounded-r-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Replying to {replyTo.from}</p>
                    <p className="text-[11px] text-slate-600 truncate italic font-medium">"{replyTo.text}"</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              {editingMessage && (
                <div className="mb-3 px-4 py-2 bg-emerald-50 border-l-4 border-l-emerald-600 rounded-r-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Editing message</p>
                    <p className="text-[11px] text-slate-600 truncate italic font-medium">"{editingMessage.text}"</p>
                  </div>
                  <button onClick={() => { setEditingMessage(null); setInput(""); }} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-4 bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 focus-within:border-primary transition-all shadow-inner">
                <button className="text-slate-400 hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={editingMessage ? "Update your message..." : replyTo ? "Type your reply..." : "Type your response here..."}
                  className="flex-1 text-sm text-slate-700 outline-none bg-transparent placeholder:text-slate-400 font-bold"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isSending}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${editingMessage ? "bg-emerald-600 shadow-emerald-500/20" : "bg-primary shadow-blue-500/20 hover:scale-105 active:scale-95"}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientMessagesPage;
