// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middleware/errorMiddleware.js';
import cloudinary from 'cloudinary';
import {connectDatabase} from './db/Database.js';
import dotenv from 'dotenv';
dotenv.config();
import Stripe from "stripe";

const app = express();

//stripe configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));
app.use(errorMiddleware);

// Cloudinary Config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Database Connection
connectDatabase();


// Routes
import userRoutes from "./routes/userRoutes.js"
import shopRoutes from "./routes/shopRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js"
import coupounRoutes from "./routes/coupounRoutes.js"
import eventRoutes from "./routes/eventRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import withdrawRoutes from "./routes/withdrawRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"

app.use("/api/v2/user",userRoutes)
app.use("/api/v2/shop",shopRoutes)
app.use("/api/v2/product",productRoutes)
app.use("/api/v2/category",categoryRoutes)
app.use("/api/v2/coupoun",coupounRoutes)
app.use("/api/v2/event",eventRoutes)
app.use("/api/v2/order",orderRoutes)
app.use("/api/v2/withdraw",withdrawRoutes)
app.use("/api/v2/payment",paymentRoutes)


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
