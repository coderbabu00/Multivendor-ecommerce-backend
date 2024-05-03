import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from "crypto"

const { Schema, model } = mongoose;

const shopSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please enter your shop name!'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your shop email address'],
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minLength: [6, 'Password should be greater than 6 characters'],
    select: false,
  },
  description: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  isVerified:{
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    default: 'Seller',
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  zipCode: {
    type: Number,
    required: true,
  },
  withdrawMethod: {
    type: Object,
  },
  availableBalance: {
    type: Number,
    default: 0,
  },
  transections: [
    {
      amount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        default: 'Processing',
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
      updatedAt: {
        type: Date,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});

// Hash password
shopSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// JWT token
shopSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// Compare password
shopSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
shopSchema.methods.getResetPasswordToken = function () {
  // Generate Token 
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Set resetPasswordToken and resetPasswordExpires in the user document
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
  // Save the user document
  this.save();

  // Return the reset token
  return resetToken;
}


export default model('Shop', shopSchema);
