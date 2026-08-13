import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)


APP_ID = 1080


def verification_text(status):
    if status == 2:
        return "VERIFIED"
    elif status == 1:
        return "PENDING"
    else:
        return "UNVERIFIED"


def main():
    print("========================================")
    print("       BOUNDARY GRAPH INTEGRITY")
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
            boundary_id = int(input("\nEnter Boundary ID to check: "))

            if boundary_id <= 0:
                print("Please enter a positive Boundary ID.")
                continue

            break

        except ValueError:
            print("Invalid input. Please enter a number.")

    print()
    print(f"Reading Boundary #{boundary_id}...")

    try:
        boundary_result = client.send.get_boundary(
            args=(boundary_id,)
        )

        boundary = boundary_result.abi_return

        land_a_id = boundary[0]
        land_b_id = boundary[1]
        boundary_hash = boundary[2]
        boundary_status = boundary[3]

        if isinstance(boundary_hash, list):
            boundary_hash = bytes(boundary_hash).decode(
                "utf-8",
                errors="replace",
            )

        print()
        print("Boundary information loaded successfully.")

        print()
        print("========================================")
        print("          BOUNDARY INFORMATION")
        print("========================================")

        print(f"Boundary ID       : {boundary_id}")
        print(f"Land A ID         : {land_a_id}")
        print(f"Land B ID         : {land_b_id}")
        print(f"Boundary Hash     : {boundary_hash}")
        print(
            f"Boundary Status   : "
            f"{verification_text(boundary_status)}"
        )
        print(f"Status Code       : {boundary_status}")

        # --------------------------------------------------
        # Read Land A
        # --------------------------------------------------

        print()
        print(f"Reading Land #{land_a_id}...")

        land_a_result = client.send.get_land(
            args=(land_a_id,)
        )

        land_a = land_a_result.abi_return

        land_a_survey = land_a[0]
        land_a_extent = land_a[1]
        land_a_owner = land_a[2]
        land_a_status = land_a[3]

        if isinstance(land_a_owner, list):
            land_a_owner = bytes(land_a_owner).hex()

        # --------------------------------------------------
        # Read Land B
        # --------------------------------------------------

        print(f"Reading Land #{land_b_id}...")

        land_b_result = client.send.get_land(
            args=(land_b_id,)
        )

        land_b = land_b_result.abi_return

        land_b_survey = land_b[0]
        land_b_extent = land_b[1]
        land_b_owner = land_b[2]
        land_b_status = land_b[3]

        if isinstance(land_b_owner, list):
            land_b_owner = bytes(land_b_owner).hex()

        # --------------------------------------------------
        # Display connected lands
        # --------------------------------------------------

        print()
        print("========================================")
        print("        CONNECTED LAND RECORDS")
        print("========================================")

        print(f"Land A ID         : {land_a_id}")
        print(f"Survey Number     : {land_a_survey}")
        print(f"Extent            : {land_a_extent}")
        print(
            f"Verification      : "
            f"{verification_text(land_a_status)}"
        )

        print()

        print(f"Land B ID         : {land_b_id}")
        print(f"Survey Number     : {land_b_survey}")
        print(f"Extent            : {land_b_extent}")
        print(
            f"Verification      : "
            f"{verification_text(land_b_status)}"
        )

        # --------------------------------------------------
        # Integrity analysis
        # --------------------------------------------------

        boundary_ok = boundary_status == 2
        land_a_ok = land_a_status == 2
        land_b_ok = land_b_status == 2

        print()
        print("========================================")
        print("           GRAPH ANALYSIS")
        print("========================================")

        if boundary_ok:
            print("✓ Boundary exists")
            print("✓ Boundary is VERIFIED")
        else:
            print("✓ Boundary exists")
            print("⚠ Boundary is NOT VERIFIED")

        if land_a_ok:
            print(f"✓ Land #{land_a_id} is VERIFIED")
        else:
            print(f"⚠ Land #{land_a_id} is NOT VERIFIED")

        if land_b_ok:
            print(f"✓ Land #{land_b_id} is VERIFIED")
        else:
            print(f"⚠ Land #{land_b_id} is NOT VERIFIED")

        print()
        print("----------------------------------------")

        if boundary_ok and land_a_ok and land_b_ok:
            graph_status = "FULLY VERIFIED"
        elif boundary_ok and (land_a_ok or land_b_ok):
            graph_status = "PARTIALLY VERIFIED"
        else:
            graph_status = "NOT VERIFIED"

        print(f"GRAPH STATUS : {graph_status}")

        print("----------------------------------------")

        print()
        print("========================================")
        print("             GRAPH VIEW")
        print("========================================")

        print()
        print(f"Land #{land_a_id}")
        print("    │")
        print(f"    │ Boundary #{boundary_id}")
        print(
            f"    │ "
            f"{verification_text(boundary_status)}"
        )
        print("    │")
        print(f"    ▼")
        print(f"Land #{land_b_id}")

        print()
        print("========================================")

    except Exception as e:
        print()
        print("========================================")
        print("       GRAPH CHECK FAILED")
        print("========================================")
        print(f"Error: {e}")


if __name__ == "__main__":
    main()