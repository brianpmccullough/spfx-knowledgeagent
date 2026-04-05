# Upgrade project spfx-knowledgeagent-client-side-solution to v1.22.2

Date: 4/4/2026

## Findings

Following is the list of steps required to upgrade your project to SharePoint Framework version 1.22.2. [Summary](#Summary) of the modifications is included at the end of the report.

### FN001001 @microsoft/sp-core-library | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-core-library

Execute the following command:

```sh
npm i -SE @microsoft/sp-core-library@1.22.2
```

File: [./package.json:18:5](./package.json)

### FN001011 @microsoft/sp-dialog | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-dialog

Execute the following command:

```sh
npm i -SE @microsoft/sp-dialog@1.22.2
```

File: [./package.json:19:5](./package.json)

### FN001012 @microsoft/sp-application-base | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-application-base

Execute the following command:

```sh
npm i -SE @microsoft/sp-application-base@1.22.2
```

File: [./package.json:17:5](./package.json)

### FN001013 @microsoft/decorators | Required

Upgrade SharePoint Framework dependency package @microsoft/decorators

Execute the following command:

```sh
npm i -SE @microsoft/decorators@1.22.2
```

File: [./package.json:16:5](./package.json)

### FN002002 @microsoft/sp-module-interfaces | Required

Upgrade SharePoint Framework dev dependency package @microsoft/sp-module-interfaces

Execute the following command:

```sh
npm i -DE @microsoft/sp-module-interfaces@1.22.2
```

File: [./package.json:25:5](./package.json)

### FN002022 @microsoft/eslint-plugin-spfx | Required

Upgrade SharePoint Framework dev dependency package @microsoft/eslint-plugin-spfx

Execute the following command:

```sh
npm i -DE @microsoft/eslint-plugin-spfx@1.22.2
```

File: [./package.json:24:5](./package.json)

### FN002023 @microsoft/eslint-config-spfx | Required

Upgrade SharePoint Framework dev dependency package @microsoft/eslint-config-spfx

Execute the following command:

```sh
npm i -DE @microsoft/eslint-config-spfx@1.22.2
```

File: [./package.json:23:5](./package.json)

### FN002030 @microsoft/spfx-web-build-rig | Required

Upgrade SharePoint Framework dev dependency package @microsoft/spfx-web-build-rig

Execute the following command:

```sh
npm i -DE @microsoft/spfx-web-build-rig@1.22.2
```

File: [./package.json:27:5](./package.json)

### FN002034 @microsoft/spfx-heft-plugins | Required

Upgrade SharePoint Framework dev dependency package @microsoft/spfx-heft-plugins

Execute the following command:

```sh
npm i -DE @microsoft/spfx-heft-plugins@1.22.2
```

File: [./package.json:26:5](./package.json)

### FN010001 .yo-rc.json version | Recommended

Update version in .yo-rc.json

```json
{
  "@microsoft/generator-sharepoint": {
    "version": "1.22.2"
  }
}
```

File: [./.yo-rc.json:7:5](./.yo-rc.json)

### FN017001 Run npm dedupe | Optional

If, after upgrading npm packages, when building the project you have errors similar to: "error TS2345: Argument of type 'SPHttpClientConfiguration' is not assignable to parameter of type 'SPHttpClientConfiguration'", try running 'npm dedupe' to cleanup npm packages.

Execute the following command:

```sh
npm dedupe
```

File: [./package.json](./package.json)

## Summary

### Execute script

```sh
npm i -SE @microsoft/sp-core-library@1.22.2 @microsoft/sp-dialog@1.22.2 @microsoft/sp-application-base@1.22.2 @microsoft/decorators@1.22.2
npm i -DE @microsoft/sp-module-interfaces@1.22.2 @microsoft/eslint-plugin-spfx@1.22.2 @microsoft/eslint-config-spfx@1.22.2 @microsoft/spfx-web-build-rig@1.22.2 @microsoft/spfx-heft-plugins@1.22.2
npm dedupe
```

### Modify files

#### [./.yo-rc.json](./.yo-rc.json)

Update version in .yo-rc.json:

```json
{
  "@microsoft/generator-sharepoint": {
    "version": "1.22.2"
  }
}
```
