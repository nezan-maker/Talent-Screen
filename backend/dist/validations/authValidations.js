import z from "zod";
export const signupSchema = z.object({
    user_name: z.string().min(3),
    user_email: z.email(),
    user_pass: z
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/),
    user_pass_conf: z
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/),
});
export const loginSchema = z.object({
    user_email: z.email(),
    user_pass: z
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/),
});
export const forgotSchema = z.object({
    user_email: z.email(),
});
export const resetSchema = z.object({
    user_pass: z
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/),
    user_pass_conf: z
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/),
});
//# sourceMappingURL=authValidations.js.map