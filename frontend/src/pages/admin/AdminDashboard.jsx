import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { admin } from '../../lib/api.js';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      // Fetch independently so one failure doesn't block the other
      const [overviewResult, propertiesResult] = await Promise.allSettled([
        admin.getOverview(),
        admin.listProperties(),
      ]);
      if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
      else console.error('Overview error:', overviewResult.reason);
      
      if (propertiesResult.status === 'fulfilled') setProperties(propertiesResult.value);
      else setError(propertiesResult.reason?.message || 'Failed to load properties');
    } catch (err) {
      console.error('Admin load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePlan(propertyId, currentPlan) {
    setUpdatingPlan(propertyId);
    try {
      const newPlan = currentPlan === 'free' ? 'paid' : 'free';
      const expiryDate = newPlan === 'paid'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await admin.updatePlan(propertyId, {
        plan: newPlan,
        subscriptionExpiry: expiryDate,
      });
      loadData();
    } catch (err) {
      console.error('Toggle plan error:', err);
    } finally {
      setUpdatingPlan(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AvailNow
              </span>
              <span className="pill bg-purple-100 text-purple-700">Admin</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--color-body)] hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors"
                id="admin-logout-btn"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-[var(--color-heading)] mb-6">
          Dashboard Overview
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Overview cards */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" id="admin-overview">
            <div className="card text-center py-5">
              <div className="text-3xl font-bold text-[var(--color-heading)]">
                {overview.totalHomestays}
              </div>
              <div className="text-sm text-[var(--color-body)] mt-1">Total Homestays</div>
            </div>
            <div className="card text-center py-5">
              <div className="text-3xl font-bold text-[var(--color-success)]">
                {overview.paidPlan}
              </div>
              <div className="text-sm text-[var(--color-body)] mt-1">Paid Plan</div>
            </div>
            <div className="card text-center py-5">
              <div className="text-3xl font-bold text-[var(--color-primary)]">
                {overview.freePlan}
              </div>
              <div className="text-sm text-[var(--color-body)] mt-1">Free Plan</div>
            </div>
          </div>
        )}

        {/* Properties table */}
        <div className="card overflow-hidden" id="admin-properties-table">
          <h2 className="text-lg font-bold text-[var(--color-heading)] mb-4">
            All Homestays
          </h2>

          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-cream)]">
                  <th className="text-left px-6 py-3 font-semibold text-[var(--color-body)]">Property</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-body)]">Location</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-body)]">Owner</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-body)]">Rooms</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-body)]">Plan</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-body)]">Expiry</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-body)]">Views</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-body)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center px-6 py-8 text-[var(--color-muted)]">
                      No homestays registered yet.
                    </td>
                  </tr>
                ) : (
                  properties.map(prop => (
                    <tr
                      key={prop._id}
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-cream)] transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="font-semibold text-[var(--color-heading)]">{prop.name}</div>
                        <div className="text-xs text-[var(--color-muted)]">{prop.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-body)]">
                        {prop.region}, {prop.state}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[var(--color-heading)]">{prop.ownerName}</div>
                        <div className="text-xs text-[var(--color-muted)]">{prop.ownerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-[var(--color-heading)]">{prop.roomCount}</span>
                        <span className="text-[var(--color-muted)] text-xs"> ({prop.roomTypeCount} types)</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`pill ${
                          prop.plan === 'paid' ? 'pill-success' : 'pill-blue'
                        }`}>
                          {prop.plan === 'paid' ? 'Pro' : 'Free'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-[var(--color-body)]">
                        {prop.subscriptionExpiry
                          ? new Date(prop.subscriptionExpiry).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-[var(--color-heading)]">
                          {prop.viewCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePlan(prop._id, prop.plan)}
                          className={`btn text-xs px-3 py-1 ${
                            prop.plan === 'free' ? 'btn-success' : 'btn-outline'
                          }`}
                          disabled={updatingPlan === prop._id}
                        >
                          {updatingPlan === prop._id
                            ? '...'
                            : prop.plan === 'free'
                            ? 'Upgrade'
                            : 'Downgrade'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
