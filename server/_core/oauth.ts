import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Developer-only login: creates a signed session for the workspace owner
  // WITHOUT going through the OAuth portal. Restricted to development builds
  // (never reachable in published production) so UX audits can run locally.
  app.get("/api/dev/login-as-owner", async (_req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
      res.status(404).json({ error: "unavailable in production" });
      return;
    }
    const ownerOpenId = process.env.OWNER_OPEN_ID;
    if (!ownerOpenId) {
      res.status(500).json({ error: "owner identity not configured" });
      return;
    }
    try {
      await db.upsertUser({
        openId: ownerOpenId,
        name: process.env.OWNER_NAME || null,
        email: null,
        loginMethod: "developer",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(ownerOpenId, {
        name: process.env.OWNER_NAME || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(_req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Development-only relaxed mirror: browsers refuse SameSite=None
      // cookies over plain HTTP (localhost UX audits), so emit an extra
      // SameSite=Lax copy alongside the canonical one.
      if (process.env.NODE_ENV === "development") {
        res.cookie(COOKIE_NAME, sessionToken, {
          maxAge: ONE_YEAR_MS,
          path: "/",
          httpOnly: true,
          sameSite: "lax",
        });
      }

      res.redirect(302, "/");
    } catch (error) {
      console.error("[DevLogin] Failed", error);
      res.status(500).json({ error: "dev login failed" });
    }
  });
}
