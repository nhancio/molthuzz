#!/usr/bin/env bash
# deploy.sh — commit, merge every branch into main and push, then deploy.
# Deploys Firestore/Storage rules to Firebase, then builds the landing site
# and its functions and deploys them to Netlify (https://makein-nhancio.netlify.app).
# The Expo mobile app ships through EAS separately and is not touched here.
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GITHUB_ACCOUNT="${GITHUB_ACCOUNT:-didigamnithin}"
# Deploys ship main: commit pending work, merge every local and GitHub branch
# into main, and push main before the deploy below runs. Anything unsafe (a
# merge conflict, a secret, dependency folder or >100 MB file about to be
# committed, a failed push) stops the deploy before it ships.
# Flags that skip git skip this too.
_sync_git() {
  if [ -n "${_SYNC_TOKEN:-}" ]; then
    GH_TOKEN="$_SYNC_TOKEN" git -c credential.helper= -c 'credential.helper=!gh auth git-credential' "$@"
  else
    git "$@"
  fi
}

# Unstages everything and fails if `git add -A` picked up a new file that must not be committed.
_sync_check_staged() {
  local raw big line meta path mode sha bad=""
  raw="$(git -c core.quotePath=false diff --cached --diff-filter=A --no-renames --raw --no-abbrev)"
  [ -n "$raw" ] || return 0
  big=" $(printf '%s\n' "$raw" | awk '$2 != "160000" {print $4}' \
    | git cat-file --batch-check='%(objectsize) %(objectname)' | awk '$1 > 100000000 {print $2}' | tr '\n' ' ')"
  while IFS= read -r line; do
    meta="${line%%	*}"; path="${line#*	}"
    read -r _ mode _ sha _ <<< "$meta"
    case "/$path" in
      */.env.example|*/.env.sample|*/.env.template|*.example) ;;
      */.env|*/.env.*|*.pem|*.key|*.p12|*.pfx|*.jks|*.keystore|*/id_rsa*|*/id_ed25519*|*service-account*.json|*serviceAccount*.json|*/credentials.json|*client_secret*.json)
        bad="$bad"$'\n'"  $path  (looks like a secret)" ;;
      */node_modules/*) bad="$bad"$'\n'"  $path  (dependency folder)" ;;
    esac
    case "$big" in *" $sha "*) bad="$bad"$'\n'"  $path  (over 100 MB; GitHub rejects it)" ;; esac
    if [ "$mode" = 160000 ] && ! git config -f .gitmodules --get-regexp '\.path$' 2>/dev/null | awk '{print $2}' | grep -qxF "$path"; then
      bad="$bad"$'\n'"  $path  (nested git repo; its files would not ship)"
    fi
  done <<< "$raw"
  [ -n "$bad" ] || return 0
  git reset -q
  echo "Deploy stopped: nothing was committed, because these new files should not go into git:$bad" >&2
  echo "Add them to .gitignore (or commit them yourself if they really belong in git), then rerun." >&2
  return 1
}

# Each app keeps its videos and marketing files in content/, which never goes into git.
_sync_ignore_content() {
  grep -qxF '/content/' .gitignore 2>/dev/null \
    || printf '\n# Videos and marketing content live here; never committed.\n/content/\n' >> .gitignore
  [ -z "$(git ls-files content)" ] || git rm -r -q --cached content
}

_sync_merge() {
  case "$1" in refs/heads/main|refs/remotes/origin/HEAD|*/gh-pages) return 0 ;; esac
  git merge-base --is-ancestor "$1" HEAD 2>/dev/null && return 0
  echo "Merging ${1#refs/}"
  git merge -q --no-edit "$1" && return 0
  git merge --abort 2>/dev/null || true
  echo "Deploy stopped: ${1#refs/} does not merge cleanly into main. Merge it by hand, then rerun." >&2
  return 1
}

