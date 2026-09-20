#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$Host.UI.RawUI.WindowTitle = 'Metal Music 2 - frontend + music + users'

function Resolve-Executable {
    param([string]$Name)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Write-Host "Nie znaleziono '$Name' w PATH. Zainstaluj je i sprobuj ponownie." -ForegroundColor Red
        exit 1
    }
    return $cmd.Source
}

function Resolve-Php {
    $candidates = @(
        'G:\xampp\php\php.exe',
        'C:\xampp\php\php.exe',
        (Join-Path ${env:ProgramFiles} 'xampp\php\php.exe')
    )
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) {
            $modules = & $candidate -m 2>$null
            if ($modules -match 'pdo_mysql') {
                return $candidate
            }
        }
    }

    $php = Resolve-Executable 'php.exe'
    $modules = & $php -m 2>$null
    if ($modules -notmatch 'pdo_mysql') {
        Write-Host "UWAGA: PHP nie ma rozszerzenia pdo_mysql. music-repository nie polaczy sie z MySQL." -ForegroundColor Yellow
    }
    return $php
}

$php = Resolve-Php
$phpExtDir = Join-Path (Split-Path -Parent $php) 'ext'
$phpIniOverride = "-d `"extension_dir=$phpExtDir`""
$npmCmd = Get-Command 'npm.cmd' -ErrorAction SilentlyContinue
if (-not $npmCmd) { $npmCmd = Get-Command 'npm' -ErrorAction SilentlyContinue }
if (-not $npmCmd) {
    Write-Host "Nie znaleziono 'npm' w PATH. Zainstaluj Node.js i sprobuj ponownie." -ForegroundColor Red
    exit 1
}

$queue = New-Object 'System.Collections.Concurrent.ConcurrentQueue[object]'
$script:managed = New-Object System.Collections.ArrayList

function Start-LoggedProcess {
    param(
        [string]$Name,
        [ConsoleColor]$Color,
        [string]$WorkingDirectory,
        [string]$FileName,
        [string]$Arguments
    )

    if (-not (Test-Path -LiteralPath $WorkingDirectory)) {
        throw "Brak katalogu: $WorkingDirectory"
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $FileName
    $psi.Arguments = $Arguments
    $psi.WorkingDirectory = $WorkingDirectory
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    $proc.EnableRaisingEvents = $true

    $payload = @{
        Name  = $Name
        Color = $Color
        Queue = $queue
    }

    $action = {
        if (-not [string]::IsNullOrEmpty($EventArgs.Data)) {
            $Event.MessageData.Queue.Enqueue([pscustomobject]@{
                Name  = $Event.MessageData.Name
                Color = $Event.MessageData.Color
                Line  = $EventArgs.Data
            })
        }
    }

    $null = Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action $action -MessageData $payload
    $null = Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived  -Action $action -MessageData $payload

    [void]$proc.Start()
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()

    [void]$script:managed.Add([pscustomobject]@{
        Name      = $Name
        Color     = $Color
        Process   = $proc
        Reported  = $false
    })
}

function Stop-ProcessTree {
    param([int]$ProcessId)
    if ($ProcessId -le 0) { return }
    & taskkill.exe /PID $ProcessId /T /F 2>$null | Out-Null
}

function Stop-All {
    foreach ($entry in $script:managed) {
        if ($entry.Process -and -not $entry.Process.HasExited) {
            Stop-ProcessTree -ProcessId $entry.Process.Id
        }
    }
    Get-EventSubscriber -ErrorAction SilentlyContinue | Unregister-Event -ErrorAction SilentlyContinue
}

$userRouter = Join-Path $Root 'user-backend\vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php'

Write-Host ''
Write-Host '  Metal Music 2' -ForegroundColor White
Write-Host '  -------------'
Write-Host '  frontend          ' -NoNewline; Write-Host 'npm run dev' -ForegroundColor Cyan -NoNewline; Write-Host '            http://localhost:5173'
Write-Host '  music-repository  ' -NoNewline; Write-Host 'php -S localhost:8080' -ForegroundColor Green -NoNewline; Write-Host '  http://localhost:8080'
Write-Host '  user-backend      ' -NoNewline; Write-Host 'php -S localhost:8081' -ForegroundColor Yellow -NoNewline; Write-Host '  http://localhost:8081'
Write-Host ("  PHP               {0}" -f $php) -ForegroundColor DarkGray
Write-Host ''
Write-Host '  Ctrl+C zatrzymuje wszystkie trzy procesy.' -ForegroundColor DarkGray
Write-Host ''

try {
    Start-LoggedProcess -Name 'frontend' -Color Cyan -WorkingDirectory (Join-Path $Root 'frontend') `
        -FileName 'cmd.exe' -Arguments '/c npm run dev'

    Start-LoggedProcess -Name 'music' -Color Green -WorkingDirectory (Join-Path $Root 'music-repository') `
        -FileName $php -Arguments "$phpIniOverride -S localhost:8080 -t public server.php"

    Start-LoggedProcess -Name 'users' -Color Yellow -WorkingDirectory (Join-Path $Root 'user-backend\public') `
        -FileName $php -Arguments ("{0} -S localhost:8081 `"{1}`"" -f $phpIniOverride, $userRouter)

    $childPids = @($script:managed | ForEach-Object { $_.Process.Id })
    $null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -MessageData $childPids -Action {
        foreach ($childPid in $Event.MessageData) {
            & taskkill.exe /PID $childPid /T /F 2>$null | Out-Null
        }
    }

    $item = $null
    while ($true) {
        while ($queue.TryDequeue([ref]$item)) {
            Write-Host ('[{0,-8}] ' -f $item.Name) -ForegroundColor $item.Color -NoNewline
            Write-Host $item.Line
        }

        foreach ($entry in $script:managed) {
            if ($entry.Process.HasExited -and -not $entry.Reported) {
                $entry.Reported = $true
                Write-Host ('[{0,-8}] proces zakonczony (kod {1})' -f $entry.Name, $entry.Process.ExitCode) -ForegroundColor Red
            }
        }

        $alive = @($script:managed | Where-Object { -not $_.Process.HasExited })
        if ($alive.Count -eq 0) {
            Write-Host 'Wszystkie procesy zakonczyly dzialanie.' -ForegroundColor DarkGray
            break
        }

        Start-Sleep -Milliseconds 80
    }
}
finally {
    Stop-All
}
