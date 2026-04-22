param(
  [string]$ApiBase = "http://localhost:8000",
  [string]$TilesBase = "http://localhost:8080",
  [string]$FrontendBase = "http://localhost:5173"
)

$ErrorActionPreference = "Stop"

function Step([string]$name, [scriptblock]$action) {
  try {
    $result = & $action
    Write-Host "[OK] $name" -ForegroundColor Green
    if ($null -ne $result -and "$result".Trim() -ne "") {
      Write-Host "     $result"
    }
  } catch {
    Write-Host "[FAIL] $name" -ForegroundColor Red
    Write-Host "       $($_.Exception.Message)"
    exit 1
  }
}

function Require-JsonArray([object]$value, [string]$label) {
  if ($value -isnot [System.Array] -or $value.Count -eq 0) {
    throw "$label returned empty or non-array payload."
  }
}

Step "API health" {
  $health = Invoke-RestMethod -Uri "$ApiBase/health"
  if ($health.status -ne "ok") { throw "Unexpected /health payload: $($health | ConvertTo-Json -Compress)" }
  $health | ConvertTo-Json -Compress
}

Step "API available competencias" {
  $competencias = Invoke-RestMethod -Uri "$ApiBase/api/meta/available_competencias"
  Require-JsonArray $competencias "available_competencias"
  "count=$($competencias.Count) last=$($competencias[-1])"
}

Step "API available UFs" {
  $ufs = Invoke-RestMethod -Uri "$ApiBase/api/meta/available_ufs"
  Require-JsonArray $ufs "available_ufs"
  "values=$($ufs -join ',')"
}

Step "API dashboard summary" {
  $competencias = Invoke-RestMethod -Uri "$ApiBase/api/meta/available_competencias"
  $latest = $competencias[-1]
  $summary = Invoke-RestMethod -Uri "$ApiBase/api/dashboard/summary?uf=PR&competencia=$latest"
  if ($null -eq $summary.uf -or $null -eq $summary.competencia) {
    throw "Invalid summary payload: $($summary | ConvertTo-Json -Compress)"
  }
  "uf=$($summary.uf) competencia=$($summary.competencia) municipio_count=$($summary.municipio_count)"
}

Step "Tiles capabilities" {
  $caps = Invoke-RestMethod -Uri "$TilesBase/capabilities"
  if ($null -eq $caps.maps -or $caps.maps.Count -eq 0) {
    throw "No maps in capabilities."
  }
  "maps=$($caps.maps.Count)"
}

Step "Tiles endpoint" {
  $tile = curl.exe -s -o NUL -w "status=%{http_code} bytes=%{size_download}" "$TilesBase/maps/municipios/7/45/73.pbf"
  if ($tile -notmatch "status=200") { throw "Unexpected tile response: $tile" }
  $tile
}

Step "Frontend HTTP" {
  $front = curl.exe -s -o NUL -w "status=%{http_code}" "$FrontendBase"
  if ($front -notmatch "status=200") { throw "Unexpected frontend response: $front" }
  $front
}

Write-Host ""
Write-Host "Smoke check completed successfully." -ForegroundColor Green
