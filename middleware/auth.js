import ErrorHandler from "../utils/ErrorHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Shop from "../models/shop.js";

// Middleware to check if user is authenticated
export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            throw new ErrorHandler("Please login to continue", 401);
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware to check if user is a seller
export const isSeller = async (req, res, next) => {
    try {
        const sellerToken = req.cookies.seller_token;
        if (!sellerToken) {
            throw new ErrorHandler("Please login to continue", 401);
        }
        const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET_KEY);
        req.seller = await Shop.findById(decoded.id);
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware to check if user is admin
export const isAdmin = (...roles) => {
    return async (req, res, next) => {
        try {
            if (!roles.includes(req.user.role)) {
                throw new ErrorHandler(`${req.user.role} does not have access to this resource!`, 403);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
