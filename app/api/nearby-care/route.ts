import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type FacilityKind = "Hospital" | "Clinic" | "Doctor";

type OverpassElement = {
  id: number | string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: {
    name?: string;
    phone?: string;
    "contact:phone"?: string;
    "contact:website"?: string;
    website?: string;
    amenity?: string;
    healthcare?: string;
  };
};

type NearbyFacility = {
  id: number | string;
  name: string;
  phone: string;
  lat: number;
  lon: number;
  kind: FacilityKind;
  distanceKm: number;
  website: string | undefined;
};

const OVERPASS_ENDPOINTS = [
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

const REQUEST_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  "User-Agent": "LotusPhase/0.1 nearby-care contact=local",
};

function distanceInKm(fromLat: number, fromLon: number, toLat: number, toLon: number) {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(toLat - fromLat);
  const dLon = toRad(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function facilityKind(tags?: OverpassElement["tags"]): FacilityKind {
  if (tags?.amenity === "doctors" || tags?.healthcare === "doctor") return "Doctor";
  if (tags?.amenity === "clinic" || tags?.healthcare === "clinic") return "Clinic";
  return "Hospital";
}

function parseCoordinate(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidCoordinate(latitude: number, longitude: number) {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function buildOverpassQuery(latitude: number, longitude: number) {
  return `
    [out:json][timeout:18];
    (
      node["amenity"="hospital"](around:10000,${latitude},${longitude});
      way["amenity"="hospital"](around:10000,${latitude},${longitude});
      relation["amenity"="hospital"](around:10000,${latitude},${longitude});
      node["amenity"="clinic"](around:10000,${latitude},${longitude});
      way["amenity"="clinic"](around:10000,${latitude},${longitude});
      relation["amenity"="clinic"](around:10000,${latitude},${longitude});
      node["amenity"="doctors"](around:10000,${latitude},${longitude});
      way["amenity"="doctors"](around:10000,${latitude},${longitude});
      relation["amenity"="doctors"](around:10000,${latitude},${longitude});
      node["healthcare"="doctor"](around:10000,${latitude},${longitude});
      way["healthcare"="doctor"](around:10000,${latitude},${longitude});
      relation["healthcare"="doctor"](around:10000,${latitude},${longitude});
    );
    out center tags;
  `;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeLocation(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const res = await fetchWithTimeout(
    url.toString(),
    { headers: { "User-Agent": REQUEST_HEADERS["User-Agent"] } },
    8000,
  );

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const match = data[0];
  const latitude = Number(match?.lat);
  const longitude = Number(match?.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude, label: match.display_name ?? query };
}

function normalizeFacilities(elements: OverpassElement[], latitude: number, longitude: number) {
  const seen = new Set<string>();

  return elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const name = el.tags?.name?.trim();
      if (lat == null || lon == null || !name) return null;

      const key = `${name.toLowerCase()}-${lat.toFixed(4)}-${lon.toFixed(4)}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        id: el.id,
        name,
        phone: el.tags?.phone || el.tags?.["contact:phone"] || "",
        lat,
        lon,
        kind: facilityKind(el.tags),
        distanceKm: distanceInKm(latitude, longitude, lat, lon),
        website: el.tags?.website || el.tags?.["contact:website"],
      };
    })
    .filter((facility): facility is NearbyFacility => Boolean(facility))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 16);
}

async function fetchNearbyFacilities(latitude: number, longitude: number) {
  const body = new URLSearchParams({ data: buildOverpassQuery(latitude, longitude) });
  const errors: string[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: REQUEST_HEADERS,
          body,
        },
        12000,
      );

      if (!res.ok) {
        errors.push(`${endpoint}: ${res.status}`);
        continue;
      }

      const data = (await res.json()) as { elements?: OverpassElement[] };
      const facilities = normalizeFacilities(data.elements ?? [], latitude, longitude);
      if (facilities.length > 0) return { facilities, source: endpoint };

      errors.push(`${endpoint}: no named facilities`);
    } catch (err) {
      errors.push(`${endpoint}: ${err instanceof Error ? err.message : "request failed"}`);
    }
  }

  throw new Error(errors.join("; "));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const manualQuery = searchParams.get("q")?.trim();
  let latitude = parseCoordinate(searchParams.get("lat"));
  let longitude = parseCoordinate(searchParams.get("lon"));
  let resolvedLabel = "";

  if ((latitude == null || longitude == null) && manualQuery) {
    const geocoded = await geocodeLocation(manualQuery);
    if (!geocoded) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }
    latitude = geocoded.latitude;
    longitude = geocoded.longitude;
    resolvedLabel = geocoded.label;
  }

  if (latitude == null || longitude == null || !isValidCoordinate(latitude, longitude)) {
    return NextResponse.json({ error: "Valid lat/lon or q is required" }, { status: 400 });
  }

  try {
    const { facilities, source } = await fetchNearbyFacilities(latitude, longitude);
    return NextResponse.json({
      facilities,
      location: { latitude, longitude, label: resolvedLabel || `${latitude},${longitude}` },
      source,
    });
  } catch (err) {
    console.error("Nearby care lookup failed", err);
    return NextResponse.json(
      { error: "Nearby listings are temporarily unavailable" },
      { status: 502 },
    );
  }
}
