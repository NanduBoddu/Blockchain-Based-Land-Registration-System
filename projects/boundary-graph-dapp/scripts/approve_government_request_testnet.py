from dotenv import load_dotenv
import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryClient,
)


APP_ID = 769067078
REQUEST_ID = 1


def main():
    # --------------------------------------------------------
    # LOAD TESTNET ACCOUNT
    # --------------------------------------------------------

    load_dotenv(".env.testnet")

    print()
    print("=" * 65)
    print("MODULE 11 - TESTNET GOVERNMENT REQUEST APPROVAL")
    print("=" * 65)
    print()

    print("Connecting to Algorand TestNet...")

    algorand = (
        algokit_utils
        .AlgorandClient
        .testnet()
    )

    network = (
        algorand
        .client
        .network()
    )

    print(
        "Network:",
        network.genesis_id,
    )

    print(
        "App ID:",
        APP_ID,
    )


    # --------------------------------------------------------
    # LOAD CREATOR / GOVERNMENT
    # --------------------------------------------------------

    deployer = (
        algorand
        .account
        .from_environment(
            "DEPLOYER"
        )
    )

    print(
        "Government / Creator:",
        deployer.address,
    )


    account_info = (
        algorand
        .client
        .algod
        .account_info(
            deployer.address
        )
    )

    balance_algo = (
        account_info["amount"]
        / 1_000_000
    )

    print(
        "Government Balance:",
        balance_algo,
        "ALGO",
    )


    # --------------------------------------------------------
    # CREATE LAND REGISTRY CLIENT
    # --------------------------------------------------------

    client = LandRegistryClient(
        algorand=algorand,
        app_id=APP_ID,
        default_sender=deployer.address,
        default_signer=deployer.signer,
    )


    # --------------------------------------------------------
    # READ REQUEST BEFORE APPROVAL
    # --------------------------------------------------------

    print()
    print("-" * 65)
    print(
        f"Reading Government Request #{REQUEST_ID}..."
    )
    print("-" * 65)


    request_result = (
        client
        .send
        .get_government_request(
            args=(
                REQUEST_ID,
            )
        )
    )


    if (
        request_result.abi_return
        is None
    ):
        raise RuntimeError(
            "No ABI result returned while reading "
            "Government request."
        )


    requester = (
        request_result
        .abi_return[0]
    )

    status = int(
        request_result
        .abi_return[1]
    )


    print(
        "Requester:",
        requester,
    )

    print(
        "Current Status:",
        status,
    )


    if status == 0:
        print(
            "Status Name: Pending"
        )

    elif status == 1:
        print(
            "Status Name: Approved"
        )

    elif status == 2:
        print(
            "Status Name: Rejected"
        )

    else:
        print(
            "Status Name: Unknown"
        )


    # --------------------------------------------------------
    # ALREADY APPROVED
    # --------------------------------------------------------

    if status == 1:
        print()
        print(
            "Request is already APPROVED."
        )

        print()
        print(
            "Nothing more to do."
        )

        return


    # --------------------------------------------------------
    # ALREADY REJECTED
    # --------------------------------------------------------

    if status == 2:
        print()
        print(
            "Request is already REJECTED."
        )

        print(
            "This request cannot be approved "
            "with the current contract flow."
        )

        return


    # --------------------------------------------------------
    # APPROVE REQUEST
    # --------------------------------------------------------

    print()
    print("-" * 65)
    print(
        f"Approving Government Request #{REQUEST_ID}..."
    )
    print("-" * 65)


    approve_result = (
        client
        .send
        .approve_government_request(
            args=(
                REQUEST_ID,
            )
        )
    )


    print()
    print(
        "Government Request APPROVED successfully!"
    )


    if (
        approve_result.tx_ids
    ):
        print(
            "Transaction ID:",
            approve_result.tx_ids[0],
        )

        print()
        print(
            "Explorer:"
        )

        print(
            "https://lora.algokit.io/testnet/transaction/"
            + approve_result.tx_ids[0]
        )


    # --------------------------------------------------------
    # VERIFY REQUEST AFTER APPROVAL
    # --------------------------------------------------------

    print()
    print("-" * 65)
    print(
        "Verifying request after approval..."
    )
    print("-" * 65)


    final_result = (
        client
        .send
        .get_government_request(
            args=(
                REQUEST_ID,
            )
        )
    )


    if (
        final_result.abi_return
        is None
    ):
        raise RuntimeError(
            "No ABI result returned during "
            "final verification."
        )


    final_requester = (
        final_result
        .abi_return[0]
    )

    final_status = int(
        final_result
        .abi_return[1]
    )


    print(
        "Requester:",
        final_requester,
    )

    print(
        "Final Status:",
        final_status,
    )


    if final_status == 1:
        print(
            "Final Status Name: Approved"
        )

        print()
        print("=" * 65)
        print(
            "PASS: Government Request #1 "
            "is APPROVED on TestNet!"
        )
        print("=" * 65)

    else:
        print()
        print("=" * 65)
        print(
            "WARNING: Approval transaction completed, "
            "but final status is not 1."
        )
        print("=" * 65)


if __name__ == "__main__":
    main()