import type { DropResult } from '@hello-pangea/dnd';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { t } from '@lingui/core/macro';
import { keepPreviousData } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
	HiOutlineBars3CenterLeft,
	HiOutlinePlusSmall,
	HiOutlineRectangleStack,
	HiOutlineSquare3Stack3D,
	HiOutlineViewColumns,
} from 'react-icons/hi2';

import type { UpdateBoardInput } from '@kan/api/types';
import { authClient } from '@kan/auth/client';

import type { CardContextMenuAction } from './components/CardContextMenu';
import Button from '~/components/Button';
import { DeleteLabelConfirmation } from '~/components/DeleteLabelConfirmation';
import { LabelForm } from '~/components/LabelForm';
import Modal from '~/components/modal';
import { NewWorkspaceForm } from '~/components/NewWorkspaceForm';
import { PageHead } from '~/components/PageHead';
import PatternedBackground from '~/components/PatternedBackground';
import { Tooltip } from '~/components/Tooltip';
import { EditYouTubeModal } from '~/components/YouTubeEmbed/EditYouTubeModal';
import { useDragToScroll } from '~/hooks/useDragToScroll';
import { usePermissions } from '~/hooks/usePermissions';
import { useScrollRestore } from '~/hooks/useScrollRestore';
import { useKeyboardShortcut } from '~/providers/keyboard-shortcuts';
import { useModal } from '~/providers/modal';
import { usePopup } from '~/providers/popup';
import { useWorkspace } from '~/providers/workspace';
import { api } from '~/utils/api';
import { formatToArray } from '~/utils/helpers';
import { DeleteCardConfirmation } from '~/views/card/components/DeleteCardConfirmation';
import BoardDropdown from './components/BoardDropdown';
import BoardKanbanView from './components/BoardKanbanView';
import { CardBorderColorPicker } from './components/CardBorderColorPicker';
import { CardContextDueDateModal } from './components/CardContextDueDateModal';
import { CardContextDuplicateModal } from './components/CardContextDuplicateModal';
import { CardContextLabelsModal } from './components/CardContextLabelsModal';
import { CardContextMembersModal } from './components/CardContextMembersModal';
import { CardContextMenu } from './components/CardContextMenu';
import { CardContextMoveListModal } from './components/CardContextMoveListModal';
import { CardDetailModal } from './components/CardDetailModal';
import { DeleteBoardConfirmation } from './components/DeleteBoardConfirmation';
import { DeleteListConfirmation } from './components/DeleteListConfirmation';
import Filters from './components/Filters';
import { NewCardForm } from './components/NewCardForm';
import { NewListForm } from './components/NewListForm';
import { NewTemplateForm } from './components/NewTemplateForm';
import UpdateBoardSlugButton from './components/UpdateBoardSlugButton';
import { UpdateBoardSlugForm } from './components/UpdateBoardSlugForm';
import VerticalBoardListView from './components/VerticalBoardListView';
import VisibilityButton from './components/VisibilityButton';

type PublicListId = string;
type BoardViewMode = 'kanban' | 'list';
const BOARD_VIEW_MODE_STORAGE_KEY = 'kan:board:view-mode';

