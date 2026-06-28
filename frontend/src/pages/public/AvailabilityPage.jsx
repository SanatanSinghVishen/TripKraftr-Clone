import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../../lib/api.js';
import ShareLink from '../../components/ShareLink.jsx';

const MEAL_PLAN_LABELS = {
  only_room: 'Only Room',
  breakfast: 'Breakfast Included',
  breakfast_dinner: 'Breakfast & Dinner',
  all_meals: 'All Meals',
};

function formatCurrency(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function AvailabilityPage() {
  const { slug } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Availability form
  const [form, setForm] = useState({
    checkin: '',
    nights: 1,
    guests: 1,
    rooms: 1,
  });
  const [results, setResults] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadProperty();
    // Fire page view (fire-and-forget)
    publicApi.logView(slug);
  }, [slug]);

  async function loadProperty() {
    try {
      setLoading(true);
      const data = await publicApi.getProperty(slug);
      setProperty(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckAvailability(e) {
    e.preventDefault();
    setChecking(true);
    setResults(null);

    try {
      const data = await publicApi.checkAvailability(slug, {
        checkin: form.checkin,
        nights: form.nights,
        guests: form.guests,
        rooms: form.rooms,
      });
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  function getWhatsAppUrl(number) {
    const clean = number.replace(/[^0-9]/g, '');
    const withCountry = clean.startsWith('91') ? clean : `91${clean}`;
    return `https://wa.me/${withCountry}`;
  }

  function getPhoneUrl(number) {
    const clean = number.replace(/[^0-9+]/g, '');
    return `tel:${clean.startsWith('+') ? clean : '+91' + clean}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center p-4">
        <div className="card text-center max-w-md w-full py-12">
          <div className="text-4xl mb-4">🏠</div>
          <h1 className="text-xl font-bold text-[var(--color-heading)] mb-2">Property Not Found</h1>
          <p className="text-sm text-[var(--color-body)]">
            This availability page doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      {/* Branding header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border)] sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 text-center">
          <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AvailNow
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Property header card */}
        <div className="card slide-up" id="property-header">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[var(--color-heading)]">
                {property.name}
              </h1>
              <p className="text-sm text-[var(--color-body)] mt-0.5">
                {property.region}, {property.state}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <a
                href={getPhoneUrl(property.contactNumber)}
                className="btn btn-primary text-xs px-3 py-1.5"
                id="call-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
                Call
              </a>
              <a
                href={getWhatsAppUrl(property.whatsappNumber || property.contactNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5"
                id="whatsapp-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Check availability card */}
        <div className="card slide-up" id="check-availability-form">
          <h2 className="text-lg font-bold text-[var(--color-heading)] mb-4">
            Check Availability
          </h2>

          <form onSubmit={handleCheckAvailability} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="pub-checkin">Check-in Date</label>
                <input
                  id="pub-checkin"
                  className="input"
                  type="date"
                  value={form.checkin}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(prev => ({ ...prev, checkin: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="pub-nights">No. of Nights</label>
                <input
                  id="pub-nights"
                  className="input"
                  type="number"
                  min="1"
                  value={form.nights}
                  onChange={e => setForm(prev => ({ ...prev, nights: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="pub-guests">No. of Guests</label>
                <input
                  id="pub-guests"
                  className="input"
                  type="number"
                  min="1"
                  value={form.guests}
                  onChange={e => setForm(prev => ({ ...prev, guests: e.target.value }))}
                />
              </div>
              <div>
                <label className="label" htmlFor="pub-rooms">Rooms Needed</label>
                <input
                  id="pub-rooms"
                  className="input"
                  type="number"
                  min="1"
                  value={form.rooms}
                  onChange={e => setForm(prev => ({ ...prev, rooms: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full text-base py-3"
              disabled={checking}
              id="check-availability-btn"
            >
              {checking ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Checking...
                </span>
              ) : (
                'Check Availability'
              )}
            </button>

            <p className="text-xs text-[var(--color-muted)] text-center">
              No login required · Instant result
            </p>
          </form>
        </div>

        {/* Availability Results */}
        {results && (
          <div className="space-y-3 slide-up" id="availability-results">
            <h3 className="text-sm font-semibold text-[var(--color-body)]">
              Available rooms for {new Date(results.checkin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' })} – {new Date(results.checkout).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' })} ({results.nights} night{results.nights > 1 ? 's' : ''})
            </h3>

            {results.availability.map(room => (
              <div
                key={room.roomTypeId}
                className={`card border-2 transition-colors ${
                  room.meetsNeeded && room.freeCount > 0
                    ? 'border-green-200 bg-green-50/30'
                    : room.freeCount > 0
                    ? 'border-[var(--color-border)]'
                    : 'border-red-100 bg-red-50/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-[var(--color-heading)]">
                      {room.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm font-bold text-[var(--color-primary)]">
                        {formatCurrency(room.pricePerNight)}/night
                      </span>
                      <span className="pill pill-blue text-[10px]">
                        {MEAL_PLAN_LABELS[room.mealPlan]}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      room.freeCount === 0
                        ? 'text-[var(--color-danger)]'
                        : room.meetsNeeded
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-amber)]'
                    }`}>
                      {room.freeCount}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {room.freeCount === 0 ? 'sold out' : `of ${room.totalRooms} free`}
                    </div>
                  </div>
                </div>
                {room.meetsNeeded && room.freeCount > 0 && (
                  <div className="mt-2 text-xs text-[var(--color-success)] font-medium">
                    ✓ Meets your requirement
                  </div>
                )}
              </div>
            ))}

            <p className="text-sm text-center text-[var(--color-body)] bg-white rounded-lg p-4 border border-[var(--color-border)]">
              To book, contact the property directly using the
              <strong> Call</strong> or <strong>WhatsApp</strong> buttons above.
            </p>
          </div>
        )}

        {/* Share this page */}
        <div className="pt-2">
          <ShareLink slug={slug} />
        </div>
      </main>
    </div>
  );
}
