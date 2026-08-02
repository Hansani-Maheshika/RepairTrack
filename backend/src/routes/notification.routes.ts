import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/authenticate.js";
import { AppError } from "../utils/AppError.js";

export const notificationRouter=Router();
notificationRouter.use(authenticate);
notificationRouter.get("/",async(req,res,next)=>{try{if(!req.user)throw new AppError("Authentication required",401);const notifications=await prisma.notification.findMany({where:{userId:req.user.id},take:50,orderBy:{createdAt:"desc"}});res.json({success:true,message:"Notifications retrieved",data:{notifications}})}catch(e){next(e)}});
notificationRouter.patch("/:id/read",async(req,res,next)=>{try{if(!req.user)throw new AppError("Authentication required",401);await prisma.notification.updateMany({where:{id:req.params.id,userId:req.user.id},data:{readAt:new Date()}});res.json({success:true,message:"Notification marked as read",data:null})}catch(e){next(e)}});
