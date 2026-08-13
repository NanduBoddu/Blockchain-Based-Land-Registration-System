from algokit_utils import AlgorandClient
from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)

APP_ID = 1080
LAND_ID = 6
BOUNDARY_ID = 6


def main():
    print("========== VERIFICATION TEST ==========")

    algorand = AlgorandClient.from_environment()
    deployer = algorand.account.from_environment("DEPLOYER")

    client = LandRegistryFactory(
        algorand,
        default_sender=deployer.address,
    ).get_app_client_by_id(APP_ID)

    print(f"App ID: {client.app_id}")
    print(f"App Address: {client.app_address}")
    print(f"Deployer: {deployer.address}")

    # ---------------------------------------------------------
    # READ CURRENT BOX STATE
    # ---------------------------------------------------------
    land = client.state.box.land_records.get_value(LAND_ID)
    boundary = client.state.box.boundary_records.get_value(BOUNDARY_ID)

    if land is None:
        print(f"ERROR: Land #{LAND_ID} does not exist.")
        return

    if boundary is None:
        print(f"ERROR: Boundary #{BOUNDARY_ID} does not exist.")
        return

    print()
    print("========== BEFORE VERIFICATION ==========")

    print(f"Land #{LAND_ID}")
    print(f"Survey Number: {land.survey_number}")
    print(f"Extent: {land.extent}")
    print(f"Verification Status: {land.verification_status}")

    print()
    print(f"Boundary #{BOUNDARY_ID}")
    print(f"Land A: {boundary.land_a}")
    print(f"Land B: {boundary.land_b}")
    print(f"Verification Status: {boundary.verification_status}")

    # ---------------------------------------------------------
    # VERIFY LAND
    # ---------------------------------------------------------
    print()
    print("========== LAND VERIFICATION ==========")

    if land.verification_status == 2:
        print(f"Land #{LAND_ID} is already VERIFIED.")
    else:
        print(f"Land #{LAND_ID} is not verified.")
        print("Sending verification transaction...")

        result = client.send.verify_land((LAND_ID,))

        print("Land verification successful!")
        print(f"Transaction ID: {result.tx_id}")

    # ---------------------------------------------------------
    # VERIFY BOUNDARY
    # ---------------------------------------------------------
    print()
    print("========== BOUNDARY VERIFICATION ==========")

    if boundary.verification_status == 2:
        print(f"Boundary #{BOUNDARY_ID} is already VERIFIED.")
    else:
        print(f"Boundary #{BOUNDARY_ID} is not verified.")
        print("Sending verification transaction...")

        result = client.send.verify_boundary((BOUNDARY_ID,))

        print("Boundary verification successful!")
        print(f"Transaction ID: {result.tx_id}")

    # ---------------------------------------------------------
    # READ UPDATED BOX STATE
    # ---------------------------------------------------------
    print()
    print("========== AFTER VERIFICATION ==========")

    land_after = client.state.box.land_records.get_value(LAND_ID)
    boundary_after = client.state.box.boundary_records.get_value(BOUNDARY_ID)

    if land_after is None:
        print(f"ERROR: Land #{LAND_ID} disappeared from box state.")
        return

    if boundary_after is None:
        print(f"ERROR: Boundary #{BOUNDARY_ID} disappeared from box state.")
        return

    print(f"Land #{LAND_ID} verification status: {land_after.verification_status}")
    print(
        f"Boundary #{BOUNDARY_ID} verification status: "
        f"{boundary_after.verification_status}"
    )

    # ---------------------------------------------------------
    # FINAL RESULT
    # ---------------------------------------------------------
    print()
    print("========== FINAL RESULT ==========")

    land_verified = land_after.verification_status == 2
    boundary_verified = boundary_after.verification_status == 2

    if land_verified:
        print(f"SUCCESS: Land #{LAND_ID} is VERIFIED.")
    else:
        print(f"ERROR: Land #{LAND_ID} is NOT verified.")

    if boundary_verified:
        print(f"SUCCESS: Boundary #{BOUNDARY_ID} is VERIFIED.")
    else:
        print(f"ERROR: Boundary #{BOUNDARY_ID} is NOT verified.")

    print()

    if land_verified and boundary_verified:
        print("========================================")
        print("VERIFICATION TEST SUCCESSFUL!")
        print("========================================")
    else:
        print("Verification test failed.")


if __name__ == "__main__":
    main()