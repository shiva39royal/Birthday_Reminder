!macro customInstall
  DetailPrint "Creating automatic startup shortcut for Birthday Buddy daily reminders..."
  CreateShortCut "$SMSTARTUP\Birthday Buddy.lnk" "$INSTDIR\Birthday Buddy.exe" "--reminder" "$INSTDIR\Birthday Buddy.exe" 0
  ; Ensure clean empty state on fresh installation without leftover test/sample records
  Delete "$APPDATA\birthday-buddy\birthday_buddy.db"
  RMDir /r "$APPDATA\birthday-buddy\photos"
!macroend

!macro customUnInstall
  DetailPrint "Removing automatic startup shortcut for Birthday Buddy..."
  Delete "$SMSTARTUP\Birthday Buddy.lnk"
  Delete "$APPDATA\birthday-buddy\birthday_buddy.db"
  RMDir /r "$APPDATA\birthday-buddy\photos"
!macroend

