import express
  from "express"

import {
  consumePayment,
  createPaymentChallenge,
  getPaymentChallenge,
  verifyAlgorandPayment,
} from "../x402/x402Service.js"


const router =
  express.Router()


router.post(
  "/challenge",

  (
    req,
    res,
  ) => {
    try {
      const {
        action,
        userId,
        resourceId,
        payerAddress,
      } = req.body


      const payment =
        createPaymentChallenge({
          action,
          userId,
          resourceId,
          payerAddress,
        })


      if (
        payment.status ===
        "Verified"
      ) {
        return res.json({
          ok:
            true,

          paymentRequired:
            false,

          reusable:
            true,

          payment,
        })
      }


      return res
        .status(402)
        .json({
          ok:
            false,

          error:
            "Payment Required",

          x402: {
            version:
              2,

            paymentId:
              payment.paymentId,

            action:
              payment.action,

            resourceId:
              payment.resourceId,

            network:
              payment.network,

            asset:
              "ALGO",

            amountMicroAlgo:
              payment.amountMicroAlgo,

            payTo:
              payment.payTo,

            payerAddress:
              payment.payerAddress,

            expiresAt:
              payment.expiresAt,

            reusable:
              payment.reusable,
          },
        })
    } catch (
      error
    ) {
      return res
        .status(400)
        .json({
          ok:
            false,

          message:
            error?.message ||
            "Unable to create x402 challenge.",
        })
    }
  },
)


router.get(
  "/challenge/:paymentId",

  (
    req,
    res,
  ) => {
    const payment =
      getPaymentChallenge(
        req.params.paymentId,
      )

    if (
      !payment
    ) {
      return res
        .status(404)
        .json({
          ok:
            false,

          message:
            "Payment challenge was not found.",
        })
    }

    return res.json({
      ok:
        true,

      payment,
    })
  },
)


router.post(
  "/verify",

  async (
    req,
    res,
  ) => {
    try {
      const payment =
        await verifyAlgorandPayment({
          paymentId:
            req.body.paymentId,

          paymentTxId:
            req.body.paymentTxId,
        })

      return res.json({
        ok:
          true,

        payment,
      })
    } catch (
      error
    ) {
      return res
        .status(400)
        .json({
          ok:
            false,

          message:
            error?.message ||
            "Unable to verify payment.",
        })
    }
  },
)


router.post(
  "/consume",

  (
    req,
    res,
  ) => {
    try {
      const payment =
        consumePayment({
          paymentId:
            req.body.paymentId,

          action:
            req.body.action,

          resourceId:
            req.body.resourceId,
        })

      return res.json({
        ok:
          true,

        message:
          "Payment consumed successfully.",

        payment,
      })
    } catch (
      error
    ) {
      return res
        .status(400)
        .json({
          ok:
            false,

          message:
            error?.message ||
            "Unable to consume payment.",
        })
    }
  },
)


export default router