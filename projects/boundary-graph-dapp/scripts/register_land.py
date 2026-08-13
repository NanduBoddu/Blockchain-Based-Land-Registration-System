import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)

APP_ID = 1080


def main() -> None:
    print("======================================")
    print("       LAND REGISTRATION")
    print("======================================")

    print("Connecting to LocalNet...", flush=True)

    algorand = algokit_utils.AlgorandClient.from_environment()

    print("Getting DEPLOYER account...", flush=True)

    deployer = algorand.account.from_environment("DEPLOYER")

    print(f"Deployer: {deployer.address}", flush=True)

    print("Creating typed app factory...", flush=True)

    factory = algorand.client.get_typed_app_factory(
        LandRegistryFactory,
        default_sender=deployer.address,
    )

    print(f"Connecting to LandRegistry App ID {APP_ID}...", flush=True)

    app_client = factory.get_app_client_by_id(APP_ID)

    # --------------------------------------------
    # New land information
    # --------------------------------------------

    survey_number = "SURVEY-004"
    extent = 1500
    owner = deployer.address.encode()

    print()
    print("Land information:")
    print(f"Survey Number : {survey_number}")
    print(f"Extent        : {extent}")
    print(f"Owner         : {deployer.address}")

    print()
    print("Submitting register_land() transaction...", flush=True)

    response = app_client.send.register_land(
        args=(
            survey_number,
            extent,
            owner,
        )
    )

    print()
    print("======================================")
    print("     LAND REGISTERED SUCCESSFULLY")
    print("======================================")
    print(f"Transaction ID : {response.tx_id}")
    print(f"Land ID        : {response.abi_return}")
    print(f"Survey Number  : {survey_number}")
    print(f"Extent         : {extent}")
    print(f"Owner          : {deployer.address}")
    print("Verification    : 0 - Unverified")
    print("======================================")


if __name__ == "__main__":
    main()