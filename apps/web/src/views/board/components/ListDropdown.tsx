import { t } from '@lingui/core/macro';
import {
	HiEllipsisHorizontal,
	HiOutlineSquaresPlus,
	HiOutlineSwatch,
	HiOutlineTrash,
} from 'react-icons/hi2';

import Dropdown from '~/components/Dropdown';

interface ListDropdownProps {
	canCreateCard?: boolean;
	canEditList: boolean;
	canDeleteList: boolean;
	onAddCard?: () => void;
	onEditBorderColor: () => void;
	onDeleteList: () => void;
}

export default function ListDropdown({
	canCreateCard = false,
	canEditList,
	canDeleteList,
	onAddCard,
	onEditBorderColor,
	onDeleteList,
}: ListDropdownProps) {
	const items = [
		...(canCreateCard && onAddCard
			? [
					{
						label: t`Add a card`,
						action: onAddCard,
						icon: (
							<HiOutlineSquaresPlus className="h-[18px] w-[18px] text-dark-900" />
						),
					},
				]
			: []),
		...(canEditList
			? [
					{
						label: t`Edit border color`,
						action: onEditBorderColor,
						icon: (
							<HiOutlineSwatch className="h-[18px] w-[18px] text-dark-900" />
						),
					},
				]
			: []),
		...(canDeleteList
			? [
					{
						label: t`Delete list`,
						action: onDeleteList,
						icon: (
							<HiOutlineTrash className="h-[18px] w-[18px] text-dark-900" />
						),
					},
				]
			: []),
	];

	if (items.length === 0) {
		return null;
	}

	return (
		<Dropdown items={items}>
			<HiEllipsisHorizontal className="h-5 w-5 text-dark-900" />
		</Dropdown>
	);
}
