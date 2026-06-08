import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppRoutes />
        <Toaster position="top-right" reverseOrder={false} />
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
