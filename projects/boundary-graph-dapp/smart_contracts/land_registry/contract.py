from algopy import (
    ARC4Contract,
    Bytes,
    String,
    UInt64,
    BoxMap,
    Global,
    Txn,
    arc4,
)


class LandRecord(arc4.Struct):
    """
    Individual land parcel record.
    """

    survey_number: String
    extent: UInt64
    owner: Bytes
    verification_status: UInt64


class BoundaryRecord(arc4.Struct):
    """
    Boundary relationship between two land parcels.
    """

    land_a: UInt64
    land_b: UInt64
    boundary_hash: Bytes
    verification_status: UInt64


class GovernmentRequest(arc4.Struct):
    """
    Government access request.

    status:
    0 = Pending
    1 = Approved
    2 = Rejected
    """

    requester: Bytes
    status: UInt64


class OwnershipTransfer(arc4.Struct):
    """
    Immutable ownership transfer history record.
    """

    land_id: UInt64
    previous_owner: Bytes
    new_owner: Bytes


class LandRegistry(ARC4Contract):
    """
    Decentralized Smart Land Registration
    & Boundary Verification System.

    Roles:
    - Government
    - Public

    Initial Government:
    - Contract creator

    Government permissions:
    - Register land
    - Verify land
    - Add boundary
    - Verify boundary
    - Transfer ownership
    - Approve / reject government requests

    Public permissions:
    - Read land records
    - Read boundary records
    - Request government access
    - Read request status
    - Read ownership history
    """

    def __init__(self) -> None:

        # ====================================================
        # LAND STORAGE
        # ====================================================

        self.total_lands = UInt64(0)

        self.land_records = BoxMap(
            UInt64,
            LandRecord,
            key_prefix="land_",
        )


        # ====================================================
        # BOUNDARY STORAGE
        # ====================================================

        self.total_boundaries = UInt64(0)

        self.boundary_records = BoxMap(
            UInt64,
            BoundaryRecord,
            key_prefix="boundary_",
        )


        # ====================================================
        # GOVERNMENT ROLE STORAGE
        # ====================================================

        # Wallet bytes -> role flag
        #
        # 1 = Government
        self.government_users = BoxMap(
            Bytes,
            UInt64,
            key_prefix="gov_",
        )


        # ====================================================
        # GOVERNMENT ACCESS REQUESTS
        # ====================================================

        self.total_government_requests = UInt64(0)

        self.government_requests = BoxMap(
            UInt64,
            GovernmentRequest,
            key_prefix="gov_req_",
        )


        # Wallet address -> request ID
        #
        # This prevents the same wallet from
        # continuously creating duplicate requests.
        self.requester_request_id = BoxMap(
            Bytes,
            UInt64,
            key_prefix="gov_req_wallet_",
        )


        # ====================================================
        # OWNERSHIP HISTORY
        # ====================================================

        self.total_transfers = UInt64(0)

        self.ownership_transfers = BoxMap(
            UInt64,
            OwnershipTransfer,
            key_prefix="transfer_",
        )


        # Land ID -> number of ownership transfers
        self.land_transfer_counts = BoxMap(
            UInt64,
            UInt64,
            key_prefix="land_transfer_count_",
        )


        # Composite transfer lookup:
        #
        # transfer index key is generated using
        # land_id and the land-specific transfer number.
        #
        # For initial Module 11 implementation,
        # ownership_transfers contains the complete
        # global immutable transfer history.


    # ========================================================
    # INTERNAL AUTHORIZATION
    # ========================================================

    def _is_government(self) -> bool:
        """
        Return True when caller is an authorized
        Government wallet.

        The contract creator is always Government.
        """

        if Txn.sender == Global.creator_address:
            return True

        sender_bytes = Txn.sender.bytes

        if sender_bytes in self.government_users:
            return (
                self.government_users[
                    sender_bytes
                ]
                == UInt64(1)
            )

        return False


    def _require_government(
        self,
    ) -> None:
        """
        Stop execution unless caller is Government.
        """

        assert self._is_government(), \
            "Government authorization required"


    # ========================================================
    # ROLE METHODS
    # ========================================================

    @arc4.abimethod()
    def is_government(self) -> UInt64:
        """
        Check whether the current caller has
        Government privileges.

        Returns:
        1 = Government
        0 = Public
        """

        if self._is_government():
            return UInt64(1)

        return UInt64(0)


    @arc4.abimethod()
    def request_government_access(
        self,
    ) -> UInt64:
        """
        Public wallet requests Government access.

        One active request is maintained per wallet.
        """

        sender_bytes = Txn.sender.bytes

        assert not self._is_government(), \
            "Wallet already has Government access"


        if sender_bytes in self.requester_request_id:

            existing_request_id = (
                self.requester_request_id[
                    sender_bytes
                ]
            )

            existing_request = (
                self.government_requests[
                    existing_request_id
                ].copy()
            )

            # Pending request already exists
            assert (
                existing_request.status
                != UInt64(0)
            ), "Government request already pending"

            # Approved users should already have
            # Government access, but protect anyway.
            assert (
                existing_request.status
                != UInt64(1)
            ), "Government request already approved"


        self.total_government_requests += UInt64(1)

        new_request_id = (
            self.total_government_requests
        )


        request = GovernmentRequest(
            sender_bytes,
            UInt64(0),
        )


        self.government_requests[
            new_request_id
        ] = request.copy()


        self.requester_request_id[
            sender_bytes
        ] = new_request_id


        return new_request_id


    @arc4.abimethod()
    def get_government_request_count(
        self,
    ) -> UInt64:
        """
        Government-only:
        Return total number of access requests.
        """

        self._require_government()

        return self.total_government_requests


    @arc4.abimethod()
    def get_government_request(
        self,
        request_id: UInt64,
    ) -> tuple[Bytes, UInt64]:
        """
        Government-only:
        Retrieve an access request.

        Returns:
        requester wallet
        status
        """

        self._require_government()

        assert request_id > UInt64(0), \
            "Invalid Request ID"

        assert (
            request_id
            <= self.total_government_requests
        ), "Request ID does not exist"


        request = (
            self.government_requests[
                request_id
            ].copy()
        )


        return (
            request.requester,
            request.status,
        )


    @arc4.abimethod()
    def get_my_government_request(
        self,
    ) -> tuple[UInt64, UInt64]:
        """
        Public caller checks their own request.

        Returns:
        request_id
        status

        If no request exists:
        request_id = 0
        status = 0
        """

        sender_bytes = Txn.sender.bytes


        if sender_bytes not in self.requester_request_id:
            return (
                UInt64(0),
                UInt64(0),
            )


        request_id = (
            self.requester_request_id[
                sender_bytes
            ]
        )


        request = (
            self.government_requests[
                request_id
            ].copy()
        )


        return (
            request_id,
            request.status,
        )


    @arc4.abimethod()
    def approve_government_request(
        self,
        request_id: UInt64,
    ) -> None:
        """
        Government approves another wallet.
        """

        self._require_government()


        assert request_id > UInt64(0), \
            "Invalid Request ID"

        assert (
            request_id
            <= self.total_government_requests
        ), "Request ID does not exist"


        request = (
            self.government_requests[
                request_id
            ].copy()
        )


        assert (
            request.status
            == UInt64(0)
        ), "Request is not pending"


        updated_request = GovernmentRequest(
            request.requester,
            UInt64(1),
        )


        self.government_requests[
            request_id
        ] = updated_request.copy()


        self.government_users[
            request.requester
        ] = UInt64(1)


    @arc4.abimethod()
    def reject_government_request(
        self,
        request_id: UInt64,
    ) -> None:
        """
        Government rejects an access request.
        """

        self._require_government()


        assert request_id > UInt64(0), \
            "Invalid Request ID"

        assert (
            request_id
            <= self.total_government_requests
        ), "Request ID does not exist"


        request = (
            self.government_requests[
                request_id
            ].copy()
        )


        assert (
            request.status
            == UInt64(0)
        ), "Request is not pending"


        updated_request = GovernmentRequest(
            request.requester,
            UInt64(2),
        )


        self.government_requests[
            request_id
        ] = updated_request.copy()


    # ========================================================
    # LAND REGISTRATION
    # ========================================================

    @arc4.abimethod()
    def register_land(
        self,
        survey_number: String,
        extent: UInt64,
        owner: Bytes,
    ) -> UInt64:
        """
        Government-only:
        Register a new land parcel.
        """

        self._require_government()


        assert extent > UInt64(0), \
            "Extent must be greater than zero"

        assert owner.length > UInt64(0), \
            "Owner address required"


        self.total_lands += UInt64(1)

        new_land_id = self.total_lands


        land_record = LandRecord(
            survey_number,
            extent,
            owner,
            UInt64(0),
        )


        self.land_records[
            new_land_id
        ] = land_record.copy()


        self.land_transfer_counts[
            new_land_id
        ] = UInt64(0)


        return new_land_id


    @arc4.abimethod()
    def get_land_count(
        self,
    ) -> UInt64:

        return self.total_lands


    @arc4.abimethod()
    def get_land(
        self,
        land_id: UInt64,
    ) -> tuple[
        String,
        UInt64,
        Bytes,
        UInt64,
    ]:

        assert land_id > UInt64(0), \
            "Invalid Land ID"

        assert (
            land_id
            <= self.total_lands
        ), "Land ID does not exist"


        record = (
            self.land_records[
                land_id
            ].copy()
        )


        return (
            record.survey_number,
            record.extent,
            record.owner,
            record.verification_status,
        )


    @arc4.abimethod()
    def verify_land(
        self,
        land_id: UInt64,
    ) -> None:
        """
        Government-only:
        Verify a land parcel.
        """

        self._require_government()


        assert land_id > UInt64(0), \
            "Invalid Land ID"

        assert (
            land_id
            <= self.total_lands
        ), "Land ID does not exist"


        record = (
            self.land_records[
                land_id
            ].copy()
        )


        updated_record = LandRecord(
            record.survey_number,
            record.extent,
            record.owner,
            UInt64(2),
        )


        self.land_records[
            land_id
        ] = updated_record.copy()


    @arc4.abimethod()
    def get_verification_status(
        self,
        land_id: UInt64,
    ) -> UInt64:

        assert land_id > UInt64(0), \
            "Invalid Land ID"

        assert (
            land_id
            <= self.total_lands
        ), "Land ID does not exist"


        return (
            self.land_records[
                land_id
            ].verification_status
        )


    # ========================================================
    # OWNERSHIP TRANSFER
    # ========================================================

    @arc4.abimethod()
    def transfer_ownership(
        self,
        land_id: UInt64,
        new_owner: Bytes,
    ) -> UInt64:
        """
        Government-only:
        Transfer current ownership of a land.

        Old owner remains permanently stored
        in ownership transfer history.

        Returns:
        global transfer ID
        """

        self._require_government()


        assert land_id > UInt64(0), \
            "Invalid Land ID"

        assert (
            land_id
            <= self.total_lands
        ), "Land ID does not exist"

        assert new_owner.length > UInt64(0), \
            "New owner address required"


        record = (
            self.land_records[
                land_id
            ].copy()
        )


        assert (
            record.owner
            != new_owner
        ), "New owner is already current owner"


        previous_owner = record.owner


        self.total_transfers += UInt64(1)

        transfer_id = self.total_transfers


        transfer_record = OwnershipTransfer(
            land_id,
            previous_owner,
            new_owner,
        )


        self.ownership_transfers[
            transfer_id
        ] = transfer_record.copy()


        if land_id in self.land_transfer_counts:
            current_count = (
                self.land_transfer_counts[
                    land_id
                ]
            )
        else:
            current_count = UInt64(0)


        self.land_transfer_counts[
            land_id
        ] = current_count + UInt64(1)


        updated_land = LandRecord(
            record.survey_number,
            record.extent,
            new_owner,
            record.verification_status,
        )


        self.land_records[
            land_id
        ] = updated_land.copy()


        return transfer_id


    @arc4.abimethod()
    def get_transfer_count(
        self,
    ) -> UInt64:
        """
        Return total number of ownership
        transfers across all lands.
        """

        return self.total_transfers


    @arc4.abimethod()
    def get_land_transfer_count(
        self,
        land_id: UInt64,
    ) -> UInt64:
        """
        Return number of ownership transfers
        for a specific land.
        """

        assert land_id > UInt64(0), \
            "Invalid Land ID"

        assert (
            land_id
            <= self.total_lands
        ), "Land ID does not exist"


        if land_id in self.land_transfer_counts:
            return (
                self.land_transfer_counts[
                    land_id
                ]
            )

        return UInt64(0)


    @arc4.abimethod()
    def get_ownership_transfer(
        self,
        transfer_id: UInt64,
    ) -> tuple[
        UInt64,
        Bytes,
        Bytes,
    ]:
        """
        Public:
        Retrieve ownership transfer history.

        Returns:
        land_id
        previous_owner
        new_owner
        """

        assert transfer_id > UInt64(0), \
            "Invalid Transfer ID"

        assert (
            transfer_id
            <= self.total_transfers
        ), "Transfer ID does not exist"


        record = (
            self.ownership_transfers[
                transfer_id
            ].copy()
        )


        return (
            record.land_id,
            record.previous_owner,
            record.new_owner,
        )


    # ========================================================
    # BOUNDARY GRAPH
    # ========================================================

    @arc4.abimethod()
    def add_boundary(
        self,
        land_a: UInt64,
        land_b: UInt64,
        boundary_hash: Bytes,
    ) -> UInt64:
        """
        Government-only:
        Add land boundary relationship.
        """

        self._require_government()


        assert land_a > UInt64(0), \
            "Invalid Land A"

        assert land_b > UInt64(0), \
            "Invalid Land B"


        assert (
            land_a
            <= self.total_lands
        ), "Land A does not exist"

        assert (
            land_b
            <= self.total_lands
        ), "Land B does not exist"


        assert (
            land_a
            != land_b
        ), "Land cannot be its own neighbor"


        assert (
            boundary_hash.length
            > UInt64(0)
        ), "Boundary hash required"


        self.total_boundaries += UInt64(1)

        new_boundary_id = (
            self.total_boundaries
        )


        boundary_record = BoundaryRecord(
            land_a,
            land_b,
            boundary_hash,
            UInt64(0),
        )


        self.boundary_records[
            new_boundary_id
        ] = boundary_record.copy()


        return new_boundary_id


    @arc4.abimethod()
    def get_boundary_count(
        self,
    ) -> UInt64:

        return self.total_boundaries


    @arc4.abimethod()
    def get_boundary(
        self,
        boundary_id: UInt64,
    ) -> tuple[
        UInt64,
        UInt64,
        Bytes,
        UInt64,
    ]:

        assert boundary_id > UInt64(0), \
            "Invalid Boundary ID"

        assert (
            boundary_id
            <= self.total_boundaries
        ), "Boundary ID does not exist"


        record = (
            self.boundary_records[
                boundary_id
            ].copy()
        )


        return (
            record.land_a,
            record.land_b,
            record.boundary_hash,
            record.verification_status,
        )


    @arc4.abimethod()
    def verify_boundary(
        self,
        boundary_id: UInt64,
    ) -> None:
        """
        Government-only:
        Verify a boundary relationship.
        """

        self._require_government()


        assert boundary_id > UInt64(0), \
            "Invalid Boundary ID"

        assert (
            boundary_id
            <= self.total_boundaries
        ), "Boundary ID does not exist"


        record = (
            self.boundary_records[
                boundary_id
            ].copy()
        )


        updated_record = BoundaryRecord(
            record.land_a,
            record.land_b,
            record.boundary_hash,
            UInt64(2),
        )


        self.boundary_records[
            boundary_id
        ] = updated_record.copy()


    @arc4.abimethod()
    def get_boundary_verification_status(
        self,
        boundary_id: UInt64,
    ) -> UInt64:

        assert boundary_id > UInt64(0), \
            "Invalid Boundary ID"

        assert (
            boundary_id
            <= self.total_boundaries
        ), "Boundary ID does not exist"


        return (
            self.boundary_records[
                boundary_id
            ].verification_status
        )