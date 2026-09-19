$htmlPath = "$PSScriptRoot\odivonfarm_sistem_kapsam_dokumani.html"
$pdfPath = "$PSScriptRoot\OdivonFARM_Sistem_Kapsam_Dokumani.pdf"

$edgePaths = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$edgeExe = $edgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $edgeExe) {
    Write-Error "Microsoft Edge yürütülebilir dosyası bulunamadı."
    exit 1
}

Write-Host "PDF üretimi başlatılıyor: $pdfPath"
& $edgeExe --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="$pdfPath" "$htmlPath"

Start-Sleep -Seconds 2

if (Test-Path $pdfPath) {
    $size = (Get-Item $pdfPath).Length
    Write-Host "BAŞARILI: PDF oluşturuldu! Boyut: $size bayt ($([math]::Round($size/1024, 2)) KB)"
} else {
    Write-Error "PDF dosyası oluşturulamadı."
    exit 1
}
