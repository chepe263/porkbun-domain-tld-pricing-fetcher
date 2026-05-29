# Examples

This folder provides quick, repeatable testing helpers.

## Files
- `rest-api-smoke.sh`: Shell smoke test for the REST API.
- `mcp.json.example`: VS Code MCP config example for this project.

## REST smoke test
1. Start the API server (or Docker compose stack).
2. Run:
   - `./examples/rest-api-smoke.sh`
   - or `./examples/rest-api-smoke.sh http://127.0.0.1:3000`

Checks performed:
- `/health`
- `/api/tlds/cheapest`
- `/api/tlds/casa`
- `/api/recommendations`

## MCP example config
Copy `examples/mcp.json.example` into your VS Code MCP config and merge with your existing servers.
