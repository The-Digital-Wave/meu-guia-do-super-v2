import { server } from "./server";
import "@testing-library/react-native/extend-expect";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
