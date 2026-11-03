!macro customInstall
  DetailPrint "Creating automatic startup shortcut for Birthday Buddy daily reminders..."
  CreateShortCut "$SMSTARTUP\Birthday Buddy.lnk" "$INSTDIR\Birthday Buddy.exe" "--reminder" "$INSTDIR\Birthday Buddy.exe" 0
!macroend

!macro customUnInstall
  DetailPrint "Removing automatic startup shortcut for Birthday Buddy..."
  Delete "$SMSTARTUP\Birthday Buddy.lnk"
!macroend

