import { test, expect, Page } from "@playwright/test";

const TEST_EMAIL = "test-playwright@sabexpense.com";
const TEST_PASSWORD = "Test123456!";
const TEST_NAME = "Test User";

async function signUpOrSignIn(page: Page) {
  await page.goto("/");
  await page.waitForSelector('text="Sab Expense"', { timeout: 10000 });

  // If already on dashboard (authenticated), skip
  const googleBtn = page.locator("text=Continue with Google");
  if (!(await googleBtn.isVisible())) return;

  // Try sign in first
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("Sign In")');

  // Wait for either dashboard or error
  await page.waitForTimeout(2000);

  // If we got an error, try signing up instead
  const error = page.locator("text=Invalid email or password");
  const noAccount = page.locator("text=No account with this email");
  if ((await error.isVisible()) || (await noAccount.isVisible())) {
    // Switch to signup
    await page.click('button:has-text("Sign Up")');
    await page.waitForTimeout(500);
    await page.fill('input[type="text"]', TEST_NAME);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(3000);
  }

  // Should be on dashboard now
  await expect(page.locator("nav")).toBeVisible({ timeout: 10000 });
}

// ─── Login / Signup / Reset ─────────────────────────────────────────

test.describe("Auth - Login Screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('text="Sab Expense"', { timeout: 10000 });
  });

  test("shows login form by default", async ({ page }) => {
    await expect(page.locator("text=Welcome back")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator("text=Continue with Google")).toBeVisible();
  });

  test("can switch to signup mode", async ({ page }) => {
    await page.click('button:has-text("Sign Up")');
    await expect(page.locator("text=Create your account")).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible(); // name field
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Create Account")')).toBeVisible();
  });

  test("can switch to forgot password mode", async ({ page }) => {
    await page.click('button:has-text("Forgot password?")');
    await expect(page.locator("text=Reset your password")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // Password field should not be visible
    await expect(page.locator('input[type="password"]')).not.toBeVisible();
    await expect(page.locator('button:has-text("Send Reset Link")')).toBeVisible();
  });

  test("can navigate back from forgot password to sign in", async ({ page }) => {
    await page.click('button:has-text("Forgot password?")');
    await expect(page.locator("text=Reset your password")).toBeVisible();
    await page.click('button:has-text("Back to Sign In")');
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });

  test("can navigate back from signup to sign in", async ({ page }) => {
    await page.click('button:has-text("Sign Up")');
    await expect(page.locator("text=Create your account")).toBeVisible();
    await page.click('button:has-text("Sign In")');
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });

  test("shows error for invalid email", async ({ page }) => {
    await page.fill('input[type="email"]', "not-an-email");
    await page.fill('input[type="password"]', "password123");
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);
    // Should show some error (either browser validation or Firebase error)
    const hasError = await page.locator("text=/[Ii]nvalid/").isVisible();
    const stillOnLogin = await page.locator("text=Welcome back").isVisible();
    expect(hasError || stillOnLogin).toBe(true);
  });

  test("shows error for wrong password", async ({ page }) => {
    await page.fill('input[type="email"]', "nobody@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    // Should show an error and stay on login
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });

  test("signup requires name field", async ({ page }) => {
    await page.click('button:has-text("Sign Up")');
    await page.fill('input[type="email"]', "test@test.com");
    await page.fill('input[type="password"]', "password123");
    // Leave name empty and submit
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(1000);
    // Should still be on signup (name is required)
    await expect(page.locator("text=Create your account")).toBeVisible();
  });
});

// ─── Authenticated: Accounts & Dashboard ────────────────────────────

test.describe("Authenticated - Accounts", () => {
  test.beforeEach(async ({ page }) => {
    await signUpOrSignIn(page);
  });

  test("dashboard loads with bottom nav after sign in", async ({ page }) => {
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("nav button", { hasText: "Home" })).toBeVisible();
    await expect(page.locator("nav button", { hasText: "Accounts" })).toBeVisible();
  });

  test("should show exactly one Main Account (no duplicates)", async ({ page }) => {
    const accountsTab = page.locator("nav button", { hasText: "Accounts" });
    await accountsTab.click();
    await page.waitForTimeout(3000);

    // "default" badge should appear exactly once
    const defaultBadges = page.locator("text=default");
    const defaultCount = await defaultBadges.count();
    expect(defaultCount).toBe(1);

    // Main Account: once in filter chips + once in card = 2
    const mainAccounts = page.locator("text=Main Account");
    const count = await mainAccounts.count();
    expect(count).toBeLessThanOrEqual(2);
  });

  test("should not create duplicate Main Account on page reload", async ({ page }) => {
    const accountsTab = page.locator("nav button", { hasText: "Accounts" });
    await accountsTab.click();
    await page.waitForTimeout(3000);

    const beforeCount = await page.locator("text=Main Account").count();

    // Reload multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForSelector('text="Sab Expense"', { timeout: 10000 });
      await page.waitForTimeout(1500);
    }

    // Go back to accounts tab
    await page.locator("nav button", { hasText: "Accounts" }).click();
    await page.waitForTimeout(3000);

    const afterCount = await page.locator("text=Main Account").count();
    expect(afterCount).toBe(beforeCount);
  });

  test("Accounts tab shows account cards with correct info", async ({ page }) => {
    await page.locator("nav button", { hasText: "Accounts" }).click();
    await page.waitForTimeout(3000);

    await expect(page.locator("text=Main Account").first()).toBeVisible();
    await expect(page.locator("text=Mix").first()).toBeVisible();

    // Should show a dollar amount
    const amounts = page.locator('text=/\\$\\d+\\.\\d{2}/');
    expect(await amounts.count()).toBeGreaterThan(0);
  });

  test("FAB label changes between tabs", async ({ page }) => {
    // Home tab: FAB says "Expense"
    await expect(page.locator("nav").locator("text=Expense")).toBeVisible();

    // Accounts tab: FAB says "Account"
    await page.locator("nav button", { hasText: "Accounts" }).click();
    await expect(page.locator("nav").locator("text=Account").first()).toBeVisible();
  });

  test("sign out returns to login screen", async ({ page }) => {
    await page.click('button:has-text("Sign out")');
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });
});
