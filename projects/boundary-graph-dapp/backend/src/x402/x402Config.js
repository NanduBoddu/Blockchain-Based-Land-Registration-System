export const X402_NETWORK =
  "algorand-testnet"


export const X402_ACTIONS = {
  REGISTER_LAND: {
    action:
      "register_land",

    description:
      "Register land on BoundaryGraph",

    amountMicroAlgo:
      1000,
  },

  VERIFY_LAND: {
    action:
      "verify_land",

    description:
      "Verify land record",

    amountMicroAlgo:
      500,
  },

  ADD_BOUNDARY: {
    action:
      "add_boundary",

    description:
      "Add land boundary",

    amountMicroAlgo:
      1000,
  },

  VERIFY_BOUNDARY: {
    action:
      "verify_boundary",

    description:
      "Verify land boundary",

    amountMicroAlgo:
      500,
  },

  TRANSFER_OWNERSHIP: {
    action:
      "transfer_ownership",

    description:
      "Transfer land ownership",

    amountMicroAlgo:
      1500,
  },
}


export function getX402Action(
  actionName,
) {
  return Object.values(
    X402_ACTIONS,
  ).find(
    (
      item,
    ) =>
      item.action ===
      actionName,
  )
}