import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  buildExampleDomain,
  getCheapestTlds,
  getDataPath,
  getTldDetails,
  loadPricingData,
  recommendTldsForIdea
} from "./pricingStore.js";

const server = new McpServer({
  name: "porkbun-pricing-mcp",
  version: "1.0.0"
});

server.tool(
  "get_cheapest_tlds",
  "Return the cheapest TLDs from Porkbun pricing data.",
  {
    maxResults: z.number().int().min(1).max(100).optional(),
    maxRenewal: z.number().positive().optional(),
    sortBy: z.enum(["renewal", "registration", "transfer"]).optional()
  },
  async ({ maxResults, maxRenewal, sortBy }) => {
    const rows = getCheapestTlds({ maxResults, maxRenewal, sortBy });
    const text = rows
      .map(
        (r, i) =>
          `${i + 1}. .${r.tld} | reg $${r.registration.toFixed(2)} | renew $${r.renewal.toFixed(2)} | transfer $${r.transfer.toFixed(2)}`
      )
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: text || "No results found."
        }
      ]
    };
  }
);

server.tool(
  "get_tld_details",
  "Get pricing details for one TLD (example input: com, io, ai, app).",
  {
    tld: z.string().min(1)
  },
  async ({ tld }) => {
    const row = getTldDetails(tld);
    if (!row) {
      return {
        content: [
          {
            type: "text",
            text: `TLD not found: .${String(tld).replace(/^\./, "")}`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `.${row.tld}\nregistration: $${row.registration.toFixed(2)}\nrenewal: $${row.renewal.toFixed(2)}\ntransfer: $${row.transfer.toFixed(2)}\ncoupons: ${row.coupons.length}`
        }
      ]
    };
  }
);

server.tool(
  "recommend_tlds_for_idea",
  "Recommend TLDs for a domain idea using simple semantic scoring + price weighting.",
  {
    idea: z.string().min(1),
    maxResults: z.number().int().min(1).max(20).optional(),
    maxRenewal: z.number().positive().optional()
  },
  async ({ idea, maxResults, maxRenewal }) => {
    const rows = recommendTldsForIdea({ idea, maxResults, maxRenewal });

    const text = rows
      .map((r, i) => {
        const example = buildExampleDomain(idea, r.tld);
        return `${i + 1}. .${r.tld} (score ${r.score}) | renew $${r.renewal.toFixed(2)} | example: ${example}`;
      })
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: text || "No recommendation results found."
        }
      ]
    };
  }
);

server.tool(
  "get_data_source_info",
  "Show which local pricing file is loaded by this MCP server.",
  {},
  async () => {
    const total = loadPricingData().length;
    return {
      content: [
        {
          type: "text",
          text: `Data file: ${getDataPath()}\nTotal TLDs loaded: ${total}`
        }
      ]
    };
  }
);

async function start() {
  loadPricingData();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

start().catch((err) => {
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});
