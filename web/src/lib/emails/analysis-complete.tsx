interface AnalysisCompleteEmailProps {
  videoFilename: string;
  resultsUrl: string;
}

export function AnalysisCompleteEmail({ videoFilename, resultsUrl }: AnalysisCompleteEmailProps) {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1c1b1e', margin: 0 }}>
          BRAIN<span style={{ color: '#999', margin: '0 2px' }}>|</span>RANK
        </h1>
      </div>

      {/* Body */}
      <div style={{ backgroundColor: '#f5f5f8', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
        <div style={{ marginBottom: '16px' }}>
          <img
            src="https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/neurology/default/48px.svg"
            alt="Brain"
            width="40"
            height="40"
            style={{ display: 'inline-block', filter: 'brightness(0) saturate(100%)' }}
          />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1c1b1e', margin: '0 0 8px 0' }}>
          Your Brain<span style={{ color: '#999', margin: '0 4px' }}>|</span>Rank analysis is ready
        </h2>
        <p style={{ fontSize: '14px', color: '#605d62', margin: '0 0 24px 0', lineHeight: '1.5' }}>
          We&apos;ve finished analyzing <strong style={{ color: '#1c1b1e' }}>{videoFilename}</strong> and your neural activation results are ready to view.
        </p>

        {/* CTA Button */}
        <a
          href={resultsUrl}
          style={{
            display: 'inline-block',
            backgroundColor: '#1c1b1e',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
            borderRadius: '8px',
            padding: '12px 32px',
          }}
        >
          View Results →
        </a>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <p style={{ fontSize: '11px', color: '#999', margin: 0, lineHeight: '1.6' }}>
          Neural activation predictions are computational estimates, not medical measurements.
          <br />
          © {new Date().getFullYear()} BRAIN<span style={{ color: '#bbb', margin: '0 2px' }}>|</span>RANK. All rights reserved.
        </p>
      </div>
    </div>
  );
}
