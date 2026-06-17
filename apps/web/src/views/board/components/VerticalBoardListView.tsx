import type { DragUpdate, DropResult } from '@hello-pangea/dnd';
import { DragDropContext } from '@hello-pangea/dnd';
import { useRef, useState } from 'react';

import { authClient } from '@kan/auth/client';

import type { BoardList } from './VerticalBoardAccordion';
import { StrictModeDroppable as Droppable } from '~/components/StrictModeDroppable';
import VerticalBoardAccordion from './VerticalBoardAccordion';

interface VerticalBoardListViewProps {
	lists: BoardList[];
	cardPrefix: string;
	onOpenCard: (cardPublicId: string) => void;
	onOpenNewCardForm: (publicListId: string) => void;
	onOpenListBorderColor: (publicListId: string) => void;
	onOpenDeleteListConfirmation: (publicListId: string) => void;
	onDragEnd: (result: DropResult) => void;
	canCreateCard: boolean;
	canEditList: boolean;
	canDeleteList: boolean;
	canEditCard: boolean;
}

export default function VerticalBoardListView({
	lists,
	cardPrefix,
	onOpenCard,
	onOpenNewCardForm,
	onOpenListBorderColor,
	onOpenDeleteListConfirmation,
	onDragEnd,
	canCreateCard,
	canEditList,
	canDeleteList,
	canEditCard,
}: VerticalBoardListViewProps) {
	const { data: session } = authClient.useSession();
	const [isCardDragActive, setIsCardDragActive] = useState(false);
	const [hoveredCardDropListId, setHoveredCardDropListId] = useState<
		string | null
	>(null);
	const [hoveredAccordionListId, setHoveredAccordionListId] = useState<
		string | null
	>(null);
	const lastCardDestinationRef = useRef<{
		droppableId: string;
		index: number;
	} | null>(null);

	const handleDragUpdate = (update: DragUpdate) => {
		if (!isCardDragActive) return;
		setHoveredCardDropListId(update.destination?.droppableId ?? null);

		if (update.type === 'CARD' && update.destination) {
			lastCardDestinationRef.current = {
				droppableId: update.destination.droppableId,
				index: update.destination.index,
			};
		}
	};

	const handleDragEnd = (result: DropResult) => {
		let fallbackDestination = lastCardDestinationRef.current;
		const shouldForceFallbackTarget =
			result.type === 'CARD' &&
			(!result.destination ||
				result.destination.droppableId === result.source.droppableId) &&
			hoveredAccordionListId &&
			hoveredAccordionListId !== result.source.droppableId;

		if (shouldForceFallbackTarget) {
			const hoveredList = lists.find(
				(list) => list.publicId === hoveredAccordionListId,
			);

			fallbackDestination = {
				droppableId: hoveredAccordionListId,
				index: hoveredList?.cards.length ?? 0,
			};
		}

		if (
			result.type === 'CARD' &&
			!result.destination &&
			hoveredCardDropListId &&
			hoveredCardDropListId !== result.source.droppableId
		) {
			const hoveredList = lists.find(
				(list) => list.publicId === hoveredCardDropListId,
			);

			fallbackDestination = {
				droppableId: hoveredCardDropListId,
				index: hoveredList?.cards.length ?? 0,
			};
		}

		const usedFallbackDestination =
			result.type === 'CARD' &&
			!result.destination &&
			!!fallbackDestination;

		const resolvedResult =
			result.type === 'CARD' && !result.destination && fallbackDestination
				? {
						...result,
						destination: {
							droppableId: fallbackDestination.droppableId,
							index: fallbackDestination.index,
						},
					}
				: result;

		setIsCardDragActive(false);
		setHoveredCardDropListId(null);
		setHoveredAccordionListId(null);
		lastCardDestinationRef.current = null;

		onDragEnd(resolvedResult);
	};

	return (
		<DragDropContext
			onBeforeDragStart={(start) => {
				setIsCardDragActive(start.type === 'CARD');
				setHoveredCardDropListId(null);
				setHoveredAccordionListId(null);
				lastCardDestinationRef.current = null;
			}}
			onDragUpdate={handleDragUpdate}
			onDragEnd={handleDragEnd}
		>
			<Droppable
				droppableId="all-lists-vertical"
				type="LIST"
				direction="vertical"
			>
				{(provided) => (
					<div
						ref={provided.innerRef}
						{...provided.droppableProps}
						className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 pb-6 md:px-6"
					>
						{lists.map((list, listIndex) => {
							const isCreator =
								!!list.createdBy &&
								session?.user.id === list.createdBy;
							const canEditListActions = canEditList || isCreator;
							const canDeleteListActions =
								canDeleteList || isCreator;

							return (
								<VerticalBoardAccordion
									key={list.publicId}
									list={list}
									listIndex={listIndex}
									cardPrefix={cardPrefix}
									onOpenCard={onOpenCard}
									onAddCard={() =>
										onOpenNewCardForm(list.publicId)
									}
									onEditListBorderColor={() =>
										onOpenListBorderColor(list.publicId)
									}
									onDeleteList={() =>
										onOpenDeleteListConfirmation(
											list.publicId,
										)
									}
									canCreateCard={canCreateCard}
									canEditListActions={canEditListActions}
									canDeleteListActions={canDeleteListActions}
									canEditCard={canEditCard}
									isCardDragActive={isCardDragActive}
									isHoveredForCardDrop={
										hoveredCardDropListId === list.publicId
									}
									onCardDragPointerEnter={() => {
										if (!isCardDragActive) return;
										setHoveredAccordionListId(
											list.publicId,
										);
									}}
									onCardDragPointerLeave={() => {
										if (!isCardDragActive) return;
										setHoveredAccordionListId((current) =>
											current === list.publicId
												? null
												: current,
										);
									}}
								/>
							);
						})}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
}
