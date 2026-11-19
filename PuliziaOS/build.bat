@echo off
rem Ricompila PuliziaOS.exe usando il compilatore C# incluso in Windows (.NET Framework 4.x).
rem Non serve installare nulla: funziona su qualsiasi PC Windows 10/11.
cd /d "%~dp0"
set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" set CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe
if not exist "%CSC%" (
  echo Compilatore C# non trovato. Serve .NET Framework 4.x ^(gia' presente in Windows 10/11^).
  pause
  exit /b 1
)
"%CSC%" /nologo /target:exe /optimize+ /codepage:65001 /nowarn:0649 /out:PuliziaOS.exe src\*.cs
if errorlevel 1 (
  echo.
  echo COMPILAZIONE FALLITA
  pause
  exit /b 1
)
PuliziaOS.exe --selftest
echo.
echo Fatto: PuliziaOS.exe e' pronto.
