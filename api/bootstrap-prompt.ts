import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadAgentPromptParts } from "./content-markdown";
import { composeAgentPrompt } from "../src/lib/copy-preamble";
import { resolveSiteUrlForRequest } from "../src/lib/site-url";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const siteOrigin = resolveSiteUrlForRequest(req.headers.host);
    const combined = composeAgentPrompt({
      parts: loadAgentPromptParts(),
      kind: "hero",
      siteOrigin,
    });

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600");
    res.setHeader("Vary", "Accept");
    res.setHeader("X-Robots-Tag", "noindex");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="bootstrap-prompt.md"',
    );
    res.status(200).send(combined);
  } catch {
    res.status(500).json({ error: "Failed to build bootstrap prompt" });
  }
}
