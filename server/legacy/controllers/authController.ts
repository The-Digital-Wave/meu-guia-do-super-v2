import bcrypt from "bcryptjs";
import type { Request, Response } from "express";

import { prisma } from "../utils/prisma.js";
import { signAdminToken } from "../utils/jwt.js";
import { loginSchema } from "../utils/zodSchemas.js";

export async function login(request: Request, response: Response) {
  const payload = loginSchema.parse(request.body);
  const admin = await prisma.adminUser.findUnique({ where: { email: payload.email } });

  if (!admin) {
    return response.status(401).json({ message: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(payload.password, admin.passwordHash);
  if (!isPasswordValid) {
    return response.status(401).json({ message: "Invalid credentials" });
  }

  return response.json({
    token: signAdminToken({ sub: admin.id, email: admin.email, role: "admin" }),
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    },
  });
}
