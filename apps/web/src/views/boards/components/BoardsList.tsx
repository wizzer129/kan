import Link from 'next/link';
import { t } from '@lingui/core/macro';
import { motion } from 'framer-motion';
import {
	HiEllipsisHorizontal,
	HiOutlineRectangleStack,
	HiOutlineStar,
	HiStar,
} from 'react-icons/hi2';

import Button from '~/components/Button';
import Dropdown from '~/components/Dropdown';
import PatternedBackground from '~/components/PatternedBackground';
import { Tooltip } from '~/components/Tooltip';
import { usePermissions } from '~/hooks/usePermissions';
import { useModal } from '~/providers/modal';
import { useWorkspace } from '~/providers/workspace';
import { api } from '~/utils/api';
import {
	DEFAULT_BOARD_BG_COLOR,
	DEFAULT_BOARD_BORDER_COLOR,
	getContrastColor,
	getDerivedBoardColor,
} from './BoardColorPicker';

export function BoardsList({
	isTemplate,
	archived = false,
}: {
	isTemplate?: boolean;
	archived?: boolean;
}) {
	const { workspace } = useWorkspace();
	const { openModal, setModalState } = useModal();
	const { canCreateBoard, canDeleteBoard, canEditBoard } = usePermissions();

	const utils = api.useUtils();
	const updateBoard = api.board.update.useMutation({
		onSuccess: () => {
			void utils.board.all.invalidate();
		},
	});

	const { data, isLoading } = api.board.all.useQuery(
		{
			workspacePublicId: workspace.publicId,
			type: isTemplate ? 'template' : 'regular',
			archived: archived,
		},
		{ enabled: workspace.publicId ? true : false },
	);

	const handleToggleFavorite = (
		e: React.MouseEvent,
		boardPublicId: string,
		currentFavorite: boolean | undefined,
	) => {
		e.preventDefault();
		e.stopPropagation();
		updateBoard.mutate({
			boardPublicId,
			favorite: !currentFavorite,
		});
	};

	const handleDeleteBoard = (
		e: React.MouseEvent,
		boardPublicId: string,
		boardName: string,
	) => {
		e.preventDefault();
		e.stopPropagation();

		if (!canDeleteBoard) return;

		openModal('DELETE_BOARD', boardPublicId, boardName);
	};

	const handleChangeColor = (
		boardPublicId: string,
		backgroundColor: string | null,
		borderColor: string | null,
	) => {
		setModalState('CHANGE_BOARD_COLOR', { backgroundColor, borderColor });
		openModal('CHANGE_BOARD_COLOR', boardPublicId);
	};

	if (isLoading)
		return (
			<div className="3xl:grid-cols-4 grid h-fit w-full grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
				<div className="mr-5 flex h-[150px] w-full animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
				<div className="mr-5 flex h-[150px] w-full animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
				<div className="mr-5 flex h-[150px] w-full animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
			</div>
		);

	if (data?.length === 0)
		return (
			<div className="z-10 flex h-full w-full flex-col items-center justify-center space-y-8 pb-[150px]">
				<div className="flex flex-col items-center">
					<HiOutlineRectangleStack className="h-10 w-10 text-light-800 dark:text-dark-800" />
					<p className="mb-2 mt-4 text-[14px] font-bold text-light-1000 dark:text-dark-950">
						{archived
							? t`No archived boards`
							: t`No ${isTemplate ? 'templates' : 'boards'}`}
					</p>
					<p className="text-[14px] text-light-900 dark:text-dark-900">
						{archived
							? t`Boards you archive will appear here.`
							: t`Get started by creating a new ${isTemplate ? 'template' : 'board'}`}
					</p>
				</div>
				<Tooltip
					content={
						!canCreateBoard
							? t`You don't have permission`
							: undefined
					}
				>
					<Button
						onClick={() => {
							if (canCreateBoard) openModal('NEW_BOARD');
						}}
						disabled={!canCreateBoard}
					>
						{t`Create new ${isTemplate ? 'template' : 'board'}`}
					</Button>
				</Tooltip>
			</div>
		);

	return (
		<motion.div
			className="3xl:grid-cols-4 grid h-fit w-full grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3"
			layout
		>
			{data?.map((board) => (
				<motion.div
					key={board.publicId}
					layout
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{
						layout: {
							type: 'spring',
							stiffness: 300,
							damping: 30,
							mass: 1,
						},
						opacity: { duration: 0.2 },
						scale: { duration: 0.2 },
					}}
				>
					<Link
						href={`${isTemplate ? 'templates' : 'boards'}/${board.publicId}`}
					>
						<div
							className="border-a-4 group relative mr-5 flex h-[150px] w-full items-center justify-center rounded-md border-4 border-solid shadow-sm"
							style={{
								backgroundColor:
									board.backgroundColor ??
									getDerivedBoardColor(board.publicId),
								borderColor:
									board.borderColor ??
									getDerivedBoardColor(board.publicId),
							}}
						>
							{/* Hover overlay */}
							<div className="absolute inset-0 rounded-md bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
							<PatternedBackground />
							<button
								onClick={(e) =>
									handleToggleFavorite(
										e,
										board.publicId,
										board.favorite,
									)
								}
								className={`absolute right-3 top-3 z-10 rounded p-1 transition-all hover:bg-black/10 ${
									board.favorite
										? ''
										: 'md:opacity-0 md:group-hover:opacity-100'
								}`}
								aria-label={
									board.favorite
										? 'Remove from favorites'
										: 'Add to favorites'
								}
							>
								{board.favorite ? (
									<HiStar className="h-5 w-5 text-neutral-700 dark:text-dark-1000" />
								) : (
									<HiOutlineStar className="h-5 w-5 text-neutral-700 dark:text-dark-800" />
								)}
							</button>

							{(canEditBoard || canDeleteBoard) && (
								<div
									className="absolute bottom-3 right-3 z-10 md:opacity-0 md:group-hover:opacity-100"
									onClick={(e) => e.preventDefault()}
								>
									<Dropdown
										items={[
											...(canEditBoard
												? [
														{
															label: isTemplate
																? t`Change template color`
																: t`Change board color`,
															action: () =>
																handleChangeColor(
																	board.publicId,
																	board.backgroundColor ??
																		null,
																	board.borderColor ??
																		null,
																),
														},
													]
												: []),
											...(canDeleteBoard
												? [
														{
															label: isTemplate
																? t`Delete template`
																: t`Delete board`,
															action: () =>
																openModal(
																	'DELETE_BOARD',
																	board.publicId,
																	board.name,
																),
														},
													]
												: []),
										]}
									>
										<HiEllipsisHorizontal
											size={20}
											className="text-neutral-700 dark:text-dark-800"
										/>
									</Dropdown>
								</div>
							)}

							<p
								className="relative z-[1] px-4 text-[14px] font-bold"
								style={{
									color: getContrastColor(
										board.backgroundColor ??
											getDerivedBoardColor(
												board.publicId,
											),
									),
								}}
							>
								{board.name}
							</p>
						</div>
					</Link>
				</motion.div>
			))}
		</motion.div>
	);
}
