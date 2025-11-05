<#
PowerShell helper: trigger-render-deploy.ps1
Usage: Run this locally. It will prompt for your Render API key and service IDs.
It triggers deploys for backend and frontend and polls each deploy until success/failure.

Do NOT paste secrets into chat. Run this script locally where you keep your Render key.
#>

param(
    [string]$RenderApiKey,
    [string]$BackendServiceId,
    [string]$FrontendServiceId
)

function Read-SecretIfEmpty([string]$value, [string]$prompt) {
    if ([string]::IsNullOrWhiteSpace($value)) {
        return Read-Host -AsSecureString -Prompt $prompt | ConvertFrom-SecureString
    }
    return $value
}

# Helper to call Render and return parsed JSON
function Invoke-RenderApi($method, $url, $body) {
    $headers = @{ Authorization = "Bearer $RenderApiKey"; 'Content-Type' = 'application/json' }

    if ($method -eq 'POST') {
        $resp = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $body -ErrorAction Stop
    } else {
        $resp = Invoke-RestMethod -Method Get -Uri $url -Headers $headers -ErrorAction Stop
    }
    return $resp
}

if (-not $RenderApiKey) {
    $secure = Read-Host -AsSecureString -Prompt "Enter your Render API Key (it will be read securely)"
    $RenderApiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

if (-not $BackendServiceId -and -not $FrontendServiceId) {
    Write-Host "You can provide Backend and/or Frontend service IDs. If you don't have them, open Render -> service -> copy the 'srv-...' id from the URL." -ForegroundColor Yellow
}

if (-not $BackendServiceId) { $BackendServiceId = Read-Host "Enter Backend service ID (or leave empty)" }
if (-not $FrontendServiceId) { $FrontendServiceId = Read-Host "Enter Frontend service ID (or leave empty)" }

function Trigger-And-Poll($serviceId, $name) {
    if ([string]::IsNullOrWhiteSpace($serviceId)) { return }
    Write-Host "Triggering deploy for $name ($serviceId)..."
    $url = "https://api.render.com/v1/services/$serviceId/deploys"
    $body = '{"clearCache": true}'

    try {
        $resp = Invoke-RenderApi -method POST -url $url -body $body
    } catch {
        Write-Error "Failed to trigger deploy for $name: $($_.Exception.Message)"
        return 1
    }

    $deployId = $resp.id
    if (-not $deployId) { Write-Error "No deploy id returned for $name"; return 1 }
    Write-Host "$name deploy id: $deployId"

    # Poll
    for ($i=0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 5
        try {
            $statusResp = Invoke-RenderApi -method GET -url "https://api.render.com/v1/services/$serviceId/deploys/$deployId" -body $null
        } catch {
            Write-Warning "Failed to fetch deploy status: $($_.Exception.Message)"
            continue
        }
        $state = $statusResp.state
        Write-Host "[$name] poll #$($i+1) - state=$state"
        if ($state -eq 'success') { Write-Host "$name deploy succeeded"; return 0 }
        if ($state -eq 'failed') { Write-Error "$name deploy failed"; return 1 }
    }
    Write-Error "$name deploy timed out"
    return 1
}

$overallSuccess = $true
if ($BackendServiceId) {
    $res = Trigger-And-Poll -serviceId $BackendServiceId -name 'backend'
    if ($res -ne 0) { $overallSuccess = $false }
}
if ($FrontendServiceId) {
    $res = Trigger-And-Poll -serviceId $FrontendServiceId -name 'frontend'
    if ($res -ne 0) { $overallSuccess = $false }
}

if ($overallSuccess) { Write-Host "All triggered deploys completed successfully" -ForegroundColor Green } else { Write-Error "One or more deploys failed or timed out" }
