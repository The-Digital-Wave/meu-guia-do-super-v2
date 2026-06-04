import React from "react";
import { render } from "@testing-library/react-native";
import ConfirmationOverlay from "../ConfirmationOverlay";

describe("ConfirmationOverlay", () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  it("calls onComplete after 400ms", () => {
    const onComplete = jest.fn();
    render(<ConfirmationOverlay onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();
    jest.advanceTimersByTime(400);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not call onComplete before 400ms", () => {
    const onComplete = jest.fn();
    render(<ConfirmationOverlay onComplete={onComplete} />);
    jest.advanceTimersByTime(399);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
