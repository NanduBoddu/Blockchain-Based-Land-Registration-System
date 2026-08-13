import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)


APP_ID = 1080


STATUS_NAMES = {
    0: "UNVERIFIED",
    1: "PENDING",
    2: "VERIFIED",
    3: "FLAGGED",
}


def decode_owner(owner):
    """Convert Algorand byte array into readable address."""

    if isinstance(owner, list):
        owner = bytes(owner)

    if isinstance(owner, bytes):
        try:
            return owner.decode("utf-8")
        except UnicodeDecodeError:
            return owner.hex()

    return str(owner)


def main():

    print()
    print("==============================================")
    print("          BOUNDARY GRAPH EXPLORER")
    print("==============================================")

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

    boundary_id = int(input("\nEnter Boundary ID: "))

    print(f"\nReading Boundary #{boundary_id}...")
    print("Calling get_boundary()...")

    boundary_result = app_client.send.get_boundary(
        args=(boundary_id,)
    )

    print("get_boundary() completed.")

    boundary = boundary_result.returns[0].value

    land_a = boundary[0]
    land_b = boundary[1]
    boundary_hash = boundary[2]
    verification_status = boundary[3]

    if isinstance(boundary_hash, list):
        boundary_hash = bytes(boundary_hash)

    if isinstance(boundary_hash, bytes):
        try:
            boundary_hash = boundary_hash.decode("utf-8")
        except UnicodeDecodeError:
            boundary_hash = boundary_hash.hex()

    verification_text = STATUS_NAMES.get(
        verification_status,
        f"UNKNOWN ({verification_status})",
    )

    # --------------------------------------------------
    # Read Land A
    # --------------------------------------------------

    land_a_result = app_client.send.get_land(
        args=(land_a,)
    )

    land_a_record = land_a_result.returns[0].value

    land_a_survey = land_a_record[0]
    land_a_extent = land_a_record[1]
    land_a_owner = decode_owner(land_a_record[2])
    land_a_status = land_a_record[3]

    # --------------------------------------------------
    # Read Land B
    # --------------------------------------------------

    land_b_result = app_client.send.get_land(
        args=(land_b,)
    )

    land_b_record = land_b_result.returns[0].value

    land_b_survey = land_b_record[0]
    land_b_extent = land_b_record[1]
    land_b_owner = decode_owner(land_b_record[2])
    land_b_status = land_b_record[3]

    # --------------------------------------------------
    # Display graph
    # --------------------------------------------------

    print()
    print("==============================================")
    print("             BOUNDARY RELATIONSHIP")
    print("==============================================")

    print()
    print(f"Land A ID          : {land_a}")
    print(f"Survey Number      : {land_a_survey}")
    print(f"Extent             : {land_a_extent}")
    print(f"Owner              : {land_a_owner}")
    print(
        f"Verification       : "
        f"{STATUS_NAMES.get(land_a_status, land_a_status)}"
    )

    print()
    print("                    │")
    print("                    │")
    print(f"             Boundary #{boundary_id}")
    print(f"             {verification_text}")
    print("                    │")
    print("                    │")
    print("                    ▼")
    print()

    print(f"Land B ID          : {land_b}")
    print(f"Survey Number      : {land_b_survey}")
    print(f"Extent             : {land_b_extent}")
    print(f"Owner              : {land_b_owner}")
    print(
        f"Verification       : "
        f"{STATUS_NAMES.get(land_b_status, land_b_status)}"
    )

    print()
    print("==============================================")
    print("              IMMUTABLE BOUNDARY")
    print("==============================================")

    print(f"Boundary ID        : {boundary_id}")
    print(f"Land A             : {land_a}")
    print(f"Land B             : {land_b}")
    print(f"Boundary Hash      : {boundary_hash}")
    print(f"Verification       : {verification_text}")
    print(f"Status Code        : {verification_status}")

    print("==============================================")


if __name__ == "__main__":
    main()