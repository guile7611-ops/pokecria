param([switch]$NewFamiliesOnly)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path $PSScriptRoot -Parent
$revision = '0b7ac414f7c1c06f8993d7bf0ceecbe4e8938891'
$base = "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/$revision"
$assetRoot = Join-Path $projectRoot 'public/assets/pokemon'
$sourceRoot = Join-Path $projectRoot 'docs/source-assets/pmdcollab'
New-Item -ItemType Directory -Path $assetRoot,$sourceRoot -Force | Out-Null
foreach ($file in @('LICENSE.md','README.md','credit_names.txt')) {
  $destination = Join-Path $sourceRoot $file
  if (!(Test-Path $destination)) { Invoke-WebRequest "$base/$file" -OutFile $destination }
}
$manifest = [ordered]@{}
if ($NewFamiliesOnly) {
 $existing = & node --input-type=module -e "import {SPRITE_DEFINITIONS} from './public/sprite-data.js';console.log(JSON.stringify(SPRITE_DEFINITIONS))"
 $manifest = $existing | ConvertFrom-Json -AsHashtable
}
$newFamilies = (& node --input-type=module -e "import {NEW_SPECIES_DATA} from './public/new-species-data.js';console.log(JSON.stringify(NEW_SPECIES_DATA.map(s=>({name:s.id,id:String(s.dex).padStart(4,'0')}))))") | ConvertFrom-Json

