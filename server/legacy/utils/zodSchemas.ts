import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createLayoutSchema = z.object({
  supermarketId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(["meters", "pixels"]).default("meters"),
});

export const updateLayoutSchema = createLayoutSchema.partial().omit({ supermarketId: true });

export const createShelfSchema = z.object({
  layoutId: z.string().min(1),
  name: z.string().min(2),
  sectionName: z.string().min(2),
  color: z.string().default("#1f6f5f"),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0),
  racks: z.number().int().min(1).default(1),
  sections: z.number().int().min(1).default(1),
});

export const updateShelfSchema = createShelfSchema.partial().omit({ layoutId: true });

export const createProductSchema = z.object({
  name: z.string().min(2),
  brand: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  shelfId: z.string().min(1),
  sectionIndex: z.number().int().min(1),
  quantity: z.number().int().min(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  quantity: z.number().int().min(0).optional(),
  shelfId: z.string().min(1).optional(),
  sectionIndex: z.number().int().min(1).optional(),
});

const navigationStartFields = {
  start: z
    .object({
      x: z.number().min(0),
      y: z.number().min(0),
    })
    .optional(),
  startNodeId: z.string().min(1).optional(),
};

function withNavigationStartValidation<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.refine((value) => Boolean(value.start || value.startNodeId), {
    message: "Either start coordinates or startNodeId must be provided",
    path: ["start"],
  });
}

export const optimizeRouteSchema = withNavigationStartValidation(
  z.object({
    ...navigationStartFields,
    supermarketId: z.string().min(1),
    productIds: z.array(z.string().min(1)).min(1),
  }),
);

export const previewRouteSchema = withNavigationStartValidation(
  z.object({
    ...navigationStartFields,
    supermarketId: z.string().min(1),
    productId: z.string().min(1),
  }),
);

export const snapPositionSchema = z.object({
  supermarketId: z.string().min(1),
  point: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
  }),
});

export const getNavigationGraphSchema = z.object({
  supermarketId: z.string().min(1),
});

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});
