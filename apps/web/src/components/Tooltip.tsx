import type { ReactNode } from 'react';
import type { Placement } from 'tippy.js';
import { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import tippy from 'tippy.js';

const DEFAULT_DELAY: [number, number] = [500, 0];

interface TooltipProps {
	children: ReactNode;
	content?: ReactNode;
	placement?: Placement;
	delay?: number | [number, number];
}

export function Tooltip({
	children,
	content,
	placement = 'bottom',
	delay = DEFAULT_DELAY,
}: TooltipProps) {
	const triggerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!triggerRef.current) return;

		if (!content) return;

		const container = document.createElement('div');
		container.innerHTML = renderToStaticMarkup(<>{content}</>);

		const instance = tippy(triggerRef.current, {
			content: container,
			placement,
			delay,
			interactive: false,
			theme: 'tooltip',
			touch: false,
		});

		return () => {
			instance.destroy();
		};
	}, [content, placement, delay]);

	return (
		<div ref={triggerRef} className="inline-flex">
			{children}
		</div>
	);
}
