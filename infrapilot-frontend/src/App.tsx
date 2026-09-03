import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";

// Global Error Boundary — catches any unhandled render errors
// and displays a user-friendly fallback instead of a white screen.
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("AppErrorBoundary caught an error:", error, info);
  }

  handleClearAndReload = () => {
    // Clear all InfraPilot keys from localStorage that could be corrupted
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("infrapilot_") || key.startsWith("mock_"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              padding: "48px",
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "#fef2f2",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: "28px",
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: "8px",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
                marginBottom: "8px",
                fontWeight: 500,
              }}
            >
              The application encountered an unexpected error. This is often
              caused by corrupted cached data.
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                marginBottom: "32px",
                fontFamily: "monospace",
                background: "#f8fafc",
                padding: "10px 16px",
                borderRadius: "12px",
                wordBreak: "break-all",
              }}
            >
              {this.state.error?.message || "Unknown error"}
            </p>
            <button
              onClick={this.handleClearAndReload}
              style={{
                background: "#1e293b",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "14px 28px",
                fontSize: "12px",
                fontWeight: 900,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Clear Cache &amp; Go to Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <AuthProvider>
          <ChatProvider>
            <AppRoutes />
            <Toaster position="top-right" reverseOrder={false} />
          </ChatProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
// Deployment Trigger: Mon Jun 22 19:58:14 IST 2026
