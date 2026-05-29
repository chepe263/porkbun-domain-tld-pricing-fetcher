# Porkbun Domain Pricing Fetcher

This project fetches domain pricing data from the Porkbun API, processes it, and outputs filtered and sorted results for easy analysis.

## Features
- Fetches domain pricing from Porkbun's public API
- Saves raw pricing data to `porkbun-domain-pricing.json`
- Filters out TLDs with `specialType` set to `handshake`
- Excludes TLDs listed in `tld-without-privacy.json`
- Cleans and parses pricing values as floats
- Sorts filtered domains by renewal price (ascending)
- Outputs results to `porkbun-domains-filtered.json`

## Usage
1. **Install dependencies**
   ```sh
   npm install
   ```
2. **Run the fetcher**
   ```sh
   node index.js
   ```
   Force refresh from API even if cached JSON exists:
   ```sh
   FORCE_REFRESH=1 node index.js
   # or
   node index.js --force
   ```
3. **Check output files**
   - `porkbun-domain-pricing.json`: Raw API data
   - `porkbun-domains-filtered.json`: Filtered and sorted domains

## Customization
- To exclude additional TLDs, add them to `tld-without-privacy.json` (as a JSON array of strings).
- The code uses lodash for data manipulation and filtering.

## File Overview
- `index.js`: Main script for fetching and processing data
- `Dockerfile.updater`: Container image for scheduled refreshes
- `docker/updater/entrypoint.sh`: Cron entrypoint for periodic updates in Docker
- `tld-without-privacy.json`: List of TLDs to exclude from results, taken from porkbun's checkout page
- `porkbun-domain-pricing.json`: Raw pricing data from Porkbun
- `porkbun-domains-filtered.json`: Final filtered and sorted domain data

## Example Output
```json
[
  {
    "registration": 1.63,
    "renewal": 4.63,
    "transfer": 4.63,
    "coupons": [],
    "tld": "top"
  },
  // ...more domains
]
```

## License
MIT
