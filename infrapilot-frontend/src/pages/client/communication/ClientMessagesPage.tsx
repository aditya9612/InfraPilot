import Navbar from "../../../components/common/Navbar";
import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import toast from "react-hot-toast";
import { communicationService, type CommunicationMessage } from "../../../services/communicationService";
import { projectService } from "../../../services/projectService";

// Helper to format iso strings
const formatTime = (isoString?: string) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`;
};

const ClientMessagesPage = () => {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Resolve project_id and fetch all messages for the project
  const fetchMessages = async () => {
    try {
      setLoading(true);

      // Step 1: Resolve real project_id
      let resolvedProjectId: number | null = null;
        try {
          const settings = await import("../../../services/settingsService").then(m => m.settingsService.getSettings()).catch(() => null);
          
          if (settings?.default_project_id) {
             resolvedProjectId = settings.default_project_id;
          } else {
              const result: any = await projectService.getProjects(10, 0);
              const projects = Array.isArray(result) ? result : (result?.items || result?.data || []);
              if (projects && projects.length > 0) {
                  const p1 = projects.find((p: any) => p.id === 1 || p.project_id === 1);
                  resolvedProjectId = p1 ? (p1.id || p1.project_id) : projects[0].id || projects[0].project_id;
              }
          }
        } catch (e) {
          resolvedProjectId = 1; // Fallback
        }

      if (resolvedProjectId) {
          setProjectId(resolvedProjectId);
          const data = await communicationService.getMessages(resolvedProjectId);
          setMessages(data);
          
          // Open the first thread by default if available
          const firstThread = data.find(m => m.parent_id === null);
          if (firstThread) {
              setSelectedThreadId(firstThread.id);
          }
      }
    } catch (error) {
      console.error("Failed to load messages", error);
      toast.error("Live communication channel currently unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Filter messages for the selected thread (root + its replies)
  const activeDialog = messages.filter(m => 
    m.id === selectedThreadId || m.parent_id === selectedThreadId
  );

  const rootThreads = messages.filter(m => m.parent_id === null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeDialog]);

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text || !projectId) return;

    const payload = {
        message: text,
        attachment_url: undefined, // Option for future
        parent_id: selectedThreadId || undefined
    };

    const sendToast = toast.loading("Syncing with project site...");

    try {
      const sentMsg = await communicationService.sendMessage(projectId, payload);
      
      setMessages(prev => [...prev, sentMsg]);
      
      if (!selectedThreadId) {
          setSelectedThreadId(sentMsg.id);
      }
      
      setInput("");
      toast.success("Synchronized", { id: sendToast });
      
      // Mark delivered
      await communicationService.markDelivered(sentMsg.id).catch(() => {});
    } catch (error) {
      toast.error("Packet transmission failed", { id: sendToast });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Communication", "Messages"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Direct Project Stream</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">End-to-end encrypted communication with site leads</p>
          </div>
          <button 
            onClick={() => setSelectedThreadId(null)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            + Initialize New Stream
          </button>
        </div>

        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
          
          {/* Threads List */}
          <div className="w-80 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/50">
            <div className="p-6 border-b border-slate-100">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Active Discussions</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : rootThreads.length === 0 ? (
                <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No history recorded</div>
              ) : (
                rootThreads.map(t => (
                  <button
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`w-full flex items-center justify-between px-8 py-6 border-b border-slate-100 transition-all ${selectedThreadId === t.id ? "bg-white border-l-4 border-l-indigo-600 shadow-sm" : "hover:bg-white border-l-4 border-l-transparent text-slate-500"}`}
                >
                  <p className={`text-xs font-black truncate tracking-tight mb-1 ${selectedThreadId === t.id ? 'text-slate-900' : ''}`}>{t.message}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{formatTime(t.created_at)}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${t.status === 'read' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100'}`}>{t.status}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        communicationService.deleteMessage(t.id).then(() => {
                          toast.success('Message deleted');
                          setMessages(prev => prev.filter(m => m.id !== t.id && m.parent_id !== t.id));
                          if (selectedThreadId === t.id) setSelectedThreadId(null);
                        });
                      }}
                      className="p-1 text-red-500 hover:text-red-600"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>
                    </button>
                  </div>
                </button>
                ))
              )}
            </div>
          </div>

          {/* Dialog Area */}
          <div className="flex-1 flex flex-col bg-slate-50/20 relative">
            {!selectedThreadId && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-sm bg-white/40">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-xl border border-slate-100 mb-4 scale-125">✉️</div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Select a stream or initialize a new one</p>
                </div>
            )}

            {/* Header */}
            <div className="px-10 py-6 bg-white border-b border-slate-100 flex items-center justify-between z-20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg shadow-xl shadow-blue-500/10">#</div>
                <div>
                   <p className="text-sm font-black text-slate-800 tracking-tight">{selectedThreadId ? `Discussion Stream #${selectedThreadId}` : "Initializing Stream..."}</p>
                   <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">Secure Transmission Active</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 flex flex-col z-20">
              {activeDialog.map(msg => {
                  const isMine = msg.created_by === 1; // Assuming 1 is you
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] flex flex-col gap-2`}>
                            <div className={`px-8 py-5 rounded-[32px] shadow-sm ${isMine ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'}`}>
                                <p className="text-[13px] font-bold leading-relaxed">{msg.message}</p>
                                {msg.attachment_url && (
                                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="mt-3 block p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all group">
                                        <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">Attachment Package</span>
                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                )}
                            </div>
                            <div className={`flex items-center gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatTime(msg.created_at)}</span>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${msg.status === 'read' ? 'text-blue-500' : 'text-slate-300'}`}>{msg.status}</span>
                            </div>
                        </div>
                    </div>
                  )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-8 bg-white border-t border-slate-100 z-20">
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 focus-within:border-primary transition-all shadow-inner">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Direct transmission to site team..." 
                  className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400" 
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
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
