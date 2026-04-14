$repo = 'C:/Users/hp/OneDrive/Desktop/Projects/Beautify-Africa'
$targetCommits = 40

$statusLines = git -C $repo status --porcelain
$files = @()
foreach ($line in $statusLines) {
  if ($line -match '^\s*[MADRCU\?]{1,2}\s+(.+)$') {
    $files += $matches[1]
  }
}

$files = $files | Sort-Object -Unique
$n = $files.Count

if ($n -lt $targetCommits) {
  throw "Cannot create $targetCommits commits from only $n changed files."
}
if ($n -gt ($targetCommits * 3)) {
  throw "Cannot fit $n files into $targetCommits commits with max 3 files per commit."
}

function Get-Category([string]$path) {
  switch -Regex ($path) {
    '^Back-End/config/' { 'backend-config'; break }
    '^Back-End/controllers/' { 'backend-controllers'; break }
    '^Back-End/middlewares/' { 'backend-middlewares'; break }
    '^Back-End/models/' { 'backend-models'; break }
    '^Back-End/queues/' { 'backend-queues'; break }
    '^Back-End/routes/' { 'backend-routes'; break }
    '^Back-End/services/' { 'backend-services'; break }
    '^Back-End/tests/' { 'backend-tests'; break }
    '^Back-End/utils/' { 'backend-utils'; break }
    '^Back-End/workers/' { 'backend-workers'; break }
    '^Back-End/package' { 'backend-deps'; break }
    '^Back-End/server\.js$' { 'backend-server'; break }
    '^Back-End/\.env\.example$' { 'backend-env-template'; break }
    '^Front-End/src/Components/AdminOrders/' { 'frontend-admin-orders'; break }
    '^Front-End/src/Components/AdminProducts/' { 'frontend-admin-products'; break }
    '^Front-End/src/Components/Cart/' { 'frontend-cart'; break }
    '^Front-End/src/Components/Home/' { 'frontend-home'; break }
    '^Front-End/src/Components/Profile/' { 'frontend-profile'; break }
    '^Front-End/src/Components/Shared/' { 'frontend-shared'; break }
    '^Front-End/src/Components/Shop/' { 'frontend-shop'; break }
    '^Front-End/src/Components/Tracking/' { 'frontend-tracking'; break }
    '^Front-End/src/context/' { 'frontend-context'; break }
    '^Front-End/src/data/' { 'frontend-data'; break }
    '^Front-End/src/hooks/' { 'frontend-hooks'; break }
    '^Front-End/src/services/' { 'frontend-services'; break }
    '^Front-End/src/assets/' { 'frontend-assets'; break }
    '^Front-End/src/utils/' { 'frontend-utils'; break }
    '^Front-End/src/App\.jsx$' { 'frontend-app'; break }
    '^Front-End/index\.html$' { 'frontend-html'; break }
    '^Front-End/nginx\.conf$' { 'frontend-nginx'; break }
    '^Front-End/vercel\.json$' { 'frontend-vercel'; break }
    '^docker-compose\.yml$' { 'infra-docker-compose'; break }
    default { 'misc'; break }
  }
}

$entries = foreach ($f in $files) {
  [pscustomobject]@{
    Path = $f
    Category = Get-Category $f
  }
}

$entries = $entries | Sort-Object Category, Path

# Build exact group sizes for 40 commits with max 3 files/commit
$sizes = @()
if ($n -ge ($targetCommits * 2)) {
  for ($i = 0; $i -lt $targetCommits; $i++) { $sizes += 2 }
  $extra = $n - ($targetCommits * 2)
  for ($i = 0; $i -lt $extra; $i++) { $sizes[$i] = $sizes[$i] + 1 }
} else {
  for ($i = 0; $i -lt $targetCommits; $i++) { $sizes += 1 }
  $extra = $n - $targetCommits
  for ($i = 0; $i -lt $extra; $i++) { $sizes[$i] = $sizes[$i] + 1 }
}

$cursor = 0
for ($i = 0; $i -lt $targetCommits; $i++) {
  $take = $sizes[$i]
  $group = $entries[$cursor..($cursor + $take - 1)]
  $cursor += $take

  $paths = @($group | ForEach-Object { $_.Path })
  $categoryCounts = $group | Group-Object Category | Sort-Object @(
    @{ Expression = 'Count'; Descending = $true },
    @{ Expression = 'Name'; Descending = $false }
  )
  $dominantCategory = $categoryCounts[0].Name

  $msg = "chore(batch $($i + 1)/40): $dominantCategory updates ($($paths.Count) files)"

  git -C $repo add -- $paths
  if ($LASTEXITCODE -ne 0) {
    throw "git add failed on batch $($i + 1)."
  }

  git -C $repo commit -m $msg
  if ($LASTEXITCODE -ne 0) {
    throw "git commit failed on batch $($i + 1)."
  }
}

if ($cursor -ne $n) {
  throw "Internal batching mismatch: consumed $cursor of $n files."
}

Write-Output "Created $targetCommits commits across $n files."
