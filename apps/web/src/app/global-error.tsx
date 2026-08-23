"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary (P0.4-A) — only fires for a failure in the root layout itself
 * (app/layout.tsx) or in app/error.tsx's own render, since every other segment has a nearer
 * boundary above it. Must define its own <html>/<body>, replacing the root layout entirely
 * while active. Per Next's docs, global-error does NOT reliably include the app's global
 * stylesheet, so this intentionally uses inline styles rather than Tailwind classes — the one
 * exception to this codebase's usual styling convention, required by the framework, not a
 * style regression.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#ffffff",
          color: "#1a1a1a",
        }}
      >
        <div style={{ textAlign: "center", padding: "24px", maxWidth: "28rem" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#8bc236", margin: 0 }}>
            Oops
          </p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "8px 0 0" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "1rem", color: "#525252", margin: "12px 0 0" }}>
            The site couldn&apos;t load right now. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "24px",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              background: "#a4dc4a",
              color: "#1a1a1a",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
