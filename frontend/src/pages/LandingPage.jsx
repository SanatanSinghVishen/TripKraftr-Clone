import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function LandingPage() {
  const { isAuthenticated, isOwner, isAdmin, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isOwner) navigate('/dashboard');
      if (isAdmin) navigate('/admin/dashboard');
    }
  }, [loading, isAuthenticated, isOwner, isAdmin, navigate]);

  return (
    <div className="min-h-screen bg-[var(--color-cream)] flex flex-col">
      {/* Nav */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AvailNow
          </span>
          <a
            href="/admin"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-body)] transition-colors"
          >
            Admin
          </a>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-xl w-full text-center fade-in">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-heading)] mb-3 tracking-tight">
            Manage your homestay,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              effortlessly.
            </span>
          </h1>

          <p className="text-lg text-[var(--color-body)] mb-8 max-w-md mx-auto leading-relaxed">
            Track room availability, manage bookings, and share a beautiful 
            availability page with your guests — all in one place.
          </p>

          <button
            onClick={loginWithGoogle}
            className="btn bg-white hover:bg-gray-50 text-[var(--color-heading)] border border-[var(--color-border)] shadow-sm text-base px-6 py-3 mx-auto"
            id="google-login-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-[var(--color-muted)] mt-4">
            Free to get started · No credit card required
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 mt-12 max-w-lg mx-auto">
            {[
              { icon: '📊', text: 'Live availability' },
              { icon: '📱', text: 'Share via WhatsApp' },
              { icon: '💰', text: 'Track revenue' },
            ].map((f, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-xs font-medium text-[var(--color-body)]">{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-[var(--color-muted)]">
        © 2026 AvailNow. Built for Indian homestay owners.
      </footer>
    </div>
  );
}
