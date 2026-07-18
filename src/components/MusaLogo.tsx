import React from 'react';

interface MusaLogoProps {
  className?: string;
  size?: number;
}

export default function MusaLogo({ className = '', size = 48 }: MusaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Royal Shield */}
      <path
        d="M50 5C75 5 85 15 85 45C85 70 65 90 50 95C35 90 15 70 15 45C15 15 25 5 50 5Z"
        fill="#010066"
        stroke="#FFCB05"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Golden Laurel/Branch details in background */}
      <path
        d="M30 45C30 58 38 68 50 68C62 68 70 58 70 45"
        stroke="#FFCB05"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
      {/* Stylized M and T Monogram */}
      <text
        x="34"
        y="53"
        fill="#FFCB05"
        fontFamily="Georgia, serif"
        fontSize="24"
        fontWeight="bold"
      >
        M
      </text>
      <text
        x="51"
        y="53"
        fill="#FFFFFF"
        fontFamily="Georgia, serif"
        fontSize="24"
        fontWeight="bold"
      >
        T
      </text>
      {/* Clean elegant underline or division ribbon */}
      <path
        d="M28 58H72"
        stroke="#FFCB05"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Little star accent */}
      <polygon
        points="50,22 52,28 58,28 53,32 55,38 50,34 45,38 47,32 42,28 48,28"
        fill="#FFCB05"
      />
    </svg>
  );
}
