$filePath = "app\companies\[id]\page.tsx"
$content = Get-Content $filePath -Raw

# Replace all "client." with "company."
$content = $content -replace '\bclient\.', 'company.'

# Replace all standalone "client" with "company" (but not as part of other words)
$content = $content -replace '\bclient\b', 'company'

Set-Content $filePath $content -NoNewline
Write-Host "✅ Fixed all client references to company"
