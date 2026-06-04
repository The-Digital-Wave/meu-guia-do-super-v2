import { toScreen2D, toScreen3D } from "../projection";

describe("toScreen2D", () => {
  it("maps layout centre to canvas centre when not panned", () => {
    const { sx, sy } = toScreen2D(25, 15, 50, 30, 375, 600, 0, 0, 1);
    expect(sx).toBeCloseTo(187.5, 0);
    expect(sy).toBeCloseTo(300, 0);
  });

  it("pan offset shifts output", () => {
    const base = toScreen2D(0, 0, 50, 30, 375, 600, 0, 0, 1);
    const panned = toScreen2D(0, 0, 50, 30, 375, 600, 10, 20, 1);
    expect(panned.sx).toBeCloseTo(base.sx + 10, 1);
    expect(panned.sy).toBeCloseTo(base.sy + 20, 1);
  });
});

describe("toScreen3D", () => {
  it("maps user position to canvas centre", () => {
    const { sx, sy } = toScreen3D(10, 10, 10, 10, 375, 600, 1);
    expect(sx).toBeCloseTo(375 / 2, 1);
    expect(sy).toBeCloseTo(600 / 2, 1);
  });

  it("point to the right of user produces positive sx offset", () => {
    const centre = toScreen3D(10, 10, 10, 10, 375, 600, 1);
    const right = toScreen3D(11, 10, 10, 10, 375, 600, 1);
    expect(right.sx).toBeGreaterThan(centre.sx);
  });
});
