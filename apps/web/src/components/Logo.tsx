/**
 * Logo slot. Replace the <svg> content with your own download logo (keep width/height props).
 * Placeholder: white square with a down arrow.
 */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" role="img" aria-label="Logo Media Hub" className="shrink-0">
      <rect width="26" height="26" rx="6" fill="#fff" />
      <path d="M13 6.5v9m-4-3.5 4 4 4-4M8 19.5h10" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
