import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./utils/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/authRoute.js";
import { contactRouter } from "./routes/contactRoute.js";
import { layoutRouter } from "./routes/layoutRoute.js";
import { navigationRouter } from "./routes/navigationRoute.js";
import { productRouter } from "./routes/productRoute.js";
import { shelfRouter } from "./routes/shelfRoute.js";
import { supermarketRouter } from "./routes/supermarketRoute.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/contact", contactRouter);
app.use("/api/layouts", layoutRouter);
app.use("/api/shelves", shelfRouter);
app.use("/api/products", productRouter);
app.use("/api/supermarkets", supermarketRouter);
app.use("/api/navigation", navigationRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});