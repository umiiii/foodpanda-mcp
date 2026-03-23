import { homedir } from "os";
import { join } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const TOKEN_DIR = join(homedir(), ".foodpanda-mcp");
const TOKEN_FILE = join(TOKEN_DIR, "token.json");
const BROWSER_DATA_DIR = join(TOKEN_DIR, "browser-data");

interface PersistedToken {
  token: string;
  savedAt: string;
}

export function loadPersistedToken(): string | null {
  try {
    if (!existsSync(TOKEN_FILE)) return null;
    const data = JSON.parse(readFileSync(TOKEN_FILE, "utf-8")) as PersistedToken;
    if (data && typeof data.token === "string" && data.token.length > 0) {
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

export function persistToken(token: string): void {
  mkdirSync(TOKEN_DIR, { recursive: true, mode: 0o700 });
  const data: PersistedToken = {
    token,
    savedAt: new Date().toISOString(),
  };
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
}

/**
 * Decode JWT payload and return the `expires` field as epoch milliseconds.
 * Returns null if the token cannot be parsed.
 */
export function getTokenExpiryMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4 !== 0) payload += "=";
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    if (typeof decoded.expires === "number") return decoded.expires * 1000;
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token expires within `thresholdMs` (default 5 minutes).
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdMs: number = 5 * 60 * 1000
): boolean {
  const expiryMs = getTokenExpiryMs(token);
  if (expiryMs === null) return false; // can't parse → don't trigger refresh
  return Date.now() + thresholdMs >= expiryMs;
}

/**
 * Silently refresh the token using the persistent browser context (headless).
 * The switch-account endpoint uses cookies to issue a new access token
 * without user interaction.
 * Returns the new token string, or null if refresh fails.
 */
export async function silentRefreshToken(): Promise<string | null> {
  let chromium: Awaited<typeof import("playwright-extra")>["chromium"];
  try {
    const pw = await import("playwright-extra");
    const stealthModule = await import("puppeteer-extra-plugin-stealth");
    const StealthPlugin = stealthModule.default;
    chromium = pw.chromium;
    chromium.use(StealthPlugin());
  } catch {
    return null;
  }

  mkdirSync(BROWSER_DATA_DIR, { recursive: true, mode: 0o700 });

  let context;
  try {
    context = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
      headless: true,
    });
  } catch {
    return null;
  }

  try {
    const page = context.pages()[0] || (await context.newPage());

    return await new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), 15_000);

      page.on("request", (request) => {
        const url = request.url();
        if (!url.includes("sg.fd-api.com")) return;

        const authHeader = request.headers()["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) return;

        const token = authHeader.slice("Bearer ".length).trim();
        if (token.length === 0) return;
        if (token.split(".").length !== 3) return;

        clearTimeout(timer);
        resolve(token);
      });

      page
        .goto("https://www.foodpanda.sg/login/new/api/switch-account")
        .catch(() => {
          clearTimeout(timer);
          resolve(null);
        });
    });
  } catch {
    return null;
  } finally {
    await context.close().catch(() => {});
  }
}

export async function refreshTokenViaBrowser(
  timeoutSeconds: number = 120
): Promise<string> {
  // Use playwright-extra with stealth plugin to avoid bot detection.
  // This patches navigator.webdriver, Chrome automation signals, and other
  // fingerprinting vectors that Google OAuth and foodpanda use to block bots.
  let chromium: Awaited<typeof import("playwright-extra")>["chromium"];
  try {
    const pw = await import("playwright-extra");
    const stealthModule = await import("puppeteer-extra-plugin-stealth");
    const StealthPlugin = stealthModule.default;
    chromium = pw.chromium;
    chromium.use(StealthPlugin());
  } catch {
    throw new Error(
      "Playwright is not installed. Run: npm install playwright-extra puppeteer-extra-plugin-stealth"
    );
  }

  // Persistent context preserves cookies across refreshes so the user
  // may already be logged in from a previous session.
  mkdirSync(BROWSER_DATA_DIR, { recursive: true, mode: 0o700 });

  let context;
  try {
    context = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
      headless: false,
    });
  } catch (err) {
    throw new Error(
      `Failed to launch browser. Run: npx playwright install chromium\n${(err as Error).message}`
    );
  }

  try {
    const page = context.pages()[0] || await context.newPage();

    return await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Login timed out after ${timeoutSeconds} seconds. Please try again.`
          )
        );
      }, timeoutSeconds * 1000);

      page.on("request", (request) => {
        const url = request.url();
        if (!url.includes("sg.fd-api.com")) return;

        const authHeader = request.headers()["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) return;

        const token = authHeader.slice("Bearer ".length).trim();
        if (token.length === 0) return;

        // Validate JWT structure (header.payload.signature)
        if (token.split(".").length !== 3) return;

        clearTimeout(timer);
        resolve(token);
      });

      page.goto("https://www.foodpanda.sg").catch((err) => {
        clearTimeout(timer);
        reject(new Error(`Failed to navigate to foodpanda.sg: ${(err as Error).message}`));
      });
    });
  } finally {
    await context.close().catch(() => {});
  }
}
