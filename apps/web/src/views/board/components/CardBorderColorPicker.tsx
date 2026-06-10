import { t } from "@lingui/core/macro";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

const presetColors = [
  { label: "Rosewater", value: "#f2d5cf" },
  { label: "Flamingo", value: "#eebebe" },
  { label: "Pink", value: "#f4b8e4" },
  { label: "Mauve", value: "#ca9ee6" },
  { label: "Red", value: "#e78284" },
  { label: "Peach", value: "#ef9f76" },
  { label: "Yellow", value: "#e5c890" },
  { label: "Green", value: "#a6d189" },
  { label: "Teal", value: "#81c8be" },
  { label: "Sky", value: "#99d1db" },
  { label: "Blue", value: "#8caaee" },
  { label: "Lavender", value: "#babbf1" },
];

export const DEFAULT_CARD_BORDER_COLOR = "#8caaee";

interface CardBorderColorPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function CardBorderColorPicker({
  value,
  onChange,
}: CardBorderColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentColor = value ?? DEFAULT_CARD_BORDER_COLOR;

  return (
    <div className="relative w-fit">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-full w-full items-center gap-2 rounded-[5px] border-[1px] border-light-600 bg-light-200 px-2 py-1 text-left text-xs text-light-800 hover:bg-light-300 focus-visible:outline-none dark:border-dark-600 dark:bg-dark-400 dark:text-dark-1000 dark:hover:bg-dark-500"
      >
        <span
          className="h-3 w-3 rounded-sm border border-black/10 shadow-sm"
          style={{ backgroundColor: currentColor }}
        />
        <span>{t`Border color`}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-md border border-light-200 bg-light-50 p-3 shadow-lg dark:border-dark-200 dark:bg-dark-100">
            <div className="mb-3 text-xs font-medium text-light-900 dark:text-dark-900">
              {t`Pick a color`}
            </div>
            <div className="grid grid-cols-6 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  aria-label={color.label}
                  title={color.label}
                  onClick={() => {
                    onChange(color.value);
                    setIsOpen(false);
                  }}
                  className={twMerge(
                    "h-8 w-8 rounded-md border border-black/10 shadow-sm transition-transform hover:scale-105",
                    value === color.value &&
                      "ring-2 ring-offset-2 ring-offset-light-50 dark:ring-offset-dark-100",
                  )}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="color"
                value={currentColor}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border border-light-300 bg-transparent p-1 dark:border-dark-300"
                aria-label={t`Custom border color`}
              />
              <div className="flex flex-1 flex-col">
                <span className="text-[11px] text-light-900 dark:text-dark-900">
                  {t`Custom color wheel`}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="mt-1 self-start text-[11px] font-medium text-light-900 underline decoration-light-600 underline-offset-2 dark:text-dark-900 dark:decoration-dark-600"
                >
                  {t`Clear color`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
