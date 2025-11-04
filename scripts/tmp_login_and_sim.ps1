$ErrorActionPreference = 'Stop'

$body = @{ email='localadmin@example.com'; password='Admin123!' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:5001/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
Write-Output "Login response:"
Write-Output ($login | ConvertTo-Json -Depth 3)

$token = $login.token
if (-not $token) { Write-Error "No token returned from login"; exit 1 }

$simBody = @{ count = 3 } | ConvertTo-Json
Write-Output "Calling simulate with token length: $($token.Length)"
$resp = Invoke-RestMethod -Uri 'http://localhost:5001/api/transactions/simulate' -Method Post -Body $simBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" }
Write-Output "Simulation response:"
Write-Output ($resp | ConvertTo-Json -Depth 5)
