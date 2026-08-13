import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)

APP_ID = 1080


def decode_bytes(value):
    """Convert ABI byte-array output into readable text."""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")

    if isinstance(value, list):
        try:
            return bytes(value).decode("utf-8", errors="replace")
        except (ValueError, TypeError):
            return str(value)

    return str(value)


def get_status_text(status):
    """Convert verification status code into readable text."""
    if status == 0:
        return "UNVERIFIED"
    elif status == 1:
        return "DISPUTED"
    elif status == 2:
        return "VERIFIED"
    else:
        return f"UNKNOWN ({status})"


def main():
    print()
    print("=" * 55)
    print("          BOUNDARY GRAPH VIEWER")
    print("=" * 55)

    algorand = algokit_utils.AlgorandClient.from_environment()

    print("Connecting to LocalNet...")

    deployer = algorand.account.from_environment("DEPLOYER")

    print(f"Deployer: {deployer.address}")

    factory = algorand.client.get_typed_app_factory(
        LandRegistryFactory,
        default_sender=deployer.address,
    )

    print(f"Connecting to LandRegistry App ID {APP_ID}...")

    app_client = factory.get_app_client_by_id(APP_ID)

    print()

    boundary_id_text = input("Enter Boundary ID: ").strip()

    try:
        boundary_id = int(boundary_id_text)
    except ValueError:
        print("Invalid Boundary ID.")
        return

    print()
    print(f"Reading Boundary #{boundary_id}...")

    response = app_client.send.get_boundary(
        args=(boundary_id,)
    )

    data = response.abi_return

    if not data:
        print("Boundary not found.")
        return

    land_a = data[0]
    land_b = data[1]
    boundary_hash = decode_bytes(data[2])
    status_code = data[3]

    print()
    print("=" * 55)
    print("             BOUNDARY DETAILS")
    print("=" * 55)

    print(f"Boundary ID       : {boundary_id}")
    print(f"Land A            : {land_a}")
    print(f"Land B            : {land_b}")
    print(f"Boundary Hash     : {boundary_hash}")
    print(f"Verification      : {get_status_text(status_code)}")
    print(f"Status Code       : {status_code}")

    print()
    print("-" * 55)
    print("              GRAPH RELATIONSHIP")
    print("-" * 55)

    print()
    print(f"Land {land_a}")
    print("   │")
    print(f"   │  Boundary #{boundary_id}")
    print(f"   │  {get_status_text(status_code)}")
    print("   │")
    print(f"   ▼")
    print(f"Land {land_b}")

    print()
    print("-" * 55)
    print("              IMMUTABLE HASH")
    print("-" * 55)

    print(boundary_hash)

    print()
    print("=" * 55)
    print("          BOUNDARY INSPECTION COMPLETE")
    print("=" * 55)


if __name__ == "__main__":
    main()