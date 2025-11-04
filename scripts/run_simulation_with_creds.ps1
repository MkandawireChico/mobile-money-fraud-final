# scripts/run_simulation_with_creds.ps1
# Logs in and calls the simulate endpoint. Use only for local testing.

$apiBase = "http://localhost:5001" # Use port 5001 to avoid conflicts if 5000 is in use
$email = 'chicomkandawire@gmail.com'
$password = 'Mkanda1.'

try {
    Write-Host "Attempting login for $email to $apiBase/api/auth/login"
    $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$apiBase/api/auth/login" -Method Post -Body $loginBody -ContentType 'application/json'
    if (-not $login.token) {
        Write-Error "Login did not return a token. Response: $($login | ConvertTo-Json -Depth 5)"
        exit 1
    }
    $token = $login.token
    Write-Host "Login succeeded. Token length: $($token.Length) (token redacted)"

    # Call simulate with count=3
    $body = @{ count = 3 } | ConvertTo-Json
    Write-Host "Calling simulate endpoint..."
    $resp = Invoke-RestMethod -Uri "$apiBase/api/transactions/simulate" -Method Post -Body $body -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" }

    Write-Host "Simulation response (truncated):"
    $out = $resp | ConvertTo-Json -Depth 5
    Write-Host $out

} catch {
    Write-Error "Error during simulation: $_"
    exit 2
}
