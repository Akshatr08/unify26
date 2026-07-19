/**
 * error-reporting.ts
 *
 * Generic error reporter for the UNIFY/26 error boundary.
 * In production, swap this with your preferred error tracking
 * service (e.g. Sentry, Datadog, Highlight.io).
 */

/**
 * Report an error from the React error boundary.
 * @param error - The caught error object.
 * @param context - Additional context metadata for debugging.
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  // Log to console in all environments.
  console.error("[UNIFY/26 error]", error, context);

  // TODO: Integrate your error tracking service here.
  // Example with Sentry:
  // import * as Sentry from "@sentry/react";
  // Sentry.captureException(error, { extra: context });
}
