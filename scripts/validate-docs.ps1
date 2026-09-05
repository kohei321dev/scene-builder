[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$errors = [System.Collections.Generic.List[string]]::new()

$requiredFiles = @(
    'README.md',
    'AGENTS.md',
    'docs/README.md',
    'docs/product.md',
    'docs/requirements.md',
    'docs/specifications/README.md',
    'docs/architecture.md',
    'docs/security.md',
    'docs/decisions/README.md',
    'docs/decisions/TEMPLATE.md',
    'docs/process/development.md',
    'docs/process/documentation.md',
    'docs/process/release.md',
    'docs/operations/README.md',
    'docs/guides/README.md',
    '.github/pull_request_template.md',
    'LICENSE'
)

foreach ($relativePath in $requiredFiles) {
    $path = Join-Path $repositoryRoot $relativePath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $errors.Add("Required file is missing: $relativePath")
        continue
    }

    if ((Get-Item -LiteralPath $path).Length -eq 0) {
        $errors.Add("Required file is empty: $relativePath")
    }
}

$legacyPaths = @(
    'docs/product-brief.md',
    'docs/design.md',
    'docs/ADR.md',
    'docs/adr/'
)
$markdownFiles = Get-ChildItem -LiteralPath $repositoryRoot -Recurse -File -Filter '*.md' |
    Where-Object { $_.FullName -notmatch '[\\/]\.git[\\/]' }

foreach ($markdownFile in $markdownFiles) {
    $content = Get-Content -Raw -Encoding UTF8 -LiteralPath $markdownFile.FullName
    $relativePath = $markdownFile.FullName.Substring($repositoryRoot.Length).TrimStart([char]92, [char]47)

    foreach ($legacyPath in $legacyPaths) {
        if ($content.Contains($legacyPath)) {
            $errors.Add("Legacy path reference remains: $relativePath -> $legacyPath")
        }
    }

    foreach ($match in [regex]::Matches($content, '(?m)!?\[[^\]]*\]\(([^)]+)\)')) {
        $target = $match.Groups[1].Value.Trim()
        if ($target -match '^(?:https?://|mailto:|#)' -or $target -eq '') {
            continue
        }

        $targetWithoutFragment = ($target -split '#', 2)[0]
        if ($targetWithoutFragment -eq '') {
            continue
        }

        $decodedTarget = [System.Uri]::UnescapeDataString($targetWithoutFragment)
        $resolvedPath = Join-Path $markdownFile.DirectoryName $decodedTarget
        if (-not (Test-Path -LiteralPath $resolvedPath)) {
            $errors.Add("Internal link target is missing: $relativePath -> $target")
        }
    }
}

$decisionFiles = Get-ChildItem -LiteralPath (Join-Path $repositoryRoot 'docs/decisions') -File |
    Where-Object { $_.Name -match '^(\d{4})-.+\.md$' } |
    Sort-Object Name

if ($decisionFiles.Count -ne 17) {
    $errors.Add("Expected 17 Decision Records from 0001 through 0017: actual=$($decisionFiles.Count)")
}

$seenIds = @{}
$decisionIndex = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $repositoryRoot 'docs/decisions/README.md')
foreach ($decisionFile in $decisionFiles) {
    $id = [regex]::Match($decisionFile.Name, '^(\d{4})-').Groups[1].Value
    if ($seenIds.ContainsKey($id)) {
        $errors.Add("Duplicate Decision Record ID: $id")
    }
    $seenIds[$id] = $true

    $content = Get-Content -Raw -Encoding UTF8 -LiteralPath $decisionFile.FullName
    if ($content -notmatch "(?m)^# ADR(?:-|\s)$id(?:\D|$)") {
        $errors.Add("Decision Record heading does not match file ID: $($decisionFile.Name)")
    }
    if ($content -notmatch '(?m)^- Status:\s*\S+') {
        $errors.Add("Decision Record has no Status: $($decisionFile.Name)")
    }
    if (-not $decisionIndex.Contains($decisionFile.Name)) {
        $errors.Add("Decision Record is missing from index: $($decisionFile.Name)")
    }
}

$expectedIds = 1..17 | ForEach-Object { $_.ToString('0000') }
foreach ($expectedId in $expectedIds) {
    if (-not $seenIds.ContainsKey($expectedId)) {
        $errors.Add("Decision Record ID is missing: $expectedId")
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Documentation validation passed: $($requiredFiles.Count) required files, $($markdownFiles.Count) Markdown files, $($decisionFiles.Count) Decision Records."
