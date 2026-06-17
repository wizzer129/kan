import { Draggable } from '@hello-pangea/dnd';
import { t } from '@lingui/core/macro';
import { useEffect, useRef, useState } from 'react';
import { HiMiniChevronDown, HiOutlinePlusSmall } from 'react-icons/hi2';

import type { VerticalBoardCardData } from './VerticalBoardListCard';
import { StrictModeDroppable as Droppable } from '~/components/StrictModeDroppable';
import { Tooltip } from '~/components/Tooltip';
import ListDropdown from './ListDropdown';
import VerticalBoardListCard from './VerticalBoardListCard';

interface VerticalBoardAccordionProps {
	list: BoardList;
	listIndex: number;
	cardPrefix: string;
	onOpenCard: (cardPublicId: string) => void;
	onAddCard: () => void;
	onEditListBorderColor: () => void;
	onDeleteList: () => void;
	canCreateCard: boolean;
	canEditListActions: boolean;
	canDeleteListActions: boolean;
	canEditCard: boolean;
	isCardDragActive: boolean;
	isHoveredForCardDrop: boolean;
	onCardDragPointerEnter: () => void;
	onCardDragPointerLeave: () => void;
}

export interface BoardList {
	publicId: string;
	name: string;
	borderColor?: string | null;
	createdBy?: string | null;
	cards: VerticalBoardCardData[];
}

export default function VerticalBoardAccordion({
	list,
	listIndex,
	cardPrefix,
	onOpenCard,
	onAddCard,
	onEditListBorderColor,
	onDeleteList,
	canCreateCard,
	canEditListActions,
	canDeleteListActions,
	canEditCard,
	isCardDragActive,
	isHoveredForCardDrop,
	onCardDragPointerEnter,
	onCardDragPointerLeave,
}: VerticalBoardAccordionProps) {
	const [isOpen, setIsOpen] = useState(true);
	const openedByHoverRef = useRef(false);

	useEffect(() => {
		if (isCardDragActive && isHoveredForCardDrop && !isOpen) {
			setIsOpen(true);
			openedByHoverRef.current = true;
		}

		// Keep a hover-opened accordion expanded until drag completes.
		// Closing during drag can cause destination loss at drop time.
		if (!isCardDragActive && openedByHoverRef.current) {
			setIsOpen(false);
			openedByHoverRef.current = false;
		}
	}, [isCardDragActive, isHoveredForCardDrop, isOpen]);

	return (
		<Draggable
			key={list.publicId}
			draggableId={list.publicId}
			index={listIndex}
			isDragDisabled={false}
			disableInteractiveElementBlocking
		>
			{(providedList) => (
				<div
					ref={providedList.innerRef}
					{...providedList.draggableProps}
					style={{
						...providedList.draggableProps.style,
					}}
				>
					<section
						onMouseEnter={onCardDragPointerEnter}
						onMouseLeave={onCardDragPointerLeave}
						className="mt-1 overflow-visible rounded-md border-2 border-light-400 bg-light-100 dark:border-dark-300 dark:bg-dark-100"
						style={{ borderColor: list.borderColor ?? undefined }}
					>
						<div
							{...providedList.dragHandleProps}
							className="flex w-full cursor-grab items-center gap-2 px-4 py-3 transition-colors hover:bg-light-200 active:cursor-grabbing dark:hover:bg-dark-200"
						>
							<div className="mr-1 flex items-center gap-1">
								<Tooltip
									content={
										!canCreateCard
											? t`You don't have permission`
											: undefined
									}
								>
									<button
										type="button"
										className="inline-flex h-fit items-center rounded-md p-1 text-sm font-semibold text-dark-50 hover:bg-light-400 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-dark-200"
										onClick={onAddCard}
										disabled={!canCreateCard}
									>
										<HiOutlinePlusSmall
											className="h-5 w-5 text-dark-900"
											aria-hidden="true"
										/>
									</button>
								</Tooltip>
								<ListDropdown
									canEditList={canEditListActions}
									canDeleteList={canDeleteListActions}
									onEditBorderColor={onEditListBorderColor}
									onDeleteList={onDeleteList}
								/>
							</div>
							<button
								type="button"
								onClick={() => {
									setIsOpen((prev) => !prev);
									openedByHoverRef.current = false;
								}}
								className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left text-sm font-semibold text-light-1000 dark:text-dark-1000"
							>
								<span className="truncate">{list.name}</span>
								<div className="flex items-center gap-3">
									<span className="text-xs font-medium text-light-800 dark:text-dark-800">
										{t`${list.cards.length} tasks`}
									</span>
									<HiMiniChevronDown
										className={`h-4 w-4 text-light-800 transition-transform dark:text-dark-800 ${
											isOpen ? 'rotate-180' : ''
										}`}
										aria-hidden="true"
									/>
								</div>
							</button>
						</div>

						<div className="border-t border-light-300 px-3 py-3 dark:border-dark-300">
							<Droppable droppableId={list.publicId} type="CARD">
								{(providedCards) => (
									<div
										ref={providedCards.innerRef}
										{...providedCards.droppableProps}
										className={isOpen ? 'space-y-2' : ''}
									>
										{isOpen ? (
											<>
												{list.cards.length === 0 && (
													<div className="rounded-md border border-dashed border-light-300 px-3 py-4 text-sm text-light-800 dark:border-dark-400 dark:text-dark-800">
														{t`No cards in this list`}
													</div>
												)}
												{list.cards.map(
													(card, cardIndex) => (
														<VerticalBoardListCard
															key={card.publicId}
															card={card}
															cardIndex={
																cardIndex
															}
															cardPrefix={
																cardPrefix
															}
															canEditCard={
																canEditCard
															}
															onOpenCard={
																onOpenCard
															}
														/>
													),
												)}
											</>
										) : isCardDragActive ? (
											<div className="rounded-md border border-dashed border-light-300 px-3 py-2 text-xs text-light-800 dark:border-dark-400 dark:text-dark-800">
												{t`Drop card here to move into this list`}
											</div>
										) : (
											<div
												className="h-0 overflow-hidden"
												aria-hidden="true"
											/>
										)}
										{providedCards.placeholder}
									</div>
								)}
							</Droppable>
						</div>
					</section>
				</div>
			)}
		</Draggable>
	);
}
