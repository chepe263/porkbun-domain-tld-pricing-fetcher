const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');

const exlude_tlds = require("./tld-without-privacy.json")
const forceRefresh = process.env.FORCE_REFRESH === '1' || process.argv.includes('--force');

async function get_domain_pricing() {
  const filePath = 'porkbun-domain-pricing.json';
  if (fs.existsSync(filePath) && !forceRefresh) {
    console.log(`${filePath} already exists. Skipping fetch.`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  }
  try {
    const response = await axios.get('https://api.porkbun.com/api/json/v3/pricing/get');
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
    console.log('Output saved to porkbun-domain-pricing.json');
    return response.data;
  } catch (error) {
    console.error('Error fetching Porkbun pricing:', error);
    return null;
  }
}
async function main() {
    const pricingData = await get_domain_pricing();
    if (!pricingData || !pricingData.pricing) {
        console.error('No pricing data found.');
        return;
    }
    // Filter out TLDs with specialType === 'handshake'
    const filtered = _.chain(pricingData.pricing)
        .toPairs()
        .filter(([tld, info]) => info.specialType !== 'handshake' && !exlude_tlds.includes(tld))
        .map(([tld, info]) => ({
            ...info,
            tld,
            registration: parseFloat(String(info.registration).replace(/,/g, '')),
            renewal: parseFloat(String(info.renewal).replace(/,/g, '')),
            transfer: parseFloat(String(info.transfer).replace(/,/g, ''))
        }))
        .sortBy(obj => parseFloat(obj.renewal))
        .value();
    fs.writeFileSync('porkbun-domains-filtered.json', JSON.stringify(filtered, null, 2));
    console.log('Filtered and sorted domains written to porkbun-domains-filtered.json');
}

main();
