import { beforeEach, describe, expect, it } from 'vitest';

import * as webhookRepo from '@kan/db/repository/webhook.repo';

import type { TestDbClient } from './test-db';
import { createTestDb, seedTestData } from './test-db';

function assertDefined<T>(value: T | null | undefined, message: string): T {
	if (value == null) {
		throw new Error(message);
	}

	return value;
}

describe('webhook repository integration tests', () => {
	let db: TestDbClient;
	let testUser: { id: string; name: string | null };
	let testWorkspace: { id: number; publicId: string };

	beforeEach(async () => {
		db = await createTestDb();
		const seeded = await seedTestData(db);
		testUser = seeded.user;
		testWorkspace = seeded.workspace;
	});

	describe('create', () => {
		it('creates a webhook with all fields', async () => {
			const webhook = await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'My Webhook',
				url: 'https://example.com/webhook',
				secret: 'my-secret',
				events: ['card.created', 'card.updated'],
				createdBy: testUser.id,
			});

			const createdWebhook = assertDefined(
				webhook,
				'Expected webhook to exist',
			);

			expect(createdWebhook.name).toBe('My Webhook');
			expect(createdWebhook.url).toBe('https://example.com/webhook');
			expect(createdWebhook.events).toEqual([
				'card.created',
				'card.updated',
			]);
			expect(createdWebhook.active).toBe(true);
			expect(createdWebhook.publicId).toMatch(/^[a-zA-Z0-9]{12}$/);
		});

		it('creates a webhook without secret', async () => {
			const webhook = await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'No Secret Webhook',
				url: 'https://example.com/webhook',
				events: ['card.deleted'],
				createdBy: testUser.id,
			});

			const createdWebhook = assertDefined(
				webhook,
				'Expected webhook to exist',
			);

			expect(createdWebhook.name).toBe('No Secret Webhook');
		});
	});

	describe('getByPublicId', () => {
		it('retrieves a webhook by public ID', async () => {
			const created = await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'Test Webhook',
				url: 'https://example.com/webhook',
				events: ['card.created'],
				createdBy: testUser.id,
			});

			const createdWebhook = assertDefined(
				created,
				'Expected webhook to exist',
			);
			const retrieved = await webhookRepo.getByPublicId(
				db,
				createdWebhook.publicId,
			);
			const existingWebhook = assertDefined(
				retrieved,
				'Expected persisted webhook to exist',
			);

			expect(existingWebhook.publicId).toBe(createdWebhook.publicId);
			expect(existingWebhook.name).toBe('Test Webhook');
		});

		it('returns null for non-existent public ID', async () => {
			const retrieved = await webhookRepo.getByPublicId(
				db,
				'nonexistent12',
			);

			expect(retrieved).toBeNull();
		});
	});

	describe('getAllByWorkspaceId', () => {
		it('returns all webhooks for a workspace', async () => {
			await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'Webhook 1',
				url: 'https://example.com/webhook1',
				events: ['card.created'],
				createdBy: testUser.id,
			});

			await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'Webhook 2',
				url: 'https://example.com/webhook2',
				events: ['card.updated'],
				createdBy: testUser.id,
			});

			const webhooks = await webhookRepo.getAllByWorkspaceId(
				db,
				testWorkspace.id,
			);

			expect(webhooks).toHaveLength(2);
			expect(webhooks.map((w) => w.name)).toContain('Webhook 1');
			expect(webhooks.map((w) => w.name)).toContain('Webhook 2');
		});

		it('returns empty array for workspace with no webhooks', async () => {
			const webhooks = await webhookRepo.getAllByWorkspaceId(
				db,
				testWorkspace.id,
			);

			expect(webhooks).toEqual([]);
		});
	});

	describe('getActiveByWorkspaceId', () => {
		it('returns only active webhooks', async () => {
			const active = await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'Active Webhook',
				url: 'https://example.com/active',
				events: ['card.created'],
				createdBy: testUser.id,
			});

			const inactive = await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'Inactive Webhook',
				url: 'https://example.com/inactive',
				events: ['card.created'],
				createdBy: testUser.id,
			});

			// Deactivate one webhook
			const inactiveWebhook = assertDefined(
				inactive,
				'Expected inactive webhook to exist',
			);

			await webhookRepo.update(db, inactiveWebhook.publicId, {
				active: false,
			});

			const activeWebhooks = await webhookRepo.getActiveByWorkspaceId(
				db,
				testWorkspace.id,
			);

			expect(activeWebhooks).toHaveLength(1);
			// getActiveByWorkspaceId returns only publicId, url, secret, events
			expect(activeWebhooks[0]?.url).toBe('https://example.com/active');
			expect(activeWebhooks[0]?.publicId).toBe(
				assertDefined(active, 'Expected active webhook to exist')
					.publicId,
			);
		});
	});

	describe('update', () => {
		it('updates webhook name', async () => {
			const created = await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'Original Name',
				url: 'https://example.com/webhook',
				events: ['card.created'],
				createdBy: testUser.id,
			});

			const createdWebhook = assertDefined(
				created,
				'Expected webhook to exist',
			);
			const updated = await webhookRepo.update(
				db,
				createdWebhook.publicId,
				{
					name: 'Updated Name',
				},
			);
			const updatedWebhook = assertDefined(
				updated,
				'Expected update to succeed',
			);

			expect(updatedWebhook.name).toBe('Updated Name');
			expect(updatedWebhook.url).toBe('https://example.com/webhook'); // Unchanged
		});

		it('updates webhook events', async () => {
			const created = await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'Test Webhook',
				url: 'https://example.com/webhook',
				events: ['card.created'],
				createdBy: testUser.id,
			});

			const createdWebhook = assertDefined(
				created,
				'Expected webhook to exist',
			);
			const updated = await webhookRepo.update(
				db,
				createdWebhook.publicId,
				{
					events: ['card.created', 'card.updated', 'card.deleted'],
				},
			);
			const updatedWebhook = assertDefined(
				updated,
				'Expected update to succeed',
			);

			expect(updatedWebhook.events).toEqual([
				'card.created',
				'card.updated',
				'card.deleted',
			]);
		});

		it('updates webhook active status', async () => {
			const created = await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'Test Webhook',
				url: 'https://example.com/webhook',
				events: ['card.created'],
				createdBy: testUser.id,
			});

			const createdWebhook = assertDefined(
				created,
				'Expected webhook to exist',
			);

			expect(createdWebhook.active).toBe(true);

			const updated = await webhookRepo.update(
				db,
				createdWebhook.publicId,
				{
					active: false,
				},
			);
			const updatedWebhook = assertDefined(
				updated,
				'Expected update to succeed',
			);

			expect(updatedWebhook.active).toBe(false);
		});

		it('sets updatedAt timestamp on update', async () => {
			const created = await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'Test Webhook',
				url: 'https://example.com/webhook',
				events: ['card.created'],
				createdBy: testUser.id,
			});

			// create() doesn't return updatedAt, verify via getByPublicId
			const createdWebhook = assertDefined(
				created,
				'Expected webhook to exist',
			);
			const initial = await webhookRepo.getByPublicId(
				db,
				createdWebhook.publicId,
			);
			const initialWebhook = assertDefined(
				initial,
				'Expected webhook to exist',
			);

			expect(initialWebhook.updatedAt).toBeNull();

			const updated = await webhookRepo.update(
				db,
				createdWebhook.publicId,
				{
					name: 'Updated',
				},
			);
			const updatedWebhook = assertDefined(
				updated,
				'Expected update to succeed',
			);

			expect(updatedWebhook.updatedAt).not.toBeNull();
			expect(updatedWebhook.updatedAt).toBeInstanceOf(Date);
		});

		it('returns null for non-existent webhook', async () => {
			const updated = await webhookRepo.update(db, 'nonexistent12', {
				name: 'Updated',
			});

			expect(updated).toBeNull();
		});
	});

	describe('hardDelete', () => {
		it('deletes a webhook permanently', async () => {
			const created = await webhookRepo.create(db, {
				workspaceId: testWorkspace.id,
				name: 'To Be Deleted',
				url: 'https://example.com/webhook',
				events: ['card.created'],
				createdBy: testUser.id,
			});

			const createdWebhook = assertDefined(
				created,
				'Expected webhook to exist',
			);

			await webhookRepo.hardDelete(db, createdWebhook.publicId);

			const retrieved = await webhookRepo.getByPublicId(
				db,
				createdWebhook.publicId,
			);
			expect(retrieved).toBeNull();
		});

		it('does not throw for non-existent webhook', async () => {
			await expect(
				webhookRepo.hardDelete(db, 'nonexistent12'),
			).resolves.not.toThrow();
		});
	});
});
