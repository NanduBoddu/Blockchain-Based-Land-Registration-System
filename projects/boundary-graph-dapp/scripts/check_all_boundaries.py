import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)

APP_ID = 1080


def decode_hash(value):
    if isinstance(value, list):
        return bytes(value).decode("utf-8")

    if isinstance(value, bytes):
        return value.decode("utf-8")

    return str(value)


def get_status_text(status):
    if status == 0:
        return "UNVERIFIED"
    elif status == 1:
        return "PENDING"
    elif status == 2:
        return "VERIFIED"
    else:
        return f"UNKNOWN ({status})"


def main():
    print()
    print("==============================================")
    print("       BOUNDARY GRAPH - ALL BOUNDARIES")
    print("==============================================")

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

    print("Calling get_boundary_count()...", flush=True)

    count_result = app_client.send.get_boundary_count()

    total_boundaries = count_result.abi_return

    print()
    print(f"Total registered boundaries: {total_boundaries}")
    print()
    print("----------------------------------------------")

    for boundary_id in range(1, total_boundaries + 1):

        print()
        print(f"Reading Boundary ID {boundary_id}...", flush=True)

        result = app_client.send.get_boundary(
            args=(boundary_id,)
        )

        boundary = result.abi_return

        print(f"Raw data: {boundary}", flush=True)

        land_a = boundary[0]
        land_b = boundary[1]
        boundary_hash = boundary[2]
        status = boundary[3]

        print()
        print(f"Boundary ID         : {boundary_id}")
        print(f"Land A              : {land_a}")
        print(f"Land B              : {land_b}")
        print(f"Boundary Hash       : {decode_hash(boundary_hash)}")
        print(f"Verification Status : {status}")
        print(f"Status              : {get_status_text(status)}")

        print("----------------------------------------------")

    print()
    print("==============================================")
    print("      Boundary inspection completed.")
    print("==============================================")


if __name__ == "__main__":
    main()