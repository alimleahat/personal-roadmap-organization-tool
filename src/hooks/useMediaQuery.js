import { useSyncExternalStore, useCallback } from "react";

// useSyncExternalStore rather than useState + useEffect: matchMedia is an
// external store, and subscribing to it this way avoids the extra render (and
// the brief wrong-layout flash) that the effect-based version causes.
export default function useMediaQuery(query) {
  const subscribe = useCallback((onChange) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    // Belt and braces: some environments resize the viewport without firing
    // the media query's own change event, which would leave the layout stuck
    // at the previous breakpoint until a reload.
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, [query]);

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
