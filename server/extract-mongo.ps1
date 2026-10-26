$zipPath = 'C:\Users\salee\.gemini\antigravity\scratch\imovies\server\.mongo-bin\mongodb-windows-x86_64-6.0.14.zip'
$dest = 'C:\Users\salee\.gemini\antigravity\scratch\imovies\server\.mongo-bin'
Remove-Item -Path "$dest\6.0.14.lock" -Force -ErrorAction SilentlyContinue

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
foreach ($entry in $zip.Entries) {
  if ($entry.Name -eq 'mongod.exe') {
    $outPath = Join-Path $dest 'mongod-x64-win32-6.0.14.exe'
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $outPath, $true)
    Write-Output "Extracted mongod.exe to $outPath"
    Copy-Item $outPath "$dest\mongod.exe" -Force
  }
}
$zip.Dispose()
Write-Output "Done extracting."
