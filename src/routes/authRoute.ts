import { Router } from "express";
import authController from "../controllers/authController";
import { validateRequestBody } from "../middlewares/validateReqBody";
import { logInSchema } from "../models/loginSchema";


const route = Router();


route.post("/login", validateRequestBody(logInSchema), authController);



export default route;
