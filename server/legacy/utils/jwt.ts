import jwt from "jsonwebtoken";

import { env } from "./env.js";

type TokenPayload = {
  sub: string;
  email: string;
  role: "admin";
};

export function signAdminToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "12h" });
}
