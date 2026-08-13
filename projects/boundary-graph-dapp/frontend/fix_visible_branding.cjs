const fs = require("fs")

const fixes = {
  "src/App.jsx": [
    ['"ðŸ”Ž Public Verification"', '"🔎 Public Verification"'],
  ],

  "src/components/WalletConnect.jsx": [
    ["Pera Wallet â€¢ TestNet", "Pera Wallet • TestNet"],
  ],

  "src/components/ViewUsersModal.jsx": [
    [
      "Registered public users in BoundaryGraph.",
      "Registered public users in LandRegistration System with Blockchain.",
    ],
  ],

  "src/components/AuthModal.jsx": [
    [
      "Create your BoundaryGraph account and choose your role.",
      "Create your LandRegistration System with Blockchain account and choose your role.",
    ],
  ],

  "src/components/GovernmentSignupRequestsModal.jsx": [
    [
      "the BoundaryGraph backend.",
      "the LandRegistration System with Blockchain backend.",
    ],
  ],

  "src/components/SettingsModal.jsx": [
    [
      "Manage your BoundaryGraph account,",
      "Manage your LandRegistration System with Blockchain account,",
    ],
    [
      "BoundaryGraph password.",
      "LandRegistration System with Blockchain password.",
    ],
  ],

  "src/components/LandingPage.jsx": [
    [
      "Start Using BoundaryGraph",
      "Start Using LandRegistration System",
    ],
    [
      "BoundaryGraph provides a secure,",
      "LandRegistration System with Blockchain provides a secure,",
    ],
    [
      "BoundaryGraph • Decentralized Smart Land",
      "LandRegistration System with Blockchain • Decentralized Smart Land",
    ],
    [
      ">BoundaryGraph<",
      ">LandRegistration System with Blockchain<",
    ],
  ],
}

let totalChanges = 0

for (const [file, replacements] of Object.entries(fixes)) {
  if (!fs.existsSync(file)) {
    console.log(`SKIPPED: ${file}`)
    continue
  }

  let content =
    fs.readFileSync(
      file,
      "utf8",
    )

  let fileChanges = 0

  for (const [oldText, newText] of replacements) {
    if (content.includes(oldText)) {
      content =
        content
          .split(oldText)
          .join(newText)

      fileChanges++
      totalChanges++
    }
  }

  fs.writeFileSync(
    file,
    content,
    "utf8",
  )

  console.log(
    `${file}: ${fileChanges} replacement group(s)`,
  )
}

console.log("")
console.log("======================================")
console.log("Visible UI branding repair completed.")
console.log(`Total replacement groups: ${totalChanges}`)
console.log("======================================")