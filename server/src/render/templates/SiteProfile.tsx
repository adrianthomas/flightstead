import React from "react";
import { isSafeLinkUrl } from "../format.js";
import type { ContactLink, ProfileLink, Site } from "./types.js";

export function siteContactLinks(site: Site): ContactLink[] {
  const links = (site.contactLinks ?? []) as ContactLink[];
  if (links.length) return links;
  return site.contactUrl ? [{ label: site.contactLabel || "Contact", url: site.contactUrl }] : [];
}

export function SiteProfile({ site }: { site: Site }) {
  // A stored `javascript:`/`data:` link URL (predating the write-time
  // validation added to these fields) must not reach the hrefs below
  // unfiltered.
  const profileLinks = ((site.profileLinks ?? []) as ProfileLink[]).filter((link) => isSafeLinkUrl(link.url));
  const contactLinks = siteContactLinks(site).filter((link) => isSafeLinkUrl(link.url));
  const name = site.profileName?.trim() || site.title;

  return (
    <section className="site-footer-profile" aria-label={name}>
      <div className="site-profile-details">
        <div className="site-profile-identity">
          <p className="site-profile-name">{name}</p>
          {site.location ? <p className="site-profile-location">{site.location}</p> : null}
        </div>
        {profileLinks.length || contactLinks.length ? (
          <div className="site-profile-link-groups">
            {profileLinks.length ? (
              <p className="site-profile-links">
                <span>Elsewhere</span>
                {profileLinks.map((link) => (
                  <a key={link.url} href={link.url} rel={link.relMe ? "me" : undefined}>{link.label}</a>
                ))}
              </p>
            ) : null}
            {contactLinks.length ? (
              <p className="site-profile-links site-contact-links">
                <span>Contact</span>
                {contactLinks.map((link) => <a key={link.url} href={link.url}>{link.label}</a>)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
