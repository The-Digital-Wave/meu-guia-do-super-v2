import { prisma } from "../utils/prisma.js";

export const supermarketRepository = {
  list(query?: string) {
    return prisma.supermarket.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
              { address: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        entranceX: true,
        entranceY: true,
      },
      orderBy: { name: "asc" },
    });
  },
  findById(id: string) {
    return prisma.supermarket.findUnique({
      where: { id },
      include: {
        layout: {
          include: {
            navigationNodes: true,
            navigationEdges: true,
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
        },
      },
    });
  },
};
