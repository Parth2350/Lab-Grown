/**
 * Client-safe helpers for rendering untrusted, customer-supplied contact details and URLs.
 * Anything that fails validation is rendered as plain text (or not at all), never as a link.
 */

const RELATIVE_PATH_RE = /^\/(?![/\\])[^\s\\]*$/;
const BARE_DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?::\d{2,5})?(?:[/?#][^\s]*)?$/i;
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"?&#%/]+@[^\s@<>()[\]\\,;:"?&#%/]+\.[^\s@<>()[\]\\,;:"?&#%/]+$/;

/** Site-relative paths (not protocol-relative) or absolute http(s) URLs; anything else → null. */
export function safeUrl(raw: string | null | undefined): string | null {
  const v = raw?.trim();
  if (!v || v.length > 2048) return null;
  if (v.startsWith('/')) return RELATIVE_PATH_RE.test(v) ? v : null;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Like safeUrl, but also accepts a bare domain ("maison.com/about") by assuming https. */
export function safeWebsite(raw: string | null | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) || v.startsWith('/')) {
    const url = safeUrl(v);
    return url && !url.startsWith('/') ? url : null;
  }
  return BARE_DOMAIN_RE.test(v) ? safeUrl(`https://${v}`) : null;
}

/** Display form of a URL: host + path, without protocol or trailing slash. */
export function displayUrl(url: string) {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

/** mailto: link with an optional subject — null for anything that is not a plain address. */
export function mailtoHref(email: string | null | undefined, subject?: string): string | null {
  const e = email?.trim();
  if (!e || e.length > 254 || !EMAIL_RE.test(e)) return null;
  return `mailto:${e}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}

/** tel: link from a free-form phone number (keeps a leading + and digits only). */
export function telHref(phone: string | null | undefined): string | null {
  const v = phone?.trim();
  if (!v) return null;
  const digits = v.replace(/\D/g, '');
  if (digits.length < 5 || digits.length > 18) return null;
  return `tel:${v.startsWith('+') ? '+' : ''}${digits}`;
}
