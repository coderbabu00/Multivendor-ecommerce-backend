import express from "express"
import { singleUpload } from "../middleware/multer.js";
import { activateUser, deleteUser, forgotPassword, getAllUsers, getUserInfo, loadUser, loginUser, registerUser, resendActivationToken, resetPassword, updateUserAddress, updateUserAvatar, updateUserInfo } from "../controllers/userController.js";
import {isAuthenticated,isAdmin} from "../middleware/auth.js"
const router = express.Router();

router.post("/sign-up",singleUpload,registerUser)
router.post("/verify",activateUser)
router.post("/resend-activation",resendActivationToken)
router.post("/login",loginUser)
router.get("/loadUser/:id",isAuthenticated,loadUser)
router.put("/update",isAuthenticated,updateUserInfo)
router.put("/updateProfilePic",isAuthenticated,singleUpload,updateUserAvatar)
router.post("/forgot-password",forgotPassword)
router.post("/resetPassword",resetPassword)
router.put("/updateAddress",isAuthenticated,updateUserAddress)
router.get("/userInfo/:id",isAuthenticated,getUserInfo)

router.get("/getAll",isAdmin,getAllUsers)
router.delete("/delete/:id",isAdmin,deleteUser)


export default router;