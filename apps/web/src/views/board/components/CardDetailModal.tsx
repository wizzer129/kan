import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useEffect, useState } from 'react';

import CardPage, { CardRightPanel } from '~/views/card';

interface Props {
	cardPublicId: string | null;
	isTemplate?: boolean;
	onClose: () => void;
}

export function CardDetailModal({ cardPublicId, isTemplate, onClose }: Props) {
	const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

	useEffect(() => {
		setIsMobileDetailsOpen(false);
	}, [cardPublicId]);

	return (
		<Transition.Root show={!!cardPublicId} as={Fragment}>
			<Dialog as="div" className="relative z-40" onClose={onClose}>
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-200"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-150"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black/40 dark:bg-black/60" />
				</Transition.Child>

				<div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-0 md:p-8">
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-200"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-150"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<Dialog.Panel className="relative flex h-[100dvh] w-full max-w-none overflow-hidden rounded-none border-0 bg-light-50 shadow-none dark:bg-dark-50 md:mt-4 md:h-[calc(100dvh-5rem)] md:max-w-5xl md:rounded-lg md:border md:border-light-300 md:shadow-2xl md:dark:border-dark-300">
							{cardPublicId && (
								<>
									<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
										<CardPage
											cardPublicId={cardPublicId}
											isTemplate={isTemplate}
											onClose={onClose}
											onOpenDetails={() =>
												setIsMobileDetailsOpen(true)
											}
										/>
									</div>
									<div className="hidden h-full md:block">
										<CardRightPanel
											cardPublicId={cardPublicId}
											isTemplate={isTemplate}
										/>
									</div>

									<Transition show={isMobileDetailsOpen} as={Fragment}>
										<Transition.Child
											as={Fragment}
											enter="ease-out duration-200"
											enterFrom="opacity-0"
											enterTo="opacity-100"
											leave="ease-in duration-150"
											leaveFrom="opacity-100"
											leaveTo="opacity-0"
										>
											<div
												className="absolute inset-0 z-20 bg-black/30 md:hidden"
												onClick={() => setIsMobileDetailsOpen(false)}
											/>
										</Transition.Child>
										<Transition.Child
											as={Fragment}
											enter="transform ease-out duration-200"
											enterFrom="translate-x-full"
											enterTo="translate-x-0"
											leave="transform ease-in duration-150"
											leaveFrom="translate-x-0"
											leaveTo="translate-x-full"
										>
											<div className="absolute inset-y-0 right-0 z-30 w-[min(22rem,100vw-1rem)] md:hidden">
												<CardRightPanel
													cardPublicId={cardPublicId}
													isTemplate={isTemplate}
												/>
											</div>
										</Transition.Child>
									</Transition>
								</>
							)}
						</Dialog.Panel>
					</Transition.Child>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
