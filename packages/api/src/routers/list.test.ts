import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as boardRepo from '@kan/db/repository/board.repo';
import * as listRepo from '@kan/db/repository/list.repo';

import { assertCanEdit, assertPermission } from '../utils/permissions';

vi.mock('@kan/db/repository/board.repo', () => ({
	getWorkspaceAndBoardIdByBoardPublicId: vi.fn(),
}));

vi.mock('@kan/db/repository/list.repo', () => ({
	create: vi.fn(),
	update: vi.fn(),
	reorder: vi.fn(),
	getWorkspaceAndListIdByListPublicId: vi.fn(),
	softDeleteById: vi.fn(),
}));

vi.mock('../utils/permissions', () => ({
	assertPermission: vi.fn(),
	assertCanEdit: vi.fn(),
	assertCanDelete: vi.fn(),
}));

const mockBoardGetWorkspaceAndBoardIdByBoardPublicId =
	boardRepo.getWorkspaceAndBoardIdByBoardPublicId as ReturnType<typeof vi.fn>;
const mockListCreate = listRepo.create as ReturnType<typeof vi.fn>;
const mockListUpdate = listRepo.update as ReturnType<typeof vi.fn>;
const mockGetWorkspaceAndListIdByListPublicId =
	listRepo.getWorkspaceAndListIdByListPublicId as ReturnType<typeof vi.fn>;
const mockAssertPermission = assertPermission as ReturnType<typeof vi.fn>;
const mockAssertCanEdit = assertCanEdit as ReturnType<typeof vi.fn>;

describe('list router color features', () => {
	const mockDb = {} as never;
	const mockUser = {
		id: 'user-123',
		name: 'Test User',
		email: 'test@example.com',
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockAssertPermission.mockResolvedValue(undefined);
		mockAssertCanEdit.mockResolvedValue(undefined);
	});

	it('passes borderColor through on create', async () => {
		const { listRouter } = await import('./list');

		mockBoardGetWorkspaceAndBoardIdByBoardPublicId.mockResolvedValueOnce({
			id: 1,
			workspaceId: 99,
		});
		mockListCreate.mockResolvedValueOnce({
			publicId: 'list123456789',
			name: 'Done',
			borderColor: '#123456',
		});

		const ctx = { user: mockUser, db: mockDb } as never;

		await listRouter.createCaller(ctx).create({
			name: 'Done',
			boardPublicId: 'board12345678',
			borderColor: '#123456',
		});

		expect(mockListCreate).toHaveBeenCalledWith(
			mockDb,
			expect.objectContaining({
				name: 'Done',
				borderColor: '#123456',
			}),
		);
	});

	it('passes borderColor through on update', async () => {
		const { listRouter } = await import('./list');

		mockGetWorkspaceAndListIdByListPublicId.mockResolvedValueOnce({
			id: 1,
			publicId: 'list123456789',
			name: 'Done',
			createdBy: mockUser.id,
			workspaceId: 99,
			boardPublicId: 'board12345678',
			boardName: 'Board',
			borderColor: '#123456',
		});
		mockListUpdate.mockResolvedValueOnce({
			publicId: 'list123456789',
			name: 'Done',
			borderColor: '#abcdef',
		});

		const ctx = { user: mockUser, db: mockDb } as never;

		await listRouter.createCaller(ctx).update({
			listPublicId: 'list123456789',
			borderColor: '#abcdef',
		});

		expect(mockListUpdate).toHaveBeenCalledWith(
			mockDb,
			{ name: undefined, borderColor: '#abcdef' },
			{ listPublicId: 'list123456789' },
		);
	});

	it('throws UNAUTHORIZED when creating without a user', async () => {
		const { listRouter } = await import('./list');
		const ctx = { user: null, db: mockDb } as never;

		await expect(
			listRouter.createCaller(ctx).create({
				name: 'Done',
				boardPublicId: 'board12345678',
			}),
		).rejects.toThrow(TRPCError);
	});
});
