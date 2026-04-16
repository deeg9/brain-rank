interface AnalysisFailedEmailProps {
  videoFilename: string;
  uploadUrl: string;
  errorMessage?: string;
}

export function AnalysisFailedEmail({ videoFilename, uploadUrl, errorMessage }: AnalysisFailedEmailProps) {
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
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1c1b1e', margin: '0 0 8px 0' }}>
          Analysis couldn&apos;t be completed
        </h2>
        <p style={{ fontSize: '14px', color: '#605d62', margin: '0 0 8px 0', lineHeight: '1.5' }}>
          Something went wrong while analyzing <strong style={{ color: '#1c1b1e' }}>{videoFilename}</strong>.
        </p>
        {errorMessage && (
          <p style={{ fontSize: '12px', color: '#999', margin: '0 0 24px 0', fontFamily: 'monospace' }}>
            {errorMessage}
          </p>
        )}
        <p style={{ fontSize: '14px', color: '#605d62', margin: '0 0 24px 0', lineHeight: '1.5' }}>
          This can happen with certain video formats or lengths. Try re-uploading your video.
        </p>

        {/* CTA Button */}
        <a
          href={uploadUrl}
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
          Try Again →
        </a>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <p style={{ fontSize: '11px', color: '#999', margin: 0, lineHeight: '1.6' }}>
          If this keeps happening, reach out to us and we&apos;ll help.
          <br />
          © {new Date().getFullYear()} BrainRank. All rights reserved.
        </p>
      </div>
    </div>
  );
}
