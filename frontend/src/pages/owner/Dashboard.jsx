import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { properties } from '../../lib/api.js';
import SetupTab from './SetupTab.jsx';
import BookingsTab from './BookingsTab.jsx';
import RevenueTab from './RevenueTab.jsx';
import ShareLink from '../../components/ShareLink.jsx';

const TABS = ['Setup', 'Bookings', 'Revenue'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Setup');
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProperty();
  }, []);

  async function loadProperty() {
    try {
      setLoading(true);
      const data = await properties.getMyProperty();
      setProperty(data);
    } catch (err) {
      if (err.status === 404) {
        // No property yet — show setup
        setProperty(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const totalRooms = property?.rooms?.reduce((sum, r) => sum + r.totalRooms, 0) || 0;
  const roomLimit = 4; // FREE_PLAN_ROOM_LIMIT

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-muted)]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      {/* Top navigation bar */}
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AvailNow
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--color-body)] hidden sm:block">
                {user?.name || user?.email}
              </span>
              <button
                onClick={logout}
                className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors"
                id="logout-btn"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Property header (shown when property exists and not on Setup tab) */}
        {property && activeTab !== 'Setup' && (
          <div className="mb-6 slide-up">
            <h1 className="text-2xl font-bold text-[var(--color-heading)]">
              {property.name}
            </h1>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
              <span className="text-sm text-[var(--color-body)]">
                {property.region}, {property.state} · Owner view
              </span>
              <span className="pill pill-blue">
                {property.plan === 'free' ? 'Free' : 'Pro'} plan · {totalRooms}/{roomLimit} rooms
              </span>
            </div>
          </div>
        )}

        {/* Tab bar */}
        {property && (
          <div className="flex gap-0 border-b border-[var(--color-border)] mb-6">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab ? 'tab-active' : 'tab-inactive'
                }`}
                id={`tab-${tab.toLowerCase()}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        <div className="fade-in">
          {(!property || activeTab === 'Setup') && (
            <SetupTab
              property={property}
              onPropertySaved={loadProperty}
            />
          )}
          {property && activeTab === 'Bookings' && (
            <BookingsTab property={property} onUpdate={loadProperty} />
          )}
          {property && activeTab === 'Revenue' && (
            <RevenueTab property={property} />
          )}
        </div>

        {/* Share link widget */}
        {property && (
          <div className="mt-8">
            <ShareLink slug={property.slug} />
          </div>
        )}
      </main>
    </div>
  );
}
