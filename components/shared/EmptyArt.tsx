// Soft pastel cluster used in empty states. Abstract on purpose — feels intentional
// but doesn't overcommit to a literal illustration.

export default function EmptyArt({ size = 96 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      width={size}
      height={(size * 100) / 120}
      className="mx-auto block"
      aria-hidden
    >
      <circle cx="46" cy="40" r="24" fill="var(--accent-soft)" />
      <circle cx="74" cy="40" r="24" fill="var(--lilac-soft)" />
      <circle cx="60" cy="62" r="24" fill="var(--success-soft)" />
      <circle cx="60" cy="48" r="7" fill="var(--surface)" opacity="0.85" />
    </svg>
  );
}