sync_branches_into_main() {
  local arg ref start start_ref before tries _SYNC_TOKEN=""
  for arg in "$@"; do
    case "$arg" in -h|--help|--dry-run|--no-git|--no-push|--skip-push|--deploy-only) return 0 ;; esac
  done
  [ -z "${DEPLOY_BRANCHES_SYNCED:-}" ] || return 0
  if [ -f .git ] || [ "$(git rev-parse --show-toplevel 2>/dev/null)" != "$(pwd -P)" ]; then
    echo "Branch sync skipped: $(pwd) is not a standalone git repository."
    return 0
  fi
  git remote get-url origin >/dev/null 2>&1 || { echo "Branch sync skipped: no 'origin' remote."; return 0; }
  for ref in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD rebase-merge rebase-apply; do
    [ ! -e "$(git rev-parse --git-path "$ref")" ] || { echo "Deploy stopped: finish the in-progress git operation first." >&2; return 1; }
  done
  ref="$(git rev-parse --git-path index.lock)"
  [ ! -e "$ref" ] || { echo "Deploy stopped: another git command is running (or delete the stale $ref)." >&2; return 1; }
  case "$(git remote get-url origin)" in
    https://github.com/*)
      if [ -n "${GITHUB_ACCOUNT:-}" ] && command -v gh >/dev/null 2>&1; then
        _SYNC_TOKEN="$(gh auth token --hostname github.com --user "$GITHUB_ACCOUNT" 2>/dev/null)" \
          || { echo "Deploy stopped: GitHub CLI is not logged in as $GITHUB_ACCOUNT (gh auth login)." >&2; return 1; }
      fi ;;
  esac
  before="$(cksum < deploy.sh)"
  start="$(git symbolic-ref -q --short HEAD || git rev-parse --short HEAD)"

  echo "==> 1/3 Commit pending changes on $start"
  _sync_ignore_content || return 1
  git add -A || return 1
  _sync_check_staged || return 1
  git diff --cached --quiet || git commit -q -m "chore: commit pending changes before deploy" || return 1
  start_ref="$(git symbolic-ref -q HEAD || git rev-parse HEAD)"

  echo "==> 2/3 Merge local and GitHub branches into main"
  _sync_git fetch -q --prune origin || { echo "Deploy stopped: could not fetch from origin." >&2; return 1; }
  git checkout -q main 2>/dev/null || git checkout -q -b main || return 1
  for ref in "$start_ref" $(git for-each-ref --format='%(refname)' refs/heads refs/remotes/origin); do
    _sync_merge "$ref" || { echo "You were on $start; you are now on main." >&2; return 1; }
  done

  echo "==> 3/3 Push main"
  for tries in 1 2; do
    _sync_git push -q -u origin main && break
    [ "$tries" = 1 ] || { echo "Deploy stopped: pushing main to origin failed." >&2; return 1; }
    echo "Push rejected; merging the latest origin/main and retrying."
    _sync_git fetch -q origin || return 1
    _sync_merge refs/remotes/origin/main || return 1
  done
  [ "$(_sync_git ls-remote origin refs/heads/main | cut -f1)" = "$(git rev-parse HEAD)" ] \
    || { echo "Deploy stopped: origin main does not match local main after the push." >&2; return 1; }

  export DEPLOY_BRANCHES_SYNCED=1
  if [ "$(cksum < deploy.sh)" != "$before" ]; then
    echo "deploy.sh changed in the merge; restarting with the merged version."
    exec bash ./deploy.sh "$@"
  fi
}
# A fresh checkout has no node_modules; install the locked dependencies before building.
_ensure_node_deps() {
  [ -f package.json ] && [ ! -d node_modules ] || return 0
  echo "==> Installing npm dependencies (node_modules is missing)"
  if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi \
    || { echo "Deploy stopped: npm could not install dependencies." >&2; return 1; }
}
sync_branches_into_main "$@" || exit 1
_ensure_node_deps || exit 1

FIREBASE_PROJECT="${FIREBASE_PROJECT:-makein-nhancio-20261023}"
FIREBASE_ACCOUNT="${FIREBASE_ACCOUNT:-nithindidigam@nhancio.com}"
NETLIFY_SITE_ID="7d8f601d-a0eb-4a8d-8fc6-fb090f7e4f69"

echo "==> Test"
npm test
echo "==> Deploy Firestore and Storage rules"
npx -y firebase-tools@latest deploy --only firestore,storage --project "$FIREBASE_PROJECT" \
  --account "$FIREBASE_ACCOUNT" --non-interactive
echo "==> Build and deploy the site to Netlify"
netlify deploy --build --prod --site "$NETLIFY_SITE_ID"
echo "Deployed https://makein-nhancio.netlify.app"
