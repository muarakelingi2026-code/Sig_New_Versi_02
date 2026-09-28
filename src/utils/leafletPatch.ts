import L from 'leaflet';

/**
 * Defensive monkey-patch for Leaflet DomUtil to prevent:
 * "Uncaught TypeError: Cannot read properties of undefined (reading '_leaflet_pos')"
 * which occurs in React when Leaflet map animations, transitions, or resize events
 * run while a map pane or layer container is detached or unmounted.
 */
if (typeof window !== 'undefined' && L && L.DomUtil) {
  const originalGetPosition = L.DomUtil.getPosition;
  L.DomUtil.getPosition = function (el: HTMLElement): L.Point {
    if (!el) {
      return new L.Point(0, 0);
    }
    try {
      const pos = originalGetPosition.call(this, el);
      return pos || new L.Point(0, 0);
    } catch {
      return (el as any)?._leaflet_pos || new L.Point(0, 0);
    }
  };

  const originalSetPosition = L.DomUtil.setPosition;
  L.DomUtil.setPosition = function (el: HTMLElement, point: L.Point): void {
    if (!el) return;
    try {
      originalSetPosition.call(this, el, point);
    } catch {
      // Safely ignore if DOM node is already detached or unmounted
    }
  };
}

export default L;
