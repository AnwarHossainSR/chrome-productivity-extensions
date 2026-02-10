Icon placeholder files were added as base64 strings in the `icons/` folder.

Please convert them to real PNG binaries before loading the extension, or replace them with your preferred PNG icons.

PowerShell (Windows) to decode each file and overwrite with binary PNG:

```powershell
$base = Get-Content .\icons\icon128.png -Raw
[IO.File]::WriteAllBytes('.\icons\icon128.png',[Convert]::FromBase64String($base))
$base = Get-Content .\icons\icon48.png -Raw
[IO.File]::WriteAllBytes('.\icons\icon48.png',[Convert]::FromBase64String($base))
$base = Get-Content .\icons\icon16.png -Raw
[IO.File]::WriteAllBytes('.\icons\icon16.png',[Convert]::FromBase64String($base))
```

Alternatively use a Linux/macOS shell:

```bash
base64 -d icons/icon128.png > icons/icon128.png.bin && mv icons/icon128.png.bin icons/icon128.png
base64 -d icons/icon48.png > icons/icon48.png.bin && mv icons/icon48.png.bin icons/icon48.png
base64 -d icons/icon16.png > icons/icon16.png.bin && mv icons/icon16.png.bin icons/icon16.png
```

After converting, reload the extension in `chrome://extensions` (click Reload). If Chrome still shows a cached icon, disable and re-enable the extension or restart the browser.
