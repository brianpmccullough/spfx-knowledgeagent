---
name: spfx-upgrade
description: Upgrade an SPFx project one version at a time using the m365 CLI. Use when the user asks to upgrade SPFx, bump the SPFx version, or run spfx project upgrade.
allowed-tools: [Bash, Read, WebFetch]
disable-model-invocation: true
---

# SPFx Project Upgrade

## Step 0 — Prerequisites

Current git branch: !`git branch --show-current 2>/dev/null || echo "not a git repo"`
m365 CLI installed version: !`m365 --version 2>/dev/null || echo "NOT FOUND"`
m365 CLI latest version: !`npm view @pnp/cli-microsoft365 version 2>/dev/null || echo "UNKNOWN"`
node: !`node --version 2>/dev/null || echo "NOT FOUND"`
pnpm-lock.yaml present: !`test -f pnpm-lock.yaml && echo "yes" || echo "no"`
yarn.lock present: !`test -f yarn.lock && echo "yes" || echo "no"`
packageManager in .yo-rc.json: !`node -e "try{const r=require('./.yo-rc.json');console.log(r['@microsoft/generator-sharepoint'].packageManager||'not set')}catch(e){console.log('not found')}" 2>/dev/null`

If on `main` or `master`, warn: "You are on `<branch>` — work on a dedicated upgrade branch. Name will be suggested after Step 4."

If m365 CLI is not found or not on the latest version, install/update it (always use npm for global installs):
```
npm install -g @pnp/cli-microsoft365
```
If outdated, ask the user before continuing.

**Detect project package manager**: pnpm-lock.yaml → pnpm, yarn.lock → yarn, otherwise npm. Confirm with the user before applying any project-level install commands.

## Step 1 — Pre-flight build check

gulpfile.js present: !`test -f gulpfile.js && echo "yes" || echo "no"`
heft config present: !`test -f config/heft.json -o -f .heftrc.json && echo "yes" || echo "no"`

- `gulpfile.js` present → `gulp bundle` (SPFx ≤ 1.21.x)
- Otherwise → `npm run build` (SPFx 1.22+, Heft)

```bash
# gulp-based:
gulp bundle 2>&1 | tee /tmp/spfx-preflight.log; echo "EXIT:$?"

# heft-based:
npm run build 2>&1 | tee /tmp/spfx-preflight.log; echo "EXIT:$?"
```

If exit code non-zero or errors present: stop — resolve build errors before upgrading.
If warnings only: inform user and ask whether to continue.

```bash
rm /tmp/spfx-preflight.log
```

## Step 2 — Detect current version

Current package.json sp-core-library: !`grep '"@microsoft/sp-core-library"' package.json 2>/dev/null`
Fallback .yo-rc.json version: !`node -e "try{const r=require('./.yo-rc.json');console.log(r['@microsoft/generator-sharepoint'].version)}catch(e){console.log('not found')}" 2>/dev/null`

If neither yields a version, stop — this does not appear to be an SPFx project.

## Step 3 — Fetch the official version and compatibility list

Use WebFetch to retrieve:
`https://learn.microsoft.com/en-us/sharepoint/dev/spfx/compatibility#spfx-development-environment-compatibility`

Extract in ascending order (exclude struck-through versions):
- SPFx version numbers
- Required Node.js version for each
- Note: Heft toolchain was introduced at **1.22.0** (replaces Gulp)

## Step 4 — Determine the next version

Find the current version in the ordered list. The **target version** is the immediately next entry — do not skip versions. If already on latest, stop.

**Node.js compatibility check**:
Identify the required Node.js version for the target. Compare with the detected node version from Step 0.
- If incompatible: **STOP** — tell the user which Node version is required (e.g. "SPFx 1.21 requires Node 22") and suggest using `nvm install <version> && nvm use <version>`. Do not proceed until Node is updated.
- If compatible: confirm and continue.

