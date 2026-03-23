#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { FoodpandaClient } from "./foodpanda-client.js";
import { createServer } from "./server.js";
import { loadPersistedToken } from "./token-manager.js";

// Token loading priority: persisted file > env var > null (tokenless startup)
const sessionToken =
  loadPersistedToken() || process.env.FOODPANDA_SESSION_TOKEN || null;

if (sessionToken) {
  console.error("foodpanda-mcp: loaded session token");
} else {
  console.error(
    "foodpanda-mcp: no session token found. Use the refresh_token tool to log in."
  );
}

const client = new FoodpandaClient(sessionToken);
const server = createServer(client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("foodpanda-mcp server running on stdio");

  // If we have a session token, fetch saved addresses and select the first one
  if (sessionToken) {
    try {
      await client.initializeAddress();
      const addr = client.getSelectedAddress();
      if (addr) {
        console.error(`foodpanda-mcp: using delivery address "${addr.formatted_customer_address}"`);
      } else {
        console.error("foodpanda-mcp: no saved addresses found. Add an address in the foodpanda app.");
      }
    } catch (err) {
      console.error(`foodpanda-mcp: failed to load addresses (${(err as Error).message}). They will be loaded on first use.`);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
