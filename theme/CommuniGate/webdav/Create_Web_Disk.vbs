' Win2k3WebDavConfig.vbs
'
' 11/17/2006 - Initial write.
'

Option Explicit
Dim errReturn, strURL, strDomain


' *************************************************************************
' Configurable Variables
' *************************************************************************
strURL = "http://luvhimba.com:2077/" ' This is the URL to the WebDAV share.

strDomain = "luvhimba.com" ' This is the name of the domain.

' *************************************************************************
' This subroutine searches for the WebDAV service known as 'WebClient' and
'  makes sure that it is configured for automatic startup, and that it is 
'  currently running.
' *************************************************************************
Sub ConfigureService()
   Dim objWMIService
   Set objWMIService = GetObject("winmgmts:"_
       & "{impersonationLevel=impersonate}!\\.\root\cimv2")


   ' We only care about one service, so the search is only for
   '    the WebClient service.
   Dim colServiceList
   Set colServiceList = objWMIService.ExecQuery _
      ("Select * from Win32_Service where Name = 'WebClient'")

   ' If more than one service was returned, something is funky.
   ' Likewise, if no services are returned, we shouldn't be running.
   If colServiceList.Count = 1 Then
      Dim objService
      For Each objService in colServiceList
         ' Test to see if the service is scheduled to run on startup, if not, configure it to.
         If objService.StartMode <> "Automatic" Then
            errReturn = objService.Change( , , , , "Automatic")
         End If
         ' Test to see if the service is currently running, if not, start it.
         If objService.State <> "Started" Then
            objService.StartService()
         End If
      Next
   Else
      WScript.Echo "Could not find WebClient service."
   End If
End Sub


' **********************************************************************
' This Subroutine launches an IE browser that contains the HTML required
'  to open the web folder for viewing.  It then fires the OnClick event
'  for the link in order to open the WebFolder. The browser is then
'  closed.
' **********************************************************************
Sub LaunchBrowser()
   Dim objIE
   Set objIE = CreateObject("InternetExplorer.Application")
   objIE.Visible = false
   objIE.Navigate2 "about:blank"
   objIE.Document.write "<!DOCTYPE html PUBLIC ""-//W3C//DTD XHTML 1.0 Transitional//EN"" ""http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"">"_
                       &"<html><head>"_
                       &"<style>a {behavior: url(#default#AnchorClick);}</style></head>"_
                       &"<body><a href='" & strURL & "' FOLDER='" & strURL & "' TARGET='_top'>"_
                       &"Click here to finish setting up your Web Folder</a></body></html>"
   Dim links
   Set links = objIE.Document.links
   links(0).fireEvent("OnClick")
   objIE.Quit
   Set objIE = Nothing
End Sub

' *********************************************************************
' This subroutine creates a shortcut to the web disk.
' *********************************************************************

Sub CreateShorty ()
   Dim strName, strAppname, strNetHood, blnDeleteMode, objFSO, objWSHShell, objShell, objFolder, objFolderItem, blnVerboseMode, strDesktop,oMyShortCut, objDesktopIni, objNewLinkFolder
   strAppname = "Create_Web_Disk.vbs" 
   Const NETHOOD = &H13&
   strName = strDomain

   Set objFSO = CreateObject("Scripting.FileSystemObject")
   Set objWshShell = CreateObject("WScript.Shell")
   Set objShell = CreateObject("Shell.Application")

   Set objFolder = objShell.Namespace(NETHOOD)
   Set objFolderItem = objFolder.Self
   strNetHood = objFolderItem.Path
 
   Set objNewLinkFolder = objFSO.CreateFolder(strNetHood & "\" & strName)
   Set objDesktopIni = objFSO.CreateTextFile(strNetHood & "\" & strName & "\Desktop.ini")
 
   strDesktop = objWshShell.SpecialFolders("Desktop")
   Set oMyShortCut = objWshShell.CreateShortcut(strDesktop & "\" & strName & ".lnk")
   oMyShortCut.IconLocation = "%SystemRoot%\system32\SHELL32.dll,9"
   oMyShortCut.TargetPath = strNetHood & "\" & strName
   oMyShortCut.Save
End Sub



' *********************************************************************
' Main Function Area.  This is where it all goes down.
' *********************************************************************
ConfigureService
LaunchBrowser
CreateShorty
