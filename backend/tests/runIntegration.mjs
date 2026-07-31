import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  ["./node_modules/vitest/vitest.mjs", "run", "tests/integration"],
  { stdio: "inherit", env: { ...process.env, RUN_INTEGRATION_TESTS: "true" } },
);

process.exitCode = result.status ?? 1;
