from algopy import ARC4Contract, Bytes, String, UInt64, BoxMap, arc4


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

    verification_status:
        0 = Unverified
        1 = Pending
        2 = Verified
        3 = Flagged
    """

    land_a: UInt64
    land_b: UInt64
    boundary_hash: Bytes
    verification_status: UInt64


class LandRegistry(ARC4Contract):
    """
    Decentralized Smart Land Registration & Boundary Verification System.

    Features:
    - Register multiple land parcels
    - Generate unique Land IDs
    - Store land parcels using BoxMap
    - Store survey number
    - Store extent
    - Store owner
    - Track land verification
    - Create boundary relationships
    - Store boundary hashes
    - Verify boundaries
    - Retrieve boundary records
    """

    def __init__(self) -> None:
        # Total registered land parcels
        self.total_lands = UInt64(0)

        # Land ID -> LandRecord
        self.land_records = BoxMap(UInt64, LandRecord)

        # Total registered boundaries
        self.total_boundaries = UInt64(0)

        # Boundary ID -> BoundaryRecord
        self.boundary_records = BoxMap(UInt64, BoundaryRecord)

    # ============================================================
    # MODULE 3 - LAND REGISTRATION
    # ============================================================

    @arc4.abimethod()
    def register_land(
        self,
        survey_number: String,
        extent: UInt64,
        owner: Bytes,
    ) -> UInt64:

        assert extent > UInt64(0), "Extent must be greater than zero"

        # Generate unique Land ID
        self.total_lands += UInt64(1)
        new_land_id = self.total_lands

        # Create land record
        land_record = LandRecord(
            survey_number,
            extent,
            owner,
            UInt64(0),
        )

        # Store land
        self.land_records[new_land_id] = land_record.copy()

        return new_land_id

    @arc4.abimethod()
    def get_land_count(self) -> UInt64:
        """
        Return total number of registered lands.
        """

        return self.total_lands

    @arc4.abimethod()
    def get_land(
        self,
        land_id: UInt64,
    ) -> arc4.Tuple[
        String,
        UInt64,
        Bytes,
        UInt64,
    ]:

        assert land_id > UInt64(0), "Invalid Land ID"
        assert land_id <= self.total_lands, "Land ID does not exist"

        record = self.land_records[land_id].copy()

        return arc4.Tuple(
            (
                record.survey_number,
                record.extent,
                record.owner,
                record.verification_status,
            )
        )

    @arc4.abimethod()
    def verify_land(
        self,
        land_id: UInt64,
    ) -> None:

        assert land_id > UInt64(0), "Invalid Land ID"
        assert land_id <= self.total_lands, "Land ID does not exist"

        record = self.land_records[land_id].copy()

        updated_record = LandRecord(
            record.survey_number,
            record.extent,
            record.owner,
            UInt64(2),
        )

        self.land_records[land_id] = updated_record.copy()

    @arc4.abimethod()
    def get_verification_status(
        self,
        land_id: UInt64,
    ) -> UInt64:

        assert land_id > UInt64(0), "Invalid Land ID"
        assert land_id <= self.total_lands, "Land ID does not exist"

        return self.land_records[land_id].verification_status

    # ============================================================
    # MODULE 4 - BOUNDARY GRAPH
    # ============================================================

    @arc4.abimethod()
    def add_boundary(
        self,
        land_a: UInt64,
        land_b: UInt64,
        boundary_hash: Bytes,
    ) -> UInt64:
        """
        Create a boundary relationship between two land parcels.

        Returns:
            Unique Boundary ID.
        """

        # Both land parcels must exist
        assert land_a > UInt64(0), "Invalid Land A"
        assert land_b > UInt64(0), "Invalid Land B"

        assert land_a <= self.total_lands, "Land A does not exist"
        assert land_b <= self.total_lands, "Land B does not exist"

        # A land parcel cannot be its own neighbor
        assert land_a != land_b, "Land cannot be its own neighbor"

        # Boundary hash must not be empty
        assert boundary_hash.length > UInt64(0), "Boundary hash required"

        # Generate Boundary ID
        self.total_boundaries += UInt64(1)
        new_boundary_id = self.total_boundaries

        # Create boundary record
        boundary_record = BoundaryRecord(
            land_a,
            land_b,
            boundary_hash,
            UInt64(0),
        )

        # Store boundary
        self.boundary_records[new_boundary_id] = boundary_record.copy()

        return new_boundary_id

    @arc4.abimethod()
    def get_boundary_count(self) -> UInt64:
        """
        Return total number of registered boundaries.
        """

        return self.total_boundaries

    @arc4.abimethod()
    def get_boundary(
        self,
        boundary_id: UInt64,
    ) -> arc4.Tuple[
        UInt64,
        UInt64,
        Bytes,
        UInt64,
    ]:
        """
        Retrieve a boundary record.

        Returns:
            Land A
            Land B
            Boundary hash
            Verification status
        """

        assert boundary_id > UInt64(0), "Invalid Boundary ID"
        assert boundary_id <= self.total_boundaries, (
            "Boundary ID does not exist"
        )

        record = self.boundary_records[boundary_id].copy()

        return arc4.Tuple(
            (
                record.land_a,
                record.land_b,
                record.boundary_hash,
                record.verification_status,
            )
        )

    @arc4.abimethod()
    def verify_boundary(
        self,
        boundary_id: UInt64,
    ) -> None:
        """
        Mark a boundary as verified.

        0 = Unverified
        1 = Pending
        2 = Verified
        3 = Flagged
        """

        assert boundary_id > UInt64(0), "Invalid Boundary ID"
        assert boundary_id <= self.total_boundaries, (
            "Boundary ID does not exist"
        )

        record = self.boundary_records[boundary_id].copy()

        updated_record = BoundaryRecord(
            record.land_a,
            record.land_b,
            record.boundary_hash,
            UInt64(2),
        )

        self.boundary_records[boundary_id] = updated_record.copy()

    @arc4.abimethod()
    def get_boundary_verification_status(
        self,
        boundary_id: UInt64,
    ) -> UInt64:
        """
        Return boundary verification status.
        """

        assert boundary_id > UInt64(0), "Invalid Boundary ID"
        assert boundary_id <= self.total_boundaries, (
            "Boundary ID does not exist"
        )

        return self.boundary_records[
            boundary_id
        ].verification_status