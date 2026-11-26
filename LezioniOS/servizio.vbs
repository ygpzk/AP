' Lezioni OS: fa partire servizio.cmd senza finestra (lo chiama l'attività pianificata «Lezioni OS»).
Set fso = CreateObject("Scripting.FileSystemObject")
qui = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "cmd /c """ & qui & "\servizio.cmd""", 0, False
