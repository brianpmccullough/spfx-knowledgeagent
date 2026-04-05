# SPFx Upgrade: 1.21.1 → 1.22.0

**Date:** 2026-04-04
**Branch:** `upgrade/spfx-1.22.0`
**Toolchain migration:** Gulp → Heft

---

## Summary

| Category | Details |
|---|---|
| From version | 1.21.1 |
| To version | 1.22.0 |
| Node.js | v22.16.0 (required: v22) |
| Toolchain change | Gulp removed, Heft introduced |

### Package changes

**Removed devDependencies:**
- `@microsoft/sp-build-web`
- `@microsoft/rush-stack-compiler-5.3`
- `gulp`
- `ajv`

**Upgraded dependencies:**
- `@microsoft/decorators` 1.21.1 → 1.22.0
- `@microsoft/sp-application-base` 1.21.1 → 1.22.0
- `@microsoft/sp-core-library` 1.21.1 → 1.22.0
- `@microsoft/sp-dialog` 1.21.1 → 1.22.0

**Upgraded devDependencies:**
- `@microsoft/sp-module-interfaces` 1.21.1 → 1.22.0
- `@microsoft/eslint-config-spfx` 1.21.1 → 1.22.0
- `@microsoft/eslint-plugin-spfx` 1.21.1 → 1.22.0
- `@rushstack/eslint-config` 4.0.1 → 4.5.2
- `typescript` ~5.3.3 → ~5.8.0

**Added devDependencies (Heft toolchain):**
- `@microsoft/spfx-web-build-rig@1.22.0`
- `@microsoft/spfx-heft-plugins@1.22.0`
- `@rushstack/heft@1.1.2`
- `@typescript-eslint/parser@8.46.2`
- `css-loader@7.1.2`
- `@types/heft-jest@1.0.2`

**scripts updated:**
- `build`: `gulp bundle` → `heft test --clean --production && heft package-solution --production`
- `clean`: `gulp clean` → `heft clean`
- `start` (added): `heft start --clean`
- `eject-webpack` (added): `heft eject-webpack`
- `test` (removed)
- `main` property (removed)

**Added overrides:**
- `@rushstack/heft: 1.1.2`

### Config file changes

| File | Change |
|---|---|
| `config/sass.json` | Updated `$schema` to Heft URL; added `extends` pointing to rig |
| `tsconfig.json` | Replaced — now extends rig's `tsconfig-base.json` |
| `config/rig.json` | Created — points to `@microsoft/spfx-web-build-rig` |
| `config/typescript.json` | Created — extends rig config; defines static asset copy rules |
| `.gitignore` | Added `lib-dts`, `lib-commonjs`, `lib-esm`, `jest-output` |
| `.yo-rc.json` | `version` → `1.22.0`, `useGulp` → `false` |

### Files removed
- `src/index.ts`
- `gulpfile.js`

### ESLint changes (`.eslintrc.js`)
- Added: `@rushstack/import-requires-chunk-name`
- Added: `@rushstack/pair-react-dom-render-unmount`
- Removed: `@microsoft/spfx/import-requires-chunk-name`
- Removed: `@microsoft/spfx/pair-react-dom-render-unmount`

### Manual follow-up
- Update any CI/CD pipelines or scripts that call `gulp` → use `npm run build` / `npm run start`
- If TypeScript type errors appear after build, run `pnpm dedupe`

---

## Full m365 upgrade report

# Upgrade project spfx-knowledgeagent-client-side-solution to v1.22.0

Date: 4/4/2026

## Findings

