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
; Per-user install into %LocalAppData%\Programs — no admin / UAC needed, and
; the HKCU PATH write below lands in the actual current user's hive (the
; default {autopf}\mddeck install requires elevation, which writes PATH
; into the elevated process's HKCU instead of the interactive user's,
; making `mddeck` invisible in freshly opened cmd windows).
DefaultDirName={localappdata}\Programs\{#MyAppName}
PrivilegesRequired=lowest
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

[Messages]
; Shown after a successful install — confirm what just happened.
FinishedLabel=mddeck was installed successfully.%n%nThe install directory has been appended to your user PATH. Open a NEW cmd.exe / PowerShell window and run:%n%n  mddeck --version%n%nIf `mddeck` is still not found, restart any open shells and try again.

[Files]
; Paths are relative to the repo root (one level up from this script).
Source: "..\..\build\{#MyAppExeName}"; DestDir: "{app}"; DestName: "{#MyAppExeName}"; Flags: ignoreversion
Source: "..\..\packaging\windows\icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\README.md"; DestDir: "{app}"; Flags: ignoreversion isreadme

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"

[Registry]
; Append the install directory to the current user's PATH (HKCU\Environment).
; With PrivilegesRequired=lowest, the installer runs as the current user
; (no UAC), so this write lands in the right HKCU and newly-spawned
; shells immediately see `mddeck` on PATH.
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; \
  ValueData: "{olddata};{app}"; Check: NeedsAddPath

[Code]
function NeedsAddPath(): Boolean;
var
  OrigPath: String;
begin
  if not RegQueryStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', OrigPath) then
    OrigPath := '';
  // Case-insensitive substring check; Pos returns 0 if not found.
  Result := Pos(UpperCase(ExpandConstant('{app}')), UpperCase(OrigPath)) = 0;
end;