export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle
        cx="24"
        cy="24"
        r="22.25"
        fill="none"
        stroke="var(--color-gold-500)"
        strokeWidth="1.5"
      />
      <circle
        cx="24"
        cy="24"
        r="18.5"
        fill="none"
        stroke="var(--color-gold-500)"
        strokeOpacity="0.35"
        strokeWidth="0.75"
      />

      {/* Cinnamon quill */}
      <path
        d="M17.5 31.5c3.4-1.2 6.1-3.9 9.3-7.1 3.2-3.2 5.6-6.2 6.6-9.4"
        fill="none"
        stroke="var(--color-forest-800)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M18.9 33.2c3.4-1.2 6.1-3.9 9.3-7.1 3.2-3.2 5.6-6.2 6.6-9.4"
        fill="none"
        stroke="var(--color-earth-500)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />

      {/* Leaf */}
      <path
        d="M27.6 25.9c.3-4.6 3.4-8 8.4-8.9-.1 5-3 8.4-8.4 8.9Z"
        fill="var(--color-forest-600)"
      />
      <path
        d="M27.8 25.8c2.2-2.2 4.5-3.9 7.1-5.2"
        fill="none"
        stroke="var(--color-cream-100)"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />

      {/* Gold seeds */}
      <circle cx="16.2" cy="30.2" r="1.15" fill="var(--color-gold-500)" />
      <circle cx="20.4" cy="34.1" r="0.9" fill="var(--color-gold-500)" />
    </svg>
  );
}
