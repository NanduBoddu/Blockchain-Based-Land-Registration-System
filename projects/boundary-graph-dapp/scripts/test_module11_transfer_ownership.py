import algokit_utils
import time
def unique_params(label):
    return algokit_utils.CommonAppCallParams(
        note=f"{label}-{time.time_ns()}".encode()
    )

from algokit_utils import (
    AlgoAmount,
    PaymentParams,
)

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryClient,
)


APP_ID = 1239
LAND_ID = 1


def make_client(
    algorand,
    account,
):
    return LandRegistryClient(
        algorand=algorand,
        app_id=APP_ID,
        default_sender=account.address,
    )


def decode_owner(value):
    if isinstance(
        value,
        list,
    ):
        value = bytes(
            value
        )

    if isinstance(
        value,
        bytes,
    ):
        try:
            return value.decode()
        except UnicodeDecodeError:
            return value.hex()

    return str(value)


def main():

    algorand = (
        algokit_utils
        .AlgorandClient
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
        "MODULE 11 OWNERSHIP TRANSFER TEST"
    )

    print(
        "================================="
    )


    # --------------------------------------------
    # CREATE NEW PUBLIC OWNER
    # --------------------------------------------

    new_owner_account = (
        algorand.account
        .random()
    )

    new_owner_address = (
        new_owner_account.address
    )


    algorand.send.payment(
        PaymentParams(
            sender=
                government.address,

            receiver=
                new_owner_address,

            amount=
                AlgoAmount
                .from_algo(2),
        )
    )


    print()
    print(
        "New Public Owner:",
        new_owner_address,
    )


    public_client = (
        make_client(
            algorand,
            new_owner_account,
        )
    )


    # --------------------------------------------
    # TEST 1
    # READ CURRENT OWNER
    # --------------------------------------------

    print()
    print(
        "TEST 1 - Read Current Owner"
    )


    before_result = (
        government_client
        .send
        .get_land(
            args=(
                LAND_ID,
            )
        )
    )


    before_land = (
        before_result
        .abi_return
    )

    previous_owner = (
        decode_owner(
            before_land[2]
        )
    )


    print(
        "Current Owner Before Transfer:",
        previous_owner,
    )


    # --------------------------------------------
    # TEST 2
    # PUBLIC TRANSFER MUST FAIL
    # --------------------------------------------

    print()
    print(
        "TEST 2 - Public Transfer Attempt"
    )


    try:

        public_client \
            .send \
            .transfer_ownership(
                args=(
                    LAND_ID,

                    new_owner_address
                    .encode(),
                )
            )


        raise AssertionError(
            "Public wallet was allowed "
            "to transfer ownership"
        )


    except Exception as err:

        message = str(
            err
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
            "PASS: Public wallet cannot "
            "transfer ownership"
        )


    # --------------------------------------------
    # TEST 3
    # GOVERNMENT TRANSFER
    # --------------------------------------------

    print()
    print(
        "TEST 3 - Government Transfer Ownership"
    )


    transfer_result = (
        government_client
        .send
        .transfer_ownership(
            args=(
                LAND_ID,

                new_owner_address
                .encode(),
            )
        )
    )


    transfer_id = (
        transfer_result
        .abi_return
    )


    print(
        "Transfer ID:",
        transfer_id,
    )


    assert (
        transfer_id > 0
    )


    print(
        "PASS: Government transferred ownership"
    )


    # --------------------------------------------
    # TEST 4
    # VERIFY NEW CURRENT OWNER
    # --------------------------------------------

    print()
    print(
        "TEST 4 - Verify New Current Owner"
    )


    after_result = (
       government_client
       .send
       .get_land(
           args=(
               LAND_ID,
           ),
           params=unique_params(
               "land-after-transfer"
           )
       )
    )


    after_land = (
        after_result
        .abi_return
    )


    current_owner = (
        decode_owner(
            after_land[2]
        )
    )


    print(
        "Current Owner After Transfer:",
        current_owner,
    )


    assert (
        current_owner
        ==
        new_owner_address
    )


    print(
        "PASS: Current owner updated correctly"
    )


    # --------------------------------------------
    # TEST 5
    # LAND TRANSFER COUNT
    # --------------------------------------------
    count_result = (
       government_client
       .send
       .get_land_transfer_count(
           args=(
               LAND_ID,
           ),
           params=unique_params(
               "land-transfer-count"
           )
       )
    )
    print()
    print(
        "TEST 5 - Land Transfer Count"
    )


    count_result = (
        government_client
        .send
        .get_land_transfer_count(
            args=(
                LAND_ID,
            )
        )
    )


    transfer_count = (
        count_result
        .abi_return
    )


    print(
        "Land Transfer Count:",
        transfer_count,
    )


    assert (
        transfer_count >= 1
    )


    print(
        "PASS: Transfer count recorded"
    )


    # --------------------------------------------
    # TEST 6
    # READ OWNERSHIP HISTORY
    # --------------------------------------------

    history_result = (
       government_client
       .send
       .get_ownership_transfer(
           args=(
               transfer_id,
           ),
           params=unique_params(
               "ownership-history"
           )
       )
    )

    print()
    print(
        "TEST 6 - Ownership History"
    )


    history_result = (
        government_client
        .send
        .get_ownership_transfer(
            args=(
                transfer_id,
            )
        )
    )


    history = (
        history_result
        .abi_return
    )


    history_land_id = (
        history[0]
    )

    history_previous_owner = (
        decode_owner(
            history[1]
        )
    )

    history_new_owner = (
        decode_owner(
            history[2]
        )
    )


    print(
        "History Land ID:",
        history_land_id,
    )

    print(
        "Previous Owner:",
        history_previous_owner,
    )

    print(
        "New Owner:",
        history_new_owner,
    )


    assert (
        history_land_id
        ==
        LAND_ID
    )

    assert (
        history_previous_owner
        ==
        previous_owner
    )

    assert (
        history_new_owner
        ==
        new_owner_address
    )


    print(
        "PASS: Previous owner history preserved"
    )


    print()
    print(
        "======================================"
    )

    print(
        "ALL OWNERSHIP TRANSFER TESTS PASSED"
    )

    print(
        "======================================"
    )


if __name__ == "__main__":
    main()