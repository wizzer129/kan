import { z } from 'zod';

// ─── list.create ─────────────────────────────────────────────
export const listCreateResponseSchema = z.object({
	publicId: z.string(),
	name: z.string(),
	borderColor: z.string().nullable(),
});

// ─── list.update / list.reorder ──────────────────────────────
export const listUpdateResponseSchema = z.object({
	publicId: z.string(),
	name: z.string(),
	borderColor: z.string().nullable(),
});