Following is the list of steps required to upgrade your project to SharePoint Framework version 1.22.0. [Summary](#Summary) of the modifications is included at the end of the report.

### FN001001 @microsoft/sp-core-library | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-core-library

Execute the following command:

```sh
npm i -SE @microsoft/sp-core-library@1.22.0
```

File: [./package.json:18:5](./package.json)

### FN001011 @microsoft/sp-dialog | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-dialog

Execute the following command:

```sh
npm i -SE @microsoft/sp-dialog@1.22.0
```

File: [./package.json:19:5](./package.json)

### FN001012 @microsoft/sp-application-base | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-application-base

Execute the following command:

```sh
npm i -SE @microsoft/sp-application-base@1.22.0
```

File: [./package.json:17:5](./package.json)

### FN001013 @microsoft/decorators | Required

Upgrade SharePoint Framework dependency package @microsoft/decorators

Execute the following command:

```sh
npm i -SE @microsoft/decorators@1.22.0
```

File: [./package.json:16:5](./package.json)

### FN002001 @microsoft/sp-build-web | Required

Remove SharePoint Framework dev dependency package @microsoft/sp-build-web

Execute the following command:

```sh
npm un -D @microsoft/sp-build-web
```

File: [./package.json:26:5](./package.json)

### FN002002 @microsoft/sp-module-interfaces | Required

Upgrade SharePoint Framework dev dependency package @microsoft/sp-module-interfaces

Execute the following command:

```sh
npm i -DE @microsoft/sp-module-interfaces@1.22.0
```

File: [./package.json:27:5](./package.json)

### FN002004 gulp | Required

Remove SharePoint Framework dev dependency package gulp

Execute the following command:

```sh
npm un -D gulp
```

File: [./package.json:32:5](./package.json)

### FN002007 ajv | Required

Remove SharePoint Framework dev dependency package ajv

Execute the following command:

```sh
npm un -D ajv
```

File: [./package.json:30:5](./package.json)

### FN002021 @rushstack/eslint-config | Required

Upgrade SharePoint Framework dev dependency package @rushstack/eslint-config

Execute the following command:

```sh
npm i -DE @rushstack/eslint-config@4.5.2
```

File: [./package.json:28:5](./package.json)

### FN002022 @microsoft/eslint-plugin-spfx | Required

Upgrade SharePoint Framework dev dependency package @microsoft/eslint-plugin-spfx

Execute the following command:

```sh
npm i -DE @microsoft/eslint-plugin-spfx@1.22.0
```

File: [./package.json:24:5](./package.json)

### FN002023 @microsoft/eslint-config-spfx | Required

Upgrade SharePoint Framework dev dependency package @microsoft/eslint-config-spfx

Execute the following command:

```sh
npm i -DE @microsoft/eslint-config-spfx@1.22.0
```

File: [./package.json:23:5](./package.json)

### FN002026 typescript | Required

Upgrade SharePoint Framework dev dependency package typescript

Execute the following command:

```sh
npm i -DE typescript@~5.8.0
```

File: [./package.json:33:5](./package.json)

### FN002029 @microsoft/rush-stack-compiler-5.3 | Required

Remove SharePoint Framework dev dependency package @microsoft/rush-stack-compiler-5.3

Execute the following command:

```sh
npm un -D @microsoft/rush-stack-compiler-5.3
```

File: [./package.json:22:22](./package.json)

### FN002030 @microsoft/spfx-web-build-rig | Required

Install SharePoint Framework dev dependency package @microsoft/spfx-web-build-rig

Execute the following command:

```sh
npm i -DE @microsoft/spfx-web-build-rig@1.22.0
```

File: [./package.json:22:3](./package.json)

### FN002031 @rushstack/heft | Required

Install SharePoint Framework dev dependency package @rushstack/heft

Execute the following command:

```sh
npm i -DE @rushstack/heft@1.1.2
```

File: [./package.json:22:3](./package.json)

### FN002032 @typescript-eslint/parser | Required

Install SharePoint Framework dev dependency package @typescript-eslint/parser

Execute the following command:

```sh
npm i -DE @typescript-eslint/parser@8.46.2
```

File: [./package.json:22:3](./package.json)

### FN002033 css-loader | Required

Install SharePoint Framework dev dependency package css-loader

Execute the following command:

```sh
npm i -DE css-loader@7.1.2
```

File: [./package.json:22:3](./package.json)

### FN002034 @microsoft/spfx-heft-plugins | Required

Install SharePoint Framework dev dependency package @microsoft/spfx-heft-plugins

Execute the following command:

```sh
npm i -DE @microsoft/spfx-heft-plugins@1.22.0
```

File: [./package.json:22:3](./package.json)

### FN002035 @types/heft-jest | Required

Install SharePoint Framework dev dependency package @types/heft-jest

Execute the following command:

```sh
npm i -DE @types/heft-jest@1.0.2
```

File: [./package.json:22:3](./package.json)

### FN010001 .yo-rc.json version | Recommended

Update version in .yo-rc.json

```json
{
  "@microsoft/generator-sharepoint": {
    "version": "1.22.0"
  }
}
```

File: [./.yo-rc.json:7:5](./.yo-rc.json)

### FN010011 .yo-rc.json useGulp | Recommended

Update useGulp property in .yo-rc.json

```json
{
    "useGulp": false
}
```

File: [./.yo-rc.json:2:38](./.yo-rc.json)

### FN015005 src/index.ts | Required

Remove file src/index.ts

### FN015010 gulpfile.js | Required

Remove file gulpfile.js

### FN015011 tsconfig.json | Required

Add file tsconfig.json

```json
{
  "extends": "./node_modules/@microsoft/spfx-web-build-rig/profiles/default/tsconfig-base.json"
}
```

### FN015014 config/rig.json | Required

Add file config/rig.json

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json",
  "rigPackageName": "@microsoft/spfx-web-build-rig"
}
```

### FN015015 config/typescript.json | Required

Add file config/typescript.json

```json
{
  "extends": "@microsoft/spfx-web-build-rig/profiles/default/config/typescript.json",
  "staticAssetsToCopy": {
    "fileExtensions": [".resx", ".jpg", ".png", ".woff", ".eot", ".ttf", ".svg", ".gif"],
    "includeGlobs": ["webparts/*/loc/*.js"]
  }
}
```

### FN021001 main | Required

Remove package.json `main` property.

### FN021004 package.json scripts.build | Required

Update to: `heft test --clean --production && heft package-solution --production`

### FN021005 package.json scripts.test | Required

Remove scripts.test property.

### FN021006 package.json scripts.clean | Required

Update to: `heft clean`

### FN021007 package.json scripts.start | Required

Update to: `heft start --clean`

### FN021008 package.json scripts.eject-webpack | Required

Update to: `heft eject-webpack`

### FN021009 package.json overrides.@rushstack/heft | Required

Add: `"overrides": { "@rushstack/heft": "1.1.2" }`

### FN023003–FN023006 .gitignore | Required

Add: `lib-dts`, `lib-commonjs`, `lib-esm`, `jest-output`

### FN025002 .eslintrc.js — Add @rushstack/import-requires-chunk-name | Required

### FN025003 .eslintrc.js — Add @rushstack/pair-react-dom-render-unmount | Required

### FN025004 .eslintrc.js — Remove @microsoft/spfx/import-requires-chunk-name | Required

### FN025005 .eslintrc.js — Remove @microsoft/spfx/pair-react-dom-render-unmount | Required

### FN026001 sass.json schema | Required

Update to: `https://developer.microsoft.com/json-schemas/heft/v0/heft-sass-plugin.schema.json`

### FN026002 sass.json extends | Required

Add: `"extends": "@microsoft/spfx-web-build-rig/profiles/default/config/sass.json"`

### FN017001 npm dedupe | Optional

If build errors like `error TS2345: Argument of type 'SPHttpClientConfiguration' is not assignable...` appear, run `pnpm dedupe`.
