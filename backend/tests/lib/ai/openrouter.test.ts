const ORIGINAL_ENV = process.env;

jest.mock("../../../src/config/env", () => ({
  env: {
    get openrouterApiKey() { return process.env.OPENROUTER_API_KEY ?? ""; },
    get groqApiKey() { return process.env.GROQ_API_KEY ?? ""; },
    get geminiApiKey() { return process.env.GEMINI_API_KEY ?? ""; },
    get jwtSecret() { return process.env.JWT_SECRET ?? "replace-this-local-secret-before-production"; },
    get nodeEnv() { return process.env.NODE_ENV ?? "development"; }
  }
}));

function loadModule() {
  return require("../../../src/lib/ai/openrouter");
}

function mockFetchOnce(content: string, ok = true) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok,
    statusText: ok ? "OK" : "Bad",
    json: async () => ({ choices: [{ message: { content } }] }),
  });
  (global as any).fetch = fetchMock;
  return fetchMock;
}

describe("openrouter constants", () => {
  it("exposes model presets", () => {
    const { MODELS } = loadModule();
    expect(MODELS.FAST).toBe("google/gemini-2.5-flash");
    expect(MODELS.POWERFUL).toBe("google/gemini-2.5-flash");
  });

  it("exposes a non-empty chat model catalogue with required fields", () => {
    const { CHAT_MODELS } = loadModule();
    expect(Array.isArray(CHAT_MODELS)).toBe(true);
    expect(CHAT_MODELS.length).toBeGreaterThan(0);
    for (const m of CHAT_MODELS) {
      expect(typeof m.id).toBe("string");
      expect(typeof m.name).toBe("string");
      expect(typeof m.provider).toBe("string");
      expect(typeof m.cheap).toBe("boolean");
    }
  });
});

describe("generateJSON", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns the fallback when no providers are configured", async () => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const { generateJSON } = loadModule();
    const fallback = { ok: false };
    await expect(generateJSON("sys", "user", { model: "x" }, fallback)).resolves.toBe(fallback);
  });

  it("parses JSON wrapped in a markdown code fence", async () => {
    process.env.OPENROUTER_API_KEY = "key";
    const { generateJSON } = loadModule();
    mockFetchOnce('```json\n{"answer": 42}\n```');
    await expect(
      generateJSON("sys", "user", { model: "x" }, { answer: 0 })
    ).resolves.toEqual({ answer: 42 });
  });

  it("extracts a JSON object embedded in surrounding prose", async () => {
    process.env.OPENROUTER_API_KEY = "key";
    const { generateJSON } = loadModule();
    mockFetchOnce('Sure, here is the result: {"name": "ady"} hope it helps!');
    await expect(
      generateJSON("sys", "user", { model: "x" }, {})
    ).resolves.toEqual({ name: "ady" });
  });

  it("extracts a JSON array response", async () => {
    process.env.OPENROUTER_API_KEY = "key";
    const { generateJSON } = loadModule();
    mockFetchOnce("[1, 2, 3]");
    await expect(generateJSON("sys", "user", { model: "x" }, [])).resolves.toEqual([1, 2, 3]);
  });

  it("returns the fallback when the response is not valid JSON", async () => {
    process.env.OPENROUTER_API_KEY = "key";
    const { generateJSON } = loadModule();
    mockFetchOnce("this is not json at all");
    const fallback = { fallback: true };
    await expect(generateJSON("sys", "user", { model: "x" }, fallback)).resolves.toBe(fallback);
  });

  it("returns the fallback when the provider responds with an error", async () => {
    process.env.OPENROUTER_API_KEY = "key";
    const { generateJSON } = loadModule();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Server Error",
      json: async () => ({ error: { message: "rate limited" } }),
    });
    (global as any).fetch = fetchMock;
    const fallback = { x: 1 };
    await expect(generateJSON("sys", "user", { model: "x" }, fallback)).resolves.toBe(fallback);
  });
});

describe("generateText", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it("returns the raw completion content", async () => {
    process.env.OPENROUTER_API_KEY = "key";
    const { generateText } = loadModule();
    mockFetchOnce("Hello from the model");
    await expect(generateText("sys", "user", { model: "x" })).resolves.toBe("Hello from the model");
  });

  it("throws when all providers fail", async () => {
    process.env.OPENROUTER_API_KEY = "key";
    const { generateText } = loadModule();
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("network down"));
    await expect(generateText("sys", "user", { model: "x" })).rejects.toThrow(
      /All AI completion providers failed/
    );
  });

  it("throws when no providers are configured", async () => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const { generateText } = loadModule();
    await expect(generateText("sys", "user", { model: "x" })).rejects.toThrow(
      /No AI providers configured/
    );
  });
});