export default function BoardPage({ isTemplate }: { isTemplate?: boolean }) {
	const params = useParams() as { boardId: string | string[] } | null;
	const router = useRouter();
	const utils = api.useUtils();
	const { showPopup } = usePopup();
	const { workspace } = useWorkspace();
	const {
		openModal,
		closeModal,
		modalContentType,
		entityId,
		isOpen,
		setModalState,
	} = useModal();
	const [selectedPublicListId, setSelectedPublicListId] =
		useState<PublicListId>('');
	const [selectedCardPublicId, setSelectedCardPublicId] = useState<
		string | null
	>(null);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [boardViewMode, setBoardViewMode] = useState<BoardViewMode>('kanban');
	const hasInitializedBoardViewMode = useRef(false);
	const hasSkippedInitialBoardViewWrite = useRef(false);

	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
		cardPublicId: string;
	} | null>(null);

	const { ref: scrollRef, onMouseDown } = useDragToScroll({
		enabled: boardViewMode === 'kanban',
		direction: 'horizontal',
	});

	const {
		canCreateCard,
		canCreateList,
		canEditList,
		canDeleteList,
		canEditCard,
		canEditBoard,
	} = usePermissions();
	const { data: session } = authClient.useSession();

	const { tooltipContent: createListShortcutTooltipContent } =
		useKeyboardShortcut({
			type: 'PRESS',
			stroke: { key: 'C' },
			action: () => boardId && canCreateList && openNewListForm(boardId),
			description: t`Create new list`,
			group: 'ACTIONS',
		});

	const boardId = params?.boardId
		? Array.isArray(params.boardId)
			? params.boardId[0]
			: params.boardId
		: null;

	const updateBoard = api.board.update.useMutation();

	const { register, handleSubmit, setValue } = useForm<UpdateBoardInput>({
		values: {
			boardPublicId: boardId ?? '',
			name: '',
		},
	});

	const onSubmit = (values: UpdateBoardInput) => {
		updateBoard.mutate({
			boardPublicId: values.boardPublicId,
			name: values.name,
		});
	};

	const semanticFilters = formatToArray(router.query.dueDate) as (
		| 'overdue'
		| 'today'
		| 'tomorrow'
		| 'next-week'
		| 'next-month'
		| 'no-due-date'
	)[];

	const boardType: 'regular' | 'template' = isTemplate
		? 'template'
		: 'regular';

	const queryParams = {
		boardPublicId: boardId ?? '',
		members: formatToArray(router.query.members),
		labels: formatToArray(router.query.labels),
		lists: formatToArray(router.query.lists),
		...(semanticFilters.length > 0 && {
			dueDateFilters: semanticFilters,
		}),
		type: boardType,
	};

	const {
		data: boardData,
		isSuccess,
		isLoading: isQueryLoading,
		error,
		refetch: refetchBoardQuery,
	} = api.board.byId.useQuery(queryParams, {
		enabled: !!boardId,
		placeholderData: keepPreviousData,
	});
	const [localBoardData, setLocalBoardData] =
		useState<typeof boardData>(undefined);
	const effectiveBoardData = localBoardData ?? boardData;
	const boardVisibility: 'private' | 'public' =
		boardData?.visibility === 'public' ? 'public' : 'private';

	useEffect(() => {
		if (!boardData) return;
		setLocalBoardData(boardData);
	}, [boardData]);

	// Redirect to 404 if board doesn't exist
	useEffect(() => {
		if (router.isReady && boardId && !isQueryLoading) {
			if (
				error?.data?.code === 'NOT_FOUND' ||
				(!boardData && !isQueryLoading)
			) {
				router.replace('/404');
			}
		}
	}, [router, boardId, isQueryLoading, error, boardData]);

	const refetchBoard = async () => {
		if (boardId) await utils.board.byId.refetch({ boardPublicId: boardId });
	};

	useEffect(() => {
		if (boardId) {
			setIsInitialLoading(false);
		}
	}, [boardId]);

	// Open card modal from URL query param (deep-link support)
	useEffect(() => {
		if (!router.isReady) return;
		const cardFromQuery = Array.isArray(router.query.card)
			? router.query.card[0]
			: router.query.card;
		if (cardFromQuery) {
			setSelectedCardPublicId(cardFromQuery);
		}
	}, [router.isReady, router.query.card]);

	const isLoading = isInitialLoading || isQueryLoading;

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const stored = window.localStorage.getItem(BOARD_VIEW_MODE_STORAGE_KEY);

		if (stored === 'kanban' || stored === 'list') {
			setBoardViewMode(stored);
		}

		hasInitializedBoardViewMode.current = true;
	}, []);

	useEffect(() => {
		if (!hasInitializedBoardViewMode.current) return;
		if (typeof window === 'undefined') return;

		// Skip the first write after hydration-sync to avoid clobbering
		// a persisted value with the default pre-sync mode.
		if (!hasSkippedInitialBoardViewWrite.current) {
			hasSkippedInitialBoardViewWrite.current = true;
			return;
		}

		window.localStorage.setItem(BOARD_VIEW_MODE_STORAGE_KEY, boardViewMode);
	}, [boardViewMode]);

	useScrollRestore(
		boardId,
		scrollRef,
		router,
		boardViewMode === 'kanban' &&
			!isLoading &&
			(effectiveBoardData?.lists.length ?? 0) > 0,
	);

	useEffect(() => {
		if (boardViewMode !== 'kanban') return;

		const el = scrollRef.current;
		if (!el) return;
		const onWheel = (e: WheelEvent) => {
			if (e.deltaY === 0) return;

			const target = e.target as HTMLElement | null;
			const listScrollContainer = target?.closest(
				'[data-board-list-scroll="true"]',
			) as HTMLElement | null;

			if (listScrollContainer) {
				const canScrollUp = listScrollContainer.scrollTop > 0;
				const canScrollDown =
					listScrollContainer.scrollTop +
						listScrollContainer.clientHeight <
					listScrollContainer.scrollHeight;

				if (
					(e.deltaY < 0 && canScrollUp) ||
					(e.deltaY > 0 && canScrollDown)
				) {
					return;
				}
			}

			e.preventDefault();
			el.scrollLeft += e.deltaY;
		};
		el.addEventListener('wheel', onWheel, { passive: false });
		return () => el.removeEventListener('wheel', onWheel);
	}, [scrollRef, boardViewMode]);

	const updateListMutation = api.list.update.useMutation({
		onError: async () => {
			showPopup({
				header: t`Unable to update list`,
				message: t`Please try again later, or contact customer support.`,
				icon: 'error',
			});

			const latest = await refetchBoardQuery();
			if (latest.data) {
				setLocalBoardData(latest.data);
			}
		},
	});

	const updateCardMutation = api.card.update.useMutation({
		onError: async () => {
			showPopup({
				header: t`Unable to update card`,
				message: t`Please try again later, or contact customer support.`,
				icon: 'error',
			});

			const latest = await refetchBoardQuery();
			if (latest.data) {
				setLocalBoardData(latest.data);
			}
		},
	});

	const updateBorderColorMutation = api.card.update.useMutation({
		onMutate: async (args) => {
			await utils.board.byId.cancel();
			const currentState = utils.board.byId.getData(queryParams);
			utils.board.byId.setData(queryParams, (oldBoard) => {
				if (!oldBoard) return oldBoard;
				return {
					...oldBoard,
					lists: oldBoard.lists.map((list) => ({
						...list,
						cards: list.cards.map((card) =>
							card.publicId === args.cardPublicId
								? {
										...card,
										borderColor: args.borderColor ?? null,
									}
								: card,
						),
					})),
				};
			});
			return { previousState: currentState };
		},
		onError: (_error, _args, context) => {
			utils.board.byId.setData(queryParams, context?.previousState);
			showPopup({
				header: t`Unable to update border color`,
				message: t`Please try again later, or contact customer support.`,
				icon: 'error',
			});
		},
		onSettled: async () => {
			await utils.board.byId.invalidate(queryParams);
		},
	});

	const updateListColorMutation = api.list.update.useMutation({
		onMutate: async (args) => {
			await utils.board.byId.cancel();

			const currentState = utils.board.byId.getData(queryParams);

			utils.board.byId.setData(queryParams, (oldBoard) => {
				if (!oldBoard) return oldBoard;

				return {
					...oldBoard,
					lists: oldBoard.lists.map((list) =>
						list.publicId === args.listPublicId
							? { ...list, borderColor: args.borderColor ?? null }
							: list,
					),
					allLists: oldBoard.allLists.map((list) =>
						list.publicId === args.listPublicId
							? { ...list, borderColor: args.borderColor ?? null }
							: list,
					),
				};
			});

			return { previousState: currentState };
		},
		onError: (_error, _args, context) => {
			utils.board.byId.setData(queryParams, context?.previousState);
			showPopup({
				header: t`Unable to update list color`,
				message: t`Please try again later, or contact customer support.`,
				icon: 'error',
			});
		},
		onSettled: async () => {
			await utils.board.byId.invalidate(queryParams);
		},
	});

	useEffect(() => {
		if (isSuccess && boardData) {
			setValue('name', boardData.name || '');
		}
	}, [isSuccess, boardData, setValue]);

	const openNewListForm = (publicBoardId: string) => {
		openModal('NEW_LIST');
		setSelectedPublicListId(publicBoardId);
	};

	const openNewCardForm = (publicListId: string) => {
		if (!canCreateCard) return;
		openModal('NEW_CARD');
		setSelectedPublicListId(publicListId);
	};

	const openListBorderColorModal = (publicListId: string) => {
		setSelectedPublicListId(publicListId);
		openModal('LIST_BORDER_COLOR');
	};

	const openDeleteListConfirmation = (publicListId: string) => {
		setSelectedPublicListId(publicListId);
		openModal('DELETE_LIST');
	};

	const openCardModal = (publicId: string) => {
		setSelectedCardPublicId(publicId);
		void router.push(
			{ query: { ...router.query, card: publicId } },
			undefined,
			{ shallow: true },
		);
	};

	const closeCardModal = () => {
		setSelectedCardPublicId(null);
		const { card: _card, ...restQuery } = router.query;
		void router.push({ query: restQuery }, undefined, { shallow: true });
	};

	const toggleBoardView = () => {
		setBoardViewMode((currentMode) =>
			currentMode === 'kanban' ? 'list' : 'kanban',
		);
	};

	const handleCardContextMenuAction = (action: CardContextMenuAction) => {
		const cardPublicId = contextMenu?.cardPublicId;
		if (!cardPublicId) return;
		setContextMenu(null);
		if (action === 'copyLink') {
			const path = isTemplate
				? `/templates/${boardId}/cards/${cardPublicId}`
				: `/cards/${cardPublicId}`;
			const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${path}`;
			void navigator.clipboard.writeText(url).then(
				() => {
					showPopup({
						header: t`Link copied`,
						icon: 'success',
						message: t`Card URL copied to clipboard`,
					});
				},
				() => {
					showPopup({
						header: t`Unable to copy link`,
						icon: 'error',
						message: t`Please try again.`,
					});
				},
			);
			return;
		}
		if (action === 'duplicate') {
			setModalState('CARD_CONTEXT_DUPLICATE', {
				boardPublicId: boardId ?? '',
				isTemplate: !!isTemplate,
			});
			openModal('CARD_CONTEXT_DUPLICATE', cardPublicId);
			return;
		}
		if (action === 'delete') {
			openModal('DELETE_CARD', cardPublicId);
			return;
		}
		if (action === 'borderColor') {
			openModal('CARD_CONTEXT_BORDER_COLOR', cardPublicId);
			return;
		}
		const modalType =
			action === 'members'
				? 'CARD_CONTEXT_MEMBERS'
				: action === 'move'
					? 'CARD_CONTEXT_MOVE_LIST'
					: action === 'labels'
						? 'CARD_CONTEXT_LABELS'
						: 'CARD_CONTEXT_DUE_DATE';
		openModal(modalType, cardPublicId);
	};

	const onDragEnd = ({
		source,
		destination,
		draggableId,
		type,
	}: DropResult): void => {
		if (!destination) {
			return;
		}

		if (
			source.droppableId === destination.droppableId &&
			source.index === destination.index
		) {
			return;
		}

		const activeBoardData = localBoardData ?? boardData;
		if (!activeBoardData) return;

		const draggedList = activeBoardData.lists.find(
			(list) => list.publicId === draggableId,
		);
		const canReorderDraggedList =
			canEditList ||
			(!!draggedList?.createdBy &&
				session?.user.id === draggedList.createdBy);

		if (type === 'LIST' && canReorderDraggedList) {
			setLocalBoardData((previousBoard) => {
				const currentBoard = previousBoard ?? boardData;
				if (!currentBoard) return previousBoard;

				const currentIndex = currentBoard.lists.findIndex(
					(list) => list.publicId === draggableId,
				);
				if (currentIndex < 0) return previousBoard;

				const nextLists = [...currentBoard.lists];
				const [movedList] = nextLists.splice(currentIndex, 1);
				if (!movedList) return previousBoard;

				const destinationIndex = Math.max(
					0,
					Math.min(destination.index, nextLists.length),
				);

				nextLists.splice(destinationIndex, 0, movedList);

				return {
					...currentBoard,
					lists: nextLists,
				};
			});

			updateListMutation.mutate({
				listPublicId: draggableId,
				index: destination.index,
			});
		}

		if (type === 'CARD' && canEditCard) {
			setLocalBoardData((previousBoard) => {
				const currentBoard = previousBoard ?? boardData;
				if (!currentBoard) return previousBoard;

				const sourceListIndex = currentBoard.lists.findIndex(
					(list) => list.publicId === source.droppableId,
				);
				const destinationListIndex = currentBoard.lists.findIndex(
					(list) => list.publicId === destination.droppableId,
				);

				if (sourceListIndex < 0 || destinationListIndex < 0) {
					return previousBoard;
				}

				const nextLists = currentBoard.lists.map((list) => ({
					...list,
					cards: [...list.cards],
				}));

				const nextSourceList = nextLists[sourceListIndex];
				const nextDestinationList = nextLists[destinationListIndex];

				if (!nextSourceList || !nextDestinationList) {
					return previousBoard;
				}

				const sourceCardIndex = nextSourceList.cards.findIndex(
					(card) => card.publicId === draggableId,
				);
				if (sourceCardIndex < 0) {
					return previousBoard;
				}

				const [movedCard] = nextSourceList.cards.splice(
					sourceCardIndex,
					1,
				);
				if (!movedCard) {
					return previousBoard;
				}

				const destinationIndex = Math.max(
					0,
					Math.min(
						destination.index,
						nextDestinationList.cards.length,
					),
				);

				nextDestinationList.cards.splice(
					destinationIndex,
					0,
					movedCard,
				);

				return {
					...currentBoard,
					lists: nextLists,
				};
			});

			updateCardMutation.mutate({
				cardPublicId: draggableId,

				listPublicId: destination.droppableId,
				index: destination.index,
			});
		}
	};

	const renderModalContent = () => {
		return (
			<>
				<Modal
					modalSize="sm"
					isVisible={isOpen && modalContentType === 'DELETE_BOARD'}
				>
					<DeleteBoardConfirmation
						isTemplate={!!isTemplate}
						boardPublicId={boardId ?? ''}
					/>
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={isOpen && modalContentType === 'DELETE_LIST'}
				>
					<DeleteListConfirmation
						listPublicId={selectedPublicListId}
						queryParams={queryParams}
					/>
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={
						isOpen && modalContentType === 'LIST_BORDER_COLOR'
					}
					centered
				>
					<div className="p-5">
						<h2 className="mb-4 text-base font-medium text-light-1000 dark:text-white">{t`List border color`}</h2>
						<CardBorderColorPicker
							value={
								boardData?.lists.find(
									(list) =>
										list.publicId === selectedPublicListId,
								)?.borderColor ?? null
							}
							onChange={(color) => {
								updateListColorMutation.mutate({
									listPublicId: selectedPublicListId,
									borderColor: color ?? null,
								});
								closeModal();
							}}
						/>
					</div>
				</Modal>

				<Modal
					modalSize="md"
					isVisible={isOpen && modalContentType === 'NEW_CARD'}
				>
					<NewCardForm
						isTemplate={!!isTemplate}
						boardPublicId={boardId ?? ''}
						listPublicId={selectedPublicListId}
						queryParams={queryParams}
					/>
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={isOpen && modalContentType === 'NEW_LIST'}
				>
					<NewListForm
						boardPublicId={boardId ?? ''}
						queryParams={queryParams}
					/>
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={isOpen && modalContentType === 'NEW_WORKSPACE'}
				>
					<NewWorkspaceForm />
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={isOpen && modalContentType === 'NEW_LABEL'}
				>
					<LabelForm
						boardPublicId={boardId ?? ''}
						refetch={refetchBoard}
					/>
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={isOpen && modalContentType === 'EDIT_LABEL'}
				>
					<LabelForm
						boardPublicId={boardId ?? ''}
						refetch={refetchBoard}
						isEdit
					/>
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={isOpen && modalContentType === 'DELETE_LABEL'}
				>
					<DeleteLabelConfirmation
						refetch={refetchBoard}
						labelPublicId={entityId}
					/>
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={
						isOpen && modalContentType === 'UPDATE_BOARD_SLUG'
					}
				>
					<UpdateBoardSlugForm
						boardPublicId={boardId ?? ''}
						workspaceSlug={workspace.slug ?? ''}
						boardSlug={boardData?.slug ?? ''}
						queryParams={queryParams}
					/>
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={isOpen && modalContentType === 'CREATE_TEMPLATE'}
				>
					<NewTemplateForm
						workspacePublicId={workspace.publicId ?? ''}
						sourceBoardPublicId={boardId ?? ''}
						sourceBoardName={boardData?.name ?? ''}
					/>
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={isOpen && modalContentType === 'EDIT_YOUTUBE'}
				>
					<EditYouTubeModal />
				</Modal>

				<Modal
					modalSize="sm"
					isVisible={
						isOpen && modalContentType === 'CARD_CONTEXT_MEMBERS'
					}
				>
					<CardContextMembersModal />
				</Modal>
				<Modal
					modalSize="sm"
					isVisible={
						isOpen && modalContentType === 'CARD_CONTEXT_MOVE_LIST'
					}
				>
					<CardContextMoveListModal />
				</Modal>
				<Modal
					modalSize="sm"
					isVisible={
						isOpen && modalContentType === 'CARD_CONTEXT_LABELS'
					}
				>
					<CardContextLabelsModal />
				</Modal>
				<Modal
					modalSize="sm"
					isVisible={
						isOpen && modalContentType === 'CARD_CONTEXT_DUE_DATE'
					}
				>
					<CardContextDueDateModal />
				</Modal>
				<Modal
					modalSize="md"
					isVisible={
						isOpen && modalContentType === 'CARD_CONTEXT_DUPLICATE'
					}
				>
					<CardContextDuplicateModal
						boardPublicId={boardId ?? ''}
						isTemplate={!!isTemplate}
					/>
				</Modal>
				<Modal
					modalSize="sm"
					isVisible={
						isOpen &&
						modalContentType === 'CARD_CONTEXT_BORDER_COLOR'
					}
					centered
				>
					<div className="p-5">
						<h2 className="mb-4 text-base font-medium text-light-1000 dark:text-white">{t`Border color`}</h2>
						<CardBorderColorPicker
							value={
								boardData?.lists
									.flatMap((l) => l.cards)
									.find((c) => c.publicId === entityId)
									?.borderColor ?? null
							}
							onChange={(color) => {
								updateBorderColorMutation.mutate({
									cardPublicId: entityId,
									borderColor: color ?? undefined,
								});
								closeModal();
							}}
						/>
					</div>
				</Modal>
				<Modal
					modalSize="sm"
					isVisible={isOpen && modalContentType === 'DELETE_CARD'}
				>
					<DeleteCardConfirmation
						cardPublicId={entityId}
						boardPublicId={boardId ?? ''}
					/>
				</Modal>
			</>
		);
	};

	return (
		<>
			<PageHead
				title={`${boardData?.name ?? (isTemplate ? t`Board` : t`Template`)} | ${workspace.name ?? t`Workspace`}`}
			/>
			<div className="relative flex h-full min-h-0 flex-col">
				<PatternedBackground />
				<div className="z-10 flex w-full flex-col justify-between p-6 md:flex-row md:p-8">
					{isLoading && !boardData && (
						<div className="flex space-x-2">
							<div className="h-[2.3rem] w-[150px] animate-pulse rounded-[5px] bg-light-200 dark:bg-dark-100" />
						</div>
					)}
					{boardData && (
						<form
							onSubmit={handleSubmit(onSubmit)}
							className="order-2 focus-visible:outline-none md:order-1"
						>
							<input
								id="name"
								type="text"
								{...register('name')}
								onBlur={
									canEditBoard
										? handleSubmit(onSubmit)
										: undefined
								}
								readOnly={!canEditBoard}
								className="block border-0 bg-transparent p-0 py-0 font-bold leading-[2.3rem] tracking-tight text-neutral-900 focus:ring-0 focus-visible:outline-none disabled:cursor-not-allowed dark:text-dark-1000 sm:text-[1.2rem]"
							/>
						</form>
					)}
					{!boardData && !isLoading && (
						<p className="order-2 block p-0 py-0 font-bold leading-[2.3rem] tracking-tight text-neutral-900 dark:text-dark-1000 sm:text-[1.2rem] md:order-1">
							{t`${isTemplate ? 'Template' : 'Board'} not found`}
						</p>
					)}
					<div className="order-1 mb-4 flex items-center justify-end space-x-2 md:order-2 md:mb-0">
						{isTemplate && (
							<div className="inline-flex cursor-default items-center justify-center whitespace-nowrap rounded-md border-[1px] border-light-300 bg-light-50 px-3 py-2 text-sm font-semibold text-light-950 shadow-sm dark:border-dark-300 dark:bg-dark-50 dark:text-dark-950">
								<span className="mr-2">
									<HiOutlineRectangleStack />
								</span>
								{t`Template`}
							</div>
						)}
						{!isTemplate && (
							<>
								<UpdateBoardSlugButton
									handleOnClick={() =>
										openModal('UPDATE_BOARD_SLUG')
									}
									isLoading={isLoading}
									workspaceSlug={workspace.slug ?? ''}
									boardSlug={boardData?.slug ?? ''}
									boardPublicId={boardId ?? ''}
									visibility={boardVisibility}
									canEdit={canEditBoard}
								/>
								<Tooltip
									content={
										boardViewMode === 'kanban'
											? t`Switch to vertical list view`
											: t`Switch to kanban view`
									}
								>
									<Button
										variant="secondary"
										iconOnly
										iconLeft={
											boardViewMode === 'kanban' ? (
												<HiOutlineBars3CenterLeft className="h-5 w-5" />
											) : (
												<HiOutlineViewColumns className="h-5 w-5" />
											)
										}
										onClick={toggleBoardView}
										aria-label={
											boardViewMode === 'kanban'
												? t`Switch to vertical list view`
												: t`Switch to kanban view`
										}
									/>
								</Tooltip>
								{effectiveBoardData && (
									<Filters
										labels={effectiveBoardData.labels}
										members={effectiveBoardData.workspace.members.filter(
											(member) => member.user !== null,
										)}
										lists={effectiveBoardData.allLists}
										position="left"
										isLoading={!effectiveBoardData}
									/>
								)}
								<VisibilityButton
									visibility={boardVisibility}
									boardPublicId={boardId ?? ''}
									boardSlug={effectiveBoardData?.slug ?? ''}
									queryParams={queryParams}
									isLoading={!effectiveBoardData}
									isAdmin={workspace.role === 'admin'}
								/>
							</>
						)}
						<Tooltip
							content={
								!canCreateList
									? t`You don't have permission`
									: createListShortcutTooltipContent
							}
						>
							<Button
								iconLeft={
									<HiOutlinePlusSmall
										className="-mr-0.5 h-5 w-5"
										aria-hidden="true"
									/>
								}
								onClick={() => {
									if (boardId && canCreateList)
										openNewListForm(boardId);
								}}
								disabled={!boardData || !canCreateList}
							>
								{t`New list`}
							</Button>
						</Tooltip>
						<BoardDropdown
							isTemplate={!!isTemplate}
							isLoading={!boardData}
							boardPublicId={boardId ?? ''}
							isArchived={boardData?.isArchived ?? false}
							isFavorite={boardData?.favorite}
							boardName={boardData?.name}
						/>
					</div>
				</div>

				<div
					ref={scrollRef}
					onMouseDown={
						boardViewMode === 'kanban' ? onMouseDown : undefined
					}
					className={`z-0 min-h-0 flex-1 ${
						boardViewMode === 'kanban'
							? 'scrollbar-w-none scrollbar-track-rounded-[4px] scrollbar-thumb-rounded-[4px] scrollbar-h-[8px] overflow-y-hidden overflow-x-scroll overscroll-contain scrollbar scrollbar-track-light-200 scrollbar-thumb-light-400 dark:scrollbar-track-dark-100 dark:scrollbar-thumb-dark-300'
							: ''
					}`}
				>
					{isLoading ? (
						<div className="ml-[2rem] flex">
							<div className="0 mr-5 h-[500px] w-[18rem] animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
							<div className="0 mr-5 h-[275px] w-[18rem] animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
							<div className="0 mr-5 h-[375px] w-[18rem] animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
						</div>
					) : effectiveBoardData ? (
						<>
							{effectiveBoardData.lists.length === 0 ? (
								<div className="z-10 flex h-full w-full flex-col items-center justify-center space-y-8 pb-[150px]">
									<div className="flex flex-col items-center">
										<HiOutlineSquare3Stack3D className="h-10 w-10 text-light-800 dark:text-dark-800" />
										<p className="mb-2 mt-4 text-[14px] font-bold text-light-1000 dark:text-dark-950">
											{t`No lists`}
										</p>
										<p className="text-[14px] text-light-900 dark:text-dark-900">
											{canCreateList
												? t`Get started by creating a new list`
												: t`No lists have been created yet`}
										</p>
									</div>
									<Tooltip
										content={
											!canCreateList
												? t`You don't have permission`
												: undefined
										}
									>
										<Button
											onClick={() => {
												if (boardId && canCreateList)
													openNewListForm(boardId);
											}}
											disabled={!canCreateList}
										>
											{t`Create new list`}
										</Button>
									</Tooltip>
								</div>
							) : boardViewMode === 'kanban' ? (
								<BoardKanbanView
									boardData={effectiveBoardData}
									canEditCard={!!canEditCard}
									onDragEnd={onDragEnd}
									onOpenCard={openCardModal}
									onSetContextMenu={setContextMenu}
									setSelectedPublicListId={
										setSelectedPublicListId
									}
								/>
							) : (
								<VerticalBoardListView
									lists={effectiveBoardData.lists}
									cardPrefix={
										effectiveBoardData.workspace.cardPrefix
									}
									onOpenCard={openCardModal}
									onOpenNewCardForm={openNewCardForm}
									onOpenListBorderColor={
										openListBorderColorModal
									}
									onOpenDeleteListConfirmation={
										openDeleteListConfirmation
									}
									onDragEnd={onDragEnd}
									canCreateCard={!!canCreateCard}
									canEditList={!!canEditList}
									canDeleteList={!!canDeleteList}
									canEditCard={!!canEditCard}
								/>
							)}
						</>
					) : null}
				</div>
				{contextMenu && (
					<CardContextMenu
						x={contextMenu.x}
						y={contextMenu.y}
						onClose={() => setContextMenu(null)}
						onAction={handleCardContextMenuAction}
						canEdit={!!canEditCard}
					/>
				)}
				{renderModalContent()}
			</div>
			<CardDetailModal
				cardPublicId={selectedCardPublicId}
				isTemplate={isTemplate}
				onClose={closeCardModal}
			/>
		</>
	);
}
