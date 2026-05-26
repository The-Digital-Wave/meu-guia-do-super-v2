import { prisma } from "../utils/prisma.js";

export const layoutRepository = {
  list() {
    return prisma.layout.findMany({
      include: {
        supermarket: true,
        shelves: {
          include: {
            placements: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },
  findById(id: string) {
    return prisma.layout.findUnique({
      where: { id },
      include: {
        supermarket: true,
        shelves: {
          include: {
            placements: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },
  create(data: {
    supermarketId: string;
    name: string;
    description?: string;
    width: number;
    height: number;
    unit: string;
  }) {
    return prisma.layout.create({ data });
  },
  update(id: string, data: Partial<{ name: string; description: string; width: number; height: number; unit: string }>) {
    return prisma.layout.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.layout.delete({ where: { id } });
  },
};
