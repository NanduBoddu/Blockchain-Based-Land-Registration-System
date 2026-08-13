import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)


APP_ID = 1080


def main():
    print("========================================")
    print("       BOUNDARY IDENTITY CHECK")
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

    print(
        f"Connecting to LandRegistry App ID {APP_ID}..."
    )

    client = factory.get_app_client_by_id(APP_ID)

    while True:
        try:
            boundary_id = int(
                input("\nEnter Boundary ID to check: ")
            )

            if boundary_id <= 0:
                print(
                    "Boundary ID must be greater than zero."
                )
                continue

            break

        except ValueError:
            print(
                "Please enter a valid numeric Boundary ID."
            )

    print()
    print(f"Reading Boundary #{boundary_id}...")

    boundary_result = client.send.get_boundary(
        args=(boundary_id,)
    )

    boundary = boundary_result.abi_return

    land_a_id = boundary[0]
    land_b_id = boundary[1]

    stored_hash = boundary[2]

    if isinstance(stored_hash, list):
        stored_hash = bytes(stored_hash).decode(
            "utf-8",
            errors="replace",
        )
    elif isinstance(stored_hash, bytes):
        stored_hash = stored_hash.decode(
            "utf-8",
            errors="replace",
        )

    # Canonical ordering.
    first_id = min(land_a_id, land_b_id)
    second_id = max(land_a_id, land_b_id)

    expected_identity = (
        f"BOUNDARY-{first_id}-{second_id}"
    )

    print()
    print("========================================")
    print("        BOUNDARY IDENTITY")
    print("========================================")

    print(f"Boundary ID       : {boundary_id}")
    print(f"Land A ID         : {land_a_id}")
    print(f"Land B ID         : {land_b_id}")

    print()
    print(f"Stored Hash       : {stored_hash}")
    print(
        f"Expected Identity : "
        f"{expected_identity}"
    )

    print()
    print("----------------------------------------")

    if stored_hash == expected_identity:
        print("✓ IDENTITY MATCH")
        print("✓ Boundary references are consistent.")
    else:
        print("✗ IDENTITY MISMATCH")
        print(
            "⚠ Stored boundary identity does not "
            "match the connected Land IDs."
        )

    print("----------------------------------------")

    print()
    print("========================================")


if __name__ == "__main__":
    main()