$ErrorActionPreference = 'Stop'
$body = @{ email='localadmin@example.com'; password='Admin123!' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:5001/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
Write-Output ($login | ConvertTo-Json -Depth 3)
