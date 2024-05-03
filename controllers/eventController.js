import Event from "../models/event.js";
import Shop from "../models/shop.js"
import ErrorHandler from "../utils/ErrorHandler.js";
import cloudinary from "cloudinary";
import { singleUpload } from "../middleware/multer.js";
import { getDataUri } from "../utils/features.js";

export const createEvent = async (req, res, next) => {
    try {
        const shopId = req.seller.id;
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return next(new ErrorHandler("Shop Id is invalid!", 400));
        }
        const file = getDataUri(req.file);
        if(!file){
            return next(new ErrorHandler("Image not found",404))
        }
        const cdb = await cloudinary.v2.uploader.upload(file.content);
        const image = {
            public_id: cdb.public_id,
            url: cdb.secure_url,
        };  
        const event = await Event.create({
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            start_Date: req.body.start_Date,
            finish_Date: req.body.finish_Date,
            status: req.body.status || "Running",
            tags: req.body.tags,
            originalPrice: req.body.originalPrice,
            discountPrice: req.body.discountPrice,
            stock: req.body.stock,
            images: [image],
            shopId: shopId,
            shop: shop._id
        });
        res.status(201).json({
            success: true,
            message: "Event created successfully",
            event
        });
    } catch (error) {
        console.log(error)
        next(error);
    }
}

// get all events
export const getAllEvents = async (req, res, next) => {
    try{
        const events = await Event.find();
        res.status(201).json({
            success: true,
            events
        });
    }catch(error){
        next(error);
    }
}

// get all events of a shop
export const getAllEventsOfShop = async(req,res,next)=> {
    try{ 
        const shop = await Shop.findById(req.params.id);
        if(!shop){
            return next(new ErrorHandler("Shop not found", 404));
        }
        const events = await Event.find({shopId: shop._id});
        res.status(201).json({
            success: true,
            events
        });
    }catch(error){
        next(error);
    }
}

// delete event of a shop
export const deleteEvent = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);
        if (!event) {
            return next(new ErrorHandler("Event not found", 404));
        }

        // Delete images from Cloudinary
        for (let i = 0; i < event.images.length; i++) {
            const result = await cloudinary.v2.uploader.destroy(
                event.images[i].public_id
            );
        }

        // Remove the event from the database
        await Event.findByIdAndDelete(eventId);

        res.status(200).json({
            success: true,
            message: "Event deleted successfully"
        });
    } catch (error) {
        next(error);
    }
}