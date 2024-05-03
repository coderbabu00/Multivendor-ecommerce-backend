import express from "express"
const router = express.Router();

import ErrorHandler from "../utils/ErrorHandler.js";
import Order  from "../models/order.js";
import { isAuthenticated, isSeller } from "../middleware/auth.js";
import { createOrder, getAllOrders, getAllOrdersOfShop, updateOrderStatus } from "../controllers/orderController.js";

//create order
router.post("/create-order",isAuthenticated,createOrder)
// Get All Orders of a user
router.get("/get-my-orders",isAuthenticated,getAllOrders)
// get all orders of seller
router.get("/get-orders-for-seller",isSeller,getAllOrdersOfShop)
// Update Order Status
router.put("/update-order-status/:id",isSeller,updateOrderStatus)

export default router;
