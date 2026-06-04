import { useNavigationStore } from "../useNavigationStore";

function resetStore() {
  useNavigationStore.setState({
    navState: "GUIDANCE_ACTIVE",
    transitionProgress: 0,
  });
}

describe("NavState machine", () => {
  beforeEach(resetStore);

  it("starts in GUIDANCE_ACTIVE", () => {
    expect(useNavigationStore.getState().navState).toBe("GUIDANCE_ACTIVE");
  });

  it("transitions to SWIPE_REVEALED", () => {
    useNavigationStore.getState().setNavState("SWIPE_REVEALED");
    expect(useNavigationStore.getState().navState).toBe("SWIPE_REVEALED");
  });

  it("transitions SWIPE_REVEALED → CONFIRMING", () => {
    useNavigationStore.getState().setNavState("SWIPE_REVEALED");
    useNavigationStore.getState().setNavState("CONFIRMING");
    expect(useNavigationStore.getState().navState).toBe("CONFIRMING");
  });

  it("transitions CONFIRMING → QUEUE_ADVANCING", () => {
    useNavigationStore.getState().setNavState("CONFIRMING");
    useNavigationStore.getState().setNavState("QUEUE_ADVANCING");
    expect(useNavigationStore.getState().navState).toBe("QUEUE_ADVANCING");
  });

  it("transitions QUEUE_ADVANCING → GUIDANCE_ACTIVE", () => {
    useNavigationStore.getState().setNavState("QUEUE_ADVANCING");
    useNavigationStore.getState().setNavState("GUIDANCE_ACTIVE");
    expect(useNavigationStore.getState().navState).toBe("GUIDANCE_ACTIVE");
  });

  it("transitions QUEUE_ADVANCING → TRIP_COMPLETE", () => {
    useNavigationStore.getState().setNavState("QUEUE_ADVANCING");
    useNavigationStore.getState().setNavState("TRIP_COMPLETE");
    expect(useNavigationStore.getState().navState).toBe("TRIP_COMPLETE");
  });

  it("mode is 2d when transitionProgress < 0.5", () => {
    useNavigationStore.getState().setTransitionProgress(0.49);
    const mode = useNavigationStore.getState().transitionProgress < 0.5 ? "2d" : "3d";
    expect(mode).toBe("2d");
  });

  it("mode is 3d when transitionProgress >= 0.5", () => {
    useNavigationStore.getState().setTransitionProgress(0.5);
    const mode = useNavigationStore.getState().transitionProgress < 0.5 ? "2d" : "3d";
    expect(mode).toBe("3d");
  });
});
