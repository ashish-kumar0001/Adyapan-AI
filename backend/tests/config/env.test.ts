describe("env config", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("applies default values when env vars are not set", () => {
    delete process.env.PORT;
    delete process.env.FRONTEND_URL;
    delete process.env.JWT_SECRET;
    delete process.env.NODE_ENV;
    const { env } = require("../../src/config/env");
    expect(env.port).toBe(5000);
    expect(env.frontendUrl).toBe("http://localhost:3000");
    expect(env.jwtSecret).toBe("replace-this-local-secret-before-production");
    expect(env.nodeEnv).toBe("development");
  });

  it("reads values from environment variables", () => {
    process.env.PORT = "8080";
    process.env.FRONTEND_URL = "https://app.example.com";
    process.env.JWT_SECRET = "super-secret";
    const { env } = require("../../src/config/env");
    expect(env.port).toBe(8080);
    expect(env.frontendUrl).toBe("https://app.example.com");
    expect(env.jwtSecret).toBe("super-secret");
  });

  it("coerces PORT to a number", () => {
    process.env.PORT = "3001";
    const { env } = require("../../src/config/env");
    expect(typeof env.port).toBe("number");
    expect(env.port).toBe(3001);
  });

  it("falls back masterDatabaseUrl to DATABASE_URL", () => {
    delete process.env.MASTER_DATABASE_URL;
    process.env.DATABASE_URL = "postgres://db/main";
    const { env } = require("../../src/config/env");
    expect(env.masterDatabaseUrl).toBe("postgres://db/main");
  });

  it("throws in production when JWT_SECRET is left as the default", () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    expect(() => require("../../src/config/env")).toThrow(/JWT_SECRET must be set/);
  });

  it("does not throw in production when JWT_SECRET is set", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "a-real-secret";
    expect(() => require("../../src/config/env")).not.toThrow();
  });

  it("groups nested provider config", () => {
    process.env.CLOUDINARY_CLOUD_NAME = "demo";
    process.env.RAZORPAY_KEY_ID = "rzp_test";
    const { env } = require("../../src/config/env");
    expect(env.cloudinary.cloudName).toBe("demo");
    expect(env.razorpay.keyId).toBe("rzp_test");
    expect(env.neon.regionId).toBe("aws-us-east-1");
  });
});
