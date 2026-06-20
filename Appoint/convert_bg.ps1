Add-Type -AssemblyName System.Drawing

$inputPath = 'C:\Users\hp\Desktop\Desktop\Product\Aaramse\AaramSe\Appoint\assets\background_concept.png'
$tempPath  = 'C:\Users\hp\Desktop\Desktop\Product\Aaramse\AaramSe\Appoint\assets\background_concept_temp.png'

$img = [System.Drawing.Image]::FromFile($inputPath)
$img.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()

Remove-Item $inputPath -Force
Rename-Item $tempPath $inputPath

Write-Host "Done: background_concept.png is now a true PNG"
