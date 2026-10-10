/**
 * Utility functions for Clinical Atlas vector illustrations and image handling.
 * Resolves encoding issues (such as invalid data:image/svg+xml;utf8) and provides
 * clean vector SVG strings, data URIs, and high-resolution rendering.
 */

export function cleanAtlasImageUrl(url?: string): string {
  if (!url) return '';

  // Fix malformed data URIs with 'utf8' instead of standard 'charset=utf-8'
  if (url.startsWith('data:image/svg+xml;utf8,')) {
    const rawSvg = url.replace('data:image/svg+xml;utf8,', '');
    try {
      const decoded = decodeURIComponent(rawSvg);
      return createSafeSvgDataUri(decoded);
    } catch {
      return url.replace('data:image/svg+xml;utf8,', 'data:image/svg+xml;charset=utf-8,');
    }
  }

  // If it's already a safe charset=utf-8 or base64 data URI, return as-is
  if (url.startsWith('data:image/svg+xml;charset=utf-8,') || url.startsWith('data:image/svg+xml;base64,')) {
    return url;
  }

  // If it starts with <svg directly, convert to safe data URI
  if (url.trim().startsWith('<svg')) {
    return createSafeSvgDataUri(url.trim());
  }

  return url;
}

/**
 * Creates a rock-solid, cross-browser SVG data URI supporting UTF-8 and Arabic characters.
 */
export function createSafeSvgDataUri(svgString: string): string {
  try {
    if (typeof btoa === 'function') {
      const utf8Bytes = encodeURIComponent(svgString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      );
      return `data:image/svg+xml;base64,${btoa(utf8Bytes)}`;
    }
  } catch (e) {
    console.warn('Base64 encoding fallback for SVG:', e);
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

/**
 * Extracts inner raw SVG XML string from a data URI if possible.
 */
export function extractSvgFromDataUri(dataUri?: string): string | null {
  if (!dataUri) return null;
  if (dataUri.trim().startsWith('<svg')) return dataUri.trim();

  try {
    if (dataUri.startsWith('data:image/svg+xml;base64,')) {
      const base64 = dataUri.replace('data:image/svg+xml;base64,', '');
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }
    if (dataUri.startsWith('data:image/svg+xml;charset=utf-8,')) {
      return decodeURIComponent(dataUri.replace('data:image/svg+xml;charset=utf-8,', ''));
    }
    if (dataUri.startsWith('data:image/svg+xml;utf8,')) {
      return decodeURIComponent(dataUri.replace('data:image/svg+xml;utf8,', ''));
    }
    if (dataUri.startsWith('data:image/svg+xml,')) {
      return decodeURIComponent(dataUri.replace('data:image/svg+xml,', ''));
    }
  } catch (e) {
    console.warn('Failed to extract SVG from data URI:', e);
  }
  return null;
}
