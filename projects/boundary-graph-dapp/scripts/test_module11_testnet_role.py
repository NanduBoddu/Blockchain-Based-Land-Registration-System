from dotenv import load_dotenv

import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryClient,
)


APP_ID = 769067078


def main():

    # Load deployer mnemonic only.
    load_dotenv(".env.testnet")

    # IMPORTANT:
    # Connect directly to Algorand TestNet.
    algorand = (
        algokit_utils
        .AlgorandClient
        .testnet()
    )

    deployer = (
        algorand.account
        .from_environment(
            "DEPLOYER"
        )
    )

    client = (
        LandRegistryClient(
            algorand=algorand,
            app_id=APP_ID,
            default_sender=deployer.address,
        )
    )

    print()
    print(
        "MODULE 11 TESTNET ROLE TEST"
    )

    print(
        "==========================="
    )

    network = (
        algorand.client
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

    print(
        "Creator / Deployer:",
        deployer.address,
    )

    account_info = (
        algorand.client
        .algod
        .account_info(
            deployer.address
        )
    )

    balance = (
        account_info["amount"]
        /
        1_000_000
    )

    print(
        "Deployer Balance:",
        balance,
        "ALGO",
    )

    result = (
        client
        .send
        .is_government()
    )

    role = (
        result
        .abi_return
    )

    print()
    print(
        "is_government():",
        role,
    )

    assert (
        role == 1
    )

    print()
    print(
        "PASS: TestNet creator is Government"
    )

    print()
    print(
        "================================="
    )

    print(
        "MODULE 11 TESTNET ROLE TEST PASSED"
    )

    print(
        "================================="
    )


if __name__ == "__main__":
    main()