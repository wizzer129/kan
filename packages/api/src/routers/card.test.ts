import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cardRepo from '@kan/db/repository/card.repo';
import * as labelRepo from '@kan/db/repository/label.repo';
import * as listRepo from '@kan/db/repository/list.repo';
import * as workspaceRepo from '@kan/db/repository/workspace.repo';

import { assertPermission } from '../utils/permissions';

vi.mock('@kan/db/repository/card.repo', () => ({
	create: vi.fn(),
	bulkCreateCardLabelRelationships: vi.fn(),
	bulkCreateCardWorkspaceMemberRelationships: vi.fn(),
	getWorkspaceAndCardIdByCardPublicId: vi.fn(),
}));

vi.mock('@kan/db/repository/list.repo', () => ({
	getWorkspaceAndListIdByListPublicId: vi.fn(),
}));

vi.mock('@kan/db/repository/label.repo', () => ({
	getAllByPublicIds: vi.fn(),
}));

vi.mock('@kan/db/repository/workspace.repo', () => ({
	getAllMembersByPublicIds: vi.fn(),
}));

vi.mock('@kan/db/repository/cardActivity.repo', () => ({
	bulkCreate: vi.fn(),
}));

vi.mock('../utils/permissions', () => ({
	assertPermission: vi.fn(),
	assertCanEdit: vi.fn(),
	assertCanDelete: vi.fn(),
}));

vi.mock('../utils/notifications', () => ({
	sendMentionEmails: vi.fn(),
}));

vi.mock('../utils/webhook', () => ({
	createCardWebhookPayload: vi.fn(() => ({})),
	sendWebhooksForWorkspace: vi.fn().mockResolvedValue(undefined),
}));

const mockCardCreate = cardRepo.create as ReturnType<typeof vi.fn>;
const mockGetWorkspaceAndListIdByListPublicId =
	listRepo.getWorkspaceAndListIdByListPublicId as ReturnType<typeof vi.fn>;
const mockAssertPermission = assertPermission as ReturnType<typeof vi.fn>;

describe('card router color features', () => {
	const mockDb = {} as never;
	const mockUser = {
		id: 'user-123',
		name: 'Test User',
		email: 'test@example.com',
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockAssertPermission.mockResolvedValue(undefined);
		mockCardCreate.mockResolvedValue({
			id: 1,
			publicId: 'card12345678',
		});
	});

	it('inherits list borderColor when creating a card without an explicit borderColor', async () => {
		const { cardRouter } = await import('./card');

		mockGetWorkspaceAndListIdByListPublicId.mockResolvedValueOnce({
			id: 10,
			publicId: 'list123456789',
			name: 'Todo',
			createdBy: mockUser.id,
			workspaceId: 42,
			boardPublicId: 'board12345678',
			boardName: 'Board',
			borderColor: '#654321',
		});

		const ctx = { user: mockUser, db: mockDb } as never;

		await cardRouter.createCaller(ctx).create({
			title: 'New card',
			description: '',
			listPublicId: 'list123456789',
			labelPublicIds: [],
			memberPublicIds: [],
			position: 'end',
		});

		expect(mockCardCreate).toHaveBeenCalledWith(
			mockDb,
			expect.objectContaining({
				listId: 10,
				borderColor: '#654321',
			}),
		);
	});

	it('uses explicit card borderColor instead of the list borderColor when provided', async () => {
		const { cardRouter } = await import('./card');

		mockGetWorkspaceAndListIdByListPublicId.mockResolvedValueOnce({
			id: 10,
			publicId: 'list123456789',
			name: 'Todo',
			createdBy: mockUser.id,
			workspaceId: 42,
			boardPublicId: 'board12345678',
			boardName: 'Board',
			borderColor: '#654321',
		});

		const ctx = { user: mockUser, db: mockDb } as never;

		await cardRouter.createCaller(ctx).create({
			title: 'New card',
			description: '',
			listPublicId: 'list123456789',
			labelPublicIds: [],
			memberPublicIds: [],
			position: 'end',
			borderColor: '#abcdef',
		});

		expect(mockCardCreate).toHaveBeenCalledWith(
			mockDb,
			expect.objectContaining({
				borderColor: '#abcdef',
			}),
		);
	});

	it('throws UNAUTHORIZED when creating without a user', async () => {
		const { cardRouter } = await import('./card');
		const ctx = { user: null, db: mockDb } as never;

		await expect(
			cardRouter.createCaller(ctx).create({
				title: 'New card',
				description: '',
				listPublicId: 'list123456789',
				labelPublicIds: [],
				memberPublicIds: [],
				position: 'end',
			}),
		).rejects.toThrow(TRPCError);
	});
});
