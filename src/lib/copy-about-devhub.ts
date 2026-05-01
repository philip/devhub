import { usePluginData } from "@docusaurus/useGlobalData";
import type { AboutDevhubGlobalData } from "../../plugins/about-devhub";
import {
  composeAgentPrompt,
  type AgentPromptKind,
  type AgentPromptParts,
} from "@/lib/copy-preamble";

/** Reads all preamble blocks from build-time plugin global data. */
export function useAgentPromptParts(): AgentPromptParts {
  const data = usePluginData(
    "docusaurus-plugin-about-devhub",
  ) as AboutDevhubGlobalData;
  return data.parts;
}

/**
 * Build the final "Copy prompt" markdown payload for a template detail page.
 * Used by recipe / cookbook / example detail pages — doc and solution pages
 * skip this entirely (they emit raw content with frontmatter only).
 */
export function buildTemplateAgentMarkdown(input: {
  parts: AgentPromptParts;
  kind: Exclude<AgentPromptKind, "hero">;
  templateName: string;
  templateUrl: string;
  templateBody: string;
  siteOrigin: string;
}): string {
  return composeAgentPrompt({
    parts: input.parts,
    kind: input.kind,
    siteOrigin: input.siteOrigin,
    templateName: input.templateName,
    templateUrl: input.templateUrl,
    templateBody: input.templateBody,
  });
}
