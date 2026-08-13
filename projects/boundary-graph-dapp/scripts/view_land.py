import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)


APP_ID = 1080


def main():
    print()
    print("======================================")
    print("       LAND RECORD VIEWER")
    print("======================================")

    print("Connecting to LocalNet...")

    algorand = algokit_utils.AlgorandClient.from_environment()

    print("Getting DEPLOYER account...")
    deployer = algorand.account.from_environment("DEPLOYER")

    print(f"Deployer: {deployer.address}")

    print("Creating typed app factory...")

    factory = algorand.client.get_typed_app_factory(
        LandRegistryFactory,
        default_sender=deployer.address,
    )

    print(f"Connecting to LandRegistry App ID {APP_ID}...")

    app_client = factory.get_app_client_by_id(APP_ID)

    land_id = int(input("\nEnter Land ID: "))

    print(f"\nReading Land #{land_id}...")
    print("Calling get_land()...")

    result = app_client.send.get_land(args=(land_id,))

    print("get_land() completed.")

    # The generated client returns the decoded ABI value
    # through result.returns[0].value.
    raw_result = result.returns[0].value

    print(f"Raw ABI result: {raw_result}")

    # -------------------------------------------------
    # Decode returned land information
    # -------------------------------------------------

    survey_number = raw_result[0]
    extent = raw_result[1]
    owner = raw_result[2]
    verification_status = raw_result[3]

    # Owner is returned as a list of byte values.
    if isinstance(owner, list):
        owner = bytes(owner)

    if isinstance(owner, bytes):
        try:
            owner = owner.decode("utf-8")
        except UnicodeDecodeError:
            owner = owner.hex()

    # -------------------------------------------------
    # Verification status
    # -------------------------------------------------

    status_names = {
        0: "UNVERIFIED",
        1: "PENDING",
        2: "VERIFIED",
        3: "FLAGGED",
    }

    verification_text = status_names.get(
        verification_status,
        f"UNKNOWN ({verification_status})",
    )

    # -------------------------------------------------
    # Display
    # -------------------------------------------------

    print()
    print("======================================")
    print("          LAND RECORD")
    print("======================================")

    print(f"Land ID            : {land_id}")
    print(f"Survey Number      : {survey_number}")
    print(f"Extent             : {extent}")
    print(f"Owner              : {owner}")
    print(f"Verification       : {verification_text}")
    print(f"Status Code        : {verification_status}")

    print("======================================")


if __name__ == "__main__":
    main()