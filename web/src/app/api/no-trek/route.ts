// src/app/api/no-trek/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type NearbyPlace = { name: string; lat: number; lng: number; tags?: Record<string, string> };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = (searchParams.get('action') || '').toLowerCase();

  try {
    switch (action) {
      case 'health':
        return json({ ok: true });

      case 'nearby': {
        const lat = Number(searchParams.get('lat'));
        const lng = Number(searchParams.get('lng'));
        const radius = Number(searchParams.get('radius') || 7000);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return json({ error: 'lat/lng required' }, 400);
        }

        const overpassQuery = `
          [out:json][timeout:25];
          (
            node(around:${radius},${lat},${lng})["amenity"~"hospital|clinic"];
            node(around:${radius},${lat},${lng})["healthcare"~"hospital|clinic|doctor|urgent_care"];
          );
          out body 25;
        `;

        const r = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'User-Agent': 'NoTrek/1.0 (dev@notrek.local)',
            'Accept': 'application/json',
          },
          body: overpassQuery,
          keepalive: true as any,
        });

        if (!r.ok) return json({ error: 'Overpass error', status: r.status }, 502);

        const j = await r.json();
        const places: NearbyPlace[] = (j?.elements ?? [])
          .filter((e: any) => e?.lat && e?.lon)
          .map((e: any) => ({
            name: e.tags?.name || 'Unnamed facility',
            lat: e.lat,
            lng: e.lon,
            tags: e.tags || {},
          }))
          .slice(0, 12);

        return json({ places });
      }

      case 'revgeo': {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        if (!lat || !lng) return json({ error: 'lat/lng required' }, 400);

        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
        const r = await fetch(url, {
          headers: {
            'User-Agent': 'NoTrek/1.0 (dev@notrek.local)',
            'Accept': 'application/json',
          },
        });
        if (!r.ok) return json({ zip: null, status: r.status });
        const j = await r.json();
        const zip = j?.address?.postcode || null;
        return json({ zip });
      }

      default:
        return json({ error: 'unknown action' }, 404);
    }
  } catch (err: any) {
    return json({ error: 'server', message: String(err?.message || err) }, 500);
  }
}

// Optional: helps some tools and preflights
export async function HEAD() {
  return new Response(null, { status: 200 });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
