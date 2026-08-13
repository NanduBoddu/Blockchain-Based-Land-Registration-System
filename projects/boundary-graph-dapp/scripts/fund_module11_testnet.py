import os

from dotenv import load_dotenv

import algokit_utils

from algokit_utils import (
    AlgoAmount,
    PaymentParams,
)


APP_ADDRESS = (
    "JXTG2PVROM5Q6DNRZKMRP6VKGWPG7LXMNRLT5OWHZB6RLKPFUX6FC36O2Y"
)


def main():

    load_dotenv(".env")
    load_dotenv(
        ".env.testnet",
        override=True,
    )

    algorand = (
        algokit_utils
        .AlgorandClient
        .from_environment()
    )

    deployer = (
        algorand.account
        .from_environment(
            "DEPLOYER"
        )
    )


    print()
    print(
        "MODULE 11 TESTNET APP FUNDING"
    )

    print(
        "============================="
    )

    print(
        "Deployer:",
        deployer.address,
    )

    print(
        "Application Address:",
        APP_ADDRESS,
    )


    result = (
        algorand.send
        .payment(
            PaymentParams(
                sender=
                    deployer.address,

                receiver=
                    APP_ADDRESS,

                amount=
                    AlgoAmount
                    .from_algo(5),
            )
        )
    )


    print()
    print(
        "APP FUNDED: 5 ALGO"
    )

    print(
        "TX ID:",
        result.tx_id,
    )


if __name__ == "__main__":
    main()