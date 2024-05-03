import User from "../models/user.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { getDataUri } from "../utils/features.js";
import cloudinary from "cloudinary";
import { sendMail } from "../utils/sendMail.js";
import jwt from "jsonwebtoken";
import sendToken from "../utils/jwtToken.js";

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return next(new ErrorHandler("Please enter all fields", 400));
    }
    const userEmail = await User.findOne({ email });
    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }
    // File retrieved from client photo
    const file = getDataUri(req.file);
    // Upload to Cloudinary
    const cdb = await cloudinary.v2.uploader.upload(file.content);
    const user = new User({
      name: name,
      email: email,
      password: password,
      avatar: {
        public_id: cdb.public_id,
        url: cdb.secure_url,
      },
    });
 
    const activationToken = createActivationToken(user);

    const activationUrl = `localhost:8000/activation/${activationToken}`;

    // Send activation email
    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
      });
      // Send token after activation email is sent
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Create activation token
const createActivationToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.ACTIVATION_SECRET, {
    expiresIn: "15m",
  });
};



// Activate User
export const activateUser = async (req, res, next) => {
  try {
    const { activation_token } = req.body;
    const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
    if (!newUser) {
      return next(new ErrorHandler("Invalid token", 400));
    }
    // Update user
    const updatedUser = await User.findByIdAndUpdate(newUser.id, { isVerified: true }, { new: true, runValidators: true });
    if (!updatedUser) {
      return next(new ErrorHandler("User not found", 400));
    }
    await sendMail({
      email: updatedUser.email,
      subject: "Account Activated",
      message: "Your account has been activated",
    })
    res.status(200).json({
      success: true,
      message: "Account has been activated",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Resend activation token
export const resendActivationToken = async (req, res, next) => {
    try{
        const {email} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return next(new ErrorHandler("User not found", 404));
        }
        if(user.isVerefied){
            return next(new ErrorHandler("User already verified", 400));
        }
        const activationToken = createActivationToken(user);
        await sendMail({
            email: user.email,
            subject: "Activate your account",
            message: `Hello ${user.name}, please click on the link to activate your account: localhost:8000/activation/${activationToken}`,
        })
        res.status(200).json({
            success: true,
            message: "Email has been sent",
            data: user
        })
    }catch(error){
        next(error);
    }
}

// Login User
export const loginUser = async (req, res, next) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return next(new ErrorHandler("Please enter all fields", 400));
        }
        const user = await User.findOne({email}).select("+password");
        if(!user){
            return next(new ErrorHandler("Invalid email or password", 401));
        }
        const isPasswordMatched = await user.comparePassword(password);
        if(!isPasswordMatched){
            return next(new ErrorHandler("Invalid email or password", 401));
        }
        sendToken(user, 200, res);
    }catch(error){
        next(error);
    }
}

// Load user
export const loadUser = async(req,res,next) => {
    try{
      const user = await User.findById(req.user.id);
      if(!user){
        return next(new ErrorHandler("User not found",404))
      }
      res.status(200).json({
        success: true,
        user,
      });
    }catch(error){
      return next(new ErrorHandler(error.message, 500));
    }
}

// log out user
export const logoutUser = async(req,res,next) => {
    try{
     res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    }catch(error){
      return next(new ErrorHandler(error.message, 500));
    }
}

// Update user info
export const updateUserInfo = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }

    // Check password validity if provided
    if (password) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(new ErrorHandler("Please provide the correct password", 400));
      }
    }

    // Update user fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    await user.save();

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};


// update user avatar
export const updateUserAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    // Retrieve image from client
    const file = getDataUri(req.file);
    // Upload image to cloudinary
    const cdb = await cloudinary.v2.uploader.upload(file.content);
    user.avatar = {
      public_id: cdb.public_id,
      url: cdb.secure_url,
    };
    await user.save();

    res.status(200).send({
      success: true,
      message: "Profile picture updated",
    });
  } catch (error) {
    console.log(error)
    // return next(new ErrorHandler(error.message, 500));
  }
};


// Forgot Password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    // Generate reset password token
    await user.getResetPasswordToken();
    // Save the user document after getting the reset token
    await user.save();
    const resetUrl = `localhost:8000/shop/reset-password?resetToken=${user.resetPasswordToken}&id=${user._id}`;
    await sendMail({
      email: user.email,
      subject: "Reset your password",
      message: `Reset your password by clicking on the link below: ${resetUrl}`,
    });
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
    const user = await User.findById(id);
    if (!user) {
      return next(new ErrorHandler("Shop not found", 404));
    }
    // Check if reset token matches
    if (resetToken !== user.resetPasswordToken) { 
      return next(new ErrorHandler("Invalid reset token", 400));
    }
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    if (password !== confirmPassword) {
      return next(new ErrorHandler("Password does not match", 400));
    }
    // Reset password
    user.password = password;
    user.resetPasswordToken = undefined; // Clear the reset token
    user.resetPasswordTime = undefined; // Clear the expiration
    await user.save();


    await sendMail({
      email: user.email,
      subject: "Password Reset Successful",
      message: `Your password has been reset successfully.`,
    })

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

// update user addresses
export const updateUserAddress = async(req,res,next) => {
  try {
    const user = await User.findById(req.user.id);

    const sameTypeAddress = user.addresses.find(
      (address) => address.addressType === req.body.addressType
    );
    if (sameTypeAddress) {
      return next(
        new ErrorHandler(`${req.body.addressType} address already exists`)
      );
    }

    const existsAddress = user.addresses.find(
      (address) => address._id === req.body._id
    );

    if (existsAddress) {
      Object.assign(existsAddress, req.body);
    } else {
      // add the new address to the array
      user.addresses.push(req.body);
    }

    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}

// delete user address
export const deleteAddress = async(req,res,next) => {
  try {
    const userId = req.user._id;
    const addressId = req.params.id;

    await User.updateOne(
      {
        _id: userId,
      },
      { $pull: { addresses: { _id: addressId } } }
    );

    const user = await User.findById(userId);

    res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}

// Get user info with userId
export const getUserInfo = async(req,res,next) => {
  try{
    const user = await User.findById(req.user.id);
    if(!user){
      return next(new ErrorHandler("User not found", 404));
    }
    res.status(200).json({
      success: true,
      user,
    });
  }catch(error){
    return next(new ErrorHandler(error.message, 500));
  }
}

// Get all users (Only for admins)
export const getAllUsers = async(req,res,next) => {
  try{
    const users = await User.find();
    res.status(200).json({
      success: true,
      users,
    });
  }catch(error){
    return next(new ErrorHandler(error.message, 500));
  }
}

// Delete users(only admin)
export const deleteUser = async(req,res,next) => {
  try{
    const user = await User.findById(req.params.id);
    const imageId = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(imageId);
    if(!user){
      return next(new ErrorHandler("User not found", 404));
    }
    await user.remove();
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
  }catch(error){
    return next(new ErrorHandler(error.message, 500));
  }
}

