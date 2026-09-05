const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15 19c0-2.2 1-4 3-4.6" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg {...iconProps} width="18" height="18">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...iconProps} width="16" height="16">
      <path d="M4 7h16" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
      <path d="M6 7l1 13a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function ShuffleIcon() {
  return (
    <svg {...iconProps} width="18" height="18">
      <path d="M4 5h3.5L16 19h4" />
      <path d="M17 5h3v3" />
      <path d="M4 19h3.5L11 13" />
      <path d="M17 19h3v-3" />
      <path d="M14 8l3-3" />
    </svg>
  );
}

export function PasteIcon() {
  return (
    <svg {...iconProps} width="18" height="18">
      <rect x="7" y="4.5" width="10" height="16" rx="1.5" />
      <path d="M9.5 4.5V3.8A1.3 1.3 0 0 1 10.8 2.5h2.4A1.3 1.3 0 0 1 14.5 3.8v0.7" />
      <path d="M9.5 10.5h5M9.5 13.5h5M9.5 16.5h3" />
    </svg>
  );
}
