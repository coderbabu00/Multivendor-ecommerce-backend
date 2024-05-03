import Product from "../models/product.js";
import Shop from "../models/shop.js";
import { getDataUri } from "../utils/features.js";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/ErrorHandler.js";
import product from "../models/product.js";

export const createProduct = async (req, res, next) => {
    try {
        const shop = await Shop.findById(req.seller.id);
        const { name, description, originalPrice, category, stock, shopId, discountPrice } = req.body;

        // Check if file is provided
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please provide product images",
            });
        }

        // Convert uploaded file to data URI format
        const file = getDataUri(req.file);
        const cdb = await cloudinary.v2.uploader.upload(file.content);

        // Create image object with public_id and URL
        const image = {
            public_id: cdb.public_id,
            url: cdb.secure_url,
        };

        // Create product in the database
        const product = await Product.create({
            name,
            description,
            originalPrice,
            category,
            stock,
            shopId:req.seller.id, // Make sure shopId is provided
            discountPrice, // Make sure discountPrice is provided
            shop,
            images: [image],
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    } catch (error) {
        next(error);
    }
}

// Update Product
export const updateProduct = async (req, res, next) => {
    try{
     const product = await Product.findById(req.params.id);
     if(!product){
        return next(new ErrorHandler("Product not found", 404));
     }
     if(product.shopId !== req.seller.id){
        return next(new ErrorHandler("You are not authorized to update this product", 401));
     }
     const { name, description, originalPrice, category, stock, discountPrice } = req.body;
     if(name !== undefined) product.name = name;
     if(description !== undefined) product.description = description;
     if(originalPrice !== undefined) product.originalPrice = originalPrice;
     if(category !== undefined) product.category = category;
     if(stock !== undefined) product.stock = stock;
     if(discountPrice !== undefined) product.discountPrice = discountPrice;

     await product.save();
     return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product
     })
    }catch(error){
        next(error);
    }
}

// Update Product image
export const updateProductImage = async(req,res,next) => { 
    const product = await Product.findById(req.params.id)
    if(!product){
        return next(new ErrorHandler("Product not found", 404));
    }
    if(product.shopId !== req.seller.id){
        return next(new ErrorHandler("You are not authorized to update this product", 401));
    }
    if (!req.file) {
        return next(new ErrorHandler("Please provide an image", 400));
      }
      const file = getDataUri(req.file);
      const cdb = await cloudinary.v2.uploader.upload(file.content);
    const image = {
      public_id: cdb.public_id,
      url: cdb.secure_url,
    };
    product.images.push(image);
    await product.save();
    res.status(200).json({
      success: true,
      message: "Product image updated successfully",
    })
}

// Get Product
export const getProduct = async(req,res,next) => {
    try{
        const product = await Product.findById(req.params.id);
        if(!product){
            return next(new ErrorHandler("Product not found", 404));
        }
        return res.status(200).json({
            success: true,
            product
        })
    }catch(error){
        next(error);
    }
}

// Delete Product (Seller can delete only his product)
export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }
        if (product.shopId !== req.seller.id) {
            return next(new ErrorHandler("You are not authorized to delete this product", 401));
        }
        await Product.findByIdAndDelete(req.params.id); // Use await here
        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Get Top Products
export const getTopProducts = async (req, res, next) => {
    try {
        const products = await Product.find().sort({ sales: -1 }).limit(3);
        return res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        next(error);
    }
}

// Get All Products
export const getAllProducts = async (req, res, next) => {
    try {
        const products = await Product.find();
        return res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        next(error);
    }
}

// review for a product
export const reviewProduct = async(req,res,next)=>{
    try{
        
        const { user, rating, comment, productId} = req.body;
        const product = await Product.findById(productId)
        const review = {
            user,
            rating,
            comment,
            productId
          };
          const isReviewed = product.reviews.find((rev)=>{
            rev.user._id === req.user._id
          })
          if (isReviewed) {
            product.reviews.forEach((rev) => {
              if (rev.user._id === req.user._id) {
                (rev.rating = rating), (rev.comment = comment), (rev.user = user);
              }
            });
          } else {
            product.reviews.push(review);
          }
          let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });
      product.ratings = avg / product.reviews.length;
    
      // Come here after completing order section and complete this
      await product.save();
    }catch(error){
        next(error);
    }
}