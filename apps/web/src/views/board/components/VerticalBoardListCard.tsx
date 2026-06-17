import { Draggable } from '@hello-pangea/dnd';

import Card from './Card';

export interface VerticalBoardCardData {
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

interface VerticalBoardListCardProps {
	card: VerticalBoardCardData;
	cardIndex: number;
	cardPrefix: string;
	canEditCard: boolean;
	onOpenCard: (cardPublicId: string) => void;
}

export default function VerticalBoardListCard({
	card,
	cardIndex,
	cardPrefix,
	canEditCard,
	onOpenCard,
}: VerticalBoardListCardProps) {
	return (
		<Draggable
			key={card.publicId}
			draggableId={card.publicId}
			index={cardIndex}
			isDragDisabled={!canEditCard}
		>
			{(providedCard) => (
				<div
					ref={providedCard.innerRef}
					{...providedCard.draggableProps}
					{...providedCard.dragHandleProps}
					style={providedCard.draggableProps.style}
					role="button"
					tabIndex={0}
					onClick={() => onOpenCard(card.publicId)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							onOpenCard(card.publicId);
						}
					}}
					className="cursor-pointer"
				>
					<Card
						title={card.title}
						ticketNumber={
							card.cardNumber != null
								? `${cardPrefix}-${card.cardNumber}`
								: null
						}
						borderColor={card.borderColor ?? null}
						labels={card.labels}
						members={card.members}
						checklists={card.checklists ?? []}
						description={card.description ?? null}
						comments={card.comments ?? []}
						attachments={card.attachments}
						dueDate={card.dueDate ?? null}
					/>
				</div>
			)}
		</Draggable>
	);
}
