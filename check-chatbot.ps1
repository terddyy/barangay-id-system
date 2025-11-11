# Chatbot Health Check Script
# Run this to diagnose chatbot issues

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Barangay ID System - Chatbot Checker" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Backend Server
Write-Host "[1/5] Checking backend server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Backend server is running on port 3000" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Backend server is NOT running!" -ForegroundColor Red
    Write-Host "    → Start it with: cd backend; node server.js" -ForegroundColor Yellow
    exit 1
}

# Check 2: Chatbot Endpoint
Write-Host "[2/5] Checking chatbot endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/chatbot/health" -UseBasicParsing -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    if ($json.status -eq "operational") {
        Write-Host "  ✓ Chatbot endpoint is operational" -ForegroundColor Green
        Write-Host "    Model: $($json.model)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ✗ Chatbot endpoint is NOT responding!" -ForegroundColor Red
    Write-Host "    → Check if chatbot.js route is registered in server.js" -ForegroundColor Yellow
    exit 1
}

# Check 3: API Key Configuration
Write-Host "[3/5] Checking API key configuration..." -ForegroundColor Yellow
$envFile = ".\backend\.env"
$chatbotFile = ".\backend\routes\chatbot.js"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "GEMINI_API_KEY=(.+)") {
        $apiKey = $matches[1].Trim()
        if ($apiKey -eq "your_gemini_api_key_here" -or $apiKey.Length -lt 20) {
            Write-Host "  ⚠ API key found in .env but appears invalid" -ForegroundColor Yellow
            Write-Host "    → Get a valid key from: https://makersuite.google.com/app/apikey" -ForegroundColor Yellow
        } else {
            Write-Host "  ✓ API key configured in .env file" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠ .env file exists but no GEMINI_API_KEY found" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ No .env file found" -ForegroundColor Yellow
    Write-Host "    Checking chatbot.js for hardcoded key..." -ForegroundColor Cyan
    
    if (Test-Path $chatbotFile) {
        $chatbotContent = Get-Content $chatbotFile -Raw
        if ($chatbotContent -match 'GEMINI_API_KEY\s*=\s*[^"]*"([^"]+)"') {
            $hardcodedKey = $matches[1]
            if ($hardcodedKey.StartsWith("AIza")) {
                Write-Host "  ✓ API key found in chatbot.js" -ForegroundColor Green
            } else {
                Write-Host "  ⚠ API key in chatbot.js appears to be placeholder" -ForegroundColor Yellow
            }
        }
    }
}

# Check 4: Internet Connection
Write-Host "[4/5] Checking internet connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://generativelanguage.googleapis.com" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Can connect to Google Gemini API" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Cannot connect to Gemini API!" -ForegroundColor Red
    Write-Host "    → Check your internet connection" -ForegroundColor Yellow
    Write-Host "    → Check firewall settings" -ForegroundColor Yellow
}

# Check 5: Test Chatbot Message
Write-Host "[5/5] Testing chatbot with sample message..." -ForegroundColor Yellow
$testMessage = @{
    message = "Test"
    history = @()
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/chatbot/ask" `
        -Method Post `
        -ContentType "application/json" `
        -Body $testMessage `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "  ✓ Chatbot is working! Response received." -ForegroundColor Green
        Write-Host "    Sample: $($result.message.Substring(0, [Math]::Min(60, $result.message.Length)))..." -ForegroundColor Cyan
    } else {
        Write-Host "  ✗ Chatbot returned an error" -ForegroundColor Red
        Write-Host "    Error: $($result.error)" -ForegroundColor Yellow
    }
} catch {
    $errorMsg = $_.Exception.Message
    Write-Host "  ✗ Chatbot test failed!" -ForegroundColor Red
    
    if ($errorMsg -match "403") {
        Write-Host "    → API key is invalid or expired" -ForegroundColor Yellow
        Write-Host "    → Get new key: https://makersuite.google.com/app/apikey" -ForegroundColor Yellow
    } elseif ($errorMsg -match "429") {
        Write-Host "    → Rate limit exceeded (too many requests)" -ForegroundColor Yellow
        Write-Host "    → Wait 1 minute and try again" -ForegroundColor Yellow
    } else {
        Write-Host "    Error: $errorMsg" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Diagnosis Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick Fixes:" -ForegroundColor Yellow
Write-Host "  1. Get API key: https://makersuite.google.com/app/apikey" -ForegroundColor White
Write-Host "  2. Add to backend\.env or backend\routes\chatbot.js" -ForegroundColor White
Write-Host "  3. Restart backend: cd backend; node server.js" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - Quick Fix: QUICK_FIX_CHATBOT.md" -ForegroundColor White
Write-Host "  - Full Guide: CHATBOT_SETUP.md" -ForegroundColor White
Write-Host "  - Architecture: CHATBOT_ARCHITECTURE.md" -ForegroundColor White
Write-Host ""
