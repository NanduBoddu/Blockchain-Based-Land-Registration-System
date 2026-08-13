const fs = require("fs")

const file =
  "src/App.jsx"

let content =
  fs.readFileSync(
    file,
    "utf8",
  )

const replacements = [
  ["â€¢", "•"],
  ["â†—", "↗"],
  ["â†’", "→"],
  ["â†", "←"],
  ["âœ…", "✅"],
  ["âœ“", "✓"],
  ["Ã—", "×"],

  ["ðŸ”—", "🔗"],
  ["ðŸ ", "🏠"],
  ["ðŸ›¡ï¸", "🛡️"],
  ["ðŸ›¡", "🛡️"],
  ["ðŸ‘¤", "👤"],
  ["ðŸŒ", "🌐"],
  ["ðŸ”", "🔐"],
  ["ðŸ“", "📍"],
  ["ðŸ’³", "💳"],
]

let fixed =
  0

for (
  const [
    broken,
    correct,
  ] of replacements
) {
  if (
    content.includes(
      broken,
    )
  ) {
    const before =
      content

    content =
      content
        .split(
          broken,
        )
        .join(
          correct,
        )

    if (
      before !==
      content
    ) {
      console.log(
        `${broken}  ->  ${correct}`,
      )

      fixed++
    }
  }
}

fs.writeFileSync(
  file,
  content,
  {
    encoding:
      "utf8",
  },
)

console.log("")
console.log(
  "===================================",
)

console.log(
  `App.jsx encoding repair completed.`,
)

console.log(
  `Replacement groups fixed: ${fixed}`,
)

console.log(
  "===================================",
)