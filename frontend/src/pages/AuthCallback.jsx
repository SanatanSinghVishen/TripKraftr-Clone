import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * OAuth callback page — receives the token from the backend redirect,
 * stores it, and navigates to the dashboard.
 */
export default function AuthCallback() {
  const { handleOAuthCallback } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      navigate('/?error=auth_failed');
      return;
    }

    if (token) {
      handleOAuthCallback(token);
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [searchParams, handleOAuthCallback, navigate]);

  return (
    <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[var(--color-muted)]">Signing you in...</p>
      </div>
    </div>
  );
}
