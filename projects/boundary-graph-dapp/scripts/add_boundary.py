import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
    AddBoundaryArgs,
)

APP_ID = 1080


def main() -> None:
    print()
    print("======================================")
    print("      BOUNDARY GRAPH CREATION")
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

    print(
        f"Connecting to LandRegistry App ID {APP_ID}...",
        flush=True,
    )

    app_client = factory.get_app_client_by_id(APP_ID)

    # --------------------------------------------------------
    # Boundary information
    # --------------------------------------------------------

    land_a = 2
    land_b = 3

    boundary_hash = b"BOUNDARY-SURVEY-002-SURVEY-003"

    print()
    print("Boundary information:")
    print(f"Land A        : {land_a}")
    print(f"Land B        : {land_b}")
    print(f"Boundary Hash : {boundary_hash.decode()}")

    print()
    print("Submitting add_boundary() transaction...", flush=True)

    response = app_client.send.add_boundary(
        args=AddBoundaryArgs(
            land_a=land_a,
            land_b=land_b,
            boundary_hash=boundary_hash,
        )
    )

    print()
    print("======================================")
    print("    BOUNDARY CREATED SUCCESSFULLY")
    print("======================================")
    print(f"Transaction ID : {response.tx_id}")
    print(f"Boundary ID    : {response.abi_return}")
    print(f"Land A         : {land_a}")
    print(f"Land B         : {land_b}")
    print(f"Boundary Hash  : {boundary_hash.decode()}")
    print("Verification   : 0 - Unverified")
    print("======================================")


if __name__ == "__main__":
    main()