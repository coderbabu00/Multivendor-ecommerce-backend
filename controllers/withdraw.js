import Shop from "../models/shop.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import Withdraw from "../models/withdraw.js"
import { sendMail } from "../utils/sendMail.js";

// Create withdraw request
export const createWithdraw = async (req, res, next) => {
    try{
        const seller = req.seller.id
        const shop = await Shop.findById(req.seller._id);
        const withdraw = await Withdraw.create({
            shop: shop._id,
            amount: req.body.amount,
            seller
        })
        const message = `Your withdraw request of ${withdraw.amount} has been received. We will process it within 24 hours.`
        await sendMail({
            email: shop.email,
            subject: "Withdraw Request",
            message
        })
        res.status(201).json({message, withdraw});
    }catch(error){
        next(error);
    }
}

// Update withdraw request(for admins)
export const updateWithdraw = async (req, res, next) => {
    try{
        const withdraw = await Withdraw.findById(req.params.id);
        withdraw.status = req.body.status;
        await withdraw.save();
        const message = `Your withdraw request of ${withdraw.amount} has been ${withdraw.status}.`
        await Shop.findByIdAndUpdate(withdraw.shop, {
            balance: withdraw.amount
        })
        const seller = await Shop.findById(withdraw.seller);
        await sendMail({
            email: seller.email,
            subject: "Withdraw Request",
            message
        })
        res.status(200).json({message, withdraw});
    }catch(error){
        next(error);
    }
}