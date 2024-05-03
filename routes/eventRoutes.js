import express from "express";
import { isSeller } from "../middleware/auth.js";
import { getDataUri } from "../utils/features.js";
import { singleUpload } from "../middleware/multer.js";
import { createEvent, deleteEvent, getAllEvents } from "../controllers/eventController.js";

const router = express.Router();

router.post("/create-event",isSeller,singleUpload,createEvent)
router.get("/get-all-events",isSeller,getAllEvents)
router.delete("/delete-event/:id",isSeller,deleteEvent)
export default router;