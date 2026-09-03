/**
 * Location and Reverse Geocoding Utility
 * Provides clean, stable, and accurate address resolution for Attendance and Site check-ins.
 */

// In-memory cache for reverse geocoding to prevent GPS jitter and duplicate API calls
const geocodeCache = new Map<string, string>();

/**
 * Formats a raw comma-separated address string into a clean, concise address.
 */
export function formatDisplayAddress(rawAddress?: string | null): string {
  if (!rawAddress) return "";
  const str = String(rawAddress).trim();
  if (!str || str === "Locating..." || str === "Location detected" || str === "Location not available") {
    return str;
  }

  // Split components
  const parts = str.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 3) {
    return str;
  }

  // Filter out noisy POI/department names and redundant administrative subdistricts
  const cleaned = parts.filter((p) => {
    const lower = p.toLowerCase();
    return (
      !lower.startsWith("department of") &&
      !lower.includes("subdistrict") &&
      !lower.includes("city subdistrict") &&
      !lower.includes("district") &&
      !lower.includes("taluka") &&
      !lower.includes("division")
    );
  });

  // Deduplicate case-insensitively
  const uniqueParts: string[] = [];
  cleaned.forEach((p) => {
    if (!uniqueParts.some((u) => u.toLowerCase() === p.toLowerCase() || (u.length > 5 && p.toLowerCase().includes(u.toLowerCase())))) {
      uniqueParts.push(p);
    }
  });

  if (uniqueParts.length >= 2) {
    return uniqueParts.slice(0, 4).join(", ");
  }

  return cleaned.length > 0 ? cleaned.slice(0, 4).join(", ") : str;
}

/**
 * Clean and format structured address from reverse geocoding data
 */
export function formatAddressFromNominatim(data: any): string {
  if (!data) return "Location detected";

  const addr = data.address || {};

  // 1. Extract clean address components
  const road = addr.road || addr.street || addr.footway || addr.path || "";
  const area =
    addr.suburb ||
    addr.neighbourhood ||
    addr.residential ||
    addr.quarter ||
    addr.subdivision ||
    addr.locality ||
    addr.village ||
    addr.hamlet ||
    "";
  const city = addr.city || addr.town || addr.municipality || addr.city_district || "";
  const state = addr.state || "";
  const pincode = addr.postcode || "";

  // 2. Build unique, readable parts
  const parts: string[] = [];

  if (road) {
    parts.push(road);
  }
  if (area && !parts.some((p) => p.toLowerCase().includes(area.toLowerCase()))) {
    parts.push(area);
  }
  if (city && !parts.some((p) => p.toLowerCase().includes(city.toLowerCase()))) {
    parts.push(city);
  }
  if (state && !parts.some((p) => p.toLowerCase().includes(state.toLowerCase()))) {
    if (pincode) {
      parts.push(`${state} ${pincode}`);
    } else {
      parts.push(state);
    }
  } else if (pincode && !parts.some((p) => p.includes(pincode))) {
    parts.push(pincode);
  }

  if (parts.length >= 2) {
    return parts.join(", ");
  }

  // 3. Fallback: Clean up raw display_name
  if (data.display_name) {
    return formatDisplayAddress(data.display_name);
  }

  return "Location detected";
}

/**
 * Reverse geocodes coordinates into a clean, human-readable address.
 * Includes caching and coordinate rounding to avoid POI jitter.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Round to 4 decimal places (~11 meters) to stabilize GPS jitter
  const roundedLat = parseFloat(lat.toFixed(4));
  const roundedLng = parseFloat(lng.toFixed(4));
  const cacheKey = `${roundedLat},${roundedLng}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    // Use zoom=16 for road/locality level precision rather than micro-building jumpiness
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&zoom=16&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "en" },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const formatted = formatAddressFromNominatim(data);
      if (formatted && formatted !== "Location detected") {
        geocodeCache.set(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (err) {
    // Primary reverse geocode failed, try lightweight fallback
  }

  // Fallback 1: BigDataCloud free client-side reverse geocoding
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${roundedLat}&longitude=${roundedLng}&localityLanguage=en`
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const parts = [
        bdcData.locality || bdcData.principalSubdivisionDescription || "",
        bdcData.city || bdcData.localityInfo?.administrative?.[2]?.name || "",
        bdcData.principalSubdivision || "",
        bdcData.postcode || "",
      ].filter(Boolean);

      const uniqueParts = Array.from(new Set(parts));
      if (uniqueParts.length >= 2) {
        const formatted = uniqueParts.join(", ");
        geocodeCache.set(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (err) {
    // Fallback failed
  }

  return "Location detected";
}

/**
 * Gets live browser geolocation and resolves the address cleanly.
 */
export function getLivePosition(
  options: {
    projectFallback?: string;
    onAddressResolved?: (addr: string, lat: number, lng: number) => void;
  } = {}
): Promise<{ latitude: number; longitude: number; address: string }> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      const fallback = options.projectFallback || "Location access unavailable";
      if (options.onAddressResolved) options.onAddressResolved(fallback, 0, 0);
      return resolve({ latitude: 0, longitude: 0, address: fallback });
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const address = await reverseGeocode(lat, lng);
          const finalAddress =
            address && address !== "Location detected"
              ? address
              : options.projectFallback || address;
          if (options.onAddressResolved) options.onAddressResolved(finalAddress, lat, lng);
          resolve({ latitude: lat, longitude: lng, address: finalAddress });
        } catch {
          const fallback = options.projectFallback || "Location detected";
          if (options.onAddressResolved) options.onAddressResolved(fallback, lat, lng);
          resolve({ latitude: lat, longitude: lng, address: fallback });
        }
      },
      () => {
        const fallback = options.projectFallback || "Location access denied";
        if (options.onAddressResolved) options.onAddressResolved(fallback, 0, 0);
        resolve({ latitude: 0, longitude: 0, address: fallback });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
