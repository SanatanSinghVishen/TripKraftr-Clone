import { useState, useEffect } from 'react';
import { revenue } from '../../lib/api.js';

function formatCurrency(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function RevenueTab({ property }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenue();
  }, [property._id]);

  async function loadRevenue() {
    try {
      setLoading(true);
      const result = await revenue.getSummary(property._id);
      setData(result);
    } catch (err) {
      console.error('Load revenue error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-6 bg-gray-200 rounded w-40" />
          <div className="h-6 bg-gray-200 rounded w-36" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-[var(--color-muted)]">Unable to load revenue data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg slide-up">
      <div className="card" id="revenue-summary">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-5">
          Revenue Summary
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-body)]">Total booked</span>
            <span className="text-xl font-bold text-[var(--color-heading)]">
              {formatCurrency(data.totalBooked)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-body)]">Collected</span>
            <span className="text-xl font-bold text-[var(--color-success)]">
              {formatCurrency(data.collected)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-body)]">Outstanding</span>
            <span className={`text-xl font-bold ${
              data.outstanding > 0 ? 'text-[var(--color-amber)]' : 'text-[var(--color-success)]'
            }`}>
              {formatCurrency(data.outstanding)}
            </span>
          </div>

          <hr className="border-[var(--color-border)]" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-body)]">Active bookings</span>
            <span className="text-xl font-bold text-[var(--color-heading)]">
              {data.activeBookings}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
