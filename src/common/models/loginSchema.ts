
import { z } from "zod";


export const logInSchema = z.object({
    email: z.string().email("Invalid Email Address")
})