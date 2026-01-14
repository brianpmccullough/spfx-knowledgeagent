# https://laurakokkarinen.com/managing-sharepoint-framework-api-permissions-with-powershell/
$resourceAppIds = @("d93c7720-43a9-4924-99c5-68464eb75b20") # This GUID is for Microsoft Graph; can also be custom API Client ID(s).

$spfxAppId = "08e18876-6177-487e-b8b5-cf950c1e598c" # SharePoint Online Web Client Extensibility
$resourceGrant = $null

# Prompt to install the required modules if not yet installed
if ($null -eq (Get-Module -ListAvailable -Name Microsoft.Graph.Applications) -or $null -eq (Get-Module -ListAvailable -Name Microsoft.Graph.Identity.SignIns)) {
  $response = Read-Host -Prompt "Running this script requires Microsoft.Graph modules that are not yet installed. Install now? (Y/N)"
  if ($response -eq "Y") {
    if ($null -eq (Get-Module -ListAvailable -Name Microsoft.Graph.Applications)) {
      Install-Module -Name Microsoft.Graph.Applications -Scope CurrentUser -Force -AllowClobber
    }
    if ($null -eq (Get-Module -ListAvailable -Name Microsoft.Graph.Identity.SignIns)) {
      Install-Module -Name Microsoft.Graph.Identity.SignIns -Scope CurrentUser -Force -AllowClobber
    }
  }
  else {
    Write-Host "The script cannot continue without the Microsoft.Graph modules. Exiting."
    exit
  }
}

Connect-MgGraph -Scopes "Application.ReadWrite.All", "Directory.ReadWrite.All" -NoWelcome

try {
  foreach ($resourceAppId in $resourceAppIds) {
    # Get the SPFx Service Principal
    $spfx = Get-MgServicePrincipal -Filter "appid eq '$spfxAppId'" -ErrorAction Stop
    # Get the endpoint service princpal (required to identify the object ID)
    $resource = Get-MgServicePrincipal -Filter "appid eq '$resourceAppId'" -ErrorAction Stop

    # Get the scopes granted for the endpoint
    $spfxGrants = Get-MgServicePrincipalOauth2PermissionGrant -ServicePrincipalId $spfx.Id -ErrorAction Stop
    foreach ($spfxGrant in $spfxGrants) {
      if ($spfxGrant.ResourceId -eq $resource.Id) {
        $resourceGrant = $spfxGrant
        break
      }
    }
    if ($null -ne $resourceGrant -and $resourceGrant.Scope.Length -gt 0) {
      Write-Host "The following scopes have been granted for app $($resource.DisplayName) ($resourceAppId): $($resourceGrant.Scope -replace ' ', ', ')."
    }      
    else {
      Write-Host "No scopes have been granted for app $($resource.DisplayName) ($resourceAppId)."
    }  
  }
}
catch {
  Write-Host "The following error occurred: $_.Exception" -ForegroundColor Red
}
finally {
  $_ = Disconnect-MgGraph # Assigning the output to a variable hides it from the terminal
  Write-Host "Command completed."
}