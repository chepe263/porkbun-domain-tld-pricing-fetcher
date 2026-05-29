#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${BASE_URL:-http://127.0.0.1:3000}}"
IDEA="${IDEA:-physical pillow store humble local business}"

log() {
  printf '[rest-smoke] %s\n' "$1"
}

fail() {
  printf '[rest-smoke] ERROR: %s\n' "$1" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"
}

contains() {
  local text="$1"
  local expected="$2"
  printf '%s' "$text" | grep -Fq "$expected"
}

urlencode_spaces() {
  printf '%s' "$1" | sed 's/ /%20/g'
}

need_cmd curl
need_cmd grep
need_cmd sed

log "Base URL: $BASE_URL"

log "Checking /health"
health_json="$(curl -fsS "$BASE_URL/health")" || fail "health endpoint unavailable"
contains "$health_json" '"ok":true' || fail "health response missing ok=true"
contains "$health_json" '"totalTlds":' || fail "health response missing totalTlds"

log "Checking /api/tlds/cheapest"
cheapest_json="$(curl -fsS "$BASE_URL/api/tlds/cheapest?maxResults=3&sortBy=renewal")" || fail "cheapest endpoint unavailable"
contains "$cheapest_json" '"count":3' || fail "cheapest response does not include count=3"
contains "$cheapest_json" '"tld":"top"' || fail "cheapest response missing expected .top row"

log "Checking /api/tlds/casa"
casa_json="$(curl -fsS "$BASE_URL/api/tlds/casa")" || fail "tld details endpoint unavailable"
contains "$casa_json" '"tld":"casa"' || fail "tld details did not return casa"

log "Checking /api/recommendations"
idea_q="$(urlencode_spaces "$IDEA")"
rec_json="$(curl -fsS "$BASE_URL/api/recommendations?idea=$idea_q&maxResults=3")" || fail "recommendations endpoint unavailable"
contains "$rec_json" '"count":3' || fail "recommendations response does not include count=3"
contains "$rec_json" '"exampleDomain":' || fail "recommendations response missing exampleDomain"

log "All REST smoke checks passed"
