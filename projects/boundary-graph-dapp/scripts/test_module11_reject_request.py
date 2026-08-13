import time

import algokit_utils

from algokit_utils import (
    AlgoAmount,
    PaymentParams,
)

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryClient,
)


APP_ID = 1239


def unique_params(label):
    return algokit_utils.CommonAppCallParams(
        note=f"{label}-{time.time_ns()}".encode()
    )


def make_client(
    algorand,
    account,
):
    return LandRegistryClient(
        algorand=algorand,
        app_id=APP_ID,
        default_sender=account.address,
    )


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
        "MODULE 11 GOVERNMENT REQUEST REJECT TEST"
    )

    print(
        "========================================"
    )


    # -------------------------------------------------
    # CREATE TEMPORARY PUBLIC WALLET
    # -------------------------------------------------

    public_account = (
        algorand.account
        .random()
    )


    public_address = (
        public_account.address
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


    public_client = (
        make_client(
            algorand,
            public_account,
        )
    )


    print()
    print(
        "Temporary Public Wallet:",
        public_address,
    )

    print(
        "Public wallet funded: 2 ALGO"
    )


    # -------------------------------------------------
    # TEST 1
    # PUBLIC SHOULD NOT BE GOVERNMENT
    # -------------------------------------------------

    print()
    print(
        "TEST 1 - Public Role Before Request"
    )


    result = (
        public_client
        .send
        .is_government(
            params=unique_params(
                "before-request"
            )
        )
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
    # PUBLIC SENDS GOVERNMENT REQUEST
    # -------------------------------------------------

    print()
    print(
        "TEST 2 - Send Government Access Request"
    )


    request_result = (
        public_client
        .send
        .request_government_access(
            params=unique_params(
                "send-request"
            )
        )
    )


    request_id = (
        request_result
        .abi_return
    )


    print(
        "Request ID:",
        request_id,
    )


    assert (
        request_id > 0
    )


    print(
        "PASS: Government access request created"
    )


    # -------------------------------------------------
    # TEST 3
    # VERIFY PENDING STATUS
    # -------------------------------------------------

    print()
    print(
        "TEST 3 - Verify Pending Status"
    )


    my_request_result = (
        public_client
        .send
        .get_my_government_request(
            params=unique_params(
                "pending-status"
            )
        )
    )


    my_request = (
        my_request_result
        .abi_return
    )


    my_request_id = (
        my_request[0]
    )

    pending_status = (
        my_request[1]
    )


    print(
        "My Request ID:",
        my_request_id,
    )

    print(
        "Request Status:",
        pending_status,
        "(0 = Pending)",
    )


    assert (
        my_request_id
        ==
        request_id
    )

    assert (
        pending_status == 0
    )


    print(
        "PASS: Request is Pending"
    )


    # -------------------------------------------------
    # TEST 4
    # GOVERNMENT READS REQUEST
    # -------------------------------------------------

    print()
    print(
        "TEST 4 - Government Views Request"
    )


    request_result = (
        government_client
        .send
        .get_government_request(
            args=(
                request_id,
            ),
            params=unique_params(
                "government-view-request"
            )
        )
    )


    request_data = (
        request_result
        .abi_return
    )


    requester_bytes = (
        request_data[0]
    )

    request_status = (
        request_data[1]
    )


    if isinstance(
        requester_bytes,
        list,
    ):
        requester_bytes = bytes(
            requester_bytes
        )


    print(
        "Request Status:",
        request_status,
    )


    assert (
        request_status == 0
    )


    print(
        "PASS: Government can view pending request"
    )


    # -------------------------------------------------
    # TEST 5
    # GOVERNMENT REJECTS REQUEST
    # -------------------------------------------------

    print()
    print(
        "TEST 5 - Government Reject Request"
    )


    government_client \
        .send \
        .reject_government_request(
            args=(
                request_id,
            ),
            params=unique_params(
                "reject-request"
            )
        )


    print(
        "Government rejected request"
    )


    # -------------------------------------------------
    # TEST 6
    # VERIFY REJECTED STATUS
    # -------------------------------------------------

    print()
    print(
        "TEST 6 - Verify Rejected Status"
    )


    rejected_result = (
        public_client
        .send
        .get_my_government_request(
            params=unique_params(
                "rejected-status"
            )
        )
    )


    rejected_data = (
        rejected_result
        .abi_return
    )


    rejected_request_id = (
        rejected_data[0]
    )

    rejected_status = (
        rejected_data[1]
    )


    print(
        "Request ID:",
        rejected_request_id,
    )

    print(
        "Request Status:",
        rejected_status,
        "(2 = Rejected)",
    )


    assert (
        rejected_request_id
        ==
        request_id
    )

    assert (
        rejected_status == 2
    )


    print(
        "PASS: Request status changed to Rejected"
    )


    # -------------------------------------------------
    # TEST 7
    # REJECTED USER MUST REMAIN PUBLIC
    # -------------------------------------------------

    print()
    print(
        "TEST 7 - Role After Rejection"
    )


    role_result = (
        public_client
        .send
        .is_government(
            params=unique_params(
                "role-after-rejection"
            )
        )
    )


    role = (
        role_result
        .abi_return
    )


    print(
        "is_government():",
        role,
    )


    assert (
        role == 0
    )


    print(
        "PASS: Rejected wallet remains Public"
    )


    print()
    print(
        "======================================"
    )

    print(
        "ALL GOVERNMENT REJECT TESTS PASSED"
    )

    print(
        "======================================"
    )


if __name__ == "__main__":
    main()