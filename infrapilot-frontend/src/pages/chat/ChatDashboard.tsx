import React, { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatView from "../../components/chat/ChatView.tsx";
import { useAuth } from "../../context/AuthContext";

const ChatDashboard: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { user } = useAuth();

    return (
        <>
            <Navbar
                title="Chat"
                breadcrumb={user?.role === "Client" ? ["InfraPilot", "Chat"] : ["InfraPilot", "Communication", "Chat"]}
            />

            <PageTransition className="bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter">
                <div className="flex h-full p-2 md:p-4 gap-4">
                    {/* Main Chat Container */}
                    <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex relative">

                        {/* Sidebar Toggle (Mobile) */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-slate-100"
                        >
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Sidebar */}
                        <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex w-80 lg:w-96 border-r border-slate-100 shrink-0 h-full flex-col z-40 bg-white`}>
                            <ChatSidebar />
                        </div>

                        {/* View Area */}
                        <div className="flex-1 h-full min-w-0 bg-slate-50/20">
                            <ChatView />
                        </div>

                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default ChatDashboard;
