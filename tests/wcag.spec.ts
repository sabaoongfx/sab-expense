import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("WCAG 2 AA – login page", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const violations = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.map((n) => ({ html: n.html, target: n.target, message: n.failureSummary })),
  }));

  if (violations.length > 0) {
    console.log("WCAG violations:", JSON.stringify(violations, null, 2));
  }

  expect(violations).toEqual([]);
});
