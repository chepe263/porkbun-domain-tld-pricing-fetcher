---
name: porkbun-tld-pricing
description: Query cheapest TLDs, lookup exact TLD pricing, and recommend TLDs for a domain idea using Porkbun-derived data.
---

# Porkbun TLD Pricing Skill

Use this skill when a user asks questions like:
- What are the cheapest domain extensions right now?
- How much does `.com` renewal cost?
- What TLD should I use for an AI startup or ecommerce idea?

## Service Contract (REST)
Base URL is deployment-specific. Prefer reading from environment or tool config.

### 1) Health and metadata
- Method: `GET`
- Path: `/health`
- Returns data source path and loaded TLD count.

### 2) Cheapest TLDs
- Method: `GET`
- Path: `/api/tlds/cheapest`
- Query params:
  - `maxResults` (optional, int 1-100)
  - `maxRenewal` (optional, positive number)
  - `sortBy` (optional: `renewal|registration|transfer`)

### 3) TLD details
- Method: `GET`
- Path: `/api/tlds/{tld}`
- Example: `/api/tlds/com`

### 4) Recommendations for an idea
- Method: `GET` or `POST`
- Path: `/api/recommendations`
- Inputs:
  - `idea` (required)
  - `maxResults` (optional, int 1-20)
  - `maxRenewal` (optional, positive number)

## Expected Response Shape
- Cheapest: `{ count, results: [{ tld, registration, renewal, transfer, coupons }] }`
- Details: `{ result: { tld, registration, renewal, transfer, coupons } }`
- Recommendations: `{ count, results: [{ tld, registration, renewal, transfer, score, exampleDomain, coupons }] }`

## Agent Usage Guidance
- If user asks for "best" TLD, call `/api/recommendations` first.
- If user asks for exact price of a known extension, call `/api/tlds/{tld}`.
- If user asks for budget options, call `/api/tlds/cheapest` with `maxRenewal`.
- When presenting costs, prioritize renewal cost over registration to avoid misleading long-term pricing.

## Error Handling
- HTTP 400: bad params; ask user to adjust constraints.
- HTTP 404: TLD not found; suggest trying without a leading dot or checking spelling.
- HTTP 500: service/data issue; ask operator to verify data file mount and server logs.
