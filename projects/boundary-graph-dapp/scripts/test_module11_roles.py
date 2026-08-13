import algosdk
import algokit_utils
import time
def unique_params(label):
    return algokit_utils.CommonAppCallParams(
        note=(
            f"{label}-{time.time_ns()}"
            .encode()
        )
    )

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
        "MODULE 11 ROLE TEST"
    )
    print(
        "==================="
    )


    # -------------------------------------------------
    # TEST 1
    # INITIAL GOVERNMENT
    # -------------------------------------------------

    result = (
        government_client
        .send
        .is_government()
    )

    print()
    print(
        "TEST 1 - Initial Government"
    )
    print(
        "Government wallet:",
        government.address,
    )
    print(
        "is_government():",
        result.abi_return,
    )

    assert (
        result.abi_return == 1
    )

    print(
        "PASS: Creator is Government"
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


    # Fund temporary public wallet.
    # Private key is never printed.
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
    # TEST 2
    # PUBLIC MUST NOT BE GOVERNMENT
    # -------------------------------------------------

    result = (
        public_client
        .send
        .is_government()
    )


    print()
    print(
        "TEST 2 - Public Role"
    )
    print(
        "is_government():",
        result.abi_return,
    )

    assert (
        result.abi_return == 0
    )

    print(
        "PASS: New wallet is Public"
    )


    # -------------------------------------------------
    # TEST 3
    # PUBLIC SENDS GOVERNMENT REQUEST
    # -------------------------------------------------

    print()
    print(
        "TEST 3 - Government Access Request"
    )


    request_result = (
        public_client
        .send
        .request_government_access()
    )


    request_id = (
        request_result.abi_return
    )


    print(
        "Request ID:",
        request_id,
    )

    assert (
        request_id > 0
    )


    my_request = (
       public_client
       .send
       .get_my_government_request(
           params=unique_params(
              "request-after-approval"
           )
       )
    )
    result = (
       public_client
       .send
       .is_government(
           params=unique_params(
               "role-after-approval"
           )
       )
    )


    returned_request_id = (
        my_request
        .abi_return[0]
    )

    request_status = (
        my_request
        .abi_return[1]
    )


    print(
        "My Request ID:",
        returned_request_id,
    )

    print(
        "Request Status:",
        request_status,
        "(0 = Pending)",
    )

    assert (
        returned_request_id
        == request_id
    )

    assert (
        request_status == 0
    )


    print(
        "PASS: Government request is Pending"
    )


    # -------------------------------------------------
    # TEST 4
    # GOVERNMENT VIEWS REQUEST
    # -------------------------------------------------

    print()
    print(
        "TEST 4 - Government Views Request"
    )


    request = (
       government_client
       .send
       .get_government_request(
           args=(
               request_id,
           )
       )
   )


    requester_bytes = (
        request
        .abi_return[0]
    )

    status = (
        request
        .abi_return[1]
    )


    requester_address = (
       algosdk.encoding
       .encode_address(
           bytes(
               requester_bytes
           )
       )
    )


    print(
        "Requester:",
        requester_address,
    )

    print(
        "Status:",
        status,
    )

    assert (
        requester_address
        == public_address
    )

    assert (
        status == 0
    )


    print(
        "PASS: Government can view request"
    )


    # -------------------------------------------------
    # TEST 5
    # GOVERNMENT APPROVES REQUEST
    # -------------------------------------------------

    print()
    print(
        "TEST 5 - Government Approval"
    )


    government_client \
       .send \
       .approve_government_request(
           args=(
               request_id,
           )
       )


    print(
        "Government approved request"
    )


    # -------------------------------------------------
    # TEST 6
    # PUBLIC WALLET BECOMES GOVERNMENT
    # -------------------------------------------------

    result = (
       public_client
       .send
       .is_government(
           params=
               algokit_utils
               .CommonAppCallParams(
                   note=
                       b"module11-after-approval",
               )
       )
    )


    print()
    print(
        "TEST 6 - Role After Approval"
    )
    print(
        "is_government():",
        result.abi_return,
    )


    assert (
        result.abi_return == 1
    )


    my_request = (
        public_client
        .send
        .get_my_government_request()
    )


    print(
        "Request Status:",
        my_request.abi_return[1],
        "(1 = Approved)",
    )


    assert (
        my_request
        .abi_return[1] == 1
    )


    print(
        "PASS: Approved Public wallet "
        "is now Government"
    )


    print()
    print(
        "================================="
    )

    print(
        "ALL MODULE 11 ROLE TESTS PASSED"
    )

    print(
        "================================="
    )


if __name__ == "__main__":
    main()