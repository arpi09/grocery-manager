# Applies user profile feature files. Run from repo root: pwsh ./scripts/apply-user-profile.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path "$root/package.json")) { $root = Split-Path $PSScriptRoot -Parent }
Set-Location $root

New-Item -ItemType Directory -Force -Path "src/routes/profile" | Out-Null

@'
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "display_name" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "avatar_url" text;
'@ | Set-Content "drizzle/0004_user_profile.sql" -Encoding utf8

Write-Host "Profile feature script placeholder - run agent to complete file writes"
