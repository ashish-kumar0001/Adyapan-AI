import { requireString } from "../../src/utils/request";
import { HttpError } from "../../src/utils/httpError";

describe("requireString", () => {
  it("returns the trimmed value for a valid string", () => {
    expect(requireString("  hello  ", "name")).toBe("hello");
  });

  it("returns a non-padded string unchanged", () => {
    expect(requireString("world", "field")).toBe("world");
  });

  it("throws a 400 error for an empty string", () => {
    expect(() => requireString("", "email")).toThrow("email is required");
    try {
      requireString("", "email");
    } catch (e) {
      expect((e as HttpError).statusCode).toBe(400);
    }
  });

  it("throws for a whitespace-only string", () => {
    expect(() => requireString("   ", "password")).toThrow("password is required");
  });

  it.each([undefined, null, 42, {}, [], true])(
    "throws for non-string value %p",
    (value) => {
      expect(() => requireString(value, "field")).toThrow("field is required");
    }
  );

  it("includes the field name in the error message", () => {
    expect(() => requireString(undefined, "username")).toThrow("username is required");
  });
});
