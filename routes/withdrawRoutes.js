import express from "express";
import { createWithdraw, updateWithdraw } from "../controllers/withdraw.js";
import { isSeller,isAdmin } from "../middleware/auth.js";
const router = express.Router();

router.post("/",isSeller,createWithdraw);
router.put("/:id",updateWithdraw);

export default router;