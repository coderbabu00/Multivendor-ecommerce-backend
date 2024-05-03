import jwt from "jsonwebtoken"
import ErrorHandler from "../utils/ErrorHandler.js"
import { getDataUri } from "../utils/features.js";
import cloudinary from "cloudinary";
import {sendShopToken} from "../utils/shopToken.js";
import {sendMail} from "../utils/sendMail.js";
import Shop from "../models/shop.js";

// Create Shop 
// export const createShop = async (req, res, next) => {
//   try {
//     const { email } = req.body;
//     const sellerEmail = await Shop.findOne({ email });

//     if (sellerEmail) {
//       return next(new ErrorHandler("User already exists", 400));
//     }

//     const file = getDataUri(req.file);
//     const cdb = await cloudinary.v2.uploader.upload(file.content);
//     const seller = {
//       name: req.body.name,
//       email: email,
//       password: req.body.password,
//       avatar: {
//         public_id: cdb.public_id,
//         url: cdb.secure_url,
//       },
//       address: req.body.address,
//       phoneNumber: req.body.phoneNumber,
//       zipCode: req.body.zipCode,
//     };

//     // Create the shop
//     const shop = await Shop.create(seller);

//     // Generate activation token
//     const activationToken = createActivationToken(shop);

//     // Construct activation URL
//     const activationUrl = `https://localhost:8000/seller/activation/${activationToken}`;

//     // Send activation email
//     try {
//       await sendMail({
//         email: shop.email, // Corrected to use shop.email
//         subject: "Activate your account",
//         message: `Hello ${shop.name}, please click on the link to activate your account: ${activationUrl}`,
//       });

//       // Send shop token after activation email is sent
//       sendShopToken(shop, 201, res);
//     } catch (error) {
//       next(error);
//     }
//   } catch (error) {
//     next(error);
//   }
// };

// create activation token
const createActivationToken = (seller) => {
    return jwt.sign({ userId: seller._id }, process.env.ACTIVATION_SECRET, {
      expiresIn: "15m",
    });
  };

