# https://laurakokkarinen.com/managing-sharepoint-framework-api-permissions-with-powershell/
$resourceAppIds = @("d93c7720-43a9-4924-99c5-68464eb75b20") # This GUID is for custom API Client ID(s).  Could also be for the Graph ("00000003-0000-0000-c000-000000000000").
$scopes = @("user_impersonation") # E.g., "user_impersonation" for a custom API

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

    foreach ($scope in $scopes) {
      # Get the scopes granted for the endpoint
      $spfxGrants = Get-MgServicePrincipalOauth2PermissionGrant -ServicePrincipalId $spfx.Id -ErrorAction Stop
      foreach ($spfxGrant in $spfxGrants) {
        if ($spfxGrant.ResourceId -eq $resource.Id) {
          $resourceGrant = $spfxGrant
          break
        }
      }
      # If some scopes have already been granted for the endpoint, we check if the scope we are about to add already exists there
      if ($null -ne $resourceGrant) {
        if ($resourceGrant.Scope | Select-String $scope -Quiet ) {
          Write-Host "Scope $scope has already been granted for app $($resource.DisplayName) ($resourceAppId)."
          continue
        }
        # The scope does not yet exist; add it to the property and update it
        $resourceGrant.Scope += " $scope"
        Update-MgOauth2PermissionGrant -OAuth2PermissionGrantId $resourceGrant.Id -Scope $resourceGrant.Scope -ErrorAction Stop | Out-Null
      }      
      # Otherwise, create a new object with the scope 
      else {
        $params = @{
          "clientId"    = $spfx.id
          "consentType" = "AllPrincipals"
          "resourceId"  = $resource.id
          "scope"       = $scope
        }
        New-MgOauth2PermissionGrant -BodyParameter $params -ErrorAction Stop | Out-Null
      }
      Write-Host "Scope $scope granted for app $($resource.DisplayName) ($resourceAppId)."
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