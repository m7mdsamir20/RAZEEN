"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

/**
 * Reports whether Google rejected the Maps API key.
 *
 * The Maps script calls `window.gm_authFailure` on an authentication error
 * (invalid key, referrer not allowed, billing disabled). @vis.gl/react-google-maps
 * 1.9.0 defines an AUTH_FAILURE status but never sets it — nothing in the
 * library registers this callback — so without this hook an invalid key just
 * leaves an empty grey box behind.
 *
 * The callback is a single global, so any existing handler is chained and
 * restored on unmount rather than clobbered.
 */
export function useMapsAuthFailure(): boolean {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    const previous = window.gm_authFailure;

    window.gm_authFailure = () => {
      previous?.();
      setHasFailed(true);
    };

    return () => {
      window.gm_authFailure = previous;
    };
  }, []);

  return hasFailed;
}
