#!/usr/bin/env bash
# Runs each Phase 2 review fix's check where it must fail, on the commit before
# the fix or on a deliberately broken copy of the branch tip. Run it from the
# repo root. It needs Google Chrome, like pnpm a11y.
set -u -o pipefail

repo=$(git rev-parse --show-toplevel) || exit 1
tip=$(git -C "$repo" rev-parse HEAD)
wt=$(mktemp -d)
git -C "$repo" worktree add -q --detach "$wt" "$tip" || exit 1
trap 'git -C "$repo" worktree remove --force "$wt"' EXIT
cd "$wt" || exit 1
pnpm -s install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || {
  echo "pnpm install failed"
  exit 1
}

cases=0
wrong=0

at() {
  git reset -q --hard && git clean -fdq && git checkout -q --detach "$1" && rm -rf .next out
}

edit() {
  python3 -c '
import sys
path, old, new = sys.argv[1:]
text = open(path).read()
assert old in text, f"{old!r} is not in {path}"
open(path, "w").write(text.replace(old, new, 1))
' "$@"
}

build_then() {
  pnpm -s build >/dev/null 2>&1 || {
    echo "BUILD FAILED"
    return 1
  }
  "$@"
}

expect() {
  local want="$1" match="$2" name="$3"
  shift 3
  local out code got
  out=$("$@" 2>&1)
  code=$?
  got=$([ "$code" -eq 0 ] && echo pass || echo fail)
  if [[ "$out" == *"BUILD FAILED"* ]]; then
    got="build failure"
  elif [ "$got" = fail ] && ! grep -qiE "$match" <<<"$out"; then
    got="fail for another reason"
  fi
  cases=$((cases + 1))
  if [ "$got" = "$want" ]; then
    echo "ok     $name ($got)"
  else
    wrong=$((wrong + 1))
    echo "WRONG  $name (expected $want, got $got)"
  fi
  if [ "$got" != pass ]; then
    grep -iE "$match" <<<"$out" | head -3 | sed 's/^/         /'
  fi
}

a11y() { build_then node scripts/a11y.mjs; }
copy_contract() { pnpm -s exec vitest run tests/copy-contract.test.ts; }

echo "New checks against the commit before their fix"
for fix in cef8f38:'^320px' 17afd98:'widening to desktop' 64f3d1e:'failed copy'; do
  commit=${fix%%:*}
  at "$commit^"
  git checkout -q "$commit" -- scripts/a11y.mjs
  expect fail "${fix#*:}" "$commit pnpm a11y on $(git rev-parse --short HEAD)" a11y
done

hide_reveals() {
  edit app/globals.css '@media (prefers-reduced-motion: no-preference) {' \
    '@media (prefers-reduced-motion: no-preference) {
  .reveal { clip-path: inset(0 0 100% 0); }'
}
at 8fdabec^
hide_reveals
expect pass '' "tests before 8fdabec miss a clip-path that hides every reveal" pnpm -s test

at c64227e^
git checkout -q c64227e -- tests/copy-contract.test.ts
expect fail 'out of client components' "c64227e import boundary test on $(git rev-parse --short HEAD)" copy_contract

import_visitor_copy_in_client() {
  printf '%s\n' '"use client";' \
    'import { getVisitorFacingCopy } from "@/content/visitor-copy";' \
    'export const Leak = () => <p>{getVisitorFacingCopy().length}</p>;' >components/leak.tsx
}
at 0d5ee5f^
import_visitor_copy_in_client
expect pass '' "c64227e boundary test misses a client import of visitor-copy" copy_contract
at 0d5ee5f
import_visitor_copy_in_client
expect fail 'out of client components' "0d5ee5f boundary test catches it" copy_contract

repeat_launch() {
  edit content/site.ts "Before that: Apple's 0→1 iPhone launch in India," \
    "Before that: the 0→1 iPhone India launch at Apple,"
}
at b328888^
repeat_launch
expect pass '' "old phrase guard misses a repeated 0→1 phrase" copy_contract
at b328888
repeat_launch
expect fail 'the 0→1 iphone india launch' "b328888 phrase guard catches it" copy_contract

set_calendar() {
  edit content/site.ts '    resumeFilename: "Jarrod-Tran-Resume.pdf",' \
    '    resumeFilename: "Jarrod-Tran-Resume.pdf",
    calendar: "https://cal.example.com/jarrod",'
}
at d18c899^
set_calendar
expect fail 'sections.test' "tests before d18c899 with contact.calendar set" pnpm -s test
at d18c899
set_calendar
expect pass '' "d18c899 tests with contact.calendar set" pnpm -s test

echo
echo "Checks against a broken copy of the branch tip"
at "$tip"
expect pass '' "pnpm size at the tip" build_then node scripts/js-size.mjs
edit scripts/js-size.mjs 'const gzipBudget = 150 * 1024;' 'const gzipBudget = 140 * 1024;'
expect fail 'over the' "pnpm size with a 140 kB budget" node scripts/js-size.mjs

at "$tip"
hide_reveals
expect fail 'reveal:' "clip-path hides every reveal" a11y

breaks=(
  'app/globals.css|    translate: 0 0.625rem;|    translate: 0 0.625rem;
    opacity: 0;|reveal:|reveals start at opacity 0'
  'app/globals.css|animation: reveal linear backwards;|animation: reveal linear both;|reveal:|fill both holds a transform'
  'app/globals.css|@media (prefers-reduced-motion: no-preference) {
  @supports|@media all {
  @supports|reduced motion|reveals ignore reduced motion'
  'content/site.ts|documentTitle: "Jarrod Tran · Product & strategy · Tesla, Apple, Waymo",|documentTitle: "Jarrod Tran · Product & strategy · Tesla, Apple, Waymo · Houston, Texas",|page title|title over 60 characters'
)
for spec in "${breaks[@]}"; do
  IFS='|' read -r -d '' file old new match name <<<"$spec"
  name=${name%$'\n'}
  at "$tip"
  edit "$file" "$old" "$new"
  expect fail "$match" "$name" a11y
done

echo
echo "$((cases - wrong)) of $cases cases behave as expected"
[ "$wrong" -eq 0 ]
