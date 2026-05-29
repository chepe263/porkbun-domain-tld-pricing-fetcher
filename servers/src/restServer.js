import express from "express";
import helmet from "helmet";
import { z } from "zod";
import {
  buildExampleDomain,
  getCheapestTlds,
  getDataPath,
  getTldDetails,
  loadPricingData,
  recommendTldsForIdea
} from "./pricingStore.js";

const app = express();
app.use(helmet());
app.use(express.json({ limit: "256kb" }));

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const cheapestQuerySchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(100).optional(),
  maxRenewal: z.coerce.number().positive().optional(),
  sortBy: z.enum(["renewal", "registration", "transfer"]).optional()
});

const recommendationSchema = z.object({
  idea: z.string().min(1),
  maxResults: z.coerce.number().int().min(1).max(20).optional(),
  maxRenewal: z.coerce.number().positive().optional()
});

function sanitizeRows(rows) {
  return rows.map((row) => ({
    tld: row.tld,
    registration: Number(row.registration.toFixed(2)),
    renewal: Number(row.renewal.toFixed(2)),
    transfer: Number(row.transfer.toFixed(2)),
    coupons: row.coupons
  }));
}

function handleError(res, err) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: "Invalid request parameters",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    });
  }

  return res.status(500).json({
    error: "Server error",
    message: err.message
  });
}

app.get("/health", (_req, res) => {
  const total = loadPricingData().length;
  res.json({
    ok: true,
    service: "porkbun-pricing-rest",
    dataPath: getDataPath(),
    totalTlds: total
  });
});

app.get("/api/tlds/cheapest", (req, res) => {
  try {
    const parsed = cheapestQuerySchema.parse(req.query);
    const rows = getCheapestTlds(parsed);
    res.json({
      count: rows.length,
      results: sanitizeRows(rows)
    });
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/tlds/:tld", (req, res) => {
  try {
    const tld = String(req.params.tld || "").trim();
    if (!tld) {
      return res.status(400).json({ error: "tld path parameter is required" });
    }

    const row = getTldDetails(tld);
    if (!row) {
      return res.status(404).json({ error: `TLD not found: .${tld.replace(/^\./, "")}` });
    }

    return res.json({
      result: sanitizeRows([row])[0]
    });
  } catch (err) {
    return handleError(res, err);
  }
});

app.get("/api/recommendations", (req, res) => {
  try {
    const parsed = recommendationSchema.parse(req.query);
    const rows = recommendTldsForIdea(parsed).map((row) => ({
      ...row,
      registration: Number(row.registration.toFixed(2)),
      renewal: Number(row.renewal.toFixed(2)),
      transfer: Number(row.transfer.toFixed(2)),
      exampleDomain: buildExampleDomain(parsed.idea, row.tld)
    }));

    return res.json({
      count: rows.length,
      results: rows
    });
  } catch (err) {
    return handleError(res, err);
  }
});

app.post("/api/recommendations", (req, res) => {
  try {
    const parsed = recommendationSchema.parse(req.body || {});
    const rows = recommendTldsForIdea(parsed).map((row) => ({
      ...row,
      registration: Number(row.registration.toFixed(2)),
      renewal: Number(row.renewal.toFixed(2)),
      transfer: Number(row.transfer.toFixed(2)),
      exampleDomain: buildExampleDomain(parsed.idea, row.tld)
    }));

    return res.json({
      count: rows.length,
      results: rows
    });
  } catch (err) {
    return handleError(res, err);
  }
});

app.get("/openapi.json", (_req, res) => {
  res.json({
    openapi: "3.0.3",
    info: {
      title: "Porkbun Pricing REST API",
      version: "1.0.0"
    },
    servers: [{ url: "/" }],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": { description: "Service health and data metadata" }
          }
        }
      },
      "/api/tlds/cheapest": {
        get: {
          summary: "Get cheapest TLDs",
          parameters: [
            { name: "maxResults", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
            { name: "maxRenewal", in: "query", schema: { type: "number", minimum: 0 } },
            { name: "sortBy", in: "query", schema: { type: "string", enum: ["renewal", "registration", "transfer"] } }
          ],
          responses: {
            "200": { description: "TLD results" }
          }
        }
      },
      "/api/tlds/{tld}": {
        get: {
          summary: "Get TLD details",
          parameters: [
            { name: "tld", in: "path", required: true, schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "TLD details" },
            "404": { description: "Not found" }
          }
        }
      },
      "/api/recommendations": {
        get: {
          summary: "Recommend TLDs from query params",
          parameters: [
            { name: "idea", in: "query", required: true, schema: { type: "string" } },
            { name: "maxResults", in: "query", schema: { type: "integer", minimum: 1, maximum: 20 } },
            { name: "maxRenewal", in: "query", schema: { type: "number", minimum: 0 } }
          ],
          responses: {
            "200": { description: "Recommendation results" }
          }
        },
        post: {
          summary: "Recommend TLDs from JSON body",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["idea"],
                  properties: {
                    idea: { type: "string" },
                    maxResults: { type: "integer", minimum: 1, maximum: 20 },
                    maxRenewal: { type: "number", minimum: 0 }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Recommendation results" }
          }
        }
      }
    }
  });
});

function start() {
  loadPricingData();
  app.listen(port, host, () => {
    console.log(`REST server listening on http://${host}:${port}`);
  });
}

start();
