import { stripe } from "../server.js";

// ACCEPT PAYMENTS
export const paymetsController = async (req, res) => {
    try {
      // get amount
      const { totalAmount } = req.body;
      // validation
      if (!totalAmount) {
        return res.status(404).send({
          success: false,
          message: "Total Amount is require",
        });
      }
      const { client_secret } = await stripe.paymentIntents.create({
        amount: Number(totalAmount * 100),
        currency: "usd",
      });
      res.status(200).send({
        success: true,
        client_secret,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error In Get UPDATE Products API",
        error,
      });
    }
  };