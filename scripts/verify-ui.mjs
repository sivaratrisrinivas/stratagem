import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto("http://127.0.0.1:43123", { waitUntil: "networkidle" });

const checks = [];

checks.push(["Page title", (await page.title()).includes("Fog"), await page.title()]);
checks.push(["Hero h1", (await page.locator("h1").textContent()) === "Fog", ""]);
checks.push(["Demo buttons >= 3", (await page.locator(".demo-btn").count()) >= 3, ""]);

await page.locator(".demo-btn").first().click();
await page.waitForTimeout(400);
checks.push([
  "Demo 1 loads",
  (await page.locator(".demo-active").textContent())?.includes("Guide") ?? false,
  (await page.locator(".demo-active").textContent()) ?? "",
]);

await page.locator(".demo-btn").nth(1).click();
await page.waitForTimeout(400);
  const craftCount = await page.locator('.recipe-scroll li').count();
checks.push(["Demo 2 craftable items", craftCount > 0, String(craftCount)]);

await page.locator(".demo-btn").nth(2).click();
await page.waitForTimeout(400);
const stage = await page.locator("select").first().inputValue();
checks.push(["Demo 3 post_eye stage", stage === "post_eye", stage]);

const toolCount = await page.locator(".tool-count .count").textContent();
checks.push(["Tool count is 11", toolCount?.trim() === "11", toolCount ?? ""]);

await page.locator(".demo-btn.ghost").click();
await page.waitForTimeout(400);
const pills = await page.locator(".pill-list li").count();
checks.push(["Reset clears inventory", pills === 0, String(pills)]);

checks.push(["No console errors", errors.length === 0, errors.join("; ") || "none"]);

console.log("\n=== Browser UI Verification ===\n");
let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failed++;
}
console.log(`\n${checks.length - failed}/${checks.length} passed\n`);
await browser.close();
process.exit(failed > 0 ? 1 : 0);
