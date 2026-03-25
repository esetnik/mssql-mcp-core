/**
 * Preload script that must run before the main entry point when using the
 * msnodesqlv8 native ODBC driver.
 *
 * Usage:
 *   node --import ./dist/preload-driver.js ./dist/index.js
 *
 * Or set the MCP server command to:
 *   node --import <path>/preload-driver.js <path>/index.js
 *
 * This script patches the `mssql` package's entry point on disk to load
 * `mssql/msnodesqlv8` instead of `mssql/tedious`, so that all subsequent
 * ESM `import sql from "mssql"` statements resolve to the native driver.
 */

import * as fs from "fs";
import { createRequire } from "module";

if (process.env.SQL_DRIVER?.toLowerCase() === "msnodesqlv8") {
  const require = createRequire(import.meta.url);

  // Verify msnodesqlv8 is available
  try {
    require.resolve("msnodesqlv8");
  } catch {
    throw new Error(
      "SQL_DRIVER is set to 'msnodesqlv8' but the msnodesqlv8 package is not installed.\n" +
      "Install it with:  npm install msnodesqlv8"
    );
  }

  // Patch mssql/index.js to load the native driver
  const mssqlEntryPath = require.resolve("mssql");
  const content = fs.readFileSync(mssqlEntryPath, "utf-8");

  if (content.includes("./lib/tedious")) {
    fs.writeFileSync(
      mssqlEntryPath,
      content.replace("./lib/tedious", "./lib/msnodesqlv8"),
      "utf-8"
    );
    console.error("[preload] Patched mssql → msnodesqlv8 (native ODBC driver)");
  } else if (content.includes("./lib/msnodesqlv8")) {
    console.error("[preload] mssql already using msnodesqlv8 driver");
  }
}
