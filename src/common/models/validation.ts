
import { z } from "zod";


export const logInSchema = z.object({
    email: z.string().email("Invalid Email Address")
})

export const userQuerySchema = z.object({
  query: z.string()
    .trim()
    .transform(val => val.replace(/\s+/g, " "))
    .transform(val => val.replace(/[^A-Z0-9\s]/gi, ""))
    .pipe(
      z.string()
        .min(1, { message: "Query can't be empty" })
        .max(30, { message: "Query can't be more than 30 characters" })
    ),
  chatRoomId: z.string().uuid().optional()
});