const fs = require("fs")

const files = [
  "src/App.jsx",
]

for (
  const file of files
) {
  let content =
    fs.readFileSync(
      file,
      "utf8",
    )

  content =
    content
      .split("â¬¢")
      .join("➤")

  content =
    content
      .split("BoundaryGraph")
      .join(
        "LandRegistration System with Blockchain",
      )

  fs.writeFileSync(
    file,
    content,
    "utf8",
  )

  console.log(
    `Updated: ${file}`,
  )
}

console.log("")
console.log(
  "Brand name and symbol fixed.",
)