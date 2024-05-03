import express from "express";
const router = express.Router();
import ErrorHandler from "../utils/ErrorHandler.js";
import Order  from "../models/order.js";
import Shop from "../models/shop.js";
import Product from "../models/product.js";
import CoupounCode from "../models/CoupounCode.js";

// Create New Order
export const createOrder = async (req, res, next) => {
    try{
        const { cart, shippingAddress, totalPrice, paymentInfo} = req.body;
        //   group cart items by shopId
        /*Yeh code cart items ko shopId ke hisaab se group karta hai. Pehle, ek khali Map banaaya jaata hai jismein shopId aur unke corresponding items ko store kiya jaata hai. Fir, har cart item ke liye check kiya jaata hai ki wo kaunse shop ka hai. Agar shopId Map mein nahi hai toh us shopId ke saath ek naya empty array set kiya jaata hai. Phir, cart item us shopId ke corresponding array mein push kiya jaata hai.Uske baad, har shop ke liye ek naya order create kiya jaata hai. Yeh order un shop ke saare items ko, shipping address, user details, total price, aur payment information ke saath create kiya jaata hai. Yeh orders ka ek array banaya jaata hai aur return kiya jaata hai.
*/
        const shopItemsMap = new Map();
        for (const item of cart) {
            const shopId = item.shopId;
            if (!shopItemsMap.has(shopId)) {
                shopItemsMap.set(shopId, []);
              }
              shopItemsMap.get(shopId).push(item);
        }
        // create an order for each shop
      const orders = [];
 
      // create an order for each shop

      /* 
      Is loop mein shopItemsMap ke har entry ke liye, jisme har entry ek shopId aur uske corresponding items ka array hai, ek naya order create kiya jaata hai. Yeh order Order.create() function se banaya jaata hai, jismein cart items (items), shipping address (shippingAddress), user details (user), total price (totalPrice), aur payment information (paymentInfo) shaamil hote hain. Phir, har order ko orders array mein push kiya jaata hai. Isse, har shop ke liye ek alag order banaya jaata hai.
      */

        // Use coupon code if provided

        /*
        Is code mein, hum dekhte hain ki agar coupon code provide kiya gaya hai:

Sabse pehle, hum database mein se coupon code ko dhoondhte hain.
Agar coupon code milta hai aur minimum amount condition bhi poora hota hai, toh hum totalPrice se discount value subtract karte hain.
Agar discountedTotalPrice negative ho jaata hai, toh hum use 0 kar dete hain. Yani ki agar discount ke baad bhi price negative ho rahi hai, to hum use 0 kar dete hain, kyunki price negative nahi ho sakti. */
        // let discountedTotalPrice = totalPrice;
        // if (couponCode) {
        //     const coupounCode = await CoupounCode.findOne({ name: couponCode });
        //     if (coupounCode) {
        //         if (coupounCode.minAmount <= totalPrice && coupounCode.value) {
        //             discountedTotalPrice -= coupounCode.value;
        //             if (discountedTotalPrice < 0) {
        //                 discountedTotalPrice = 0;
        //             }
        //         }
        //     }
        // }
       
      for(const[shopId, items] of shopItemsMap){
        const shop = await Shop.findById(shopId);
        const order = await Order.create({
            cart: items,
            shippingAddress,
            user:req.user.id,
            totalPrice,
            paymentInfo,
            // couponCode
        });
        orders.push(order);
      }
      res.status(201).json({
        success: true,
        orders
      })
    }catch(error){
        next(error);
    }
}

// get all orders of user

export const getAllOrders = async (req, res, next) => {
    try{
        const orders = await Order.find({user: req.user._id});
        res.status(201).json({
            success: true,
            orders
        });
    }catch(error){
        next(error);
    }
}

// get all orders of seller
export const getAllOrdersOfShop = async (req, res, next) => {
    try{
      try {
        const orders = await Order.find({
          "cart.shopId": req.params.shopId,
        }).sort({
          createdAt: -1,
        });
        res.status(200).json({
          success: true,
          orders,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    }catch(error){
        next(error);
    }
}

// update order status for seller

export const updateOrderStatus = async(req,res,next)=> {
try{
    const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }
      if (req.body.status === "Transferred to delivery partner") {
        order.cart.forEach(async (o) => {
          await updateOrder(o._id, o.qty);
        });
      }
      order.status = req.body.status;
      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
        const serviceCharge = order.totalPrice * .10;
        await updateSellerInfo(order.totalPrice - serviceCharge);
      }

      await order.save({ validateBeforeSave: false });
      res.status(200).json({
        success: true,
        order,
      });
      async function updateOrder(id, qty) {
        const product = await Product.findById(id);

        product.stock -= qty;
        product.sold_out += qty;

        await product.save({ validateBeforeSave: false });
      }
      async function updateSellerInfo(amount) {
        const seller = await Shop.findById(req.seller.id);
        
        seller.availableBalance = amount;

        await seller.save();
      }

}catch(error){
    next(error);
}
}