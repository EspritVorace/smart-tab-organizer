import React, { useId } from 'react';

interface ExtensionMarkProps {
  size?: number;
}

/**
 * Inline render of the extension icon (src/assets/icon.svg).
 * Inlined as JSX so the gradient ids don't collide if multiple instances
 * are mounted, and so the SVG color stack stays under React's control.
 */
export function ExtensionMark({ size = 56 }: ExtensionMarkProps) {
  const gradientId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      style={{ display: 'block', borderRadius: 12, overflow: 'hidden' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9B7AE8" />
          <stop offset="1" stopColor="#6B4FD8" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill={`url(#${gradientId})`} />
      <rect x="24" y="26" width="80" height="16" rx="8" fill="#EDE4FF" />
      <rect x="24" y="56" width="64" height="16" rx="8" fill="#EDE4FF" />
      <rect x="24" y="86" width="48" height="16" rx="8" fill="#EDE4FF" />
      <circle cx="32" cy="34" r="5" fill="#D4C5FF" />
      <circle cx="32" cy="64" r="5" fill="#5EE3E3" />
      <circle cx="32" cy="94" r="5" fill="#FFB68A" />
    </svg>
  );
}
