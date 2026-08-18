"use client";

import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { Link, useRouter } from "@/i18n/navigation";
import { LoginModal } from "./LoginModal";

interface ProtectedLinkProps {
  /** Destination, without the locale prefix. */
  href: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A link to a page that requires signing in.
 *
 * It stays a real anchor so search engines follow it and the destination is
 * indexed, but a signed-out visitor gets the sign-in dialog in place rather
 * than a page that only tells them to sign in somewhere else. After signing
 * in they are taken straight on to where they were heading.
 *
 * While the session is still loading the click is left alone — the
 * destination has its own gate, so nothing is lost by navigating.
 */
export function ProtectedLink({
  href,
  className,
  children,
}: ProtectedLinkProps) {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (isLoading || session.isLoggedIn) return;

    // Leave modified clicks (new tab, download) to the browser.
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    setIsLoginOpen(true);
  }

  return (
    <>
      <Link href={href} className={className} onClick={handleClick}>
        {children}
      </Link>

      {isLoginOpen ? (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onSuccess={() => {
            setIsLoginOpen(false);
            router.push(href);
          }}
        />
      ) : null}
    </>
  );
}
