import { describe, expect, it } from 'vitest';
import {
  parseNowcastIndex,
  parseCapAlert,
  BMKG_ATTRIBUTION,
} from '../bmkg-nowcast';

const RSS_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BMKG Nowcast</title>
    <item>
      <title>Peringatan Dini Cuaca Banjir DKI Jakarta</title>
      <link>https://www.bmkg.go.id/alerts/nowcast/3171_alert.xml</link>
      <pubDate>Sun, 24 May 2026 11:00:00 +0000</pubDate>
      <guid>3171-2026-05-24T11</guid>
    </item>
    <item>
      <title>Gempa M 4.5 Sumba</title>
      <link>https://www.bmkg.go.id/alerts/nowcast/53-eq.xml</link>
      <pubDate>Sun, 24 May 2026 10:00:00 +0000</pubDate>
      <guid>53-eq</guid>
    </item>
    <item>
      <title>Hujan Lebat Potensi Genangan Bandung</title>
      <link>https://www.bmkg.go.id/alerts/nowcast/3273_alert.xml</link>
      <pubDate>Sun, 24 May 2026 10:30:00 +0000</pubDate>
      <guid>3273-2026-05-24T10</guid>
    </item>
  </channel>
</rss>`;

const CAP_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>3171-2026-05-24T11</identifier>
  <sent>2026-05-24T11:00:00+00:00</sent>
  <info>
    <category>Met</category>
    <event>Banjir</event>
    <severity>Severe</severity>
    <headline>Peringatan banjir Jakarta Pusat</headline>
    <parameter><valueName>banjir</valueName><value>true</value></parameter>
    <area>
      <areaDesc>Jakarta Pusat</areaDesc>
      <polygon>-6.18,106.82 -6.18,106.83 -6.17,106.83 -6.17,106.82 -6.18,106.82</polygon>
    </area>
  </info>
</alert>`;

describe('parseNowcastIndex', () => {
  it('returns flood-related items only and drops earthquakes', () => {
    const items = parseNowcastIndex(RSS_SAMPLE);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.id).sort()).toEqual(['3171-2026-05-24T11', '3273-2026-05-24T10']);
  });

  it('extracts the CAP detail URL from each item link', () => {
    const items = parseNowcastIndex(RSS_SAMPLE);
    expect(items[0]!.url).toMatch(/3171_alert\.xml$/);
  });

  it('parses pubDate to ISO', () => {
    const items = parseNowcastIndex(RSS_SAMPLE);
    expect(items[0]!.publishedAt).toBe('2026-05-24T11:00:00.000Z');
  });

  it('returns an empty array when the RSS body is empty or malformed', () => {
    expect(parseNowcastIndex('')).toEqual([]);
    expect(parseNowcastIndex('<not xml')).toEqual([]);
  });

  it('treats title keywords "banjir" and "genangan" (case-insensitive) as flood-related', () => {
    expect(parseNowcastIndex(RSS_SAMPLE).map((i) => i.title)).toEqual(
      expect.arrayContaining([
        'Peringatan Dini Cuaca Banjir DKI Jakarta',
        'Hujan Lebat Potensi Genangan Bandung',
      ]),
    );
  });
});

describe('parseCapAlert', () => {
  it('maps a flood CAP alert into a FloodFeature', () => {
    const feature = parseCapAlert(CAP_SAMPLE);
    expect(feature).toMatchObject({
      id: 'b-3171-2026-05-24T11',
      kind: 'warning',
      severity: 'severe',
      source: 'bmkg',
      depthCm: null,
      reportedAt: '2026-05-24T11:00:00.000Z',
      attribution: BMKG_ATTRIBUTION,
    });
    expect(feature?.geometry.type).toBe('Polygon');
    expect((feature?.geometry as { coordinates: number[][][] }).coordinates[0]).toEqual([
      [106.82, -6.18],
      [106.83, -6.18],
      [106.83, -6.17],
      [106.82, -6.17],
      [106.82, -6.18],
    ]);
  });

  it('returns null when the CAP polygon is missing', () => {
    const noPolygon = CAP_SAMPLE.replace(/<polygon>.*?<\/polygon>/, '');
    expect(parseCapAlert(noPolygon)).toBeNull();
  });

  it('maps CAP severity Minor/Moderate/Severe/Extreme', () => {
    const at = (s: string) =>
      parseCapAlert(CAP_SAMPLE.replace('<severity>Severe</severity>', `<severity>${s}</severity>`))!
        .severity;
    expect(at('Minor')).toBe('minor');
    expect(at('Moderate')).toBe('moderate');
    expect(at('Severe')).toBe('severe');
    expect(at('Extreme')).toBe('extreme');
  });

  it('returns null when the CAP body is unparseable', () => {
    expect(parseCapAlert('garbage')).toBeNull();
  });
});
