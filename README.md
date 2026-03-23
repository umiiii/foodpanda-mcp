# foodpanda-mcp

An MCP server that lets AI assistants order food from [foodpanda.sg](https://www.foodpanda.sg/) on your behalf.

Tell your AI assistant what you want to eat, and it handles the rest — searching restaurants, browsing menus, building a cart, and placing orders through your foodpanda account.

## Features

- Search restaurants by name or cuisine near your delivery address
- Browse full menus with prices, descriptions, and customization options
- Build a cart with real-time price validation from foodpanda
- Two-step checkout with order preview and explicit confirmation
- Checkout with Cash on Delivery (credit card and GCash require browser-based payment flows and are not supported)
- Automatic token refresh via browser login (no more copying tokens from DevTools)

## Quick Start

### 1. Configure your MCP client

> **Note:** No manual coordinates or session tokens needed. The server automatically uses your first saved delivery address from foodpanda, and the `refresh_token` tool handles authentication by opening a browser window for you to log in.

#### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "foodpanda": {
      "command": "npx",
      "args": ["-y", "foodpanda-mcp"]
    }
  }
}
```

#### Other MCP Clients

Any MCP-compatible client that supports stdio transport will work. Run `npx foodpanda-mcp`. On first use, the AI will open a browser for you to log in to foodpanda.

### 2. Try it out

Ask your AI assistant:

> "Search for Chinese restaurants near me"

> "Show me the menu for Tsui Wah and add the Satay Beef Brisket Noodles"

> "Preview my order and let me confirm before placing it"

> "Show me my last 10 orders"

## Available Tools

| Tool | Description |
|------|-------------|
| `search_restaurants` | Search for restaurants by name or cuisine |
| `list_outlets` | List all branches of a chain restaurant |
| `get_restaurant_details` | Get restaurant info (hours, delivery fee, minimum order) |
| `get_menu` | Browse a restaurant's menu organized by category |
| `get_item_details` | Get full item details including topping/customization options |
| `add_to_cart` | Add items to your cart (validates prices with foodpanda) |
| `get_cart` | View current cart contents and totals |
| `remove_from_cart` | Remove items from cart |
| `preview_order` | Preview order summary with delivery address and payment methods |
| `place_order` | Place the order after user confirmation |
| `order_history` | View past orders with restaurant, items, and prices |
| `list_addresses` | List all saved delivery addresses |
| `switch_address` | Switch the active delivery address |
| `refresh_token` | Open a browser to log in and refresh the session token |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FOODPANDA_SESSION_TOKEN` | No | JWT bearer token (optional — use `refresh_token` tool instead) |

## Order Safety

The checkout flow is designed with a **human-in-the-loop** pattern:

1. `preview_order` shows the full order summary (items, totals, delivery address, payment methods)
2. The AI is instructed to **always show this to you and ask for confirmation**
3. `place_order` only executes after you explicitly approve

This prevents accidental orders — the AI cannot skip the confirmation step.

## How It Works

- **Search** uses foodpanda's GraphQL API with Apollo persisted queries
- **Restaurant details and menus** use the REST API at `/api/v5/vendors/{code}`
- **Cart** is stateless on foodpanda's side — this server maintains cart state in memory and sends the full cart to `/api/v5/cart/calculate` for price validation on every change
- **Checkout** fetches your saved addresses and payment methods, then submits to `/api/v5/cart/checkout`
- Prices are in SGD (Singapore Dollar)

## Building from Source

```bash
git clone https://github.com/johnwhoyou/foodpanda-mcp.git
cd foodpanda-mcp
npm install    # also installs Google Chrome via postinstall
npm run build
```

Then use the local build in your MCP client config:

```json
{
  "mcpServers": {
    "foodpanda": {
      "command": "node",
      "args": ["/absolute/path/to/foodpanda-mcp/build/index.js"]
    }
  }
}
```

## Agent Skill

This project includes an [Agent Skill](https://agentskills.io) at [`foodpanda-ordering/SKILL.md`](foodpanda-ordering/SKILL.md) that teaches AI agents the full ordering workflow — from searching restaurants to placing orders. If your agent supports the Agent Skills format, it can use this skill to order food autonomously via the MCP server.

## Limitations

- **Session tokens expire.** The `refresh_token` tool handles this automatically — the AI opens a browser for you to log in when needed.
- **No official API.** This server reverse-engineers foodpanda's internal web API. It may break if foodpanda changes their API.
- **Singapore only.** Targets foodpanda.sg specifically. Other regions use different API endpoints and may not work.
- **Payment methods.** Only Cash on Delivery is supported. Credit card payments require browser-based payment flows (Adyen SDK) that cannot be completed through API calls. See [#2](https://github.com/johnwhoyou/foodpanda-mcp/issues/2).
- **Delivery address.** Uses the first saved address by default. Use `list_addresses` and `switch_address` to change it.
