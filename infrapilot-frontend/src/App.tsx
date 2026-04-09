import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" reverseOrder={false} />
    </AuthProvider>
  );
}

export default App;
