import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)


APP_ID = 1080


def main():
    print()
    print("======================================")
    print("        LAND VERIFICATION")
    print("======================================")

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

    print()

    land_id = int(input("Enter Land ID to verify: "))

    print()
    print(f"Verifying Land #{land_id}...")
    print()
    print("Submitting verify_land() transaction...")

    result = app_client.send.verify_land(
        args=(land_id,)
    )

    print()
    print("Transaction submitted successfully!")
    print(f"Transaction ID : {result.tx_id}")

    print()
    print("Transaction confirmed!")

    confirmation = result.confirmation

    confirmed_round = confirmation.get("confirmed-round")

    if confirmed_round:
        print(f"Confirmed Round : {confirmed_round}")

    print()
    print(f"Land #{land_id} verification successful!")

    # Read the land again to confirm the state
    print()
    print("Reading updated land record...")

    land_result = app_client.send.get_land(
        args=(land_id,)
    )

    land = land_result.abi_return

    survey_number = land[0]
    extent = land[1]
    owner_bytes = land[2]
    status_code = land[3]

    # Convert owner bytes to hexadecimal
    if isinstance(owner_bytes, list):
        owner = bytes(owner_bytes).hex()
    elif isinstance(owner_bytes, bytes):
        owner = owner_bytes.hex()
    else:
        owner = str(owner_bytes)

    if status_code == 2:
        verification = "VERIFIED"
    elif status_code == 1:
        verification = "PENDING"
    else:
        verification = "UNVERIFIED"

    print()
    print("======================================")
    print("       UPDATED LAND RECORD")
    print("======================================")
    print(f"Land ID            : {land_id}")
    print(f"Survey Number      : {survey_number}")
    print(f"Extent             : {extent}")
    print(f"Owner              : {owner}")
    print(f"Verification       : {verification}")
    print(f"Status Code        : {status_code}")
    print("======================================")
    print()


if __name__ == "__main__":
    main()