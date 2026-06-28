export default function UpgradeModal({ isOpen, onClose, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="upgrade-modal">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors"
          id="upgrade-modal-close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-center text-[var(--color-heading)] mb-2">
          Upgrade Your Plan
        </h2>
        <p className="text-center text-[var(--color-body)] text-sm mb-6 leading-relaxed">
          {message || "You're on the Free plan — upgrade to add more rooms or properties and unlock premium features."}
        </p>

        <div className="bg-[var(--color-cream)] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--color-heading)]">Free Plan</span>
            <span className="pill pill-blue">Current</span>
          </div>
          <ul className="text-xs text-[var(--color-body)] space-y-1">
            <li>✓ 1 property</li>
            <li>✓ Up to 4 rooms</li>
            <li>✓ Public availability page</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-[var(--color-primary)] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--color-heading)]">Pro Plan</span>
            <span className="pill bg-[var(--color-primary)] text-white">Recommended</span>
          </div>
          <ul className="text-xs text-[var(--color-body)] space-y-1">
            <li>✓ Unlimited rooms</li>
            <li>✓ Priority support</li>
            <li>✓ Advanced analytics</li>
          </ul>
        </div>

        <p className="text-xs text-center text-[var(--color-muted)] mb-4">
          Contact us to upgrade your plan. Payment integration coming soon!
        </p>

        <button
          onClick={onClose}
          className="btn btn-primary w-full"
          id="upgrade-modal-dismiss"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
