import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../../lib/api.js';

const MEAL_PLAN_LABELS = {
  only_room: 'Only Room',
  breakfast: 'Breakfast Included',
  breakfast_dinner: 'Breakfast & Dinner',
  all_meals: 'All Meals',
};

export default function AvailabilityPage() {
  const { slug } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Availability form state
  const [form, setForm] = useState({
    checkin: new Date().toISOString().split('T')[0],
    nights: 1,
    guests: 2,
    rooms: 1,
  });
  
  const [results, setResults] = useState(null);
  const [checking, setChecking] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProperty();
    // Fire page view (fire-and-forget)
    publicApi.logView(slug).catch(() => {});
  }, [slug]);

  async function loadProperty() {
    try {
      setLoading(true);
      const data = await publicApi.getProperty(slug);
      setProperty(data);
    } catch (err) {
      setError(err.message || 'Property not found');
    } finally {
      setLoading(false);
    }
  }

  // Client-side checkout date reconciliation
  const checkoutDate = useMemo(() => {
    if (!form.checkin || !form.nights) return null;
    const d = new Date(form.checkin);
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + parseInt(form.nights, 10));
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [form.checkin, form.nights]);

  async function handleCheckAvailability(e) {
    e.preventDefault();
    setChecking(true);
    setResults(null);
    setSearchError(null);

    try {
      const data = await publicApi.checkAvailability(slug, {
        checkin: form.checkin,
        nights: form.nights,
        guests: form.guests,
        rooms: form.rooms,
      });
      setResults(data);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setChecking(false);
    }
  }

  function getWhatsAppUrl(number) {
    if (!number) return '#';
    const clean = number.replace(/[^0-9]/g, '');
    const withCountry = clean.startsWith('91') ? clean : `91${clean}`;
    return `https://wa.me/${withCountry}`;
  }

  function getPhoneUrl(number) {
    if (!number) return '#';
    const clean = number.replace(/[^0-9+]/g, '');
    return `tel:${clean.startsWith('+') ? clean : '+91' + clean}`;
  }

  function handleCopyShareLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Unknown slug -> 404 friendly page
  if (error || !property) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center p-4">
        <div className="card text-center max-w-md w-full py-12">
          <div className="text-4xl mb-4">🏠</div>
          <h1 className="text-xl font-bold text-[var(--color-heading)] mb-2">Link Not Found</h1>
          <p className="text-sm text-[var(--color-body)]">
            This homestay link doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] pb-8">
      {/* 3.1 Header card */}
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[var(--color-heading)] truncate">
              {property.name}
            </h1>
            <p className="text-xs text-[var(--color-body)] truncate mt-0.5">
              {property.region}, {property.state}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0 items-end">
            <div className="text-xs font-medium text-[var(--color-heading)] hidden sm:block">
              {property.contactNumber}
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={getPhoneUrl(property.contactNumber)}
                className="btn btn-outline text-xs px-2.5 py-1"
                id="call-btn"
              >
                Call
              </a>
              <a
                href={getWhatsAppUrl(property.whatsappNumber || property.contactNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-green-500 hover:bg-green-600 text-white text-xs px-2.5 py-1 border-transparent"
                id="whatsapp-btn"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        
        {/* 3.2 Property Details card */}
        <div className="card slide-up" id="property-details">
          <h2 className="text-lg font-bold text-[var(--color-heading)] mb-3">
            Property Details
          </h2>
          <div className="space-y-2 text-sm text-[var(--color-body)]">
            <div className="flex gap-2">
              <span className="font-semibold text-[var(--color-heading)] w-24 shrink-0">Name</span>
              <span>{property.name}</span>
            </div>
            {property.address && (
              <div className="flex gap-2">
                <span className="font-semibold text-[var(--color-heading)] w-24 shrink-0">Address</span>
                <span>{property.address}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="font-semibold text-[var(--color-heading)] w-24 shrink-0">Location</span>
              <span>{property.region}, {property.state}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-[var(--color-heading)] w-24 shrink-0">Contact</span>
              <span>{property.contactNumber}</span>
            </div>
            {property.whatsappNumber && (
              <div className="flex gap-2">
                <span className="font-semibold text-[var(--color-heading)] w-24 shrink-0">WhatsApp</span>
                <span>{property.whatsappNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3.3 "Check availability" card */}
        <div className="card slide-up" id="check-availability-form">
          <h2 className="text-lg font-bold text-[var(--color-heading)] mb-4">
            Check availability
          </h2>

          <form onSubmit={handleCheckAvailability} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="pub-checkin">Check-in date</label>
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
                <label className="label" htmlFor="pub-nights">No. of nights</label>
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
            
            {/* Live checkout date line */}
            <div className="text-sm font-medium text-[var(--color-body)] bg-[var(--color-cream)] p-2 rounded border border-[var(--color-border)]">
              Check-out: {checkoutDate || '—'}
            </div>

            {form.nights > 30 && (
              <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                Long stay — the owner may want to confirm by phone
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="pub-guests">No. of guests</label>
                <input
                  id="pub-guests"
                  className="input"
                  type="number"
                  min="1"
                  value={form.guests}
                  onChange={e => setForm(prev => ({ ...prev, guests: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="pub-rooms">Rooms needed</label>
                <input
                  id="pub-rooms"
                  className="input"
                  type="number"
                  min="1"
                  value={form.rooms}
                  onChange={e => setForm(prev => ({ ...prev, rooms: e.target.value }))}
                  required
                />
              </div>
            </div>

            {searchError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
                {searchError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full py-3 text-base"
              disabled={checking}
              id="check-availability-btn"
            >
              {checking ? 'Checking...' : 'Check availability'}
            </button>

            <p className="text-xs text-[var(--color-muted)] text-center mt-2">
              No login required · Instant result
            </p>
          </form>
        </div>

        {/* 3.4 Availability results */}
        {results && (
          <div className="space-y-3 slide-up" id="availability-results">
            <h3 className="text-sm font-semibold text-[var(--color-body)]">
              Availability for {new Date(results.checkinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(results.checkoutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </h3>

            {results.roomTypes.length === 0 ? (
              <div className="card text-center py-6 border-dashed bg-[var(--color-cream)]">
                <p className="text-sm text-[var(--color-body)]">
                  This homestay hasn't listed any rooms yet — try calling or WhatsApping them directly.
                </p>
              </div>
            ) : (
              results.roomTypes.map(room => {
                const isSoldOut = room.freeCount === 0;
                const meetsReqs = room.meetsRoomsNeeded && room.meetsOccupancy && !isSoldOut;

                return (
                  <div
                    key={room.id}
                    className={`card transition-colors ${
                      isSoldOut ? 'opacity-60 bg-gray-50' : ''
                    } ${meetsReqs ? 'border-green-200 bg-green-50/20' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-[var(--color-heading)] flex items-center gap-2">
                          {room.name}
                          {meetsReqs && (
                            <span title="Meets room and guest requirements" className="text-[var(--color-success)] flex items-center justify-center bg-green-100 rounded-full w-4 h-4 text-[10px]">
                              ✓
                            </span>
                          )}
                        </h4>
                        
                        <div className="mt-1">
                          <span className="pill pill-blue text-[10px] inline-block mb-1">
                            {MEAL_PLAN_LABELS[room.mealPlan]}
                          </span>
                        </div>

                        {!isSoldOut && (
                          <div className="mt-1 text-sm font-bold text-[var(--color-primary)]">
                            ₹{(room.pricePerNight).toLocaleString('en-IN')}/night
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        {isSoldOut ? (
                          <div className="text-sm font-semibold text-[var(--color-muted)] max-w-[100px]">
                            Not available for these dates
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-[var(--color-success)]">
                              {room.freeCount}
                            </div>
                            <div className="text-xs text-[var(--color-muted)]">
                              free
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {results.roomTypes.length > 0 && (
              <p className="text-sm text-center text-[var(--color-body)] mt-4">
                To book, contact the property directly using the <strong>Call</strong> or <strong>WhatsApp</strong> buttons above.
              </p>
            )}
          </div>
        )}

        {/* 3.5 Share this page card */}
        <div className="card mt-8 bg-blue-50/50 border-blue-100" id="share-card">
          <h2 className="text-sm font-bold text-[var(--color-heading)] mb-2">Share this page</h2>
          <div className="flex gap-2 items-center">
            <input 
              type="text" 
              readOnly 
              value={window.location.href} 
              className="input bg-white text-xs py-2 flex-1 min-w-0"
              onClick={e => e.target.select()}
            />
            <button 
              onClick={handleCopyShareLink}
              className="btn btn-primary text-xs px-3 py-2 shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-[10px] text-[var(--color-muted)] mt-2">
            Add to Instagram bio · WhatsApp status · Google Business
          </p>
        </div>

      </main>
    </div>
  );
}
