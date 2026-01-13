**Overview**: PowerShell scripts for building, deploying, and tearing down the AWS Lambda were moved into `aws/scripts/` to keep automation organized.

**How to run** (PowerShell Core recommended):

- Build the Lambda:
  - `pwsh ./aws/scripts/build.ps1 -Environment prod`

- Deploy the stack:
  - `pwsh ./aws/scripts/deploy.ps1 -Environment prod`

- Tear down the stack:
  - `pwsh ./aws/scripts/teardown.ps1 -Environment prod -Force`

**Contributing**:
- NEVER abbreviate variable names.
- PowerShell: use full cmdlet names; powershell 7.x compatible.

**Notes**:
- The deploy/teardown scripts use `AWS.Tools.*` PowerShell modules (installed to the current user scope if missing). They will prompt or fail if the PowerShell Gallery is unreachable.
- You still need valid AWS credentials available to the AWS SDK (environment variables, shared credentials file, AWS SSO, etc.).
- If you previously invoked `./deploy.ps1` from the `aws/` folder, update tooling/CI to call the new `aws/scripts/*.ps1` paths.

If you want, I can:
- Add `AWS.Tools.SecretsManager` to the auto-install list and add helper functions to create/read secrets.
- Update CI/README and any references elsewhere in the repo to point to the new script paths.