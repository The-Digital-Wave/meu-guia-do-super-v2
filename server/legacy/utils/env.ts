import "dotenv/config";

import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1).optional(),
    DIRECT_DATABASE_URL: z.string().min(1).optional(),
    JWT_SECRET: z.string().min(8).default("change-me"),
    CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
    PORT: z.coerce.number().default(4000),
  })
  .superRefine((values, ctx) => {
    if (!values.DATABASE_URL && !values.DIRECT_DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "Provide DATABASE_URL or DIRECT_DATABASE_URL",
      });
    }
  })
  .transform((values) => {
    const databaseUrl = values.DATABASE_URL ?? values.DIRECT_DATABASE_URL!;
    const directDatabaseUrl = values.DIRECT_DATABASE_URL ?? values.DATABASE_URL!;

    return {
      ...values,
      DATABASE_URL: databaseUrl,
      DIRECT_DATABASE_URL: directDatabaseUrl,
    };
  });

export const env = envSchema.parse(process.env);
