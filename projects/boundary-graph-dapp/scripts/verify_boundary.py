import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)


APP_ID = 1080


def main():
    print("======================================")
    print("      BOUNDARY GRAPH VERIFICATION")
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

    client = factory.get_app_client_by_id(APP_ID)

    # Ask user for Boundary ID
    while True:
        try:
            boundary_id = int(input("\nEnter Boundary ID to verify: "))

            if boundary_id <= 0:
                print("Please enter a positive Boundary ID.")
                continue

            break

        except ValueError:
            print("Invalid input. Please enter a number.")

    print()
    print(f"Verifying Boundary ID {boundary_id}...")
    print()
    print("Submitting verify_boundary() transaction...")

    try:
        result = client.send.verify_boundary(
            args=(boundary_id,)
        )

        print()
        print("Transaction submitted successfully!")
        print(f"Transaction ID : {result.tx_id}")

        confirmation = result.confirmation

        print()
        print("Transaction confirmed!")
        print(
            f"Confirmed Round : "
            f"{confirmation.get('confirmed-round', 'N/A')}"
        )

        print()
        print(
            f"Boundary #{boundary_id} verification successful!"
        )

    except Exception as e:
        print()
        print("======================================")
        print("       BOUNDARY VERIFICATION FAILED")
        print("======================================")
        print(f"Error: {e}")


if __name__ == "__main__":
    main()