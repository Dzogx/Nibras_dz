import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerDevCookieRelaxer(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Development-only: browsers refuse SameSite=None cookies over plain HTTP,
// which makes the OAuth token (always set with sameSite: "none") unreadable
// on http:// previews. This middleware mirrors the session cookie with a
// relaxed SameSite=Lax flag so local UX audits can run on plain HTTP.
// The cookie is signed (HMAC), so it is not a security risk — an attacker
// still needs the JWT secret. The flag never fires in production because
// production previews are always HTTPS.
function registerDevCookieRelaxer(app: express.Express) {
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === "development") {
      // 'headers' fires BEFORE they are sent — still possible to append the
      // relaxed mirror. 'finish' would be too late.
      res.on("headers", () => {
        const setCookies = res.getHeader("set-cookie");
        if (!setCookies) return;
        const list = Array.isArray(setCookies) ? setCookies : [setCookies];
        const mirrors: string[] = [];
        list.forEach(cookieStr => {
          const str = String(cookieStr);
          if (str.startsWith(COOKIE_NAME + "=")) {
            const value = str.split(";")[0].slice(COOKIE_NAME.length + 1);
            if (value) {
              mirrors.push(
                `${COOKIE_NAME}=${value}; Max-Age=${Math.floor(
                  ONE_YEAR_MS / 1000,
                )}; Path=/; HttpOnly; SameSite=Lax`,
              );
            }
          }
        });
        if (mirrors.length > 0) {
          res.setHeader("set-cookie", [
            ...list.map(c => String(c)),
            ...mirrors,
          ]);
        }
      });
    }
    next();
  });
}

startServer().catch(console.error);
