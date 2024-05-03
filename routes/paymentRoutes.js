import express from "express";
import { paymetsController } from "../controllers/payments.js";

const router = express.Router();

router.post("/payments", paymetsController);

export default router;
