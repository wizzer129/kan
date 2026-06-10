import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

export const BOARD_PRESET_COLORS = [
	{ label: 'Rosewater', value: '#f2d5cf' },
	{ label: 'Flamingo', value: '#eebebe' },
	{ label: 'Pink', value: '#f4b8e4' },
	{ label: 'Mauve', value: '#ca9ee6' },
	{ label: 'Red', value: '#e78284' },
	{ label: 'Peach', value: '#ef9f76' },
	{ label: 'Yellow', value: '#e5c890' },
	{ label: 'Green', value: '#a6d189' },
	{ label: 'Teal', value: '#81c8be' },
	{ label: 'Sky', value: '#99d1db' },
	{ label: 'Blue', value: '#8caaee' },
	{ label: 'Lavender', value: '#babbf1' },
];

export const DEFAULT_BOARD_BG_COLOR = '#8caaee';
export const DEFAULT_BOARD_BORDER_COLOR = '#8caaee';

/** Returns '#000000' or '#ffffff' depending on which has better contrast against `hexColor`. */
export function getContrastColor(hexColor: string): string {
	const r = parseInt(hexColor.slice(1, 3), 16);
	const g = parseInt(hexColor.slice(3, 5), 16);
	const b = parseInt(hexColor.slice(5, 7), 16);
	// sRGB luminance coefficients
	const luminance =
		0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
	return luminance > 0.179 ? '#000000' : '#ffffff';
}

export function getDerivedBoardColor(publicId: string): string {
	const colors = BOARD_PRESET_COLORS.map((c) => c.value);
	let hash = 0;
	for (let i = 0; i < publicId.length; i++) {
		hash = (hash << 5) - hash + publicId.charCodeAt(i);
		hash |= 0;
	}
	return colors[Math.abs(hash) % colors.length] ?? DEFAULT_BOARD_BG_COLOR;
}

interface ColorSectionProps {
	label: string;
	value: string | null;
	onChange: (value: string | null) => void;
	defaultPickerColor: string;
}

export function ColorSection({
	label,
	value,
	onChange,
	defaultPickerColor,
}: ColorSectionProps) {
	return (
		<div>
			<div className="mb-1.5 flex items-center justify-between">
				<span className="text-[11px] font-medium text-light-900 dark:text-dark-900">
					{label}
				</span>
				{value && (
					<button
						type="button"
						onClick={() => onChange(null)}
						className="text-[11px] text-light-900 underline decoration-light-600 underline-offset-2 dark:text-dark-900 dark:decoration-dark-600"
					>
						{t`Clear`}
					</button>
				)}
			</div>
			<div className="mb-2 grid grid-cols-6 gap-2">
				{BOARD_PRESET_COLORS.map((color) => (
					<button
						key={color.value}
						type="button"
						aria-label={color.label}
						title={color.label}
						onClick={() => onChange(color.value)}
						className={twMerge(
							'h-8 w-8 rounded-md border border-black/10 shadow-sm transition-transform hover:scale-105',
							value === color.value &&
								'ring-2 ring-offset-2 ring-offset-light-50 dark:ring-offset-dark-100',
						)}
						style={{ backgroundColor: color.value }}
					/>
				))}
			</div>
			<input
				type="color"
				value={value ?? defaultPickerColor}
				onChange={(e) => onChange(e.target.value)}
				className="h-10 w-14 cursor-pointer rounded-md border border-light-300 bg-transparent p-1 dark:border-dark-300"
				aria-label={t`Custom color`}
			/>
		</div>
	);
}

interface BoardColorPickerProps {
	backgroundColor: string | null;
	borderColor: string | null;
	onBgChange: (value: string | null) => void;
	onBorderChange: (value: string | null) => void;
}

export function BoardColorPicker({
	backgroundColor,
	borderColor,
	onBgChange,
	onBorderChange,
}: BoardColorPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const displayBg = backgroundColor ?? DEFAULT_BOARD_BG_COLOR;

	return (
		<div className="relative w-fit">
			<button
				type="button"
				onClick={() => setIsOpen((o) => !o)}
				className="flex h-full w-full items-center gap-2 rounded-[5px] border-[1px] border-light-600 bg-light-200 px-2 py-1 text-left text-xs text-light-800 hover:bg-light-300 focus-visible:outline-none dark:border-dark-600 dark:bg-dark-400 dark:text-dark-1000 dark:hover:bg-dark-500"
			>
				<span
					className="h-3 w-3 rounded-sm border border-black/10 shadow-sm"
					style={{ backgroundColor: displayBg }}
				/>
				<span>{t`Board color`}</span>
			</button>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 z-10"
						onClick={() => setIsOpen(false)}
					/>
					<div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-md border border-light-200 bg-light-50 p-3 shadow-lg dark:border-dark-200 dark:bg-dark-100">
						<div className="space-y-4">
							<ColorSection
								label={t`Background`}
								value={backgroundColor}
								onChange={onBgChange}
								defaultPickerColor={DEFAULT_BOARD_BG_COLOR}
							/>
							<ColorSection
								label={t`Border`}
								value={borderColor}
								onChange={onBorderChange}
								defaultPickerColor={DEFAULT_BOARD_BORDER_COLOR}
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
