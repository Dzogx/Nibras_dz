import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    // علامة بيئة تُميّز تشغيل vitest (العمال fork لا يظهرون «vitest» في argv)
    env: { __NIBRAS_TEST_MODE: "1" },
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
  },
});
