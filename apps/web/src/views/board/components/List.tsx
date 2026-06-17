import type { ReactNode } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { t } from '@lingui/core/macro';
import { useForm } from 'react-hook-form';
import { HiMiniArrowsRightLeft, HiOutlinePlusSmall } from 'react-icons/hi2';

import { authClient } from '@kan/auth/client';

import { Tooltip } from '~/components/Tooltip';
import { usePermissions } from '~/hooks/usePermissions';
import { useModal } from '~/providers/modal';
import { api } from '~/utils/api';
import ListDropdown from './ListDropdown';

interface ListProps {
	children: ReactNode;
	index: number;
	list: List;
	setSelectedPublicListId: (publicListId: PublicListId) => void;
}

interface List {
	publicId: string;
	name: string;
	borderColor?: string | null;
	createdBy?: string | null;
}

interface FormValues {
	listPublicId: string;
	name: string;
}

type PublicListId = string;

export default function List({
	children,
	index,
	list,
	setSelectedPublicListId,
}: ListProps) {
	const { openModal } = useModal();
	const { canCreateCard, canEditList, canDeleteList } = usePermissions();
	const { data: session } = authClient.useSession();
	const isCreator = list.createdBy && session?.user.id === list.createdBy;
	const canEdit = canEditList || isCreator;
	const canDrag = canEditList || isCreator;

	const openNewCardForm = (publicListId: PublicListId) => {
		if (!canCreateCard) return;
		openModal('NEW_CARD');
		setSelectedPublicListId(publicListId);
	};

	const updateList = api.list.update.useMutation();

	const { register, handleSubmit } = useForm<FormValues>({
		defaultValues: {
			listPublicId: list.publicId,
			name: list.name,
		},
		values: {
			listPublicId: list.publicId,
			name: list.name,
		},
	});

	const onSubmit = (values: FormValues) => {
		if (!canEdit) return;
		updateList.mutate({
			listPublicId: values.listPublicId,
			name: values.name,
		});
	};

	const handleOpenDeleteListConfirmation = () => {
		setSelectedPublicListId(list.publicId);
		openModal('DELETE_LIST');
	};

	return (
		<Draggable
			key={list.publicId}
			draggableId={list.publicId}
			index={index}
			isDragDisabled={!canDrag}
		>
			{(provided) => (
				<div
					key={list.publicId}
					ref={provided.innerRef}
					{...provided.draggableProps}
					{...provided.dragHandleProps}
					className="dark-text-dark-1000 relative mr-5 flex h-fit min-w-[18rem] max-w-[18rem] shrink-0 flex-col overflow-visible rounded-md border border-light-400 bg-light-100 pb-7 pl-2 pr-1 pt-2 text-neutral-900 dark:border-dark-300 dark:bg-dark-100"
					style={{
						...provided.draggableProps.style,
						borderColor: list.borderColor ?? undefined,
					}}
				>
					<div className="mb-2 flex justify-between overflow-visible">
						<form
							onSubmit={handleSubmit(onSubmit)}
							className="w-full focus-visible:outline-none"
						>
							<input
								id="name"
								type="text"
								{...register('name')}
								onBlur={handleSubmit(onSubmit)}
								readOnly={!canEdit}
								className="w-full border-0 bg-transparent px-4 pt-1 text-sm font-medium text-neutral-900 focus:ring-0 focus-visible:outline-none dark:text-dark-1000"
							/>
						</form>
						<div className="flex items-center overflow-visible">
							<Tooltip
								content={
									!canCreateCard
										? t`You don't have permission`
										: undefined
								}
							>
								<button
									className="mx-1 inline-flex h-fit items-center rounded-md p-1 px-1 text-sm font-semibold text-dark-50 hover:bg-light-400 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-dark-200"
									onClick={() =>
										openNewCardForm(list.publicId)
									}
									disabled={!canCreateCard}
								>
									<HiOutlinePlusSmall
										className="h-5 w-5 text-dark-900"
										aria-hidden="true"
									/>
								</button>
							</Tooltip>
							<div className="relative mr-1 inline-block overflow-visible">
								<ListDropdown
									canEditList={canEdit}
									canDeleteList={
										!!(canDeleteList || isCreator)
									}
									onEditBorderColor={() => {
										setSelectedPublicListId(list.publicId);
										openModal('LIST_BORDER_COLOR');
									}}
									onDeleteList={
										handleOpenDeleteListConfirmation
									}
								/>
							</div>
						</div>
					</div>
					<div className="overflow-hidden">{children}</div>
					{canDrag && (
						<Tooltip content={t`Drag to move list`}>
							<div className="absolute bottom-1 right-1 z-20 rounded p-1 text-light-700 transition-colors hover:bg-light-300 hover:text-light-900 dark:text-dark-700 dark:hover:bg-dark-200 dark:hover:text-dark-900">
								<HiMiniArrowsRightLeft
									className="h-4 w-4 cursor-grab active:cursor-grabbing"
									aria-hidden="true"
								/>
							</div>
						</Tooltip>
					)}
				</div>
			)}
		</Draggable>
	);
}
