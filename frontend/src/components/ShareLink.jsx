import { useState } from 'react';

export default function ShareLink({ slug }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${window.location.origin}/${slug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="card" id="share-link-widget">
      <h3 className="text-sm font-semibold text-[var(--color-body)] mb-3 uppercase tracking-wide">
        Share this page
      </h3>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[var(--color-cream)] rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--color-heading)] truncate border border-[var(--color-border)]">
          {fullUrl}
        </div>
        <button
          onClick={handleCopy}
          className="btn btn-primary text-sm whitespace-nowrap"
          id="copy-link-btn"
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-[var(--color-muted)] mt-2.5">
        Add to Instagram bio · WhatsApp status · Google Business
      </p>
    </div>
  );
}
