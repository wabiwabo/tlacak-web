/**
 * BMKG nowcast RSS + CAP XML parsers.
 *
 * Index URL:   https://www.bmkg.go.id/alerts/nowcast/id
 * Detail URLs: each <item><link> in the RSS points to a CAP 1.2 XML file
 *              like https://www.bmkg.go.id/alerts/nowcast/<area>_alert.xml.
 *
 * We treat an item as flood-related when its title contains the
 * keywords "banjir" or "genangan" (case-insensitive). The CAP detail
 * supplies the polygon and a CAP severity that maps directly to our
 * FloodSeverity enum.
 *
 * Pure parsers — fetching is the hook's responsibility. We use the
 * browser DOMParser; in jsdom (vitest env: jsdom) the same API is
 * available so the parsers run unchanged under test.
 *
 * Attribution: public domain with mandatory BMKG attribution.
 * Verified live 2026-05-24 with CORS open.
 */

import type { FloodFeature, FloodSeverity, Geometry } from './types';

export const BMKG_ATTRIBUTION = 'BMKG (Public Domain)';

const FLOOD_TITLE_RE = /banjir|genangan/i;

const SEVERITY_MAP: Record<string, FloodSeverity> = {
  minor: 'minor',
  moderate: 'moderate',
  severe: 'severe',
  extreme: 'extreme',
};

export interface NowcastIndexItem {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
}

function safeParseXml(body: string, mime: 'application/xml' | 'text/xml'): Document | null {
  if (!body) return null;
  try {
    const doc = new DOMParser().parseFromString(body, mime);
    // DOMParser surfaces parse errors as a <parsererror> child rather than
    // throwing — detect and treat as failure.
    if (doc.getElementsByTagName('parsererror').length > 0) return null;
    return doc;
  } catch {
    return null;
  }
}

function textOf(parent: Element | Document, tag: string): string {
  return parent.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';
}

/** Parse the RSS index. Returns only items whose title looks flood-related. */
export function parseNowcastIndex(rss: string): NowcastIndexItem[] {
  const doc = safeParseXml(rss, 'application/xml');
  if (!doc) return [];
  const items: NowcastIndexItem[] = [];
  const nodes = Array.from(doc.getElementsByTagName('item'));
  for (const node of nodes) {
    const title = textOf(node, 'title');
    if (!FLOOD_TITLE_RE.test(title)) continue;
    const url = textOf(node, 'link');
    const guid = textOf(node, 'guid');
    const pubDate = textOf(node, 'pubDate');
    const publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
    items.push({
      id: guid || url,
      title,
      url,
      publishedAt,
    });
  }
  return items;
}

/** Parse one CAP XML alert. Returns null when no polygon is present or
 *  the body is unparseable. */
export function parseCapAlert(cap: string): FloodFeature | null {
  const doc = safeParseXml(cap, 'text/xml');
  if (!doc) return null;
  const alert = doc.getElementsByTagName('alert')[0];
  if (!alert) return null;
  const identifier = textOf(alert, 'identifier') || `bmkg-${Date.now()}`;
  const sent = textOf(alert, 'sent');
  const info = alert.getElementsByTagName('info')[0];
  const severityRaw = textOf(info ?? alert, 'severity').toLowerCase();
  const severity = SEVERITY_MAP[severityRaw] ?? 'moderate';
  const polygonRaw = info?.getElementsByTagName('polygon')[0]?.textContent?.trim();
  if (!polygonRaw) return null;
  const coords = polygonRaw
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number))
    .filter((p) => p.length === 2 && Number.isFinite(p[0]!) && Number.isFinite(p[1]!))
    // CAP polygon is "lat,lng"; GeoJSON wants [lng, lat]
    .map(([lat, lng]) => [lng!, lat!] as [number, number]);
  if (coords.length < 4) return null;
  const geometry: Geometry = { type: 'Polygon', coordinates: [coords] };
  return {
    id: `b-${identifier}`,
    kind: 'warning',
    severity,
    geometry,
    depthCm: null,
    reportedAt: sent ? new Date(sent).toISOString() : new Date().toISOString(),
    source: 'bmkg',
    attribution: BMKG_ATTRIBUTION,
    meta: {
      headline: textOf(info ?? alert, 'headline'),
      event: textOf(info ?? alert, 'event'),
      areaDesc: info?.getElementsByTagName('areaDesc')[0]?.textContent?.trim(),
    },
  };
}
