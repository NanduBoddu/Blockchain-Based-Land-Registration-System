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
    sender,
):
    return LandRegistryClient(
        algorand=algorand,
        app_id=APP_ID,
        default_sender=sender.address,
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


    print()
    print(
        "MODULE 11 PERMISSION TEST"
    )
    print(
        "========================="
    )


    # -------------------------------------------------
    # CREATE TEMPORARY PUBLIC ACCOUNT
    # -------------------------------------------------

    public_account = (
        algorand.account
        .random()
    )

    public_address = (
        public_account.address
    )


    print()
    print(
        "Temporary Public Wallet:",
        public_address,
    )


    algorand.send.payment(
        PaymentParams(
            sender=
                government.address,

            receiver=
                public_address,

            amount=
                AlgoAmount
                .from_algo(2),
        )
    )


    print(
        "Public wallet funded: 2 ALGO"
    )


    public_client = (
        make_client(
            algorand,
            public_account,
        )
    )


    # -------------------------------------------------
    # TEST 1
    # PUBLIC MUST NOT BE GOVERNMENT
    # -------------------------------------------------

    result = (
        public_client
        .send
        .is_government()
    )


    print()
    print(
        "TEST 1 - Public Role Check"
    )

    print(
        "is_government():",
        result.abi_return,
    )


    assert (
        result.abi_return == 0
    )


    print(
        "PASS: Wallet is Public"
    )


    # -------------------------------------------------
    # TEST 2
    # PUBLIC REGISTER LAND MUST FAIL
    # -------------------------------------------------

    print()
    print(
        "TEST 2 - Public Register Land Attempt"
    )


    try:
        public_client \
            .send \
            .register_land(
                args=(
                    "PUBLIC-TEST-001",
                    1000,
                    bytes(
                        public_account
                        .address
                        .encode()
                    ),
                )
            )

        print(
            "FAIL: Public wallet was allowed "
            "to register land"
        )

        raise AssertionError(
            "Public authorization check failed"
        )

    except Exception as err:
        message = str(
            err
        )

        print(
            "Public register attempt rejected"
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
            "PASS: Public wallet cannot register land"
        )


    # -------------------------------------------------
    # TEST 3
    # GOVERNMENT REGISTER LAND MUST SUCCEED
    # -------------------------------------------------

    print()
    print(
        "TEST 3 - Government Register Land"
    )


    government_result = (
        government_client
        .send
        .register_land(
            args=(
                "GOV-TEST-001",
                1500,
                bytes(
                    government.address
                    .encode()
                ),
            )
        )
    )


    land_id = (
        government_result
        .abi_return
    )


    print(
        "Registered Land ID:",
        land_id,
    )


    assert (
        land_id > 0
    )


    print(
        "PASS: Government wallet registered land"
    )


    # -------------------------------------------------
    # TEST 4
    # READ LAND BACK
    # -------------------------------------------------

    print()
    print(
        "TEST 4 - Read Registered Land"
    )


    land_result = (
        government_client
        .send
        .get_land(
            args=(
                land_id,
            )
        )
    )


    land = (
        land_result
        .abi_return
    )


    print(
        "Survey Number:",
        land[0],
    )

    print(
        "Extent:",
        land[1],
    )

    print(
        "Verification Status:",
        land[3],
    )


    assert (
        land[0]
        ==
        "GOV-TEST-001"
    )

    assert (
        land[1]
        ==
        1500
    )


    print(
        "PASS: Registered land read successfully"
    )


    print()
    print(
        "===================================="
    )

    print(
        "ALL MODULE 11 PERMISSION TESTS PASSED"
    )

    print(
        "===================================="
    )


if __name__ == "__main__":
    main()