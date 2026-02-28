$files = git status -s -uall | ForEach-Object { $_.Substring(3).Trim() }
if ($files.Length -eq 0) { exit }

# We want 26 commits. We will chunk the array.
$totalFiles = $files.Length
$numCommits = 26
$chunkSize = [Math]::Floor($totalFiles / $numCommits)
$remainder = $totalFiles % $numCommits

$currentIndex = 0

for ($i = 0; $i -lt $numCommits; $i++) {
    $currentChunkSize = $chunkSize
    if ($i -lt $remainder) {
        $currentChunkSize++
    }
    
    $chunkFiles = $files[$currentIndex..($currentIndex + $currentChunkSize - 1)]
    $currentIndex += $currentChunkSize
    
    foreach ($f in $chunkFiles) {
        # git add each file carefully
        git add "`"$f`""
    }
    
    # Generate a message based on the first file in the chunk
    $sampleFile = $chunkFiles[0]
    $commitMsg = "chore: update project structure and configuration"
    
    if ($sampleFile -match "Front-End") {
        $commitMsg = "refactor: migrate application sources to Front-End architecture ($($i+1)/$numCommits)"
    } elseif ($sampleFile -match "src/Components") {
        $commitMsg = "refactor(components): reorganize UI composition and hierarchy ($($i+1)/$numCommits)"
    } elseif ($sampleFile -match "src/data") {
        $commitMsg = "feat(data): isolate domain logic and static data configurations ($($i+1)/$numCommits)"
    } elseif ($sampleFile -match "package.json|vite.config") {
        $commitMsg = "build: configure build tools and dependency manifest ($($i+1)/$numCommits)"
    } else {
        $commitMsg = "chore: housekeeping repository root files and resources ($($i+1)/$numCommits)"
    }
    
    git commit -m $commitMsg
}
