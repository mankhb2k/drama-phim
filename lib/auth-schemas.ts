import { z } from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .max(32)
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || v.trim().length === 0 || v.trim().length >= 2, {
        message: "Tên đăng nhập ít nhất 2 ký tự",
      }),
    password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
    name: z.string().max(100).optional(),
    email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const u = (data.username ?? "").trim();
      const e = (data.email ?? "").trim();
      return !!(u || e);
    },
    { message: "Phải có username hoặc email" }
  );
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    username: z.string().optional(),
    password: z.string().min(1, "Nhập mật khẩu"),
  })
  .refine(
    (data) => !!data.username?.trim(),
    { message: "Phải có username hoặc email", path: ["username"] }
  );
export type LoginInput = z.infer<typeof loginSchema>;

export const watchHistorySchema = z.object({
  movieId: z.number().int().positive(),
  episodeId: z.number().int().positive().optional(),
  progressSeconds: z.number().int().min(0).optional(),
});
export type WatchHistoryInput = z.infer<typeof watchHistorySchema>;

export const favoriteSchema = z.object({
  movieId: z.number().int().positive(),
});
export type FavoriteInput = z.infer<typeof favoriteSchema>;
