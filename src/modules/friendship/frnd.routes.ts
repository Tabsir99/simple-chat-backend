import { Router } from "express";
import container from "../../inversify/bindings";
import FriendshipController from "./frnd.controller";
import { TYPES } from "../../inversify/types";
import authMiddleware from "../../common/middlewares/authMiddleware";



const friendRoute = Router()
const friendshipController = container.get<FriendshipController>(TYPES.FriendshipController)
friendRoute.use(authMiddleware)

friendRoute.post('/friendships', friendshipController.createFriendRequest)
// Update a friendship (accept, reject, block)
friendRoute.patch('/friendships/:userId', friendshipController.updateFriendship)

  
export default friendRoute;