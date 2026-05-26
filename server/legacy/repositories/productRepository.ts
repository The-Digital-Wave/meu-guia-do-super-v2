import { prisma } from "../utils/prisma.js";

export const productRepository = {
  list(query?: string, supermarketId?: string) {
    return prisma.product.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { brand: { contains: query, mode: "insensitive" } },
                  { category: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
          supermarketId
            ? {
                placements: {
                  some: {
                    shelf: {
                      layout: {
                        supermarketId,
                      },
                    },
                  },
                },
              }
            : {},
        ],
      },
      include: {
        placements: {
          include: {
            shelf: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 12,
    });
  },
  findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        placements: {
          include: {
            shelf: {
              include: {
                layout: true,
              },
            },
          },
        },
      },
    });
  },
  async create(data: {
    name: string;
    brand?: string;
    description?: string;
    category?: string;
    imageUrl?: string;
    shelfId: string;
    sectionIndex: number;
    quantity: number;
  }) {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        brand: data.brand,
        description: data.description,
        category: data.category,
        imageUrl: data.imageUrl,
      },
    });

    await prisma.stockPlacement.create({
      data: {
        shelfId: data.shelfId,
        productId: product.id,
        sectionIndex: data.sectionIndex,
        quantity: data.quantity,
      },
    });

    return this.findById(product.id);
  },
  async update(id: string, data: Partial<{ name: string; brand: string; description: string; category: string; imageUrl: string; quantity: number; shelfId: string; sectionIndex: number }>) {
    await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        brand: data.brand,
        description: data.description,
        category: data.category,
        imageUrl: data.imageUrl || undefined,
      },
    });

    const existingPlacement = await prisma.stockPlacement.findFirst({ where: { productId: id } });
    if (existingPlacement && (data.quantity !== undefined || data.shelfId || data.sectionIndex)) {
      await prisma.stockPlacement.update({
        where: { id: existingPlacement.id },
        data: {
          quantity: data.quantity,
          shelfId: data.shelfId,
          sectionIndex: data.sectionIndex,
        },
      });
    }

    return this.findById(id);
  },
  async remove(id: string) {
    await prisma.stockPlacement.deleteMany({ where: { productId: id } });
    return prisma.product.delete({ where: { id } });
  },
};
