"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Contains failures coming out of the Google Maps SDK.
 *
 * A rejected API key makes the Maps script throw from inside its own code
 * (`reading 'getRootNode'`, `reading 'keys'`), which otherwise propagates up
 * and takes the whole route down. Keeping the blast radius to the map means a
 * misconfigured key costs the map, not the page.
 */
export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Map failed to render:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
