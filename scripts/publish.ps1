param(
  [string]$Message = "Update website content",
  [switch]$SkipCheck,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$GitCandidates = @(
  "D:\Tool\Git\cmd\git.exe",
  "git"
)

$Git = $null

foreach ($Candidate in $GitCandidates) {
  if ($Candidate -eq "git") {
    $Command = Get-Command git -ErrorAction SilentlyContinue
    if ($Command) {
      $Git = $Command.Source
      break
    }
  } elseif (Test-Path -LiteralPath $Candidate) {
    $Git = $Candidate
    break
  }
}

if (-not $Git) {
  throw "Git was not found. Install Git or update the path in scripts/publish.ps1."
}

function Invoke-Git {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$GitArgs
  )

  & $Git @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Git command failed: git $($GitArgs -join ' ')"
  }
}

Write-Host "Website folder: $Root"
Write-Host "Git: $Git"

if (-not $SkipCheck) {
  $Node = Get-Command node -ErrorAction SilentlyContinue
  if ($Node) {
    Write-Host "Checking content/site-content.js..."
    & $Node.Source --check "content/site-content.js"
    if ($LASTEXITCODE -ne 0) {
      throw "content/site-content.js has a syntax error. Fix it before publishing."
    }
  } else {
    Write-Host "Node.js was not found; skipping JavaScript syntax check."
  }
}

Write-Host "Current changes:"
Invoke-Git status --short

$Changes = & $Git status --porcelain
if (-not $Changes) {
  Write-Host "No changes to publish."
  exit 0
}

if ($DryRun) {
  Write-Host "Dry run complete. No files were committed or pushed."
  exit 0
}

Invoke-Git add .
Invoke-Git commit -m $Message
Invoke-Git push

Write-Host "Published. GitHub Pages may take 1-3 minutes to refresh."
