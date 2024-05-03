import express from "express";
import { isSeller } from "../middleware/auth.js";
import { getDataUri } from "../utils/features.js";
import { singleUpload } from "../middleware/multer.js";
const router = express.Router();

import { createProduct, deleteProduct, getAllProducts, getProduct, getTopProducts, updateProduct, updateProductImage } from "../controllers/productController.js";

router.post("/create-product",isSeller,singleUpload,createProduct);
router.put("/update/product/:id",isSeller,updateProduct)
router.put("/update/productImg/:id",isSeller,singleUpload,updateProductImage)
router.get("/get-product/:id",getProduct)
router.delete("/delete-product/:id",isSeller,deleteProduct)
router.get("/getAllProducts",getAllProducts)
router.get("/getTopProducts",getTopProducts)
export default router