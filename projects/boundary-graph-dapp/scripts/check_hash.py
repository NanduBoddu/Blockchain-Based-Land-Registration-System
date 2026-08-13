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


def to_text(value):
    if isinstance(value, list):
        return bytes(value).decode("utf-8", errors="replace")
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return str(value)


def main():
    print("========================================")
    print("       BOUNDARY HASH INTEGRITY")
    print("========================================")

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

    client = factory.get_app_client_by_id(APP_ID)

    while True:
        try:
            boundary_id = int(
                input("\nEnter Boundary ID to check: ")
            )

            if boundary_id <= 0:
                print("Boundary ID must be greater than zero.")
                continue

            break

        except ValueError:
            print("Please enter a valid numeric Boundary ID.")

    print()
    print(f"Reading Boundary #{boundary_id}...")

    try:
        boundary_result = client.send.get_boundary(
            args=(boundary_id,)
        )

        boundary = boundary_result.abi_return

        land_a_id = boundary[0]
        land_b_id = boundary[1]
        stored_hash = to_text(boundary[2])
        boundary_status = boundary[3]

        print("Boundary loaded successfully.")

        print()
        print("Reading connected land records...")

        land_a_result = client.send.get_land(
            args=(land_a_id,)
        )

        land_b_result = client.send.get_land(
            args=(land_b_id,)
        )

        land_a = land_a_result.abi_return
        land_b = land_b_result.abi_return

        land_a_survey = to_text(land_a[0])
        land_b_survey = to_text(land_b[0])

        land_a_status = land_a[3]
        land_b_status = land_b[3]

        # Expected identity based on current land records
        expected_hash = (
            f"BOUNDARY-{land_a_survey}-{land_b_survey}"
        )

        print()
        print("========================================")
        print("          HASH ANALYSIS")
        print("========================================")

        print(f"Boundary ID       : {boundary_id}")
        print(f"Land A ID         : {land_a_id}")
        print(f"Land A Survey     : {land_a_survey}")
        print(f"Land B ID         : {land_b_id}")
        print(f"Land B Survey     : {land_b_survey}")

        print()
        print(f"Stored Hash       : {stored_hash}")
        print(f"Expected Hash     : {expected_hash}")

        print()
        print("----------------------------------------")

        if stored_hash == expected_hash:
            print("✓ HASH MATCH")
            print("✓ Boundary identity is consistent.")
            hash_result = "MATCH"
        else:
            print("✗ HASH MISMATCH")
            print("⚠ Boundary identity is inconsistent.")
            hash_result = "MISMATCH"

        print("----------------------------------------")

        print()
        print("========================================")
        print("        VERIFICATION SUMMARY")
        print("========================================")

        print(
            f"Boundary Status   : "
            f"{status_text(boundary_status)}"
        )

        print(
            f"Land #{land_a_id} Status : "
            f"{status_text(land_a_status)}"
        )

        print(
            f"Land #{land_b_id} Status : "
            f"{status_text(land_b_status)}"
        )

        print(f"Hash Integrity    : {hash_result}")

        print()
        print("========================================")

    except Exception as e:
        print()
        print("========================================")
        print("          HASH CHECK FAILED")
        print("========================================")
        print(f"Error: {e}")


if __name__ == "__main__":
    main()