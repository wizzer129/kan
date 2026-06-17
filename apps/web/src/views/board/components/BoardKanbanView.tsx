import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext, Draggable } from '@hello-pangea/dnd';
import { env } from 'next-runtime-env';

import { StrictModeDroppable as Droppable } from '~/components/StrictModeDroppable';
import Card from '~/views/board/components/Card';
import List from '~/views/board/components/List';

interface BoardKanbanViewProps {
	boardData: BoardData;
	canEditCard: boolean;
	onDragEnd: (result: DropResult) => void;
	onOpenCard: (cardPublicId: string) => void;
	onSetContextMenu: (menu: ContextMenuState | null) => void;
	setSelectedPublicListId: (publicListId: string) => void;
}

interface ContextMenuState {
	x: number;
	y: number;
	cardPublicId: string;
}

interface BoardData {
	workspace: {
		cardPrefix: string;
	};
	lists: BoardList[];
}

interface BoardList {
	publicId: string;
	name: string;
	borderColor?: string | null;
	createdBy?: string | null;
	cards: BoardCard[];
}

interface BoardCard {
	publicId: string;
	title: string;
	cardNumber: number | null;
	borderColor?: string | null;
	labels: { name: string; colourCode: string | null }[];
	members: {
		publicId: string;
		email: string;
		user: {
			name: string | null;
			email: string;
			image: string | null;
		} | null;
	}[];
	checklists: {
		publicId: string;
		name: string;
		items: {
			publicId: string;
			title: string;
			completed: boolean;
			index: number;
		}[];
	}[];
	description: string | null;
	comments: { publicId: string }[];
	attachments?: { publicId: string }[];
	dueDate?: Date | null;
}

export default function BoardKanbanView({
	boardData,
	canEditCard,
	onDragEnd,
	onOpenCard,
	onSetContextMenu,
	setSelectedPublicListId,
}: BoardKanbanViewProps) {
	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<Droppable
				droppableId="all-lists"
				direction="horizontal"
				type="LIST"
			>
				{(provided) => (
					<div
						className="flex h-full min-h-0 w-max flex-nowrap items-start pl-8 pr-3"
						ref={provided.innerRef}
						{...provided.droppableProps}
					>
						{boardData.lists.map((list, index) => (
							<List
								index={index}
								key={list.publicId}
								list={list}
								setSelectedPublicListId={
									setSelectedPublicListId
								}
							>
								<Droppable
									droppableId={list.publicId}
									type="CARD"
								>
									{(providedCards) => (
										<div
											ref={providedCards.innerRef}
											{...providedCards.droppableProps}
											data-board-list-scroll="true"
											className="z-10 min-h-[3.5rem] pr-1"
										>
											{list.cards.map(
												(card, cardIndex) => (
													<Draggable
														key={card.publicId}
														draggableId={
															card.publicId
														}
														index={cardIndex}
														isDragDisabled={
															!canEditCard
														}
													>
														{(providedCard) => (
															<div
																onClick={() => {
																	if (
																		!card.publicId.startsWith(
																			'PLACEHOLDER',
																		)
																	)
																		onOpenCard(
																			card.publicId,
																		);
																}}
																onContextMenu={(
																	e,
																) => {
																	if (
																		card.publicId.startsWith(
																			'PLACEHOLDER',
																		) ||
																		env(
																			'NEXT_PUBLIC_KAN_ENV',
																		) ===
																			'cloud'
																	)
																		return;
																	e.preventDefault();
																	onSetContextMenu(
																		{
																			x: e.clientX,
																			y: e.clientY,
																			cardPublicId:
																				card.publicId,
																		},
																	);
																}}
																role="button"
																tabIndex={0}
																onKeyDown={(
																	e,
																) => {
																	if (
																		e.key ===
																			'Enter' ||
																		e.key ===
																			' '
																	) {
																		if (
																			!card.publicId.startsWith(
																				'PLACEHOLDER',
																			)
																		)
																			onOpenCard(
																				card.publicId,
																			);
																	}
																}}
																className={`mb-2 flex cursor-pointer flex-col ${
																	card.publicId.startsWith(
																		'PLACEHOLDER',
																	)
																		? 'pointer-events-none'
																		: ''
																}`}
																ref={
																	providedCard.innerRef
																}
																style={
																	providedCard
																		.draggableProps
																		.style
																}
																{...providedCard.draggableProps}
																{...providedCard.dragHandleProps}
															>
																<Card
																	title={
																		card.title
																	}
																	ticketNumber={
																		card.cardNumber !=
																		null
																			? `${boardData.workspace.cardPrefix}-${card.cardNumber}`
																			: null
																	}
																	borderColor={
																		card.borderColor ??
																		null
																	}
																	labels={
																		card.labels
																	}
																	members={
																		card.members
																	}
																	checklists={
																		card.checklists ??
																		[]
																	}
																	description={
																		card.description ??
																		null
																	}
																	comments={
																		card.comments ??
																		[]
																	}
																	attachments={
																		card.attachments
																	}
																	dueDate={
																		card.dueDate ??
																		null
																	}
																/>
															</div>
														)}
													</Draggable>
												),
											)}
											{providedCards.placeholder}
										</div>
									)}
								</Droppable>
							</List>
						))}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
}
