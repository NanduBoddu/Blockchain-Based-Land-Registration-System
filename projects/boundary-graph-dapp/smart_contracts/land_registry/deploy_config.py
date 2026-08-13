import logging

import algokit_utils

from smart_contracts.artifacts.land_registry.land_registry_client import (
    LandRegistryFactory,
)

logger = logging.getLogger(__name__)


def deploy() -> None:
    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        LandRegistryFactory,
        default_sender=deployer.address,
    )

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    logger.info(
        f"Deployed {app_client.app_name} "
        f"with app ID {app_client.app_id}"
    )

    logger.info(
        f"Application address: {app_client.app_address}"
    )