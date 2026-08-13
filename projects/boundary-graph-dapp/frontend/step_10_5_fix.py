from pathlib import Path

BASE = Path("src/components")

files = {
    "register": BASE / "RegisterLandModal.jsx",
    "verify_land": BASE / "VerifyLandModal.jsx",
    "add_boundary": BASE / "AddBoundaryModal.jsx",
    "verify_boundary": BASE / "VerifyBoundaryModal.jsx",
}

EXPLORER_CONST = '''
const TESTNET_EXPLORER =
  "https://lora.algokit.io/testnet"

'''

def read(path):
    return path.read_text(encoding="utf-8")

def write(path, text):
    path.write_text(text, encoding="utf-8")

def add_explorer_const(text):
    if "const TESTNET_EXPLORER" in text:
        return text

    marker = 'from "../services/algorandService"\n'

    index = text.find(marker)

    if index == -1:
        raise RuntimeError(
            "Unable to locate algorandService import."
        )

    insert_at = index + len(marker)

    return (
        text[:insert_at]
        + "\n"
        + EXPLORER_CONST
        + text[insert_at:]
    )

def explorer_link():
    return '''<a
                  href={`${TESTNET_EXPLORER}/transaction/${success.txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open transaction in Algorand TestNet Explorer"
                  style={{
                    color: "#61f3c5",
                    textDecoration: "none",
                    wordBreak: "break-all",
                    cursor: "pointer",
                  }}
                >
                  {success.txId} ↗
                </a>'''

# --------------------------------------------------
# RegisterLandModal.jsx
# --------------------------------------------------

path = files["register"]
text = read(path)

text = add_explorer_const(text)

text = text.replace("├ù", "×")
text = text.replace("Γ£à", "✅")
text = text.replace("Γ£ô", "✓")

old = '''<span
                  style={{
                    color:
                      "#61f3c5",
                  }}
                >
                  {success.txId}
                </span>'''

new = explorer_link()

if old in text:
    text = text.replace(
        old,
        new,
        1,
    )

write(path, text)

print(
    "RegisterLandModal.jsx updated"
)

# --------------------------------------------------
# VerifyLandModal.jsx
# --------------------------------------------------

path = files["verify_land"]
text = read(path)

text = add_explorer_const(text)

text = text.replace("├ù", "×")
text = text.replace("Γ£à", "✅")

text = text.replace(
    '''              {success.txId}

            </p>''',
    '''              <a
                href={`${TESTNET_EXPLORER}/transaction/${success.txId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open transaction in Algorand TestNet Explorer"
                style={{
                  color: "#61f3c5",
                  textDecoration: "none",
                  wordBreak: "break-all",
                  cursor: "pointer",
                }}
              >
                {success.txId} ↗
              </a>

            </p>''',
    1,
)

text = text.replace(
    "record permanently on Algorand.",
    "record permanently on Algorand TestNet.",
)

write(path, text)

print(
    "VerifyLandModal.jsx updated"
)

# --------------------------------------------------
# AddBoundaryModal.jsx
# --------------------------------------------------

path = files["add_boundary"]
text = read(path)

text = add_explorer_const(text)

text = text.replace("├ù", "×")
text = text.replace("Γ£à", "✅")
text = text.replace(
    "ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ",
    "─────────",
)

text = text.replace(
    '''                {success.txId}

              </p>''',
    '''                <a
                  href={`${TESTNET_EXPLORER}/transaction/${success.txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open transaction in Algorand TestNet Explorer"
                  style={{
                    color: "#61f3c5",
                    textDecoration: "none",
                    wordBreak: "break-all",
                    cursor: "pointer",
                  }}
                >
                  {success.txId} ↗
                </a>

              </p>''',
    1,
)

write(path, text)

print(
    "AddBoundaryModal.jsx updated"
)

# --------------------------------------------------
# VerifyBoundaryModal.jsx
# --------------------------------------------------

path = files["verify_boundary"]
text = read(path)

text = add_explorer_const(text)

text = text.replace("├ù", "×")
text = text.replace("Γ£à", "✅")

text = text.replace(
    '''              {success.txId}

            </p>''',
    '''              <a
                href={`${TESTNET_EXPLORER}/transaction/${success.txId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open transaction in Algorand TestNet Explorer"
                style={{
                  color: "#61f3c5",
                  textDecoration: "none",
                  wordBreak: "break-all",
                  cursor: "pointer",
                }}
              >
                {success.txId} ↗
              </a>

            </p>''',
    1,
)

text = text.replace(
    "record permanently on Algorand.",
    "record permanently on Algorand TestNet.",
)

write(path, text)

print(
    "VerifyBoundaryModal.jsx updated"
)

print()
print(
    "STEP 10.5 COMPLETE"
)
print(
    "Explorer links and encoding cleanup applied."
)