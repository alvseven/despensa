import { z } from "zod";
import { zodCustomErrorMap } from "../../shared/dtos/zod-custom-error-map.ts";

const oneUpperCaseLetterRegex = /(?=.*?[A-Z])/;
const oneLowerCaseLetterRegex = /(?=.*?[a-z])/;
const oneNumberRegex = /(?=.*?\d)/;
const oneSpecialCharacterRegex = /(?=.*?[!@#$%^&*()_+])/;

export const createUserRequestSchema = z
  .object(
    {
      name: z.string().min(1),
      email: z.string().email(),
      avatarUrl: z.string().url(),
      password: z
        .string({
          required_error: "The field 'password' is required",
          invalid_type_error: "The field 'password' should be a string",
        })
        .min(8, {
          message:
            "The password is required and must be at least 8 characters long.",
        })
        .regex(
          oneUpperCaseLetterRegex,
          "At least one uppercase letter is required"
        )
        .regex(
          oneLowerCaseLetterRegex,
          "At least one lowercase letter is required"
        )
        .regex(oneNumberRegex, "At least one number is required")
        .regex(
          oneSpecialCharacterRegex,
          "At least one special character is required"
        ),
      confirmPassword: z.string().min(1, "Password confirmation is required"),
    },
    {
      errorMap: zodCustomErrorMap(["password"]),
    }
  )
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords need to match",
    path: ["confirmPassword"],
  });

export type CreateUserInput = z.infer<typeof createUserRequestSchema>;

export const getUserByIdRequestSchema = z.object({
  id: z.string().uuid(),
});

export type GetUserByIdInput = z.infer<typeof getUserByIdRequestSchema>;

export const userIdSchema = z.object({
  id: z.string().uuid(),
});

export const updateUserByIdRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  password: z
    .string({
      required_error: "The field 'password' is required",
      invalid_type_error: "The field 'password' should be a string",
    })
    .min(8, {
      message:
        "The password is required and must be at least 8 characters long.",
    })
    .regex(oneUpperCaseLetterRegex, "At least one uppercase letter is required")
    .regex(oneLowerCaseLetterRegex, "At least one lowercase letter is required")
    .regex(oneNumberRegex, "At least one number is required")
    .regex(
      oneSpecialCharacterRegex,
      "At least one special character is required"
    )
    .optional(),
});

export type UpdateUserByIdInput = z.infer<typeof updateUserByIdRequestSchema>;

export const deleteUserByIdRequestSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteUserByIdInput = z.infer<typeof deleteUserByIdRequestSchema>;

export const authenticateUserRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string({
      required_error: "The field 'password' is required",
      invalid_type_error: "The field 'password' should be a string",
    })
    .min(8, {
      message:
        "The password is required and must be at least 8 characters long.",
    })
    .regex(oneUpperCaseLetterRegex, "At least one uppercase letter is required")
    .regex(oneLowerCaseLetterRegex, "At least one lowercase letter is required")
    .regex(oneNumberRegex, "At least one number is required")
    .regex(
      oneSpecialCharacterRegex,
      "At least one special character is required"
    ),
});

export type AuthenticateUserInput = z.infer<
  typeof authenticateUserRequestSchema
>;
