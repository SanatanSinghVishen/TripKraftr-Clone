import { useState, useEffect, useCallback } from 'react';
import { bookings } from '../../lib/api.js';

const MEAL_PLAN_LABELS = {
  only_room: 'Only Room',
  breakfast: 'Breakfast Included',
  breakfast_dinner: 'Breakfast & Dinner',
  all_meals: 'All Meals',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

function formatCurrency(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function BookingsTab({ property, onUpdate }) {
  const [availability, setAvailability] = useState([]);
  const [bookingList, setBookingList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Block Rooms form state
  const [form, setForm] = useState({
    guestName: '',
    contactNumber: '',
    checkinDate: '',
    nights: 1,
    advancePaid: '',
    notes: '',
  });
  const [selectedRooms, setSelectedRooms] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const checkoutDate = form.checkinDate && form.nights
    ? (() => {
        const d = new Date(form.checkinDate);
        d.setDate(d.getDate() + parseInt(form.nights, 10));
        return d;
      })()
    : null;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [avail, bkings] = await Promise.all([
        bookings.getAvailability(
          property._id,
          form.checkinDate || undefined,
          form.nights || undefined
        ),
        bookings.list(property._id, 'active'),
      ]);
      setAvailability(avail);
      setBookingList(bkings);
    } catch (err) {
      console.error('Load bookings data error:', err);
    } finally {
      setLoading(false);
    }
  }, [property._id, form.checkinDate, form.nights]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Room Selection ──

  function toggleRoom(roomTypeId) {
    setSelectedRooms(prev => {
      const next = { ...prev };
      if (next[roomTypeId]) {
        delete next[roomTypeId];
      } else {
        next[roomTypeId] = 1;
      }
      return next;
    });
  }

  function updateRoomQty(roomTypeId, delta) {
    setSelectedRooms(prev => {
      const roomAvail = availability.find(a => a.roomTypeId === roomTypeId);
      const max = roomAvail?.freeCount || 1;
      const current = prev[roomTypeId] || 1;
      const next = Math.max(1, Math.min(max, current + delta));
      return { ...prev, [roomTypeId]: next };
    });
  }

  // ── Totals ──

  const lineTotals = {};
  let totalAmount = 0;
  for (const [roomTypeId, qty] of Object.entries(selectedRooms)) {
    const room = property.rooms.find(r => r._id === roomTypeId);
    if (room) {
      const lineTotal = qty * room.pricePerNight * (parseInt(form.nights, 10) || 1);
      lineTotals[roomTypeId] = lineTotal;
      totalAmount += lineTotal;
    }
  }
  const advancePaidPaise = Math.round(parseFloat(form.advancePaid || '0') * 100);
  const balanceDue = Math.max(0, totalAmount - advancePaidPaise);

  // ── Form Handlers ──

  function clearForm() {
    setForm({
      guestName: '',
      contactNumber: '',
      checkinDate: '',
      nights: 1,
      advancePaid: '',
      notes: '',
    });
    setSelectedRooms({});
    setError(null);
  }

  async function handleBlockRooms(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const roomSelections = Object.entries(selectedRooms).map(([roomTypeId, qty]) => ({
        roomTypeId,
        qty,
      }));

      if (roomSelections.length === 0) {
        setError('Please select at least one room type');
        setSubmitting(false);
        return;
      }

      await bookings.create(property._id, {
        guestName: form.guestName,
        contactNumber: form.contactNumber,
        checkinDate: form.checkinDate,
        nights: parseInt(form.nights, 10),
        rooms: roomSelections,
        advancePaid: advancePaidPaise,
        notes: form.notes,
      });

      clearForm();
      loadData();
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkPaid(bookingId) {
    try {
      await bookings.update(bookingId, { markPaid: true });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancelBooking(bookingId) {
    if (!confirm('Cancel this booking? Rooms will become available again.')) return;
    try {
      await bookings.cancel(bookingId);
      loadData();
      onUpdate();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 slide-up">
          {error}
        </div>
      )}

      {/* ── Room Availability Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" id="availability-cards">
        {(availability.length > 0 ? availability : property.rooms.map(r => ({
          roomTypeId: r._id,
          name: r.name,
          totalRooms: r.totalRooms,
          freeCount: r.totalRooms,
        }))).map(room => (
          <div
            key={room.roomTypeId}
            className="card text-center py-4 px-3"
          >
            <div className="text-xs font-semibold text-[var(--color-body)] uppercase tracking-wide mb-1">
              {room.name}
            </div>
            <div className={`text-3xl font-bold ${
              room.freeCount === 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'
            }`}>
              {room.freeCount}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-0.5">
              free of {room.totalRooms} total
            </div>
          </div>
        ))}
      </div>

      {/* ── Block Rooms Form ── */}
      <div className="card slide-up" id="block-rooms-form">
        <h2 className="text-lg font-bold text-[var(--color-heading)] mb-4">
          📋 Block Rooms
        </h2>

        <form onSubmit={handleBlockRooms} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="guest-name">Guest Name</label>
              <input
                id="guest-name"
                className="input"
                type="text"
                placeholder="Ramesh Kumar"
                value={form.guestName}
                onChange={e => setForm(prev => ({ ...prev, guestName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="guest-contact">Contact Number</label>
              <input
                id="guest-contact"
                className="input"
                type="tel"
                placeholder="98xxxxxxxx"
                value={form.contactNumber}
                onChange={e => setForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="checkin-date">Check-in Date</label>
              <input
                id="checkin-date"
                className="input"
                type="date"
                value={form.checkinDate}
                onChange={e => setForm(prev => ({ ...prev, checkinDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="num-nights">No. of Nights</label>
              <input
                id="num-nights"
                className="input"
                type="number"
                min="1"
                value={form.nights}
                onChange={e => setForm(prev => ({ ...prev, nights: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Check-out Date</label>
              <div className="input bg-[var(--color-cream)] text-[var(--color-body)] cursor-not-allowed">
                {checkoutDate ? formatDate(checkoutDate) : '—'}
              </div>
            </div>
          </div>

          {/* Room Type Selection */}
          <div>
            <label className="label">Select Room Types</label>
            <div className="space-y-2">
              {(availability.length > 0 ? availability : property.rooms.map(r => ({
                roomTypeId: r._id,
                name: r.name,
                totalRooms: r.totalRooms,
                freeCount: r.totalRooms,
                pricePerNight: r.pricePerNight,
                mealPlan: r.mealPlan,
              }))).map(room => {
                const isSelected = !!selectedRooms[room.roomTypeId];
                const qty = selectedRooms[room.roomTypeId] || 0;
                const roomData = property.rooms.find(r => r._id === room.roomTypeId);
                const lineTotal = lineTotals[room.roomTypeId] || 0;

                return (
                  <div
                    key={room.roomTypeId}
                    className={`flex items-center gap-3 rounded-lg p-3 border transition-colors ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-blue-50/50'
                        : 'border-[var(--color-border)] bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRoom(room.roomTypeId)}
                      className="rounded"
                      id={`room-check-${room.roomTypeId}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[var(--color-heading)]">
                          {room.name}
                        </span>
                        <span className="text-xs text-[var(--color-body)]">
                          {formatCurrency(roomData?.pricePerNight || room.pricePerNight)}/night
                        </span>
                      </div>
                      <span className={`text-xs font-medium ${
                        room.freeCount === 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'
                      }`}>
                        {room.freeCount} free
                      </span>
                    </div>

                    {/* Quantity stepper */}
                    {isSelected && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateRoomQty(room.roomTypeId, -1)}
                          className="w-7 h-7 rounded-md bg-[var(--color-cream)] border border-[var(--color-border)] flex items-center justify-center text-sm font-bold hover:bg-[var(--color-cream-dark)] transition-colors"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateRoomQty(room.roomTypeId, 1)}
                          className="w-7 h-7 rounded-md bg-[var(--color-cream)] border border-[var(--color-border)] flex items-center justify-center text-sm font-bold hover:bg-[var(--color-cream-dark)] transition-colors"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* Line total */}
                    {isSelected && lineTotal > 0 && (
                      <span className="text-sm font-semibold text-[var(--color-heading)] whitespace-nowrap">
                        {formatCurrency(lineTotal)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          {Object.keys(selectedRooms).length > 0 && (
            <div className="bg-[var(--color-cream)] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-body)]">Total Amount</span>
                <span className="text-lg font-bold text-[var(--color-heading)]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-[var(--color-body)]" htmlFor="advance-paid">
                  Advance Paid (₹)
                </label>
                <input
                  id="advance-paid"
                  className="input w-32 text-right"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.advancePaid}
                  onChange={e => setForm(prev => ({ ...prev, advancePaid: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                <span className="text-sm font-semibold text-[var(--color-amber)]">Balance Due</span>
                <span className={`text-lg font-bold ${
                  balanceDue > 0 ? 'text-[var(--color-amber)]' : 'text-[var(--color-success)]'
                }`}>
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label" htmlFor="booking-notes">Notes</label>
            <textarea
              id="booking-notes"
              className="input min-h-[60px] resize-y"
              placeholder="Early check-in, extra bed, group name…"
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={clearForm}
              className="btn btn-outline"
              id="clear-form-btn"
            >
              Clear
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              id="block-rooms-btn"
            >
              {submitting ? 'Blocking...' : 'Block Rooms'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Upcoming Bookings ── */}
      <div className="card slide-up" id="upcoming-bookings">
        <h2 className="text-lg font-bold text-[var(--color-heading)] mb-4">
          📅 Upcoming Bookings
        </h2>

        {bookingList.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] text-center py-6">
            No active bookings yet. Block rooms above to create your first booking.
          </p>
        ) : (
          <div className="space-y-3">
            {bookingList.map(booking => {
              const balance = Math.max(0, booking.totalAmount - booking.advancePaid);
              const isPaid = balance === 0;

              return (
                <div
                  key={booking._id}
                  className="flex items-start justify-between gap-4 bg-[var(--color-cream)] rounded-lg p-4 border border-[var(--color-border)] hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-[var(--color-heading)]">
                        {booking.guestName}
                      </span>
                      <span className={`pill ${isPaid ? 'pill-success' : 'pill-amber'}`}>
                        {isPaid ? 'Paid' : 'Balance due'}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--color-body)] mb-1.5">
                      {formatDate(booking.checkinDate)} – {formatDate(booking.checkoutDate)} · {booking.nights} night{booking.nights > 1 ? 's' : ''}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {booking.rooms.map((room, i) => {
                        const roomType = property.rooms.find(r => r._id === room.roomTypeId);
                        return (
                          <span key={i} className="pill pill-blue text-[10px]">
                            {room.qty} {roomType?.name || 'Room'}
                          </span>
                        );
                      })}
                      {booking.notes && (
                        <span className="pill bg-gray-100 text-gray-600 text-[10px]">
                          {booking.notes.length > 25 ? booking.notes.slice(0, 25) + '…' : booking.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-[var(--color-heading)]">
                      {formatCurrency(booking.totalAmount)}
                    </div>
                    {!isPaid && (
                      <>
                        <div className="text-xs font-medium text-[var(--color-amber)] mt-0.5">
                          {formatCurrency(balance)} due
                        </div>
                        <button
                          onClick={() => handleMarkPaid(booking._id)}
                          className="btn btn-success text-xs px-2.5 py-1 mt-1.5"
                          id={`mark-paid-${booking._id}`}
                        >
                          Mark paid
                        </button>
                      </>
                    )}
                    {isPaid && (
                      <div className="text-xs font-medium text-[var(--color-success)] mt-0.5">
                        Fully paid
                      </div>
                    )}
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-danger)] mt-1 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
