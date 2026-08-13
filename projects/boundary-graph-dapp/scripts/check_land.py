from algokit_utils import AlgorandClient
from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)

APP_ID = 1080


def main():
    print("======================================")
    print("      BOUNDARY GRAPH LAND CHECK")
    print("======================================")

    print("Connecting to LocalNet...", flush=True)

    algorand = AlgorandClient.from_environment()

    print("Getting deployer...", flush=True)

    deployer = algorand.account.from_environment("DEPLOYER")

    print(f"Deployer: {deployer.address}", flush=True)

    print("Creating factory...", flush=True)

    factory = algorand.client.get_typed_app_factory(
        LandRegistryFactory,
        default_sender=deployer.address,
    )

    print(f"Connecting to App ID {APP_ID}...", flush=True)

    app_client = factory.get_app_client_by_id(APP_ID)

    print("Calling get_land_count()...", flush=True)

    result1 = app_client.send.get_land_count()

    land_count = result1.abi_return

    print(f"Total registered lands: {land_count}", flush=True)

    print()

    if land_count == 0:
        print("No land parcels are registered yet.")
        print("Register Land ID 1 first.")
        return

    # Check the first registered land
    land_id = 1

    print(f"Calling get_verification_status({land_id})...", flush=True)

    result2 = app_client.send.get_verification_status(
    args=(1,)
    )
    verification_status = result2.abi_return

    print(f"Land ID: {land_id}", flush=True)
    print(f"Verification status: {verification_status}", flush=True)

    print()
    print("========== RESULT ==========")

    if verification_status == 0:
        print("Status: UNVERIFIED")
    elif verification_status == 1:
        print("Status: PENDING NEIGHBOR APPROVAL")
    elif verification_status == 2:
        print("Status: BORDER VERIFIED")
    elif verification_status == 3:
        print("Status: FLAGGED")
    else:
        print("Status: UNKNOWN")

    print("============================")


if __name__ == "__main__":
    main()
