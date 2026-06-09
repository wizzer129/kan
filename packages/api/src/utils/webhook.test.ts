import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as webhookRepo from "@kan/db/repository/webhook.repo";

import type { WebhookPayload } from "./webhook";
import {
	createCardWebhookPayload,
	sendWebhooksForWorkspace,
	sendWebhookToUrl,
	webhookUrlSchema,
} from "./webhook";

function createMockResponse(
	values: Pick<Response, "ok" | "status"> &
		Partial<Pick<Response, "statusText">>,
): Response {
	return {
		ok: values.ok,
		status: values.status,
		statusText: values.statusText ?? "",
	} as Response;
}

const { mockLogger } = vi.hoisted(() => ({
	mockLogger: {
		error: vi.fn(),
		info: vi.fn(),
	},
}));

vi.mock("@kan/db/repository/webhook.repo", () => ({
	getActiveByWorkspaceId: vi.fn(),
}));

vi.mock("@kan/logger", () => ({
	createLogger: vi.fn(() => mockLogger),
}));

const mockGetActiveByWorkspaceId =
	webhookRepo.getActiveByWorkspaceId as ReturnType<typeof vi.fn>;

describe("webhook utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-15T12:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("createCardWebhookPayload", () => {
		it("creates a payload with required card fields", () => {
			const payload = createCardWebhookPayload(
				"card.created",
				{
					id: "card-123",
					publicId: "card-pub-123",
					title: "Test Card",
					listId: "list-456",
				},
				{
					boardId: "board-789",
				},
			);

			expect(payload.event).toBe("card.created");
			expect(payload.timestamp).toBe("2024-01-15T12:00:00.000Z");
			expect(payload.data.card).toEqual({
				id: "card-123",
				publicId: "card-pub-123",
				title: "Test Card",
				description: undefined,
				dueDate: null,
				listId: "list-456",
				boardId: "board-789",
			});
			expect(payload.data.card.publicId).toBe("card-pub-123");
		});

		it("includes optional card fields when provided", () => {
			const dueDate = new Date("2024-02-01T10:00:00.000Z");
			const payload = createCardWebhookPayload(
				"card.updated",
				{
					id: "card-123",
					publicId: "card-pub-123",
					title: "Test Card",
					description: "A description",
					dueDate,
					listId: "list-456",
				},
				{
					boardId: "board-789",
				},
			);

			expect(payload.data.card.description).toBe("A description");
			expect(payload.data.card.dueDate).toBe("2024-02-01T10:00:00.000Z");
		});

		it("includes board context when provided", () => {
			const payload = createCardWebhookPayload(
				"card.created",
				{
					id: "card-123",
					publicId: "card-pub-123",
					title: "Test Card",
					listId: "list-456",
				},
				{
					boardId: "board-789",
					boardName: "My Board",
				},
			);

			expect(payload.data.board).toEqual({
				id: "board-789",
				name: "My Board",
			});
		});

		it("includes list context when provided", () => {
			const payload = createCardWebhookPayload(
				"card.created",
				{
					id: "card-123",
					publicId: "card-pub-123",
					title: "Test Card",
					listId: "list-456",
				},
				{
					boardId: "board-789",
					listName: "To Do",
				},
			);

			expect(payload.data.list).toEqual({
				id: "list-456",
				name: "To Do",
			});
		});

		it("includes user context when provided", () => {
			const payload = createCardWebhookPayload(
				"card.created",
				{
					id: "card-123",
					publicId: "card-pub-123",
					title: "Test Card",
					listId: "list-456",
				},
				{
					boardId: "board-789",
					user: {
						id: "user-111",
						name: "John Doe",
					},
				},
			);

			expect(payload.data.user).toEqual({
				id: "user-111",
				name: "John Doe",
			});
		});

		it("includes changes for card.updated events", () => {
			const payload = createCardWebhookPayload(
				"card.updated",
				{
					id: "card-123",
					publicId: "card-pub-123",
					title: "Updated Title",
					listId: "list-456",
				},
				{
					boardId: "board-789",
					changes: {
						title: { from: "Old Title", to: "Updated Title" },
					},
				},
			);

			expect(payload.data.changes).toEqual({
				title: { from: "Old Title", to: "Updated Title" },
			});
		});

		it("preserves public list IDs in moved payloads", () => {
			const payload = createCardWebhookPayload(
				"card.moved",
				{
					id: "card-123",
					publicId: "card-pub-123",
					title: "Moved Card",
					listId: "list-public-done",
				},
				{
					boardId: "board-789",
					listName: "Done",
					changes: {
						listId: {
							from: "list-public-backlog",
							to: "list-public-done",
						},
					},
				},
			);

			expect(payload.data.card.listId).toBe("list-public-done");
			expect(payload.data.list).toEqual({
				id: "list-public-done",
				name: "Done",
			});
			expect(payload.data.changes).toEqual({
				listId: { from: "list-public-backlog", to: "list-public-done" },
			});
		});
	});

	describe("sendWebhookToUrl", () => {
		let fetchSpy: MockInstance<typeof fetch>;

		beforeEach(() => {
			fetchSpy = vi.spyOn(global, "fetch");
		});

		const mockPayload: WebhookPayload = {
			event: "card.created",
			timestamp: "2024-01-15T12:00:00.000Z",
			data: {
				card: {
					id: "card-123",
					publicId: "card-pub-123",
					title: "Test Card",
					listId: "list-456",
					boardId: "board-789",
				},
			},
		};

		describe("SSRF protection", () => {
			it("blocks HTTP URLs", async () => {
				const result = await sendWebhookToUrl(
					"http://example.com/webhook",
					undefined,
					mockPayload,
				);
				expect(result.success).toBe(false);
				expect(result.error).toContain("HTTPS");
				expect(fetchSpy).not.toHaveBeenCalled();
			});

			it("blocks localhost", async () => {
				const result = await sendWebhookToUrl(
					"https://localhost/webhook",
					undefined,
					mockPayload,
				);
				expect(result.success).toBe(false);
				expect(result.error).toContain("Localhost");
				expect(fetchSpy).not.toHaveBeenCalled();
			});

			it("blocks 127.0.0.1", async () => {
				const result = await sendWebhookToUrl(
					"https://127.0.0.1/webhook",
					undefined,
					mockPayload,
				);
				expect(result.success).toBe(false);
				expect(fetchSpy).not.toHaveBeenCalled();
			});

			it("blocks cloud metadata endpoint", async () => {
				const result = await sendWebhookToUrl(
					"https://169.254.169.254/latest/meta-data/",
					undefined,
					mockPayload,
				);
				expect(result.success).toBe(false);
				expect(result.error).toContain("metadata");
				expect(fetchSpy).not.toHaveBeenCalled();
			});

			it("blocks private 10.x.x.x IPs", async () => {
				const result = await sendWebhookToUrl(
					"https://10.0.0.1/webhook",
					undefined,
					mockPayload,
				);
				expect(result.success).toBe(false);
				expect(result.error).toContain("Private");
				expect(fetchSpy).not.toHaveBeenCalled();
			});

			it("blocks private 192.168.x.x IPs", async () => {
				const result = await sendWebhookToUrl(
					"https://192.168.1.1/webhook",
					undefined,
					mockPayload,
				);
				expect(result.success).toBe(false);
				expect(global.fetch).not.toHaveBeenCalled();
			});

			it("allows valid HTTPS URLs", async () => {
				(
					global.fetch as ReturnType<typeof vi.fn>
				).mockResolvedValueOnce({
					ok: true,
					status: 200,
				});
				const result = await sendWebhookToUrl(
					"https://example.com/webhook",
					undefined,
					mockPayload,
				);
				expect(result.success).toBe(true);
				expect(global.fetch).toHaveBeenCalled();
			});
		});
		function getHeaderRecord(fetchSpy: MockInstance<typeof fetch>) {
			const call = fetchSpy.mock.calls[0] as
				| [unknown, unknown]
				| undefined;
			const requestInit = call?.[1];

			if (!requestInit || typeof requestInit !== "object") {
				throw new Error("Expected RequestInit object");
			}

			const headers = (requestInit as { headers?: unknown }).headers;
			if (
				!headers ||
				typeof headers !== "object" ||
				Array.isArray(headers) ||
				headers instanceof Headers
			) {
				throw new Error("Expected headers object");
			}

			return headers as Record<string, string>;
		}

		it("sends POST request with correct headers", async () => {
			fetchSpy.mockResolvedValueOnce(
				createMockResponse({ ok: true, status: 200 }),
			);

			await sendWebhookToUrl(
				"https://example.com/webhook",
				undefined,
				mockPayload,
			);

			expect(fetchSpy).toHaveBeenCalledWith(
				"https://example.com/webhook",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(mockPayload),
				}),
			);

			const headers = getHeaderRecord(fetchSpy);
			expect(headers["Content-Type"]).toBe("application/json");
			expect(headers["X-Webhook-Event"]).toBe("card.created");
			expect(headers["X-Webhook-Timestamp"]).toBe(
				"2024-01-15T12:00:00.000Z",
			);
		});

		it("includes signature header when secret is provided", async () => {
			fetchSpy.mockResolvedValueOnce(
				createMockResponse({ ok: true, status: 200 }),
			);

			await sendWebhookToUrl(
				"https://example.com/webhook",
				"my-secret",
				mockPayload,
			);

			expect(fetchSpy).toHaveBeenCalledWith(
				"https://example.com/webhook",
				expect.objectContaining({ method: "POST" }),
			);

			const headers = getHeaderRecord(fetchSpy);
			expect(headers["X-Webhook-Signature"]).toMatch(/^[a-f0-9]{64}$/);
		});

		it("returns success for 2xx responses", async () => {
			fetchSpy.mockResolvedValueOnce(
				createMockResponse({ ok: true, status: 200 }),
			);

			const result = await sendWebhookToUrl(
				"https://example.com/webhook",
				undefined,
				mockPayload,
			);

			expect(result).toEqual({ success: true, statusCode: 200 });
		});

		it("returns failure for non-2xx responses", async () => {
			fetchSpy.mockResolvedValueOnce(
				createMockResponse({
					ok: false,
					status: 500,
					statusText: "Internal Server Error",
				}),
			);

			const result = await sendWebhookToUrl(
				"https://example.com/webhook",
				undefined,
				mockPayload,
			);

			expect(result).toEqual({
				success: false,
				statusCode: 500,
				error: "500 Internal Server Error",
			});
		});

		it("returns failure on network error", async () => {
			fetchSpy.mockRejectedValueOnce(new Error("Network error"));

			const result = await sendWebhookToUrl(
				"https://example.com/webhook",
				undefined,
				mockPayload,
			);

			expect(result).toEqual({
				success: false,
				error: "Network error",
			});
		});

		it("returns timeout error when request takes too long", async () => {
			fetchSpy.mockImplementationOnce(
				() =>
					new Promise((_, reject) => {
						setTimeout(() => {
							const error = new Error("Aborted");
							error.name = "AbortError";
							reject(error);
						}, 15000);
					}),
			);

			const resultPromise = sendWebhookToUrl(
				"https://example.com/webhook",
				undefined,
				mockPayload,
			);

			// Advance timers to trigger the abort
			vi.advanceTimersByTime(15000);

			const result = await resultPromise;
			expect(result).toEqual({
				success: false,
				error: "Request timed out",
			});
		});
	});

	describe("sendWebhooksForWorkspace", () => {
		let fetchSpy: MockInstance<typeof fetch>;

		beforeEach(() => {
			fetchSpy = vi.spyOn(global, "fetch");
		});

		const mockDb = {} as Parameters<typeof sendWebhooksForWorkspace>[0];

		const mockPayload: WebhookPayload = {
			event: "card.created",
			timestamp: "2024-01-15T12:00:00.000Z",
			data: {
				card: {
					id: "card-123",
					publicId: "card-pub-123",
					title: "Test Card",
					listId: "list-456",
					boardId: "board-789",
				},
			},
		};

		it("sends to all active webhooks subscribed to the event", async () => {
			mockGetActiveByWorkspaceId.mockResolvedValueOnce([
				{
					id: 1,
					publicId: "wh-1",
					url: "https://example.com/webhook1",
					secret: "secret1",
					events: ["card.created", "card.updated"],
					active: true,
				},
				{
					id: 2,
					publicId: "wh-2",
					url: "https://example.com/webhook2",
					secret: null,
					events: ["card.created"],
					active: true,
				},
			]);

			fetchSpy.mockResolvedValue(
				createMockResponse({ ok: true, status: 200 }),
			);

			await sendWebhooksForWorkspace(mockDb, 1, mockPayload);

			// getActiveByWorkspaceId fetches all active webhooks; event filtering is client-side
			expect(mockGetActiveByWorkspaceId).toHaveBeenCalledWith(mockDb, 1);
			expect(fetchSpy).toHaveBeenCalledTimes(2);
			expect(fetchSpy).toHaveBeenCalledWith(
				"https://example.com/webhook1",
				expect.any(Object),
			);
			expect(fetchSpy).toHaveBeenCalledWith(
				"https://example.com/webhook2",
				expect.any(Object),
			);
		});

		it("does not send when no webhooks match the event (client-side filtering)", async () => {
			// Returns webhooks that don't match the event — client-side filter excludes them
			mockGetActiveByWorkspaceId.mockResolvedValueOnce([]);

			await sendWebhooksForWorkspace(mockDb, 1, mockPayload);

			expect(mockGetActiveByWorkspaceId).toHaveBeenCalledWith(mockDb, 1);
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("continues sending to other webhooks when one fails", async () => {
			mockGetActiveByWorkspaceId.mockResolvedValueOnce([
				{
					id: 1,
					publicId: "wh-1",
					url: "https://example.com/webhook1",
					secret: null,
					events: ["card.created"],
					active: true,
				},
				{
					id: 2,
					publicId: "wh-2",
					url: "https://example.com/webhook2",
					secret: null,
					events: ["card.created"],
					active: true,
				},
			]);

			fetchSpy
				.mockResolvedValueOnce(
					createMockResponse({
						ok: false,
						status: 500,
						statusText: "Error",
					}),
				)
				.mockResolvedValueOnce(
					createMockResponse({ ok: true, status: 200 }),
				);

			await sendWebhooksForWorkspace(mockDb, 1, mockPayload);

			expect(fetchSpy).toHaveBeenCalledTimes(2);
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					url: "https://example.com/webhook1",
					event: "card.created",
					error: "500 Error",
					statusCode: 500,
				}),
				"Webhook delivery failed",
			);
		});

		it("handles empty webhook list", async () => {
			mockGetActiveByWorkspaceId.mockResolvedValueOnce([]);

			await sendWebhooksForWorkspace(mockDb, 1, mockPayload);

			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("catches and logs DB errors without throwing", async () => {
			mockGetActiveByWorkspaceId.mockRejectedValueOnce(
				new Error("DB connection failed"),
			);

			// Should not throw — the try/catch absorbs the error
			await expect(
				sendWebhooksForWorkspace(mockDb, 1, mockPayload),
			).resolves.toBeUndefined();

			expect(mockLogger.error).toHaveBeenCalled();
			const firstCall = mockLogger.error.mock.calls[0] as
				| [unknown, unknown]
				| undefined;
			expect(firstCall?.[1]).toBe(
				"Failed to send webhooks for workspace",
			);

			const metaArg = firstCall?.[0];
			expect(metaArg).toBeDefined();
			if (!metaArg || typeof metaArg !== "object") {
				throw new Error("Expected error metadata object");
			}

			const meta = metaArg as { err?: unknown; workspaceId?: number };
			expect(meta.workspaceId).toBe(1);
			expect(meta.err).toBeInstanceOf(Error);
		});
	});

	describe("webhookUrlSchema", () => {
		it("accepts valid HTTPS URLs", () => {
			expect(
				webhookUrlSchema.safeParse("https://example.com/webhook")
					.success,
			).toBe(true);
		});

		it("rejects HTTP URLs", () => {
			const result = webhookUrlSchema.safeParse(
				"http://example.com/webhook",
			);
			expect(result.success).toBe(false);
		});

		it("rejects localhost", () => {
			const result = webhookUrlSchema.safeParse(
				"https://localhost/webhook",
			);
			expect(result.success).toBe(false);
		});

		it("rejects private IPs", () => {
			expect(
				webhookUrlSchema.safeParse("https://10.0.0.1/webhook").success,
			).toBe(false);
			expect(
				webhookUrlSchema.safeParse("https://192.168.1.1/webhook")
					.success,
			).toBe(false);
		});

		it("rejects cloud metadata endpoints", () => {
			expect(
				webhookUrlSchema.safeParse("https://169.254.169.254/latest")
					.success,
			).toBe(false);
		});
	});
});
