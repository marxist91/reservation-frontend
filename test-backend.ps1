# Script de test du backend
# Usage: .\test-backend.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TEST DE CONNEXION BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend accessible
Write-Host "[1/4] Test de l'accessibilite du backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/healthcheck" -Method GET -ErrorAction Stop
    $health = $response.Content | ConvertFrom-Json
    Write-Host "[OK] Backend accessible (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "Service: $($health.service)" -ForegroundColor Gray
    Write-Host "Database: $($health.database)" -ForegroundColor Gray
} catch {
    Write-Host "[ERREUR] Backend NON accessible" -ForegroundColor Red
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION: Demarrez le backend Node.js" -ForegroundColor Yellow
    Write-Host "cd c:\xampp\htdocs\reservation-backend" -ForegroundColor Gray
    Write-Host ".\start-xampp.bat" -ForegroundColor Gray
    exit
}

Write-Host ""

# Test 2: Liste des utilisateurs
Write-Host "[2/4] Test de la base de donnees..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/healthcheck" -Method GET -ErrorAction Stop
    $health = $response.Content | ConvertFrom-Json
    Write-Host "[OK] Base de donnees accessible" -ForegroundColor Green
    Write-Host "Status: $($health.database)" -ForegroundColor Gray
} catch {
    Write-Host "[ERREUR] Erreur base de donnees" -ForegroundColor Red
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Creation d'un utilisateur de test
Write-Host "[3/4] Creation d'un utilisateur de test..." -ForegroundColor Yellow
$testUser = @{
    nom = "Test"
    prenom = "User"
    email = "test@example.com"
    password = "Test@123456"
    telephone = "0612345678"
} | ConvertTo-Json

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/register" -Method POST -Body $testUser -Headers $headers -ErrorAction Stop
    $result = $response.Content | ConvertFrom-Json
    Write-Host "[OK] Utilisateur cree avec succes" -ForegroundColor Green
    Write-Host "Email: test@example.com" -ForegroundColor Gray
    Write-Host "Mot de passe: Test@123456" -ForegroundColor Gray
} catch {
    $errorContent = $_.ErrorDetails.Message
    if ($errorContent -match "existe" -or $errorContent -match "already exists") {
        Write-Host "[INFO] Utilisateur existe deja (c'est normal)" -ForegroundColor Cyan
        Write-Host "Email: test@example.com" -ForegroundColor Gray
        Write-Host "Mot de passe: Test@123456" -ForegroundColor Gray
    } else {
        Write-Host "[ATTENTION] Erreur lors de la creation" -ForegroundColor Yellow
        Write-Host "Erreur: $errorContent" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Test de connexion
Write-Host "[4/4] Test de connexion avec l'utilisateur test..." -ForegroundColor Yellow
$loginData = @{
    email = "test@example.com"
    password = "Test@123456"
} | ConvertTo-Json

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/login" -Method POST -Body $loginData -Headers $headers -ErrorAction Stop
    $result = $response.Content | ConvertFrom-Json
    Write-Host "[OK] CONNEXION REUSSIE !" -ForegroundColor Green
    Write-Host "Token JWT: $($result.data.token.Substring(0,30))..." -ForegroundColor Gray
    Write-Host "Utilisateur: $($result.data.user.prenom) $($result.data.user.nom)" -ForegroundColor Gray
    Write-Host "Role: $($result.data.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "[ERREUR] ECHEC DE CONNEXION" -ForegroundColor Red
    Write-Host "Erreur: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vous pouvez maintenant tester sur le frontend avec:" -ForegroundColor Cyan
Write-Host "Email: test@example.com" -ForegroundColor White
Write-Host "Mot de passe: Test@123456" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
