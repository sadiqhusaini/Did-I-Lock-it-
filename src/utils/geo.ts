// Geolocation distance calculations and geofence tracking

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Haversine formula calculates distance in meters between two lat/lng coordinates
export function calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function getDepartureStatus(distanceMeters: number, radiusMeters: number): 'at_home' | 'departing' | 'away' {
  if (distanceMeters <= radiusMeters * 0.4) {
    return 'at_home';
  } else if (distanceMeters <= radiusMeters) {
    return 'departing';
  } else {
    return 'away';
  }
}
