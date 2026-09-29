import { lookup } from "node:dns/promises";
import { lookup as lookupCallback, type LookupAddress } from "node:dns";
import { isIP, type LookupFunction } from "node:net";

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 0) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local, fc00::/7
  if (normalized.startsWith("fe80")) return true; // link-local
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length);
    if (isIP(mapped) === 4) return isPrivateIPv4(mapped);
  }
  return false;
}

function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // not a literal IP we recognize — refuse rather than guess
}

/**
 * Blocks the SSRF pivot resolvers/article.ts (and resolveMusic's fallback)
 * are exposed to: both fetch a user-supplied URL server-side with no other
 * restriction. Without this, an authenticated caller could point either
 * endpoint at Uberspace's internal network — other tenants' local services,
 * the box's own admin ports — or use the server as a port scanner.
 *
 * Must be re-run per redirect hop, not just on the original URL — got
 * follows redirects by default, and a public URL redirecting to a private
 * one is the standard way to smuggle a blocked target past a check that
 * only looks at the request as given.
 */
export async function assertSafeFetchTarget(rawUrl: string | URL): Promise<void> {
  const url = typeof rawUrl === "string" ? new URL(rawUrl) : rawUrl;
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Refusing to fetch unsupported protocol: ${url.protocol}`);
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (hostname.toLowerCase() === "localhost") {
    throw new Error("Refusing to fetch a local/internal address.");
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new Error("Refusing to fetch a private/internal address.");
    }
    return;
  }

  const records = await lookup(hostname, { all: true, verbatim: true });
  if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error("Refusing to fetch a private/internal address.");
  }
}

/**
 * Pass as got's `dnsLookup` option alongside assertSafeFetchTarget, not
 * instead of it. assertSafeFetchTarget validates the URL up front, but a
 * plain `dns.lookup()` check followed by an ordinary request lets the HTTP
 * client re-resolve the hostname on its own moments later — two separate
 * DNS queries an attacker's resolver can answer differently (a public IP
 * for the check, a private one for the connection). Using this function as
 * the client's own resolution logic makes the validated address the one
 * actually connected to, closing that window.
 */
export const safeDnsLookup: LookupFunction = (hostname, options, callback) => {
  const family = typeof options === "number" ? options : options?.family;
  lookupCallback(hostname, { all: true, verbatim: true, family }, (err, addresses) => {
    if (err) {
      callback(err, "", 0);
      return;
    }
    const records = addresses as LookupAddress[];
    if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) {
      callback(new Error("Refusing to fetch a private/internal address."), "", 0);
      return;
    }
    callback(null, records[0].address, records[0].family);
  });
};
