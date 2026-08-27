$fp = "src\features\documents\sender\components\ShareDocumentPanel.tsx"
$lines = Get-Content $fp

# Fix handleShare function indentation
$lines[58] = "      const link = await shareDocument(document.id, selectedRecipientId, shareRole);"
$lines[67] = "      setShareSuccess("
$lines[69] = "        `Document shared${document.docType === \"docx\" ? ` as ${shareRole}` : \"\"} successfully! Tracking link generated.`,"
$lines[73] = "      setSelectedRecipientId(\"\");"
$lines[81] = "  }, [document, selectedRecipientId, shareRole, recipients, onDocumentUpdated, onLinkGenerated]);"

# Fix JSX indentation - find the </select> that closes the recipient dropdown (before the role select comment)
# and the <button that follows
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -eq "              </select>" -and $i+1 -lt $lines.Count -and $lines[$i+1] -match "Role selector") {
    $lines[$i] = "        </select>"
  }
  if ($lines[$i] -eq "                <button" -and $i+1 -lt $lines.Count -and $lines[$i+1] -eq "          type=`"button`"" -and $lines[$i+2] -match "handleShare") {
    $lines[$i] = "        <button"
  }
}

Set-Content -Path $fp -Value $lines -Encoding UTF8
Write-Output "Done fixing indentation"