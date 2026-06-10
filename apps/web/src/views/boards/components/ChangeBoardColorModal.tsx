import { t } from '@lingui/core/macro';
import { useState } from 'react';

import Button from '~/components/Button';
import { useModal } from '~/providers/modal';
import { usePopup } from '~/providers/popup';
import { api } from '~/utils/api';
import {
	ColorSection,
	DEFAULT_BOARD_BG_COLOR,
	DEFAULT_BOARD_BORDER_COLOR,
} from './BoardColorPicker';

export function ChangeBoardColorModal() {
	const { entityId, getModalState, closeModal } = useModal();
	const { showPopup } = usePopup();
	const utils = api.useUtils();

	const initialColors = getModalState('CHANGE_BOARD_COLOR') as
		| { backgroundColor: string | null; borderColor: string | null }
		| undefined;

	const [backgroundColor, setBackgroundColor] = useState<string | null>(
		initialColors?.backgroundColor ?? null,
	);
	const [borderColor, setBorderColor] = useState<string | null>(
		initialColors?.borderColor ?? null,
	);

	const updateBoard = api.board.update.useMutation({
		onSuccess: async () => {
			await utils.board.all.invalidate();
			closeModal();
		},
		onError: () => {
			showPopup({
				header: t`Unable to update board color`,
				message: t`Please try again later, or contact customer support.`,
				icon: 'error',
			});
		},
	});

	const handleSave = () => {
		updateBoard.mutate({
			boardPublicId: entityId,
			backgroundColor,
			borderColor,
		});
	};

	return (
		<div className="p-5">
			<h2 className="mb-5 text-sm font-bold text-neutral-900 dark:text-dark-1000">
				{t`Board color`}
			</h2>
			<div className="space-y-4">
				<ColorSection
					label={t`Background`}
					value={backgroundColor}
					onChange={setBackgroundColor}
					defaultPickerColor={DEFAULT_BOARD_BG_COLOR}
				/>
				<ColorSection
					label={t`Border`}
					value={borderColor}
					onChange={setBorderColor}
					defaultPickerColor={DEFAULT_BOARD_BORDER_COLOR}
				/>
			</div>
			<div className="mt-6 flex justify-end gap-2">
				<Button variant="secondary" onClick={closeModal}>
					{t`Cancel`}
				</Button>
				<Button onClick={handleSave} isLoading={updateBoard.isPending}>
					{t`Save`}
				</Button>
			</div>
		</div>
	);
}
