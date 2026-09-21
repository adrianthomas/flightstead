import React from "react";
import { formatRichText } from "../format.js";

export function LegalPage({ title, content }: { title: string; content: string }) {
  return (
    <article className="about-page imprint-page">
      <h1>{title}</h1>
      <div
        className="about-content"
        dangerouslySetInnerHTML={{ __html: formatRichText(content) }}
      />
    </article>
  );
}
