import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as boardRepo from '@kan/db/repository/board.repo';
import * as labelRepo from '@kan/db/repository/label.repo';
import * as listRepo from '@kan/db/repository/list.repo';
import * as workspaceRepo from '@kan/db/repository/workspace.repo';

import { assertCanEdit, assertPermission } from '../utils/permissions';

vi.mock('@kan/db/repository/board.repo', () => ({
	create: vi.fn(),
	update: vi.fn(),
	isSlugUnique: vi.fn(),
	getWorkspaceAndBoardIdByBoardPublicId: vi.fn(),
	addUserFavorite: vi.fn(),
	removeUserFavorite: vi.fn(),
	isBoardSlugAvailable: vi.fn(),
	getIdByPublicId: vi.fn(),
	getByPublicId: vi.fn(),
}));

vi.mock('@kan/db/repository/workspace.repo', () => ({
	getByPublicId: vi.fn(),
}));

vi.mock('@kan/db/repository/list.repo', () => ({
	bulkCreate: vi.fn(),
}));

vi.mock('@kan/db/repository/label.repo', () => ({
	bulkCreate: vi.fn(),
}));

vi.mock('../utils/permissions', () => ({
	assertPermission: vi.fn(),
	assertCanEdit: vi.fn(),
	assertCanDelete: vi.fn(),
}));

const mockBoardCreate = boardRepo.create as ReturnType<typeof vi.fn>;
const mockBoardUpdate = boardRepo.update as ReturnType<typeof vi.fn>;
const mockIsSlugUnique = boardRepo.isSlugUnique as ReturnType<typeof vi.fn>;
const mockGetWorkspaceAndBoardIdByBoardPublicId =
	boardRepo.getWorkspaceAndBoardIdByBoardPublicId as ReturnType<
		typeof vi.fn
	>;
const mockWorkspaceGetByPublicId = workspaceRepo.getByPublicId as ReturnType<
	typeof vi.fn
>;
const mockListBulkCreate = listRepo.bulkCreate as ReturnType<typeof vi.fn>;
const mockLabelBulkCreate = labelRepo.bulkCreate as ReturnType<typeof vi.fn>;
const mockAssertPermission = assertPermission as ReturnType<typeof vi.fn>;
const mockAssertCanEdit = assertCanEdit as ReturnType<typeof vi.fn>;

describe('board router color features', () => {
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
		mockListBulkCreate.mockResolvedValue([]);
		mockLabelBulkCreate.mockResolvedValue([]);
	});

	it('passes board colors through on create', async () => {
		const { boardRouter } = await import('./board');

		mockWorkspaceGetByPublicId.mockResolvedValueOnce({
			id: 1,
			publicId: 'ws1234567890',
		});
		mockIsSlugUnique.mockResolvedValueOnce(true);
		mockBoardCreate.mockResolvedValueOnce({
			id: 11,
			publicId: 'board12345678',
			name: 'Color Board',
		});

		const ctx = { user: mockUser, db: mockDb } as never;

		await boardRouter.createCaller(ctx).create({
			name: 'Color Board',
			workspacePublicId: 'ws1234567890',
			lists: [],
			labels: [],
			backgroundColor: '#112233',
			borderColor: '#445566',
		});

		expect(mockBoardCreate).toHaveBeenCalledWith(
			mockDb,
			expect.objectContaining({
				backgroundColor: '#112233',
				borderColor: '#445566',
			}),
		);
	});

	it('passes board colors through on update', async () => {
		const { boardRouter } = await import('./board');

		mockGetWorkspaceAndBoardIdByBoardPublicId.mockResolvedValueOnce({
			id: 11,
			workspaceId: 1,
			createdBy: mockUser.id,
		});
		mockBoardUpdate.mockResolvedValueOnce({
			publicId: 'board12345678',
			name: 'Color Board',
		});

		const ctx = { user: mockUser, db: mockDb } as never;

		await boardRouter.createCaller(ctx).update({
			boardPublicId: 'board12345678',
			backgroundColor: '#778899',
			borderColor: '#aabbcc',
		});

		expect(mockBoardUpdate).toHaveBeenCalledWith(
			mockDb,
			expect.objectContaining({
				boardPublicId: 'board12345678',
				backgroundColor: '#778899',
				borderColor: '#aabbcc',
			}),
		);
	});

	it('throws UNAUTHORIZED when creating without a user', async () => {
		const { boardRouter } = await import('./board');
		const ctx = { user: null, db: mockDb } as never;

		await expect(
			boardRouter.createCaller(ctx).create({
				name: 'Color Board',
				workspacePublicId: 'ws1234567890',
				lists: [],
				labels: [],
			}),
		).rejects.toThrow(TRPCError);
	});
});