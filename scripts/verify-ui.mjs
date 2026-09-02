import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:43123", { waitUntil: "networkidle" });

const checks = [];
checks.push(["Title", (await page.title()).includes("Fog"), ""]);
checks.push(["Scenarios", (await page.locator(".scenario").count()) >= 3, ""]);
await page.locator(".scenario").first().click();
await page.waitForTimeout(400);
checks.push(["Demo loads", (await page.locator(".active-label").textContent())?.includes("Guide") ?? false, ""]);
checks.push(["Crafts show", (await page.locator(".crafts li").count()) > 0, ""]);
checks.push(["Stats tools", (await page.locator(".stats dd").first().textContent()) === "11", ""]);

console.log("\n=== UI smoke ===\n");
let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failed++;
}
await browser.close();
process.exit(failed > 0 ? 1 : 0);
