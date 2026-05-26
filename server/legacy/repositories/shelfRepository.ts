import { prisma } from "../utils/prisma.js";

type ShelfWriteData = Partial<{
  name: string;
  sectionName: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  racks: number;
  sections: number;
}>;

export const shelfRepository = {
  list() {
    return prisma.shelf.findMany({
      include: {
        placements: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },
  findById(id: string) {
    return prisma.shelf.findUnique({
      where: { id },
      include: {
        placements: {
          include: {
            product: true,
          },
        },
      },
    });
  },
  create(data: {
    layoutId: string;
    name: string;
    sectionName: string;
    color: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    racks: number;
    sections: number;
  }) {
    return prisma.shelf.create({ data });
  },
  /***
   * A shelf move is a geometric x/y translation, plus the navigation points anchored to it (access node and pick nodes).
   * The reason we do this is that the access node and pick nodes are conceptually "attached" to the shelf's position in the layout,
   * so keeping the access node and pickup nodes in sync by the same Δx, Δy is the correct behavior.
   * If we do not do this, the layout and graph drift apart and routing becomes wrong even though the shelf visually moved.
   */
  update(id: string, data: ShelfWriteData) {
    return prisma.$transaction(async (tx) => {
      const currentShelf = await tx.shelf.findUnique({
        where: { id },
        select: {
          x: true,
          y: true,
          accessNodeId: true,
          placements: {
            select: {
              pickNodeId: true,
            },
          },
        },
      });

      if (!currentShelf) {
        throw new Error(`Shelf ${id} not found`);
      }

      const nextX = data.x ?? currentShelf.x;
      const nextY = data.y ?? currentShelf.y;
      const deltaX = nextX - currentShelf.x;
      const deltaY = nextY - currentShelf.y;

      const updatedShelf = await tx.shelf.update({
        where: { id },
        data,
        include: {
          placements: {
            include: {
              product: true,
            },
          },
        },
      });

      if (deltaX === 0 && deltaY === 0) {
        return updatedShelf;
      }

      const nodeIds = new Set<string>();

      if (currentShelf.accessNodeId) {
        nodeIds.add(currentShelf.accessNodeId);
      }

      for (const placement of currentShelf.placements) {
        if (placement.pickNodeId) {
          nodeIds.add(placement.pickNodeId);
        }
      }

      if (nodeIds.size > 0) {
        await tx.indoorNode.updateMany({
          where: {
            id: {
              in: Array.from(nodeIds),
            },
          },
          data: {
            x: {
              increment: deltaX,
            },
            y: {
              increment: deltaY,
            },
          },
        });
      }

      return updatedShelf;
    });
  },
  remove(id: string) {
    return prisma.shelf.delete({ where: { id } });
  },
};
