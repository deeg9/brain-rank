// Canonical rendering of the BRAIN | RANK wordmark for use inside body copy.
// Matches the Footer / TopBar treatment (uppercase, tracking-wider, dimmed pipe)
// but inherits font weight and color from the surrounding text so it reads as
// prose rather than a heading.
export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`font-headline font-bold tracking-wider uppercase ${className}`}>
      BRAIN<span className="opacity-40 mx-0.5">|</span>RANK
    </span>
  );
}
