const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const validLatitude = (value) => {
  const number = toFiniteNumber(value);
  if (number === null || number < -90 || number > 90) return null;
  return number;
};

const validLongitude = (value) => {
  const number = toFiniteNumber(value);
  if (number === null || number < -180 || number > 180) return null;
  return number;
};

const asCoordinatePair = (latitude, longitude) => {
  const lat = validLatitude(latitude);
  const lon = validLongitude(longitude);
  if (lat === null || lon === null) return null;
  return [lat, lon];
};

export const parseLocationCoordinates = (locationValue) => {
  if (locationValue === null || locationValue === undefined) return null;
  const text = String(locationValue).trim();
  if (!text) return null;

  const labelledMatches = Array.from(text.matchAll(/(lat|latitude|lng|lon|long|longitude)[^0-9-]*(-?\d{1,3}(?:\.\d+)?)/gi));
  if (labelledMatches.length >= 2) {
    let latitudeValue = null;
    let longitudeValue = null;

    for (const match of labelledMatches) {
      const label = match[1].toLowerCase();
      const value = match[2];

      if (label.startsWith('lat')) latitudeValue = value;
      if (label.startsWith('long') || label === 'lng' || label === 'lon') longitudeValue = value;
    }

    if (latitudeValue && longitudeValue) {
      return asCoordinatePair(latitudeValue, longitudeValue);
    }
  }

  const parentheticalMatch = text.match(/\((-?\d{1,3}(?:\.\d+)?)[\s,]+(-?\d{1,3}(?:\.\d+)?)\)/);
  if (parentheticalMatch) {
    return asCoordinatePair(parentheticalMatch[1], parentheticalMatch[2]);
  }

  return null;
};

/** Reads only coordinate fields returned by the incident API and falls back to location parsing when needed. */
export const getIncidentCoordinates = (incident) => {
  const directLatitude = toFiniteNumber(incident?.latitude ?? incident?.lat ?? incident?.coordinates?.latitude ?? incident?.coordinates?.lat ?? incident?.gps?.latitude ?? incident?.gps?.lat);
  const directLongitude = toFiniteNumber(incident?.longitude ?? incident?.lng ?? incident?.lon ?? incident?.coordinates?.longitude ?? incident?.coordinates?.lng ?? incident?.coordinates?.lon ?? incident?.gps?.longitude ?? incident?.gps?.lng ?? incident?.gps?.lon);

  const directPair = asCoordinatePair(directLatitude, directLongitude);
  if (directPair) return directPair;

  return parseLocationCoordinates(incident?.location ?? incident?.address ?? incident?.formattedLocation);
};
