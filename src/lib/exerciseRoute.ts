// Exercise names can contain anything ("100% Effort", "Press/Dip?", emoji). Expo Router
// decodes route params itself, so a raw or percent-encoded name risks being decoded twice
// and corrupted or crashing. A lowercase-hex slug of the UTF-8 bytes is unchanged by any
// number of decodes, so the name always survives the round trip.

/** Hex of the UTF-8 bytes, no separators: 'Hi' -> '4869'. */
export function encodeExerciseSlug(name: string): string {
  const encoded = encodeURIComponent(name);
  let hex = '';
  for (let i = 0; i < encoded.length; i++) {
    const char = encoded.charAt(i);
    const byte = char === '%' ? parseInt(encoded.slice(i + 1, i + 3), 16) : char.charCodeAt(0);
    if (char === '%') i += 2;
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

/** Inverse of encodeExerciseSlug; null for anything that is not a valid slug. */
export function decodeExerciseSlug(slug: string): string | null {
  if (slug === '' || slug.length % 2 !== 0 || !/^[0-9a-f]+$/.test(slug)) return null;
  try {
    return decodeURIComponent(slug.replace(/../g, '%$&'));
  } catch {
    return null; // not valid UTF-8
  }
}
