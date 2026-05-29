import {
  buildExampleDomain,
  getCheapestTlds,
  getDataPath,
  getTldDetails,
  loadPricingData,
  recommendTldsForIdea
} from "./pricingStore.js";

function runSmoke() {
  const data = loadPricingData(true);
  console.log(`Loaded ${data.length} TLD rows from ${getDataPath()}`);

  const cheapest = getCheapestTlds({ maxResults: 3 });
  console.log("Cheapest sample:", cheapest.map((x) => `.${x.tld}`).join(", "));

  const com = getTldDetails("com");
  console.log(".com renewal:", com ? com.renewal : "n/a");

  const rec = recommendTldsForIdea({ idea: "ai startup automation", maxResults: 3 });
  console.log("Recommendation sample:", rec.map((x) => `.${x.tld}`).join(", "));

  console.log("Example domain:", buildExampleDomain("ai startup automation", rec[0]?.tld || "com"));
}

runSmoke();
