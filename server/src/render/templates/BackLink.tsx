import React from "react";

// The classic/washi themes' equivalent of the cards theme's CloseButton —
// a plain text link back to the feed, styled to match those themes'
// otherwise link-light typography. Reuses the "←"/"→" convention pagination
// already uses in render.ts rather than an ASCII "<-".
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="back-link" href={href}>
      <span aria-hidden="true">←</span> {label}
    </a>
  );
}
