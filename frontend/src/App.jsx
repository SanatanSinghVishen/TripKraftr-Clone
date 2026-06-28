import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import Dashboard from './pages/owner/Dashboard.jsx';
import AvailabilityPage from './pages/public/AvailabilityPage.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

function ProtectedOwnerRoute({ children }) {
  const { isAuthenticated, isOwner, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isOwner) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Landing / Login */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Owner Dashboard (protected) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedOwnerRoute>
            <Dashboard />
          </ProtectedOwnerRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />

      {/* Public Availability Page — must be last to catch /:slug */}
      <Route path="/p/:slug" element={<AvailabilityPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
