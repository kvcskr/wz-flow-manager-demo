import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function RoleRedirect() {
  const { role, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
  if (role === 'superadmin') return <Navigate to="/superadmin" replace />;
  if (role === 'admin') return <Navigate to="/dashboard" replace />;
  if (role === 'kierowca') return <Navigate to="/wz/nowe" replace />;
  return <Navigate to="/login" replace />;
}
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WzNowe from "./pages/WzNowe";
import WzLista from "./pages/WzLista";
import WzWydruk from "./pages/WzWydruk";
import Klienci from "./pages/Klienci";
import Produkty from "./pages/Produkty";
import Raporty from "./pages/Raporty";
import Zespol from "./pages/Zespol";
import Ustawienia from "./pages/Ustawienia";
import Superadmin from "./pages/Superadmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RoleRedirect />} />

            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/wz/nowe" element={
              <ProtectedRoute allowedRoles={['admin', 'kierowca']}>
                <WzNowe />
              </ProtectedRoute>
            } />

            <Route path="/wz" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <WzLista />
              </ProtectedRoute>
            } />

            <Route path="/wz/:id/wydruk" element={
              <ProtectedRoute allowedRoles={['admin', 'kierowca']}>
                <WzWydruk />
              </ProtectedRoute>
            } />

            <Route path="/klienci" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Klienci />
              </ProtectedRoute>
            } />

            <Route path="/produkty" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Produkty />
              </ProtectedRoute>
            } />

            <Route path="/raporty" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Raporty />
              </ProtectedRoute>
            } />

            <Route path="/zespol" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Zespol />
              </ProtectedRoute>
            } />

            <Route path="/ustawienia" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Ustawienia />
              </ProtectedRoute>
            } />

            <Route path="/superadmin" element={
              <ProtectedRoute allowedRoles={['superadmin']} skipSubscriptionCheck>
                <Superadmin />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
