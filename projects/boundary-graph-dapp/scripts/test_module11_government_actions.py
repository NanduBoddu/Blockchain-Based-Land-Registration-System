import algokit_utils

from algokit_utils import (
    AlgoAmount,
    PaymentParams,
)

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryClient,
)


APP_ID = 1239


def make_client(
    algorand,
    account,
):
    return LandRegistryClient(
        algorand=algorand,
        app_id=APP_ID,
        default_sender=account.address,
    )


def expect_government_rejection(
    label,
    action,
):
    print()
    print(label)

    try:
        action()

        print(
            "FAIL: Public wallet was allowed "
            "to perform Government action"
        )

        raise AssertionError(
            "Government authorization failed"
        )

    except Exception as err:
        message = str(err)

        print(
            "Public action rejected"
        )

        print(
            "Error:",
            message,
        )

        assert (
            "Government authorization required"
            in message
            or
            "logic eval error"
            in message.lower()
            or
            "assert"
            in message.lower()
        )

        print(
            "PASS: Public wallet blocked"
        )


def main():

    algorand = (
        algokit_utils.AlgorandClient
        .from_environment()
    )


    government = (
        algorand.account
        .from_environment(
            "DEPLOYER"
        )
    )


    government_client = (
        make_client(
            algorand,
            government,
        )
    )


    public_account = (
        algorand.account
        .random()
    )


    public_client = (
        make_client(
            algorand,
            public_account,
        )
    )


    print()
    print(
        "MODULE 11 GOVERNMENT ACTION TEST"
    )

    print(
        "================================"
    )


    # -------------------------------------------------
    # FUND PUBLIC WALLET
    # -------------------------------------------------

    algorand.send.payment(
        PaymentParams(
            sender=
                government.address,

            receiver=
                public_account.address,

            amount=
                AlgoAmount
                .from_algo(2),
        )
    )


    print()
    print(
        "Temporary Public Wallet:",
        public_account.address,
    )

    print(
        "Public wallet funded: 2 ALGO"
    )


    # -------------------------------------------------
    # TEST 1
    # GOVERNMENT REGISTER SECOND LAND
    # -------------------------------------------------

    print()
    print(
        "TEST 1 - Government Register Second Land"
    )


    second_land_result = (
        government_client
        .send
        .register_land(
            args=(
                "GOV-TEST-002",
                2000,
                bytes(
                    government
                    .address
                    .encode()
                ),
            )
        )
    )


    second_land_id = (
        second_land_result
        .abi_return
    )


    print(
        "Second Land ID:",
        second_land_id,
    )


    assert (
        second_land_id > 0
    )


    print(
        "PASS: Government registered second land"
    )


    # -------------------------------------------------
    # TEST 2
    # PUBLIC VERIFY LAND MUST FAIL
    # -------------------------------------------------

    expect_government_rejection(
        "TEST 2 - Public Verify Land Attempt",

        lambda:
            public_client
            .send
            .verify_land(
                args=(
                    1,
                )
            ),
    )


    # -------------------------------------------------
    # TEST 3
    # GOVERNMENT VERIFY LAND
    # -------------------------------------------------

    print()
    print(
        "TEST 3 - Government Verify Land"
    )


    government_client \
        .send \
        .verify_land(
            args=(
                1,
            )
        )


    land_result = (
        government_client
        .send
        .get_land(
            args=(
                1,
            )
        )
    )


    verification_status = (
        land_result
        .abi_return[3]
    )


    print(
        "Land #1 Status:",
        verification_status,
    )


    assert (
        verification_status == 2
    )


    print(
        "PASS: Government verified Land #1"
    )


    # -------------------------------------------------
    # TEST 4
    # PUBLIC ADD BOUNDARY MUST FAIL
    # -------------------------------------------------

    expect_government_rejection(
        "TEST 4 - Public Add Boundary Attempt",

        lambda:
            public_client
            .send
            .add_boundary(
                args=(
                    1,
                    second_land_id,
                    b"PUBLIC-BOUNDARY-TEST",
                )
            ),
    )


    # -------------------------------------------------
    # TEST 5
    # GOVERNMENT ADD BOUNDARY
    # -------------------------------------------------

    print()
    print(
        "TEST 5 - Government Add Boundary"
    )


    boundary_result = (
        government_client
        .send
        .add_boundary(
            args=(
                1,
                second_land_id,
                b"GOV-BOUNDARY-001",
            )
        )
    )


    boundary_id = (
        boundary_result
        .abi_return
    )


    print(
        "Boundary ID:",
        boundary_id,
    )


    assert (
        boundary_id > 0
    )


    print(
        "PASS: Government added boundary"
    )


    # -------------------------------------------------
    # TEST 6
    # PUBLIC VERIFY BOUNDARY MUST FAIL
    # -------------------------------------------------

    expect_government_rejection(
        "TEST 6 - Public Verify Boundary Attempt",

        lambda:
            public_client
            .send
            .verify_boundary(
                args=(
                    boundary_id,
                )
            ),
    )


    # -------------------------------------------------
    # TEST 7
    # GOVERNMENT VERIFY BOUNDARY
    # -------------------------------------------------

    print()
    print(
        "TEST 7 - Government Verify Boundary"
    )


    government_client \
        .send \
        .verify_boundary(
            args=(
                boundary_id,
            )
        )


    boundary_result = (
        government_client
        .send
        .get_boundary(
            args=(
                boundary_id,
            )
        )
    )


    boundary_status = (
        boundary_result
        .abi_return[3]
    )


    print(
        "Boundary Status:",
        boundary_status,
    )


    assert (
        boundary_status == 2
    )


    print(
        "PASS: Government verified boundary"
    )


    print()
    print(
        "========================================"
    )

    print(
        "ALL GOVERNMENT ACTION TESTS PASSED"
    )

    print(
        "========================================"
    )


if __name__ == "__main__":
    main()