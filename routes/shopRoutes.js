import express from "express";
import { singleUpload } from "../middleware/multer.js";
import {isAuthenticated,isAdmin,isSeller} from "../middleware/auth.js"
import { LoginShop, activateSeller, createShop, forgotPassword, getShopInfo, resendActivationToken, resetPassword, updateSellerInfo, updateShopAvatar } from "../controllers/shopController.js";
const router = express.Router();

router.post("/sign-up",singleUpload,createShop);
router.post("/activate",activateSeller);
router.post("/resendActivation",resendActivationToken)
router.post("/login-shop",LoginShop);
router.get("/getInfo",isSeller,getShopInfo);
router.put("/update-shop-avatar/:id",isSeller,singleUpload,updateShopAvatar);
router.put("/update-seller-info",isSeller,updateSellerInfo);
router.post("/forgot-password",forgotPassword);
router.post("/reset-password",resetPassword);

export default router;

