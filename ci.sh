#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

pass=0
fail=0
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

run_step "Vulnerability scan"          bun audit --ignore GHSA-2g4f-4pwh-qvx6
run_step "Lint"                        bunx eslint .
run_step "TypeScript check"            bunx tsc --noEmit
run_step "Build"                       bun run build
run_step "Unit & integration tests"    bun test --coverage tests/unit/ tests/integration/
run_step "E2E tests"                   bunx playwright test --config tests/e2e/playwright.config.ts

printf "\n${BOLD}══ Summary ══${RESET}\n"
printf "${GREEN}✓ %d passed${RESET}\n" "$pass"
if ((fail > 0)); then
  printf "${RED}✗ %d failed:${RESET}\n" "$fail"
  for s in "${failed_steps[@]}"; do
    printf "${RED}  - %s${RESET}\n" "$s"
  done
  exit 1
else
  printf "${GREEN}All checks passed.${RESET}\n"
fi
