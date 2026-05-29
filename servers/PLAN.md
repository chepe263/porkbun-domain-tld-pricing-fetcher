# Pricing Service Implementation Plan

## Goal
Create a Node-based pricing service that reads Porkbun pricing output from the core folder and lets agents/chatbots:
- find cheapest TLDs
- get details for a specific TLD
- get best TLD recommendations for a domain idea

## Execution Checklist
- [x] Define architecture and tool contract
- [x] Scaffold Node MCP project
- [x] Implement pricing data loader with reload support
- [x] Implement MCP tools for cheapest, lookup, and recommendation
- [x] Implement REST API mode for Docker/public hosting
- [x] Add Dockerfile for hosted deployment
- [x] Add docs for local usage and OpenWebUI integration path
- [x] Add future-ready OAuth/GitHub public deployment notes
- [x] Run smoke checks

## Architecture
- Runtime: Node.js
- Primary transport: REST over HTTP for hosted/container use
- Secondary transport: MCP stdio for native MCP clients
- Data source: `../core/porkbun-domains-filtered.json`
- Future public deployment: OAuth-enabled gateway in front of REST API

## Notes
- For OpenWebUI compatibility, REST + OpenAPI is the simplest hosted path.
- For public sharing, keep OAuth in gateway layer instead of embedding auth logic in core pricing logic.
