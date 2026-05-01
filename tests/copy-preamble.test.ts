import { describe, expect, test } from "vitest";
import {
  ABOUT_DEVHUB_CANONICAL_SITE_URL,
  composeAgentPrompt,
  substituteAboutDevhubLlmsUrl,
  type AgentPromptParts,
} from "../src/lib/copy-preamble";

const fixtureParts: AgentPromptParts = {
  about: `# About DevHub\n\n- Website: ${ABOUT_DEVHUB_CANONICAL_SITE_URL}\n- Index: ${ABOUT_DEVHUB_CANONICAL_SITE_URL}/llms.txt\n`,
  guidelines: "# Working with DevHub prompts\n\nFollow these rules.",
  intentHero: `# Hero intent\n\nCatalog: ${ABOUT_DEVHUB_CANONICAL_SITE_URL}/llms.txt`,
  intentRecipe: "# Recipe intent {{name}} ({{url}})",
  intentCookbook: "# Cookbook intent {{name}} ({{url}})",
  intentExample: "# Example intent {{name}} ({{url}})",
  localBootstrap: "## Connect Your Workstation to Databricks\n\nbody",
};

describe("substituteAboutDevhubLlmsUrl (legacy)", () => {
  test("rewrites canonical site URL to caller origin (llms.txt input)", () => {
    const body = `See <${ABOUT_DEVHUB_CANONICAL_SITE_URL}/llms.txt> for the index.`;
    const out = substituteAboutDevhubLlmsUrl(
      body,
      "http://localhost:3000/llms.txt",
    );
    expect(out).toContain("http://localhost:3000/llms.txt");
    expect(out).not.toContain(ABOUT_DEVHUB_CANONICAL_SITE_URL);
  });

  test("rewrites canonical site URL when the input is a bare origin", () => {
    const body = `Site ${ABOUT_DEVHUB_CANONICAL_SITE_URL} and index ${ABOUT_DEVHUB_CANONICAL_SITE_URL}/llms.txt`;
    const out = substituteAboutDevhubLlmsUrl(body, "http://localhost:3001");
    expect(out).toBe(
      "Site http://localhost:3001 and index http://localhost:3001/llms.txt",
    );
  });

  test("replaces every occurrence", () => {
    const body = `${ABOUT_DEVHUB_CANONICAL_SITE_URL}/llms.txt and again ${ABOUT_DEVHUB_CANONICAL_SITE_URL}/llms.txt`;
    const out = substituteAboutDevhubLlmsUrl(body, "http://example.com");
    expect(out).toBe(
      "http://example.com/llms.txt and again http://example.com/llms.txt",
    );
  });

  test("noop when caller origin matches canonical", () => {
    const body = `${ABOUT_DEVHUB_CANONICAL_SITE_URL}/llms.txt`;
    expect(
      substituteAboutDevhubLlmsUrl(body, ABOUT_DEVHUB_CANONICAL_SITE_URL),
    ).toBe(body);
  });
});

describe("composeAgentPrompt — hero", () => {
  test("emits about + guidelines + hero intent + local-bootstrap (no template body)", () => {
    const out = composeAgentPrompt({
      parts: fixtureParts,
      kind: "hero",
      siteOrigin: "http://localhost:3001",
    });

    expect(out).toContain("# About DevHub");
    expect(out).toContain("# Working with DevHub prompts");
    expect(out).toContain("# Hero intent");
    expect(out).toContain("# Verify your local Databricks dev environment");
    expect(out).toContain("## Connect Your Workstation to Databricks");

    expect(out.split("\n---\n").length).toBe(4);
    expect(out).not.toContain("# The recipe");
    expect(out).not.toContain("# The cookbook");
    expect(out).not.toContain("# The example");
  });

  test("rewrites the canonical site URL to the caller origin", () => {
    const out = composeAgentPrompt({
      parts: fixtureParts,
      kind: "hero",
      siteOrigin: "http://localhost:3001",
    });
    expect(out).toContain("http://localhost:3001/llms.txt");
    expect(out).toContain("- Website: http://localhost:3001");
    expect(out).not.toContain("https://dev.databricks.com");
  });

  test("does not rewrite when origin matches canonical", () => {
    const out = composeAgentPrompt({
      parts: fixtureParts,
      kind: "hero",
      siteOrigin: ABOUT_DEVHUB_CANONICAL_SITE_URL,
    });
    expect(out).toContain(`- Website: ${ABOUT_DEVHUB_CANONICAL_SITE_URL}`);
    expect(out).toContain(`${ABOUT_DEVHUB_CANONICAL_SITE_URL}/llms.txt`);
  });
});

describe("composeAgentPrompt — recipe / cookbook / example", () => {
  test("recipe: 5 blocks with template body and {{name}}/{{url}} substitution", () => {
    const out = composeAgentPrompt({
      parts: fixtureParts,
      kind: "recipe",
      siteOrigin: "https://dev.databricks.com",
      templateName: "Lakebase Chat Persistence",
      templateUrl:
        "https://dev.databricks.com/templates/lakebase-chat-persistence",
      templateBody: "# Lakebase Chat Persistence\n\nbody body",
    });

    expect(out.split("\n---\n").length).toBe(5);
    expect(out).toContain("# About DevHub");
    expect(out).toContain("# Working with DevHub prompts");
    expect(out).toContain(
      "# Recipe intent Lakebase Chat Persistence (https://dev.databricks.com/templates/lakebase-chat-persistence)",
    );
    expect(out).toContain("# Verify your local Databricks dev environment");
    expect(out).toContain("# The recipe the user copied");
    expect(out).toContain("body body");
  });

  test("cookbook intent uses cookbook label", () => {
    const out = composeAgentPrompt({
      parts: fixtureParts,
      kind: "cookbook",
      siteOrigin: "https://dev.databricks.com",
      templateName: "AI Chat App",
      templateUrl: "https://dev.databricks.com/templates/ai-chat-app",
      templateBody: "# AI Chat App\n\nstuff",
    });
    expect(out).toContain("# Cookbook intent AI Chat App");
    expect(out).toContain("# The cookbook the user copied");
  });

  test("example intent uses example label", () => {
    const out = composeAgentPrompt({
      parts: fixtureParts,
      kind: "example",
      siteOrigin: "https://dev.databricks.com",
      templateName: "Vacation Rentals",
      templateUrl: "https://dev.databricks.com/templates/vacation-rentals",
      templateBody: "# Vacation Rentals\n\napp body",
    });
    expect(out).toContain("# Example intent Vacation Rentals");
    expect(out).toContain("# The example the user copied");
  });

  test("throws when template body missing for non-hero", () => {
    expect(() =>
      composeAgentPrompt({
        parts: fixtureParts,
        kind: "recipe",
        siteOrigin: "https://dev.databricks.com",
        templateName: "x",
        templateUrl: "https://dev.databricks.com/x",
        templateBody: "",
      }),
    ).toThrow("non-empty templateBody");
  });

  test("throws when name/url missing for non-hero", () => {
    expect(() =>
      composeAgentPrompt({
        parts: fixtureParts,
        kind: "recipe",
        siteOrigin: "https://dev.databricks.com",
        templateBody: "body",
      }),
    ).toThrow("templateName and templateUrl");
  });
});
