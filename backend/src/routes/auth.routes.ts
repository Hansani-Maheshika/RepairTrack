import { Router } from "express";

export const authRouter = Router();

authRouter.post("/login", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "Authentication route is working",
  });
});