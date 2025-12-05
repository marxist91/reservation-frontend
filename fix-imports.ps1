# Script pour corriger tous les imports barrel exports vers des imports directs

Write-Host "Correction des imports en cours..." -ForegroundColor Green

Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $modified = $false
    
    # Correction des imports hooks
    if ($content -match "from ['`"]@/hooks/useAuth['`"]") {
        $content = $content -replace "from ['`"]@/hooks/useAuth['`"]", "from '@/hooks/useAuth'"
        $content = $content -replace "from '@/hooks/useAuth'", "from '@/hooks/useAuth.ts'"
        $content = $content -replace "from '@/hooks/useAuth.ts'", "from '@/hooks/useAuth'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/hooks/useRooms['`"]") {
        $content = $content -replace "from ['`"]@/hooks/useRooms['`"]", "from '@/hooks/useRooms'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/hooks/useReservations['`"]") {
        $content = $content -replace "from ['`"]@/hooks/useReservations['`"]", "from '@/hooks/useReservations'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/hooks/useUsers['`"]") {
        $content = $content -replace "from ['`"]@/hooks/useUsers['`"]", "from '@/hooks/useUsers'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/hooks/useInitializeNotifications['`"]") {
        $content = $content -replace "from ['`"]@/hooks/useInitializeNotifications['`"]", "from '@/hooks/useInitializeNotifications'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/hooks/useNotificationHistory['`"]") {
        $content = $content -replace "from ['`"]@/hooks/useNotificationHistory['`"]", "from '@/hooks/useNotificationHistory'"
        $modified = $true
    }
    
    # Correction des imports stores directs vers barrel export
    if ($content -match "from ['`"]@/store/authStore['`"]") {
        $content = $content -replace "from ['`"]@/store/authStore['`"]", "from '@/store'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/store/notificationStore['`"]") {
        $content = $content -replace "from ['`"]@/store/notificationStore['`"]", "from '@/store'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/store/historyStore['`"]") {
        $content = $content -replace "from ['`"]@/store/historyStore['`"]", "from '@/store'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/store/userStore['`"]") {
        $content = $content -replace "from ['`"]@/store/userStore['`"]", "from '@/store'"
        $modified = $true
    }
    
    # Correction des imports API
    if ($content -match "from ['`"]@/api/auth['`"]") {
        $content = $content -replace "from ['`"]@/api/auth['`"]", "from '@/api/auth'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/api/rooms['`"]") {
        $content = $content -replace "from ['`"]@/api/rooms['`"]", "from '@/api/rooms'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/api/reservations['`"]") {
        $content = $content -replace "from ['`"]@/api/reservations['`"]", "from '@/api/reservations'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/api/users['`"]") {
        $content = $content -replace "from ['`"]@/api/users['`"]", "from '@/api/users'"
        $modified = $true
    }
    if ($content -match "from ['`"]@/api/client['`"]") {
        $content = $content -replace "from ['`"]@/api/client['`"]", "from '@/api/client'"
        $modified = $true
    }
    
    if ($modified) {
        Set-Content $_.FullName -Value $content -NoNewline
        Write-Host "✓ $($_.FullName)" -ForegroundColor Cyan
    }
}

Write-Host "`nCorrection terminée!" -ForegroundColor Green
