import React from 'react';

// Стрелка в стиле шрифта: скругленные концы, толщина линии как у жирного Manrope
export default function ArrowIcon({ direction = 'left', size = 18 }) {
  return (
    <svg
      className="arrow-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={direction === 'right' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}
