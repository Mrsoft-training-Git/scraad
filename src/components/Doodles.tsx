import { SVGProps } from "react";

/* Hand-drawn SVG doodles for editorial accents.
   All use currentColor so they inherit text color. */

export const Squiggle = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 80 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...props}>
    <path d="M2 8 Q 12 2 22 8 T 42 8 T 62 8 T 78 8" />
  </svg>
);

export const StarBurst = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 40 40" fill="currentColor" {...props}>
    <path d="M20 0 L23 17 L40 20 L23 23 L20 40 L17 23 L0 20 L17 17 Z" />
  </svg>
);

export const Sparkle = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
  </svg>
);

export const ArrowDoodle = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 16 Q 20 4 40 14 T 58 18" />
    <path d="M52 12 L60 18 L52 24" />
  </svg>
);

export const Lightning = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13 0 L4 14 L11 14 L9 24 L20 9 L13 9 Z" />
  </svg>
);

export const Underline = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 200 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" preserveAspectRatio="none" {...props}>
    <path d="M2 8 Q 50 0 100 6 T 198 6" />
  </svg>
);
