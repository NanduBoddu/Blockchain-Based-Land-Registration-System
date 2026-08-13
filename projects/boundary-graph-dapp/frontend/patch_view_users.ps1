$path = "src\App.jsx"

$content =
  Get-Content `
    $path `
    -Raw


# ============================================================
# 1. IMPORT ViewUsersModal
# ============================================================

if (
  $content -notmatch
  'import ViewUsersModal'
) {
  $oldImport = @'
import GovernmentSignupRequestsModal
  from "./components/GovernmentSignupRequestsModal"
'@

  $newImport = @'
import GovernmentSignupRequestsModal
  from "./components/GovernmentSignupRequestsModal"

import ViewUsersModal
  from "./components/ViewUsersModal"
'@

  $content =
    $content.Replace(
      $oldImport,
      $newImport
    )
}


# ============================================================
# 2. STATE
# ============================================================

if (
  $content -notmatch
  'showViewUsers'
) {
  $pattern =
    'const\s*\[\s*showGovernmentSignupRequests,\s*setShowGovernmentSignupRequests,\s*\]\s*=\s*useState\(false\)'

  $match =
    [regex]::Match(
      $content,
      $pattern
    )

  if (
    $match.Success
  ) {
    $newState = @'
const [
  showGovernmentSignupRequests,
  setShowGovernmentSignupRequests,
] = useState(false)

const [
  showViewUsers,
  setShowViewUsers,
] = useState(false)
'@

    $content =
      $content.Remove(
        $match.Index,
        $match.Length
      ).Insert(
        $match.Index,
        $newState
      )
  }
}


# ============================================================
# 3. VIEW USERS BUTTON
# ============================================================

if (
  $content -notmatch
  '>\s*View Users\s*<'
) {
  $pattern =
    '(?s)<button\s+className="action-btn secondary-btn"\s+onClick=\{\(\) =>\s*setShowGovernmentSignupRequests\(\s*true,\s*\)\s*\}\s*>\s*Signup Requests\s*</button>'

  $match =
    [regex]::Match(
      $content,
      $pattern
    )

  if (
    $match.Success
  ) {
    $button = @'


                <button
                  className="action-btn secondary-btn"
                  onClick={() =>
                    setShowViewUsers(
                      true,
                    )
                  }
                >
                  View Users
                </button>
'@

    $content =
      $content.Insert(
        $match.Index +
        $match.Length,
        $button
      )
  }
}


# ============================================================
# 4. VIEW USERS MODAL
# ============================================================

if (
  $content -notmatch
  '<ViewUsersModal'
) {
  $marker =
    '{showMyGovernmentRequest &&'

  $index =
    $content.IndexOf(
      $marker
    )

  if (
    $index -ge 0
  ) {
    $modal = @'
{showViewUsers &&
    authUser.role ===
      "Government" && (
      <ViewUsersModal
        onClose={() =>
          setShowViewUsers(
            false,
          )
        }
      />
    )}


  
'@

    $content =
      $content.Insert(
        $index,
        $modal
      )
  }
}


Set-Content `
  -Path $path `
  -Value $content `
  -Encoding UTF8


Write-Host ""
Write-Host "========================================"
Write-Host "View Users patch finished"
Write-Host "========================================"
Write-Host ""