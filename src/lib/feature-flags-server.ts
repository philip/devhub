/**
 * Server-side feature flag resolution. The flag is opt-in: the env var must
 * be exactly "true" to enable. No implicit dev/CI/NODE_ENV handling — set the
 * env var explicitly where you want the flag on (including local `npm run dev`).
 */

export function showDrafts(): boolean {
  return process.env.SHOW_DRAFTS === "true";
}
