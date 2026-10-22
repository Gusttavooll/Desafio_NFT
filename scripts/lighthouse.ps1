param(
  [string]$BaseUrl = 'http://127.0.0.1:5241',
  [string]$ChromePath = '',
  [string]$DetailPath = '',
  [string]$OutputDirectory = '',
  [switch]$SummarizeOnly
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$config = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'lighthouse.config.json') -Raw | ConvertFrom-Json
if ($DetailPath) { $config.pages.detail = $DetailPath }
if (!$OutputDirectory) { $OutputDirectory = Join-Path $repo ('lighthouse-reports/' + (Get-Date -Format 'yyyyMMdd-HHmmss')) }
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
$null = New-Item -ItemType Directory -Path $OutputDirectory -Force
$origin = [Uri]$BaseUrl
if ($origin.Scheme -notin @('http', 'https')) { throw 'BaseUrl must use HTTP(S).' }
if ($ChromePath) {
  if (!(Test-Path -LiteralPath $ChromePath -PathType Leaf)) { throw 'ChromePath does not exist.' }
  $env:CHROME_PATH = [IO.Path]::GetFullPath($ChromePath)
}
# Runs are sequential: do not run this while Playwright or another benchmark is active.
if (!$SummarizeOnly) {
  $version = (& npx --yes $config.cli --version | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) { throw 'Could not resolve Lighthouse CLI.' }
  [ordered]@{ startedAt = (Get-Date).ToUniversalTime().ToString('o'); baseUrl = $BaseUrl; lighthouse = $version; node = (& node --version); os = [Environment]::OSVersion.VersionString; chromePath = $env:CHROME_PATH; config = $config } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'environment.json') -Encoding utf8
  foreach ($page in $config.pages.PSObject.Properties) {
    $url = [Uri]::new($origin, [string]$page.Value).AbsoluteUri
    foreach ($profile in $config.profiles) {
      for ($run = 1; $run -le $config.runs; $run++) {
        $outputBase = Join-Path $OutputDirectory "$($page.Name)-$profile-$run"
        $arguments = @('--yes', $config.cli, $url, '--quiet', '--only-categories=performance,accessibility,best-practices,seo', '--output=html', '--output=json', "--output-path=$outputBase", '--chrome-flags=--headless --disable-dev-shm-usage', '--max-wait-for-load=60000')
        if ($profile -eq 'desktop') { $arguments += '--preset=desktop' }
        Write-Host "Lighthouse $($page.Name) / $profile / $run of $($config.runs)"
        & npx @arguments
        if ($LASTEXITCODE -ne 0) { throw "Lighthouse failed: $outputBase" }
      }
    }
  }
}
$rows = @()
$failed = $false
foreach ($page in $config.pages.PSObject.Properties) {
  foreach ($profile in $config.profiles) {
    $reports = @(for ($run = 1; $run -le $config.runs; $run++) {
      $path = Join-Path $OutputDirectory "$($page.Name)-$profile-$run.report.json"
      $report = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
      if ($report.runtimeError) { throw "Invalid run ${path}: $($report.runtimeError.message)" }
      if ($report.requestedUrl -ne [Uri]::new($origin, [string]$page.Value).AbsoluteUri) { throw "Unexpected URL in $path" }
      $report
    })
    $scores = [ordered]@{}
    foreach ($category in $config.thresholds.PSObject.Properties) {
      $values = @($reports | ForEach-Object {
        $score = $_.categories.($category.Name).score
        if ($null -eq $score) { throw "Missing category $($category.Name)." }
        [double]$score * 100
      } | Sort-Object)
      $median = $values[[int][Math]::Floor($values.Count / 2)]
      $scores[$category.Name] = $median
      if ($median -lt $category.Value) { $failed = $true }
    }
    $rows += [ordered]@{ page = $page.Name; profile = $profile; medians = $scores }
  }
}
[ordered]@{ generatedAt = (Get-Date).ToUniversalTime().ToString('o'); baseUrl = $BaseUrl; runs = $config.runs; thresholds = $config.thresholds; passed = !$failed; results = $rows } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'summary.json') -Encoding utf8
$markdown = @('# Lighthouse — mediana de três execuções', '', "Origem medida: $BaseUrl. Relatórios HTML/JSON e ambiente no diretório desta execução.", '', '| Página | Perfil | Performance ≥90 | Acessibilidade ≥95 | Boas práticas ≥95 | SEO ≥90 |', '|---|---|---:|---:|---:|---:|')
foreach ($row in $rows) { $markdown += "| $($row.page) | $($row.profile) | $($row.medians.performance) | $($row.medians.accessibility) | $($row.medians['best-practices']) | $($row.medians.seo) |" }
$markdown += @('', $(if ($failed) { 'Resultado: há metas do PRD não atingidas.' } else { 'Resultado: todas as medianas atingiram as metas do PRD.' }), '', 'Medição de preview local do build; não comprova latência da URL pública. Não executar em paralelo com testes de navegador. Versão do Chrome, user agent e configurações efetivas constam em cada JSON; a versão do Lighthouse e o ambiente constam em environment.json.')
$markdown | Set-Content -LiteralPath (Join-Path $OutputDirectory 'summary.md') -Encoding utf8
Write-Host "Summary: $(Join-Path $OutputDirectory 'summary.md')"
if ($failed) { exit 2 }
