import express from "express";
import { isSeller } from "../middleware/auth.js";
import { getDataUri } from "../utils/features.js";
import { singleUpload } from "../middleware/multer.js";
import { createCoupounCode, deleteCoupounCode, getAllCoupounCodes, getCoupounCodeValue } from "../controllers/CoupounCodeController.js";

const router = express.Router();

router.post("/create-coupon",isSeller,createCoupounCode);
router.get("/get-coupons",isSeller,getAllCoupounCodes);
router.delete("/delete-coupon/:id",isSeller,deleteCoupounCode);
router.get("/get-coupons-value/:name",isSeller,getCoupounCodeValue);

export default router