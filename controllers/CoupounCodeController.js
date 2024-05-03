import CoupounCode from "../models/CoupounCode.js";
import Product from "../models/product.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// Create Coupon
export const createCoupounCode = async (req, res, next) => {
    try {
        const { name, value, minAmount, maxAmount, selectedProduct } = req.body;
        const shopId = req.seller.id

        // Check if the selected product exists
        const product = await Product.findById(selectedProduct);
        if (!product) {
            return res.status(404).send({
                success: false,
                message: "Product not found"
            });
        }

        // Check if the user is authorized to create a coupon for this product
        if (product.shopId !== shopId) {
            return res.status(403).send({
                success: false,
                message: "You are not authorized to create a coupon for this product"
            });
        }
        // Create the coupon code
        const coupounCode = await CoupounCode.create({
            name,
            value,
            minAmount,
            maxAmount,
            shopId,
            selectedProduct
        });

        res.status(201).send({
            success: true,
            message: "Coupon created successfully",
            coupounCode
        });
    } catch (error) {
        next(error);
    }
};

// Get all coupons
export const getAllCoupounCodes = async (req, res, next) => {
    try {
        const shopId = req.seller.id;

        // Find all coupons belonging to the shopId
        const coupons = await CoupounCode.find({ shopId });

        // Check if any coupons are found
        if (!coupons || coupons.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No coupons found for this shop"
            });
        }

        res.status(200).send({
            success: true,
            message: "Coupons fetched successfully",
            coupons
        });
    } catch (error) {
        next(error);
    }
};


// delete coupoun code of a shop
export const deleteCoupounCode = async (req, res, next) => {
    try {
        const { id } = req.params;
        const shopId = req.seller.id;

        // Find the coupon by ID and shopId
        const coupon = await CoupounCode.findOne({ _id: id, shopId });

        // Check if the coupon exists and belongs to the seller
        if (!coupon) {
            return res.status(404).send({
                success: false,
                message: "Coupon not found or you are not authorized to delete this coupon"
            });
        }

        // Delete the coupon
        await CoupounCode.findByIdAndDelete(id);

        res.status(200).send({
            success: true,
            message: "Coupon deleted successfully",
            coupon
        });
    } catch (error) {
        next(error);
    }
};


// get coupon code value by its name
export const getCoupounCodeValue = async (req, res, next) => {
    try {
        const { name } = req.params;
        const shopId = req.seller.id;

        // Find the coupon by name and shopId
        const coupon = await CoupounCode.findOne({ name, shopId });

        // Check if the coupon exists
        if (!coupon) {
            return res.status(404).send({
                success: false,
                message: "Coupon not found"
            });
        }

        res.status(200).send({
            success: true,
            message: "Coupon fetched successfully",
            coupon
        });
    } catch (error) {
        next(error);
    }
};