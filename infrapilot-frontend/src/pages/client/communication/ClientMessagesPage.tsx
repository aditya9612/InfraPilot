import Navbar from "../../../components/common/Navbar";
import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import toast from "react-hot-toast";
import { communicationService, type CommunicationMessage } from "../../../services/communicationService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

// Helper to format iso strings
const formatTime = (isoString?: string) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`;
};

const ClientMessagesPage = () => {
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [showAttachment, setShowAttachment] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedMsgIds, setSelectedMsgIds] = useState<number[]>([]);

  const { projectId } = useClientProjectId();

  // Resolve project_id and fetch all messages for the project
  const fetchMessages = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await communicationService.getMessages(projectId);
      setMessages(data);
      
      // Open the first thread by default if available
      const firstThread = data.find(m => m.parent_id === null);
      if (firstThread) {
          setSelectedThreadId(firstThread.id);
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
    
    // Fetch current user ID for proper alignment
    const loadProfile = async () => {
      try {
        const { settingsService } = await import("../../../services/settingsService");
        const profile = await settingsService.getProfile();
        setCurrentUserId(profile.user_id);
      } catch (err) {
        console.warn("Failed to fetch user profile for chat alignment", err);
        setCurrentUserId(1); // Default fallback
      }
    };
    loadProfile();
  }, [projectId]);

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
        attachment_url: attachmentUrl.trim() || undefined,
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
      setAttachmentUrl("");
      setShowAttachment(false);
      toast.success("Synchronized", { id: sendToast });
      
      // Mark delivered
      await communicationService.markDelivered(sentMsg.id).catch(() => {});
    } catch (error) {
      toast.error("Packet transmission failed", { id: sendToast });
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!window.confirm("Permanent erasure: Are you sure you want to delete this?")) return;
    try {
      await communicationService.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (id === selectedThreadId) setSelectedThreadId(null);
      toast.success("Erased");
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMsgIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedMsgIds.length} selected messages?`)) return;

    try {
      await Promise.all(selectedMsgIds.map(id => communicationService.deleteMessage(id)));
      setMessages(prev => prev.filter(m => !selectedMsgIds.includes(m.id)));
      setSelectedMsgIds([]);
      toast.success("Messages cleared");
    } catch (error) {
      toast.error("Cleanup failed");
    }
  };

  const handleUpdateMessage = async () => {
    if (!editingId || !editText.trim()) return;
    try {
      const updated = await communicationService.updateMessage(editingId, { message: editText });
      setMessages(prev => prev.map(m => m.id === editingId ? { ...m, ...updated } : m));
      setEditingId(null);
      setEditText("");
      toast.success("Message updated");
    } catch (error) {
      toast.error("Update failed");
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
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Chat", "Messages"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Direct Project Stream</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">End-to-end encrypted communication with site leads</p>
          </div>
           <button 
            disabled 
            className="px-6 py-2.5 bg-slate-200 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px] cursor-not-allowed"
          >
            + Initialize New Stream
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
          
          {/* Threads List */}
          <div className="w-80 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/50">
            <div className="p-6 border-b border-slate-100">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Active Discussions</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : rootThreads.length === 0 ? (
                <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No history recorded</div>
              ) : (
                rootThreads.map(t => (
                  <button
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`w-full group/thread flex items-center justify-between px-8 py-6 border-b border-slate-100 transition-all ${selectedThreadId === t.id ? "bg-white border-l-4 border-l-indigo-600 shadow-sm" : "hover:bg-white border-l-4 border-l-transparent text-slate-500"}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate tracking-tight mb-1 ${selectedThreadId === t.id ? 'text-slate-900' : ''}`}>{t.message}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{formatTime(t.created_at)}</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${t.status === 'read' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100'}`}>{t.status}</span>
                            {t.created_by === 1 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(t.id); }}
                                    className="p-1 text-slate-300 hover:text-red-500 transition-all"
                                    title="Delete Stream"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            )}
                        </div>
                    </div>
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
              {selectedThreadId && (
                <button 
                  onClick={handleDeleteSelected}
                  disabled={selectedMsgIds.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all group disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Delete Selected ({selectedMsgIds.length})</span>
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 flex flex-col z-20">
              {activeDialog.map(msg => {
                  const isMine = msg.created_by === currentUserId;
                  const isEditing = editingId === msg.id;
                  const isSelected = selectedMsgIds.includes(msg.id);

                  return (
                    <div key={msg.id} className={`flex items-start gap-4 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Selector */}
                        <div className="pt-4">
                            <label className="relative flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="peer hidden" 
                                    checked={isSelected}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedMsgIds(prev => [...prev, msg.id]);
                                        else setSelectedMsgIds(prev => prev.filter(id => id !== msg.id));
                                    }}
                                />
                                <div className="w-5 h-5 border-2 border-slate-200 rounded-lg bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                    <svg className={`w-3 h-3 text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                </div>
                            </label>
                        </div>

                        <div className={`max-w-[70%] flex flex-col gap-2 ${isMine ? 'items-end' : 'items-start'}`}>
                            <div className={`relative px-8 py-5 rounded-2xl shadow-sm group/msg ${isMine ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'}`}>
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <textarea 
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full bg-indigo-700/30 border border-white/20 rounded-xl p-3 text-sm font-bold text-white outline-none placeholder:text-white/40"
                                            rows={2}
                                            placeholder="Update message content..."
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingId(null)} className="text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white">Cancel</button>
                                            <button onClick={handleUpdateMessage} className="text-[9px] font-black uppercase tracking-widest text-white underline underline-offset-4 hover:text-indigo-200">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[13px] font-bold leading-relaxed">{msg.message}</p>
                                )}
                                
                                {msg.attachment_url && (
                                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="mt-3 block p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-indigo-700 transition-all group/link">
                                        <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">Link Attachment</span>
                                        <svg className="w-4 h-4 text-indigo-200 group-hover/link:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                )}
                            </div>
                            <div className={`flex items-center gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{formatTime(msg.created_at)}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${msg.status === 'read' ? 'text-blue-500' : 'text-slate-300'}`}>{msg.status}</span>
                                    {isMine && !isEditing && (
                                        <button 
                                            onClick={() => { setEditingId(msg.id); setEditText(msg.message); }}
                                            className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                        >
                                            update
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                  )
               })}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-8 bg-white border-t border-slate-100 z-20">
              {showAttachment && (
                <div className="mb-4 animate-in slide-in-from-bottom-2 duration-300">
                   <div className="flex items-center gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                      <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826L7.082 19.085a4.5 4.5 0 11-6.364-6.364l10.94-10.94A3 3 0 1115.95 6.05L4.662 17.336a.75.75 0 101.06 1.06L17.01 7.111a4.5 4.5 0 016.364 6.364l-7.69 7.69a.75.75 0 01-1.06-1.06l7.69-7.69a3 3 0 10-4.243-4.243L6.784 19.558a2.25 2.25 0 01-3.182-3.182l11.322-11.322a.75.75 0 011.06 1.06L4.662 17.336a.75.75 0 001.06 1.06L17.01 7.111" /></svg>
                      <input 
                         value={attachmentUrl}
                         onChange={(e) => setAttachmentUrl(e.target.value)}
                         placeholder="Paste resource/attachment URL here..."
                         className="bg-transparent text-[11px] font-black uppercase tracking-widest text-indigo-600 outline-none flex-1 placeholder:text-indigo-300"
                      />
                      <button onClick={() => { setAttachmentUrl(""); setShowAttachment(false); }} className="text-indigo-400 hover:text-red-500">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                   </div>
                </div>
              )}
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 focus-within:border-indigo-600 transition-all shadow-inner relative">
                <button 
                   onClick={() => setShowAttachment(!showAttachment)}
                   className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showAttachment ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
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
