import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DATA_PATH = process.env.PORKBUN_DATA_PATH || "../../core/porkbun-domains-filtered.json";
const resolvedDataPath = path.resolve(__dirname, DEFAULT_DATA_PATH);

let cache = {
  mtimeMs: 0,
  items: []
};

function normalizeTld(input) {
  return String(input || "").trim().toLowerCase().replace(/^\./, "");
}

function toMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

export function getDataPath() {
  return resolvedDataPath;
}

export function loadPricingData(force = false) {
  if (!fs.existsSync(resolvedDataPath)) {
    throw new Error(`Pricing file not found: ${resolvedDataPath}`);
  }

  const stat = fs.statSync(resolvedDataPath);
  if (!force && cache.items.length > 0 && stat.mtimeMs === cache.mtimeMs) {
    return cache.items;
  }

  const raw = fs.readFileSync(resolvedDataPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Expected pricing JSON array in porkbun-domains-filtered.json");
  }

  cache = {
    mtimeMs: stat.mtimeMs,
    items: parsed
      .map((item) => ({
        tld: normalizeTld(item.tld),
        registration: toMoney(item.registration),
        renewal: toMoney(item.renewal),
        transfer: toMoney(item.transfer),
        coupons: Array.isArray(item.coupons) ? item.coupons : []
      }))
      .filter((item) => item.tld)
  };

  return cache.items;
}

export function getTldDetails(tld) {
  const normalized = normalizeTld(tld);
  const items = loadPricingData();
  return items.find((item) => item.tld === normalized) || null;
}

export function getCheapestTlds({ maxResults = 10, maxRenewal = null, sortBy = "renewal" } = {}) {
  const items = loadPricingData();
  const safeMax = Math.max(1, Math.min(Number(maxResults) || 10, 100));
  const metric = ["renewal", "registration", "transfer"].includes(sortBy) ? sortBy : "renewal";

  let filtered = items;
  if (typeof maxRenewal === "number" && Number.isFinite(maxRenewal)) {
    filtered = filtered.filter((item) => item.renewal <= maxRenewal);
  }

  return [...filtered]
    .sort((a, b) => {
      const delta = a[metric] - b[metric];
      if (delta !== 0) {
        return delta;
      }
      return a.tld.localeCompare(b.tld);
    })
    .slice(0, safeMax);
}

function scoreTld(tld, tokens) {
  let score = 0;

  const boosts = [
    { keys: ["ai", "ml", "llm"], tlds: ["ai", "dev", "io", "app"] },
    { keys: ["shop", "store", "buy", "ecommerce"], tlds: ["shop", "store", "com", "co"] },
    { keys: ["blog", "news", "media", "content"], tlds: ["blog", "news", "media", "com"] },
    { keys: ["finance", "crypto", "bank", "loan", "pay"], tlds: ["finance", "money", "loan", "com"] },
    { keys: ["tech", "startup", "saas", "software"], tlds: ["io", "app", "dev", "tech", "com"] },
    { keys: ["community", "nonprofit", "open", "foundation"], tlds: ["org", "community", "com"] }
  ];

  const baseline = ["com", "io", "ai", "app", "dev", "co", "net", "org"];
  if (baseline.includes(tld)) {
    score += 2.0;
  }

  for (const rule of boosts) {
    const hit = rule.keys.some((k) => tokens.includes(k));
    if (hit && rule.tlds.includes(tld)) {
      score += 3.0;
    }
  }

  if (tld.length <= 3) {
    score += 0.5;
  }

  return score;
}

export function recommendTldsForIdea({ idea, maxResults = 5, maxRenewal = null }) {
  const items = loadPricingData();
  const safeMax = Math.max(1, Math.min(Number(maxResults) || 5, 20));
  const tokens = String(idea || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let filtered = items;
  if (typeof maxRenewal === "number" && Number.isFinite(maxRenewal)) {
    filtered = filtered.filter((item) => item.renewal <= maxRenewal);
  }

  const ranked = filtered
    .map((item) => {
      const score = scoreTld(item.tld, tokens);
      const pricePenalty = item.renewal / 20;
      const finalScore = score - pricePenalty;
      return {
        ...item,
        score: Number(finalScore.toFixed(3))
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.renewal - b.renewal;
    })
    .slice(0, safeMax);

  return ranked;
}

export function buildExampleDomain(idea, tld) {
  const label = String(idea || "idea")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "myidea";

  return `${label}.${tld}`;
}
