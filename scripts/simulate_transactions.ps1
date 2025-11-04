# PowerShell helper to call the simulate transactions endpoint
param(
    [int]$Count = 1,
    [string]$Url = 'http://localhost:5000/api/transactions/simulate'
)

$body = @{ count = $Count } | ConvertTo-Json
try {
    $resp = Invoke-RestMethod -Uri $Url -Method Post -Body $body -ContentType 'application/json'
    Write-Host "Response:`n" ($resp | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Request failed: $_"
}
