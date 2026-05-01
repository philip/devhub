import { describe, expect, test } from "vitest";
import {
  composeTemplateAgentPrompt,
  getDetailMarkdown,
} from "../api/content-markdown";

describe("detail markdown resolver", () => {
  test("resolves docs markdown", () => {
    const markdown = getDetailMarkdown("docs", "start-here");
    expect(markdown).toContain("---");
    expect(markdown).toContain("title:");
  });

  test("resolves solution markdown", () => {
    const markdown = getDetailMarkdown("solutions", "devhub-launch");
    expect(markdown).toContain("# Introducing dev.databricks.com");
  });

  test("resolves recipe markdown", () => {
    const markdown = getDetailMarkdown(
      "recipes",
      "connect-workstation-to-databricks",
    );
    expect(markdown).toContain("## Connect Your Workstation to Databricks");
    expect(markdown).toContain("databricks -v");
  });

  test("resolves example markdown", () => {
    const markdown = getDetailMarkdown("examples", "agentic-support-console");
    expect(markdown).toContain("## Agentic Support Console");
    expect(markdown).toContain("Data Flow");
  });

  test("resolves template markdown", () => {
    const markdown = getDetailMarkdown("templates", "ai-chat-app");
    expect(markdown).toContain("# AI Chat App");
    expect(markdown).toContain("## Lakebase Chat Persistence");
  });

  test("template markdown no longer embeds the connect-workstation recipe (now injected by the meta-prompt)", () => {
    const markdown = getDetailMarkdown("templates", "ai-chat-app");
    expect(markdown).not.toContain("## Connect Your Workstation to Databricks");
    expect(markdown).not.toMatch(
      /^### Connect Your Workstation to Databricks$/m,
    );
  });

  test("template markdown hoists all recipe prereqs before any recipe content", () => {
    const markdown = getDetailMarkdown("templates", "ai-chat-app");

    const firstLineStart = (pattern: RegExp): number =>
      markdown.search(pattern);

    const prereqIdx = firstLineStart(/^## Prerequisites$/m);
    const foundationContentIdx = firstLineStart(
      /^## Query AI Gateway Endpoints$/m,
    );
    const lakebaseContentIdx = firstLineStart(
      /^## Lakebase Chat Persistence$/m,
    );

    expect(prereqIdx).toBeGreaterThanOrEqual(0);
    expect(prereqIdx).toBeLessThan(foundationContentIdx);
    expect(foundationContentIdx).toBeLessThan(lakebaseContentIdx);
    // Only one combined `## Prerequisites` heading, with demoted H3 per recipe.
    expect(markdown.match(/^## Prerequisites$/gm)?.length).toBe(1);
    expect(markdown).toMatch(/^### Query AI Gateway Endpoints$/m);
    expect(markdown).toMatch(/^### Lakebase Chat Persistence$/m);
  });

  test("template markdown includes cookbook intro.md above Prerequisites when present", () => {
    const markdown = getDetailMarkdown("templates", "ai-chat-app");
    const introIdx = markdown.indexOf("## What you are building");
    const prereqIdx = markdown.indexOf("## Prerequisites");
    expect(introIdx).toBeGreaterThanOrEqual(0);
    expect(introIdx).toBeLessThan(prereqIdx);
    expect(markdown).toContain("How the steps fit together");
  });

  test("rejects path traversal", () => {
    expect(() => getDetailMarkdown("docs", "../package.json")).toThrow(
      "path traversal",
    );
  });
});

describe("templates section resolves recipes, examples, and cookbooks", () => {
  test("resolves a recipe slug via templates", () => {
    const markdown = getDetailMarkdown(
      "templates",
      "connect-workstation-to-databricks",
    );
    expect(markdown).toContain("## Connect Your Workstation to Databricks");
  });

  test("resolves an example slug via templates", () => {
    const markdown = getDetailMarkdown("templates", "agentic-support-console");
    expect(markdown).toContain("## Agentic Support Console");
  });

  test("resolves a cookbook slug via templates", () => {
    const markdown = getDetailMarkdown("templates", "ai-chat-app");
    expect(markdown).toContain("# AI Chat App");
    expect(markdown).toContain("## Lakebase Chat Persistence");
  });

  test("throws for unknown template slug", () => {
    expect(() => getDetailMarkdown("templates", "nonexistent-slug")).toThrow(
      "Template not found",
    );
  });
});

describe("empty-slug index pages", () => {
  test("templates index is one flat list of every template", () => {
    const markdown = getDetailMarkdown("templates", "");
    expect(markdown).toContain("# Templates");
    expect(markdown).not.toContain("## Cookbooks");
    expect(markdown).not.toContain("## Recipes");
    expect(markdown).not.toContain("## Examples");
    expect(markdown).toMatch(/\(\/templates\/[\w-]+\.md\)/);
    expect(markdown).toContain("/templates/ai-chat-app.md");
    expect(markdown).toContain(
      "/templates/connect-workstation-to-databricks.md",
    );
    expect(markdown).not.toContain("/templates/hello-world-app.md");
  });

  test("solutions index contains heading and .md links", () => {
    const markdown = getDetailMarkdown("solutions", "");
    expect(markdown).toContain("# Solutions");
    expect(markdown).toMatch(/\(\/solutions\/[\w-]+\.md\)/);
  });

  test("docs with empty slug throws", () => {
    expect(() => getDetailMarkdown("docs", "")).toThrow("Missing slug");
  });
});

describe("example markdown includes metadata", () => {
  test("includes init command for examples with one", () => {
    const markdown = getDetailMarkdown("examples", "agentic-support-console");
    expect(markdown).toContain("## Quick start");
    expect(markdown).toContain("git clone --depth 1");
  });

  test("includes GitHub link for examples with one", () => {
    const markdown = getDetailMarkdown("examples", "agentic-support-console");
    expect(markdown).toContain("View source on GitHub");
    expect(markdown).toContain("github.com/databricks/devhub");
  });

  test("includes related recipe and template links", () => {
    const markdown = getDetailMarkdown("examples", "agentic-support-console");
    expect(markdown).toContain("/templates/operational-data-analytics");
    expect(markdown).toContain("/templates/genie-conversational-analytics");
  });
});

describe("composeTemplateAgentPrompt wraps template bodies in the agent prompt", () => {
  const ABOUT_START = "# About DevHub";

  test("recipe wraps with about + guidelines + recipe intent + bootstrap + body", () => {
    const body = getDetailMarkdown("recipes", "lakebase-chat-persistence");
    const result = composeTemplateAgentPrompt({
      body,
      section: "recipes",
      slug: "lakebase-chat-persistence",
      siteOrigin: "https://dev.databricks.com",
    });
    expect(result.startsWith(ABOUT_START)).toBe(true);
    expect(result).toContain("# Working with DevHub prompts");
    expect(result).toContain("# Verify your local Databricks dev environment");
    expect(result).toContain("# The recipe the user copied");
    expect(result).toContain("Lakebase Chat Persistence");
  });

  test("example wraps with example intent and example label", () => {
    const body = getDetailMarkdown("examples", "agentic-support-console");
    const result = composeTemplateAgentPrompt({
      body,
      section: "examples",
      slug: "agentic-support-console",
      siteOrigin: "https://dev.databricks.com",
    });
    expect(result).toContain("# The example the user copied");
    expect(result).toContain("Agentic Support Console");
  });

  test("templates section detects cookbook kind from slug", () => {
    const body = getDetailMarkdown("templates", "ai-chat-app");
    const result = composeTemplateAgentPrompt({
      body,
      section: "templates",
      slug: "ai-chat-app",
      siteOrigin: "https://dev.databricks.com",
    });
    expect(result).toContain("# The cookbook the user copied");
  });

  test("rewrites canonical origin to localhost when called with localhost", () => {
    const body = getDetailMarkdown(
      "recipes",
      "connect-workstation-to-databricks",
    );
    const result = composeTemplateAgentPrompt({
      body,
      section: "recipes",
      slug: "connect-workstation-to-databricks",
      siteOrigin: "localhost:3001",
    });
    expect(result).toContain("http://localhost:3001/llms.txt");
    expect(result).toContain("- Website: http://localhost:3001");
    expect(result).not.toContain("https://dev.databricks.com/llms.txt");
  });

  test("preserves canonical origin when production host is used", () => {
    const body = getDetailMarkdown(
      "recipes",
      "connect-workstation-to-databricks",
    );
    const result = composeTemplateAgentPrompt({
      body,
      section: "recipes",
      slug: "connect-workstation-to-databricks",
      siteOrigin: "dev.databricks.com",
    });
    expect(result).toContain("https://dev.databricks.com/llms.txt");
    expect(result).toContain("- Website: https://dev.databricks.com");
  });
});

describe("slug normalization strips .md extension", () => {
  test("docs slug with .md extension resolves", () => {
    const markdown = getDetailMarkdown("docs", "start-here.md");
    expect(markdown).toContain("title:");
  });

  test("recipe slug with .md extension resolves", () => {
    const markdown = getDetailMarkdown(
      "recipes",
      "connect-workstation-to-databricks.md",
    );
    expect(markdown).toContain("## Connect Your Workstation to Databricks");
  });

  test("templates slug with .md extension resolves", () => {
    const markdown = getDetailMarkdown(
      "templates",
      "agentic-support-console.md",
    );
    expect(markdown).toContain("## Agentic Support Console");
  });
});