**Toolchain migration warning** (only when current ≤ 1.21.x AND target ≥ 1.22.0):
> ⚠️ **Gulp → Heft toolchain migration**: This upgrade replaces the Gulp build system with Heft.
> - `gulpfile.js` will be deleted — any custom gulp tasks will be lost
> - Build commands change: `gulp bundle` → `npm run build`, `gulp serve` → `npm run serve`
> - CI/CD pipelines or scripts calling `gulp` must be updated manually after this upgrade
>
> **Before continuing**: Does `gulpfile.js` contain any custom tasks (beyond the standard SPFx boilerplate)? If yes, document them now. Ask the user to confirm before proceeding.

**Branch check**: If warned about `main`/`master` in Step 0, offer to create a branch now:
```bash
git checkout -b upgrade/spfx-<target-version>
```
If the user declines, warn once and continue.

## Step 5 — Run the upgrade

```bash
m365 spfx project upgrade --toVersion <target-version> --output md > /tmp/spfx-upgrade-report.md
```

Read `/tmp/spfx-upgrade-report.md` and present the upgrade steps to the user, grouped by type:
- **Package changes** (add/remove dependencies in `package.json`)
- **Config file changes** (create/update files under `config/`, `tsconfig.json`, etc.)
- **Code changes** (source file updates)
- **Manual steps** (anything that cannot be automated)

**Persist the report**: Check for an existing `docs`, `doc`, or `documentation` folder. Suggest saving to `<docs-folder>/spfx-upgrades/upgrade-<target-version>.md`; otherwise suggest `docs/spfx-upgrades/upgrade-<target-version>.md`. If the user agrees, copy before deleting.

```bash
rm /tmp/spfx-upgrade-report.md
```

## Step 6 — Apply changes, install, and verify

Walk through each upgrade step with the user, confirming before applying each one. **Skip the `.yo-rc.json` version update** from the report — that step is deferred to last and verified in Step 7.

After all changes are applied, clean and re-install to update the lockfile:

```bash
rm -rf node_modules && npm install        # or: pnpm install --shamefully-hoist
```

Then run the build to verify the upgrade. **Re-detect the toolchain** — if this was a Gulp→Heft migration, the build command has changed:
```bash
# If now Heft-based (target ≥ 1.22.0):
npm run build 2>&1 | tee /tmp/spfx-postupgrade.log; echo "EXIT:$?"

# If still Gulp-based:
gulp bundle 2>&1 | tee /tmp/spfx-postupgrade.log; echo "EXIT:$?"
```

- Build passes → delete log and proceed to Step 7. The updated lockfile must be committed.
- Build fails → stop, surface the errors, and help the user resolve them before continuing.

```bash
rm -f /tmp/spfx-postupgrade.log
```

## Step 7 — Update version references, verify completion, and finalize

**Update version references** (all files except `.yo-rc.json` — handled last):
```bash
grep -rl "<current-version>" . --include="*.md" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.html" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null
```
For each file found, ask the user if the old version should be replaced with the target version. Skip `.yo-rc.json` — it will be updated after verification.

**Update the README changelog**: If a `## Changelog` or `## Change Log` section exists, prepend a new entry; otherwise append:
```
## Changelog

- **<yyyy-MM-dd>** — SPFx upgrade to <target-version>
```

**Verify upgrade completion**: Re-run the m365 upgrade command (do not save the output) to confirm all steps have been applied:
```bash
m365 spfx project upgrade --toVersion <target-version> --output md 2>&1 | head -150
```
- If the **only remaining step** is the `.yo-rc.json` version update → proceed.
- If **other steps remain** → apply them, re-run the build verification from Step 6, then re-run this check until only `.yo-rc.json` remains.

**Update `.yo-rc.json`** (final change): set `["@microsoft/generator-sharepoint"]["version"]` to `<target-version>`.

## Step 8 — Summary

Report to the user:
- Current version → target version
- Whether a toolchain migration occurred (Gulp → Heft).
- Files changed
- Reminder to commit: all modified files + updated lockfile + persisted upgrade report (if saved)

