import express from "express";
import { createCategory,deleteCategory,getAllCategoriesController,updateCategory} from "../controllers/categoryController.js";
import { isSeller } from "../middleware/auth.js";
const router = express.Router();

router.post("/create",isSeller,createCategory)
router.get("/getAll",isSeller,getAllCategoriesController)
router.put("/update/:id",isSeller,updateCategory)
router.delete("/delete/category/:id",isSeller,deleteCategory)
export default router