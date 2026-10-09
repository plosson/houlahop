#!/bin/sh
# Checks the deployed site. Usage: sh scripts/smoke.sh [base-url]
set -u
BASE="${1:-https://houlahop.com}"
fail=0

expect() { # url expected-status expected-content-type-prefix
  got=$(curl -s -o /dev/null -w "%{http_code} %{content_type}" "$1")
  case "$got" in
    "$2 $3"*) echo "ok   $1 -> $got" ;;
    *) echo "FAIL $1 -> $got (expected $2 $3)"; fail=1 ;;
  esac
}

for page in / /siteio/ /agentio/ /pagerio/ /copycat/; do expect "$BASE$page" 200 text/html; done
for f in /siteio/install /siteio/install.ps1 /agentio/install /agentio/install.ps1; do expect "$BASE$f" 200 text/plain; done
for f in /siteio/skill.md /agentio/skill.md; do expect "$BASE$f" 200 text/; done
for t in siteio agentio pagerio copycat; do expect "$BASE/$t" 301 ""; done

# An install script must start with a shebang, never with HTML.
for t in siteio agentio; do
  first=$(curl -fsSL "$BASE/$t/install" | head -c 2)
  [ "$first" = "#!" ] && echo "ok   $t/install starts with #!" || { echo "FAIL $t/install starts with '$first'"; fail=1; }
done

# No old domain may appear in what agents read.
for f in /siteio/skill.md /agentio/skill.md /siteio/install /agentio/install; do
  if curl -fsSL "$BASE$f" | grep -Eqi "(siteio|agentio)\.houlahop\.com"; then echo "FAIL $f mentions an old domain"; fail=1; fi
done

exit $fail
