"use client";

import { useState, useEffect, useCallback } from "react";
import type { SessionData } from "@/lib/session";

type ClientSession = Omit<SessionData, "save" | "destroy" | "updateConfig">;

export function useSession() {
  const [session, setSession] = useState<ClientSession>({
    isLoggedIn: false,
    isNafathVerified: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSession(data);
    } catch {
      setSession({ isLoggedIn: false, isNafathVerified: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribing to an external system (the session endpoint) — state is only
  // set from the async callback, never synchronously during the effect body.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled)
          setSession({ isLoggedIn: false, isNafathVerified: false });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { session, isLoading, refreshSession: fetchSession };
}
