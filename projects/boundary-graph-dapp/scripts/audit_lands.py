import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)


APP_ID = 1080


def status_text(status):
    if status == 2:
        return "VERIFIED"
    elif status == 1:
        return "PENDING"
    return "UNVERIFIED"


def owner_text(owner):
    if isinstance(owner, list):
        return bytes(owner).hex()

    if isinstance(owner, bytes):
        return owner.hex()

    return str(owner)


def main():
    print("========================================")
    print("          LAND REGISTRY AUDIT")
    print("========================================")

    print("Connecting to LocalNet...")

    algorand = algokit_utils.AlgorandClient.from_environment()

    print("Getting DEPLOYER account...")

    deployer = algorand.account.from_environment(
        "DEPLOYER"
    )

    print(f"Deployer: {deployer.address}")

    print("Creating typed app factory...")

    factory = algorand.client.get_typed_app_factory(
        LandRegistryFactory,
        default_sender=deployer.address,
    )

    print(f"Connecting to LandRegistry App ID {APP_ID}...")

    client = factory.get_app_client_by_id(APP_ID)

    print()
    print("Reading land count...")

    count_result = client.send.get_land_count()

    land_count = count_result.abi_return

    print(f"Total land records: {land_count}")

    print()
    print("========================================")
    print("             LAND RECORDS")
    print("========================================")

    surveys = {}

    for land_id in range(1, land_count + 1):

        try:
            result = client.send.get_land(
                args=(land_id,)
            )

            land = result.abi_return

            survey = land[0]
            extent = land[1]
            owner = owner_text(land[2])
            status = land[3]

            print()
            print(f"Land ID        : {land_id}")
            print(f"Survey Number  : {survey}")
            print(f"Extent         : {extent}")
            print(f"Owner          : {owner}")
            print(
                f"Verification   : "
                f"{status_text(status)}"
            )

            if survey not in surveys:
                surveys[survey] = []

            surveys[survey].append(land_id)

        except Exception as e:
            print()
            print(f"Could not read Land #{land_id}")
            print(f"Error: {e}")

    print()
    print("========================================")
    print("        DUPLICATE SURVEY CHECK")
    print("========================================")

    duplicates_found = False

    for survey, land_ids in surveys.items():

        if len(land_ids) > 1:

            duplicates_found = True

            print()
            print("⚠ DUPLICATE SURVEY NUMBER")
            print(f"Survey : {survey}")
            print(f"Land IDs: {land_ids}")

    if not duplicates_found:
        print()
        print("✓ No duplicate survey numbers found.")

    print()
    print("========================================")
    print("             AUDIT RESULT")
    print("========================================")

    if duplicates_found:
        print("⚠ DATA REQUIRES REVIEW")
        print()
        print(
            "Duplicate survey numbers were found."
        )
    else:
        print("✓ LAND REGISTRY CONSISTENT")

    print()
    print("========================================")


if __name__ == "__main__":
    main()