export const createShop = async (req, res, next) => {
  try {
    const { email } = req.body;
    const sellerEmail = await Shop.findOne({ email });

    if (sellerEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const file = getDataUri(req.file);
    const cdb = await cloudinary.v2.uploader.upload(file.content);
    
    const shop = new Shop({
      name: req.body.name,
      email: email,
      password: req.body.password,
      avatar: {
        public_id: cdb.public_id,
        url: cdb.secure_url,
      },
      address: req.body.address,
      phoneNumber: req.body.phoneNumber,
      zipCode: req.body.zipCode,
    });

    // Save the shop to the database
    await shop.save();

    // Generate activation token
    const activationToken = createActivationToken(shop);

    // Construct activation URL
    const activationUrl = `https://localhost:8000/seller/activation/${activationToken}`;

    // Send activation email
    try {
      await sendMail({
        email: shop.email,
        subject: "Activate your account",
        message: `Hello ${shop.name}, please click on the link to activate your account: ${activationUrl}`,
      });

      // Send shop token after activation email is sent
      sendShopToken(shop, 201, res);
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
};


  // Activate Seller
export const activateSeller = async (req, res, next) => {
  try {
    const { activation_token } = req.body;
    const decodedToken = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
    
    if (!decodedToken || !decodedToken.userId) {
      return next(new ErrorHandler("Invalid token", 400));
    }
    
    // Update shop
    const updatedShop = await Shop.findByIdAndUpdate(decodedToken.userId, { isVerified: true }, { new: true, runValidators: true });

    if (!updatedShop) {
      //log the error
    console.log(error);
      return next(new ErrorHandler("Shop not found", 404));
    }

    await sendMail({
      email: updatedShop.email,
      subject: "Account verified successfully",
      message: `Hello ${updatedShop.name}, your account has been verified successfully, now you can start selling your products!`
    });

    res.status(200).json({
      success: true,
      message: "Shop activated successfully"
    });
  } catch (error) {
    next(error);
  }
};


  // Resend Activtion Token
  export const resendActivationToken = async(req,res,next) => {
    try{
        const {email} = req.body;
        const seller = await Shop.findOne({email});
        if(!seller){
            return next(new ErrorHandler("Shop not found", 404));
        }
        if(seller.isVerified){
            return next(new ErrorHandler("Shop already verified", 400));
        }
        const activationToken = createActivationToken(seller);
        const activationUrl = `https://localhost:8000/seller/activation/${activationToken}`;
        await sendMail({
            email: seller.email,
            subject: "Activate your account",
            message: `Hello ${seller.name}, please click on the link to activate your account: ${activationUrl}`,
        })
        res.status(200).json({
            success:true,
            message:"Email Sent"
        })
    }catch(error){
        next(error);
    }
  }

  // Login Shop 
  export const LoginShop = async(req,res,next) =>{
    try{
       const {email,password} = req.body;
       if(!email || !password){
           return next(new ErrorHandler("Please enter email and password", 400));
       }
       const shop = await Shop.findOne({email}).select("+password");
       if(!shop){
           return next(new ErrorHandler("Invalid email or password", 401));
       }
       const isPasswordMatched = await shop.comparePassword(password);
       if(!isPasswordMatched){
           return next(new ErrorHandler("Invalid email or password", 401));
       }
       sendShopToken(shop, 201, res);
    }catch(error){
        next(error);
    }
  }

  // Get shop info
  export const getShopInfo = async(req,res,next) => {
      try{
        const shop = await Shop.findById(req.params.id);
        res.status(201).json({
          success: true,
          shop,
        });
      }catch(error){
          next(error)
      }
  }

  // update shop profile picture
  export const updateShopAvatar = async(req,res,next)=>{
    try{
     const shop = await Shop.findById(req.params.id);
     if(!shop){
        return next(new ErrorHandler("Shop not found", 404));
     }
     const file = getDataUri(req.file);
     if(!file){
        return next(new ErrorHandler("Please upload image", 400));
     }
    // delete prev image
    await cloudinary.v2.uploader.destroy(shop.avatar.public_id);
    // update
    const cdb = await cloudinary.v2.uploader.upload(file.content);
    const image = {
      public_id: cdb.public_id,
      url: cdb.secure_url,
    };
    shop.avatar = image;
    await shop.save();
    res.status(200).send({
      success: true,
      message: "shop picture updated",
    });
    }catch(error){
        next(error)
    }
  }

  // Update seller info
export const updateSellerInfo = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.seller.id);
    
    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    const { name, address, phoneNumber, zipCode } = req.body;

    // Update shop fields if provided
    if (name !== undefined) shop.name = name;
    if (address !== undefined) shop.address = address;
    if (phoneNumber !== undefined) shop.phoneNumber = phoneNumber;
    if (zipCode !== undefined) shop.zipCode = zipCode;

    await shop.save();

    res.status(201).json({
      success: true,
      shop,
    });
  } catch (error) {
    next(error);
  }
};

 // Forgot Password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const shop = await Shop.findOne({ email });
    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }
    // Generate reset password token and update the document
    const resetToken = shop.getResetPasswordToken(); 
    // Construct reset URL with the token and shop ID
    const resetUrl = `localhost:8000/shop/reset-password?resetToken=${resetToken}&id=${shop._id}`; 
    
    // Send reset password email with the reset URL
    await sendMail({
      email: shop.email,
      subject: "Reset your password",
      message: `Reset your password by clicking on the link below: ${resetUrl}`,
    });

    // Send success response
    res.status(200).json({
      success: true,
      message: "Reset password token sent to your email address",
    });
  } catch (error) {
    next(error);
  }
};

  // Reset Password
  export const resetPassword = async (req, res, next) => {
    try {
      const { resetToken, id } = req.query;
      if (!resetToken || !id) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const shop = await Shop.findById(id);
      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }
      // Check if reset token matches
      if (resetToken !== shop.resetPasswordToken) { 
        return next(new ErrorHandler("Invalid reset token", 400));
      }
      const password = req.body.password;
      const confirmPassword = req.body.confirmPassword;
      if (password !== confirmPassword) {
        return next(new ErrorHandler("Password does not match", 400));
      }
      // Reset password
      shop.password = password;
      shop.resetPasswordToken = undefined; // Clear the reset token
      shop.resetPasswordTime = undefined; // Clear the expiration
      await shop.save();
  
      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Get all sellers(only for admin)
export const getAllSellers = async (req, res, next) => {
    try{
      const sellers = await Shop.find({ role: "seller" });
      res.status(200).json({
        success: true,
        sellers,
      });
    }catch(error){
      next(error);
    }
  }
  
  // Delete Seller (For Admin)
  export const deleteAdmin = async(req,res,next) => {
    try{
        const seller = await Shop.findById(req.params.id);

        if (!seller) {
          return next(
            new ErrorHandler("Seller is not available with this id", 400)
          );
        }
  
        await Shop.findByIdAndDelete(req.params.id);
  
        res.status(201).json({
          success: true,
          message: "Seller deleted successfully!",
        });
    }catch(error){
      next(error);
    }
  }

//   update seller withdraw methods (only sellers)
  export const updateSellerWithdrawMethod = async (req, res, next) => {
    try {
        const { withdrawMethod } = req.body;
  
        const seller = await Shop.findByIdAndUpdate(req.seller._id, {
          withdrawMethod,
        });
  
        res.status(201).json({
          success: true,
          seller,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
  }

//   delete seller withdraw merthods(only sellers)
  export const deleteWithdrawMethode = async(req,res,next)=> {
    try {
        const seller = await Shop.findById(req.seller._id);
  
        if (!seller) {
          return next(new ErrorHandler("Seller not found with this id", 400));
        }
  
        seller.withdrawMethod = null;
  
        await seller.save();
  
        res.status(201).json({
          success: true,
          seller,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
  }