foreach ($species in @(@{id='0001';name='bulbasaur'},@{id='0002';name='ivysaur'},@{id='0003';name='venusaur'},@{id='0004';name='charmander'},@{id='0005';name='charmeleon'},@{id='0006';name='charizard'},@{id='0007';name='squirtle'},@{id='0008';name='wartortle'},@{id='0009';name='blastoise'},@{id='0010';name='caterpie'},@{id='0011';name='metapod'},@{id='0012';name='butterfree'},@{id='0013';name='weedle'},@{id='0014';name='kakuna'},@{id='0015';name='beedrill'},@{id='0016';name='pidgey'},@{id='0017';name='pidgeotto'},@{id='0018';name='pidgeot'},@{id='0019';name='rattata'},@{id='0020';name='raticate'},@{id='0021';name='spearow'},@{id='0022';name='fearow'},@{id='0041';name='zubat'},@{id='0042';name='golbat'},@{id='0043';name='oddish'},@{id='0044';name='gloom'},@{id='0045';name='vileplume'},@{id='0046';name='paras'},@{id='0047';name='parasect'},@{id='0054';name='psyduck'},@{id='0055';name='golduck'},@{id='0060';name='poliwag'},@{id='0061';name='poliwhirl'},@{id='0062';name='poliwrath'},@{id='0063';name='abra'},@{id='0064';name='kadabra'},@{id='0065';name='alakazam'},@{id='0066';name='machop'},@{id='0067';name='machoke'},@{id='0068';name='machamp'},@{id='0074';name='geodude'},@{id='0075';name='graveler'},@{id='0076';name='golem'},@{id='0081';name='magnemite'},@{id='0082';name='magneton'},@{id='0092';name='gastly'},@{id='0093';name='haunter'},@{id='0094';name='gengar'},@{id='0096';name='drowzee'},@{id='0097';name='hypno'},@{id='0098';name='krabby'},@{id='0099';name='kingler'},@{id='0100';name='voltorb'},@{id='0101';name='electrode'},@{id='0104';name='cubone'},@{id='0105';name='marowak'},@{id='0116';name='horsea'},@{id='0117';name='seadra'},@{id='0152';name='chikorita'},@{id='0153';name='bayleef'},@{id='0154';name='meganium'},@{id='0155';name='cyndaquil'},@{id='0156';name='quilava'},@{id='0157';name='typhlosion'},@{id='0158';name='totodile'},@{id='0159';name='croconaw'},@{id='0160';name='feraligatr'},@{id='0161';name='sentret'},@{id='0162';name='furret'},@{id='0163';name='hoothoot'},@{id='0164';name='noctowl'},@{id='0167';name='spinarak'},@{id='0168';name='ariados'},@{id='0169';name='crobat'},@{id='0179';name='mareep'},@{id='0180';name='flaaffy'},@{id='0181';name='ampharos'},@{id='0182';name='bellossom'},@{id='0186';name='politoed'},@{id='0194';name='wooper'},@{id='0195';name='quagsire'},@{id='0198';name='murkrow'},@{id='0218';name='slugma'},@{id='0219';name='magcargo'},@{id='0228';name='houndour'},@{id='0229';name='houndoom'},@{id='0230';name='kingdra'},@{id='0246';name='larvitar'},@{id='0247';name='pupitar'},@{id='0248';name='tyranitar'},@{id='0252';name='treecko'},@{id='0253';name='grovyle'},@{id='0254';name='sceptile'},@{id='0255';name='torchic'},@{id='0256';name='combusken'},@{id='0257';name='blaziken'},@{id='0258';name='mudkip'},@{id='0259';name='marshtomp'},@{id='0260';name='swampert'},@{id='0261';name='poochyena'},@{id='0262';name='mightyena'},@{id='0270';name='lotad'},@{id='0271';name='lombre'},@{id='0272';name='ludicolo'},@{id='0280';name='ralts'},@{id='0281';name='kirlia'},@{id='0282';name='gardevoir'},@{id='0285';name='shroomish'},@{id='0286';name='breloom'},@{id='0296';name='makuhita'},@{id='0297';name='hariyama'},@{id='0304';name='aron'},@{id='0305';name='lairon'},@{id='0306';name='aggron'},@{id='0318';name='carvanha'},@{id='0319';name='sharpedo'},@{id='0320';name='wailmer'},@{id='0321';name='wailord'},@{id='0322';name='numel'},@{id='0323';name='camerupt'},@{id='0324';name='torkoal'},@{id='0430';name='honchkrow'},@{id='0462';name='magnezone'}) + @($newFamilies)) {
  if ($NewFamiliesOnly -and $species.name -notin $newFamilies.name) { continue }
  $folder = Join-Path $assetRoot $species.name
  New-Item -ItemType Directory -Path $folder -Force | Out-Null
  foreach ($file in @('AnimData.xml','credits.txt')) { $destination=Join-Path $folder $file; if (!(Test-Path $destination)) { Invoke-WebRequest "$base/sprite/$($species.id)/$file" -OutFile $destination } }
  $portrait=Join-Path $folder 'portrait.png'; if (!(Test-Path $portrait)) { Invoke-WebRequest "$base/portrait/$($species.id)/Normal.png" -OutFile $portrait }
  $portraitCredits=Join-Path $folder 'portrait-credits.txt'; if (!(Test-Path $portraitCredits)) { Invoke-WebRequest "$base/portrait/$($species.id)/credits.txt" -OutFile $portraitCredits }
  [xml]$document = Get-Content (Join-Path $folder 'AnimData.xml') -Raw
  $animations = [ordered]@{}
  foreach ($name in @('Idle','Walk','Attack','Shoot','Hurt','Faint')) {
    $animation = $document.AnimData.Anims.Anim | Where-Object Name -EQ $name
    $fallback = $null
    if (!$animation -and $name -eq 'Faint') { $fallback = 'Sleep'; $animation = $document.AnimData.Anims.Anim | Where-Object Name -EQ 'Sleep' }
    if (!$animation -and $name -eq 'Shoot') { $fallback='Attack'; $animation=$document.AnimData.Anims.Anim | Where-Object Name -EQ 'Attack' }
    if (!$animation) { throw "Missing animation: $($species.name)/$name" }
    if ($animation.CopyOf) { $animation = $document.AnimData.Anims.Anim | Where-Object Name -EQ $animation.CopyOf }
    $sourceName = [string]$animation.Name
    foreach ($suffix in @('Anim','Shadow')) {
      $filename = "$sourceName-$suffix.png"
      if (!(Test-Path (Join-Path $folder $filename))) { Invoke-WebRequest "$base/sprite/$($species.id)/$filename" -OutFile (Join-Path $folder $filename) }
    }
    $frameWidth = [int]$animation.FrameWidth; $frameHeight = [int]$animation.FrameHeight
    $image = [System.Drawing.Bitmap]::new((Join-Path $folder "$sourceName-Anim.png"))
    $shadow = [System.Drawing.Bitmap]::new((Join-Path $folder "$sourceName-Shadow.png"))
    $columns = [int]($image.Width / $frameWidth); $rows = [int]($image.Height / $frameHeight)
    $pivots = @()
    for ($row=0; $row -lt $rows; $row++) {
      $rowPivots = @()
      for ($column=0; $column -lt $columns; $column++) {
        $pivot = $null
        for ($y=0; $y -lt $frameHeight; $y++) { for ($x=0; $x -lt $frameWidth; $x++) {
          $pixel = $shadow.GetPixel($column*$frameWidth+$x, $row*$frameHeight+$y)
          if ($pixel.A -gt 0 -and $pixel.R -eq 255 -and $pixel.G -eq 255 -and $pixel.B -eq 255) { $pivot = @{x=$x;y=$y} }
        } }
        if (!$pivot) { throw "Missing shadow pivot: $($species.name)/$name/$row/$column" }
        $rowPivots += $pivot
      }
      $pivots += ,$rowPivots
    }
    $image.Dispose(); $shadow.Dispose()
    $animations[$name] = @{src="/assets/pokemon/$($species.name)/$sourceName-Anim.png"; frameWidth=$frameWidth;frameHeight=$frameHeight;columns=$columns;rows=$rows;durations=@($animation.Durations.Duration | ForEach-Object { [Math]::Min(10,[int]$_) });pivots=$pivots;fallback=$fallback}
  }
  $manifest[$species.name] = @{ scale=2; animations=$animations; source="https://github.com/PMDCollab/SpriteCollab/tree/$revision/sprite/$($species.id)"; author='CHUNSOFT' }
  Write-Output "Imported $($species.name): $($animations.Count) animations"
}
$json = $manifest | ConvertTo-Json -Depth 15 -Compress
Set-Content -LiteralPath (Join-Path $projectRoot 'public/sprite-data.js') -Value "// Imported by scripts/import-pmd-sprites.ps1. Source revision: $revision`nexport const SPRITE_DEFINITIONS = $json;" -Encoding utf8
