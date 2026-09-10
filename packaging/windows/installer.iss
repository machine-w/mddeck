; packaging/windows/installer.iss — Inno Setup script for the mddeck CLI.
;
; Compiled via `iscc /DMyAppVersion=<ver> packaging/windows/installer.iss`
; where <ver> is the release tag with the leading "v" stripped (e.g. "0.1.8").
;
; Output: mddeck-<ver>-windows-x64-setup.exe in the repo root.

#define MyAppName "mddeck"
#define MyAppPublisher "machine-w"
#define MyAppURL "https://github.com/machine-w/mddeck"
#define MyAppExeName "mddeck.exe"

[Setup]
AppId={{A8E1A4C0-MDDE-CK57-BEEF-000000000000}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/issues
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
DisableDirPage=no
OutputBaseFilename=mddeck-{#MyAppVersion}-windows-x64-setup
OutputDir=..\..\packaging\windows
Compression=lzma2
SolidCompression=yes
SetupIconFile=icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Paths are relative to the repo root (one level up from this script).
Source: "..\..\build\{#MyAppExeName}"; DestDir: "{app}"; DestName: "{#MyAppExeName}"; Flags: ignoreversion
Source: "..\..\packaging\windows\icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\README.md"; DestDir: "{app}"; Flags: ignoreversion isreadme

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"

[Registry]
; Append the install directory to the user PATH (HKCU\Environment). No reboot
; required for the new PATH to take effect in newly-spawned shells.
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; \
  ValueData: "{olddata};{app}"; Check: NeedsAddPath

[Code]
function NeedsAddPath(): Boolean;
var
  OrigPath: String;
begin
  if not RegQueryStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', OrigPath) then
    OrigPath := '';
  // Pos returns 0 if not found; the substring already includes the surrounding braces.
  Result := Pos(ExpandConstant('{app}'), OrigPath) = 0;
end;