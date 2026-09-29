import React from "react";
import { isSafeLinkUrl } from "../format.js";
import type { ProfileLink, Site } from "./types.js";
import { siteContactLinks } from "./SiteProfile.js";

export function ContactPage({ site }: { site: Site }) {
  // A stored `javascript:`/`data:` link URL (predating the write-time
  // validation added to these fields) must not reach the hrefs below
  // unfiltered.
  const profileLinks = ((site.profileLinks ?? []) as ProfileLink[]).filter((link) => isSafeLinkUrl(link.url));
  const contactLinks = siteContactLinks(site).filter((link) => isSafeLinkUrl(link.url));
  return (
    <article className="contact-page">
      <p className="work-eyebrow">Contact</p>
      <h2>Have an interesting knot to untangle?</h2>
      <p className="contact-lede">
        A new product, a stubborn problem, or simply a half-formed idea—I’m always happy to hear what you’re thinking about.
      </p>
      {contactLinks.length ? (
        <div className="contact-actions">
          {contactLinks.map((link) => (
            <a className="contact-primary" key={link.url} href={link.url}>
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      ) : null}
      {profileLinks.length ? (
        <div className="contact-links" aria-label="Elsewhere">
          <span>Or find me elsewhere</span>
          {profileLinks.map((link) => (
            <a key={link.url} href={link.url} rel={link.relMe ? "me" : undefined}>{link.label} ↗</a>
          ))}
        </div>
      ) : null}
      <a className="contact-back" href="/my-work">← Back to my work</a>
    </article>
  );
}
