#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

pass=0
fail=0
skip=0
failed_steps=()

run_step() {
  local name="$1"
  shift
  printf "\n${BOLD}── %s ──${RESET}\n" "$name"
  if "$@"; then
    printf "${GREEN}✓ %s${RESET}\n" "$name"
    ((pass++))
  else
    printf "${RED}✗ %s${RESET}\n" "$name"
    ((fail++))
    failed_steps+=("$name")
  fi
}

skip_step() {
  local name="$1"
  local reason="$2"
  printf "\n${DIM}── %s ──${RESET}\n" "$name"
  printf "${YELLOW}⊘ %s ${DIM}(%s)${RESET}\n" "$name" "$reason"
  ((skip++))
}

# ── Parallel tier ──────────────────────────────────────────────────

printf "${BOLD}══ Audit ══${RESET}\n"
run_step "Lint"                        bunx eslint .
run_step "TypeScript check"            bunx tsc --noEmit

printf "\n${BOLD}══ Vulnerability ══${RESET}\n"
run_step "bun audit"                   bun audit --ignore GHSA-2g4f-4pwh-qvx6
if command -v trivy &>/dev/null; then
  run_step "Trivy filesystem scan"     trivy fs --scanners vuln --exit-code 0 .
else
  skip_step "Trivy filesystem scan"    "trivy not installed"
fi

printf "\n${BOLD}══ Tests ══${RESET}\n"
run_step "Unit & integration tests"    bun test tests/unit/ tests/integration/
run_step "E2E tests"                   bunx playwright test --config tests/e2e/playwright.config.ts

# ── Depends on tests ───────────────────────────────────────────────

printf "\n${BOLD}══ Coverage ══${RESET}\n"
run_step "Coverage report"             bun test --coverage tests/unit/ tests/integration/

printf "\n${BOLD}══ Build ══${RESET}\n"
run_step "Build"                       bun run build

# ── Docker (skipped locally) ───────────────────────────────────────

skip_step "Docker build"               "push-only, skipped locally"
skip_step "Docker manifest"            "push-only, skipped locally"
skip_step "Trivy image scan"           "push-only, skipped locally"
skip_step "GitHub Release"             "push-only, skipped locally"

# ── Summary ────────────────────────────────────────────────────────

printf "\n${BOLD}══ Summary ══${RESET}\n"
printf "${GREEN}✓ %d passed${RESET}\n" "$pass"
if ((skip > 0)); then
  printf "${YELLOW}⊘ %d skipped${RESET}\n" "$skip"
fi
if ((fail > 0)); then
  printf "${RED}✗ %d failed:${RESET}\n" "$fail"
  for s in "${failed_steps[@]}"; do
    printf "${RED}  - %s${RESET}\n" "$s"
  done
  exit 1
else
  printf "${GREEN}All checks passed.${RESET}\n"
fi
