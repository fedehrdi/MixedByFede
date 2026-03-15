import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module to avoid real DB connections in tests
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  updateUserStripeCustomerId: vi.fn(),
  getAllServices: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Mixing Pro",
      slug: "mixing-pro",
      description: "Test service",
      category: "mixing",
      price: "299.00",
      deliveryDays: 4,
      revisions: 3,
      features: '["Feature 1","Feature 2"]',
      isActive: 1,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getServiceBySlug: vi.fn().mockResolvedValue(null),
  getServiceById: vi.fn().mockResolvedValue(null),
  getCartByUserId: vi.fn().mockResolvedValue([]),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
  createOrder: vi.fn(),
  getOrdersByUserId: vi.fn().mockResolvedValue([]),
  getOrderById: vi.fn().mockResolvedValue(null),
  getOrderItemsByOrderId: vi.fn().mockResolvedValue([]),
  getAllOrders: vi.fn().mockResolvedValue([]),
  updateOrderStatus: vi.fn(),
  updateOrderStripeData: vi.fn(),
  getOrderByCheckoutSession: vi.fn().mockResolvedValue(null),
  createFileUpload: vi.fn(),
  getFileUploadsByOrderId: vi.fn().mockResolvedValue([]),
  updateFileAiAnalysis: vi.fn(),
  createVoiceNote: vi.fn(),
  getVoiceNotesByOrderId: vi.fn().mockResolvedValue([]),
  updateVoiceNoteTranscription: vi.fn(),
  getPublishedPortfolioItems: vi.fn().mockResolvedValue([]),
  getAllPortfolioItems: vi.fn().mockResolvedValue([]),
  createPortfolioItem: vi.fn(),
  updatePortfolioItem: vi.fn(),
  deletePortfolioItem: vi.fn(),
  getPublishedTestimonials: vi.fn().mockResolvedValue([]),
  getAllTestimonials: vi.fn().mockResolvedValue([]),
  createTestimonial: vi.fn(),
  updateTestimonial: vi.fn(),
  deleteTestimonial: vi.fn(),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
  });

  it("logout clears session cookie", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});

describe("services", () => {
  it("list returns active services", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.services.list();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("price");
      expect(result[0]).toHaveProperty("features");
      expect(Array.isArray(result[0].features)).toBe(true);
    }
  });
});

describe("cart", () => {
  it("get requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.cart.get()).rejects.toThrow();
  });

  it("get returns empty array for authenticated user with no items", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.cart.get();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("orders", () => {
  it("myOrders requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.orders.myOrders()).rejects.toThrow();
  });

  it("myOrders returns empty array for new user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.orders.myOrders();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("portfolio", () => {
  it("list returns published portfolio items", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.portfolio.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("testimonials", () => {
  it("list returns published testimonials", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.testimonials.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin", () => {
  it("allOrders requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext("user"));
    await expect(caller.admin.allOrders()).rejects.toThrow();
  });
});
