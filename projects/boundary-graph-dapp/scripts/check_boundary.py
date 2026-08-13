import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
    GetBoundaryArgs,
)

APP_ID = 1080


def main() -> None:
    print("======================================")
    print("       BOUNDARY GRAPH CHECK")
    print("======================================")

    print("Connecting to LocalNet...", flush=True)

    algorand = algokit_utils.AlgorandClient.from_environment()

    print("Getting deployer...", flush=True)

    deployer = algorand.account.from_environment("DEPLOYER")

    print(f"Deployer: {deployer.address}", flush=True)

    print("Creating typed app factory...", flush=True)

    factory = algorand.client.get_typed_app_factory(
        LandRegistryFactory,
        default_sender=deployer.address,
    )

    print(f"Connecting to App ID {APP_ID}...", flush=True)

    app_client = factory.get_app_client_by_id(APP_ID)

    # --------------------------------------------------------
    # Get boundary count
    # --------------------------------------------------------

    print("Calling get_boundary_count()...", flush=True)

    count_result = app_client.send.get_boundary_count()

    boundary_count = count_result.abi_return

    print(
        f"Total registered boundaries: {boundary_count}",
        flush=True,
    )

    if boundary_count == 0:
        print()
        print("No boundaries registered yet.")
        return

    # --------------------------------------------------------
    # Read Boundary 1
    # --------------------------------------------------------

    boundary_id = 1

    print()
    print(
        f"Calling get_boundary({boundary_id})...",
        flush=True,
    )

    result = app_client.send.get_boundary(
        args=GetBoundaryArgs(
            boundary_id=boundary_id,
        )
    )

    land_a, land_b, boundary_hash, verification_status = (
        result.abi_return
    )

    print()
    print("======================================")
    print("       BOUNDARY RECORD")
    print("======================================")

    print(f"Boundary ID          : {boundary_id}")
    print(f"Land A               : {land_a}")
    print(f"Land B               : {land_b}")

    # --------------------------------------------------------
    # Convert returned hash to readable text
    # --------------------------------------------------------

    if isinstance(boundary_hash, list):
        boundary_hash_bytes = bytes(boundary_hash)
    else:
        boundary_hash_bytes = boundary_hash

    try:
        boundary_hash_text = boundary_hash_bytes.decode()
    except UnicodeDecodeError:
        boundary_hash_text = boundary_hash_bytes.hex()

    print(
        f"Boundary Hash        : {boundary_hash_text}"
    )

    print(
        f"Verification Status  : {verification_status}"
    )

    print("======================================")

    if verification_status == 0:
        print("Status: UNVERIFIED")
    elif verification_status == 1:
        print("Status: PENDING")
    elif verification_status == 2:
        print("Status: VERIFIED")
    elif verification_status == 3:
        print("Status: FLAGGED")
    else:
        print("Status: UNKNOWN")

    print("======================================")


if __name__ == "__main__":
    main()