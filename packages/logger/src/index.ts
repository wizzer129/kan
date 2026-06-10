import { Axiom } from '@axiomhq/js';
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';
const isCloud = process.env.NEXT_PUBLIC_KAN_ENV === 'cloud';
const FALLBACK_LEVEL = isDev ? 'debug' : 'info';
const VALID_LEVELS = new Set([
	'trace',
	'debug',
	'info',
	'warn',
	'error',
	'fatal',
	'silent',
]);

function resolveLogLevel(value: string | undefined): string {
	const normalized = value?.trim().toLowerCase();
	if (!normalized || !VALID_LEVELS.has(normalized)) {
		return FALLBACK_LEVEL;
	}

	return normalized;
}

const level = resolveLogLevel(process.env.LOG_LEVEL);

const axiomToken = process.env.AXIOM_TOKEN;
const axiomDataset = process.env.AXIOM_DATASET;
const useAxiom = isCloud && !!axiomToken && !!axiomDataset;

function createAxiomStream(
	token: string,
	dataset: string,
): pino.DestinationStream {
	const client = new Axiom({ token });
	return {
		write(msg: string) {
			try {
				client.ingest(dataset, [
					JSON.parse(msg) as Record<string, unknown>,
				]);
			} catch {
				// ignore malformed log lines
			}
		},
	};
}

export const logger = useAxiom
	? pino(
			{ level },
			pino.multistream([
				{ stream: process.stdout, level },
				{ stream: createAxiomStream(axiomToken, axiomDataset), level },
			]),
		)
	: pino({
			level,
			...(isDev && {
				transport: {
					target: 'pino-pretty',
					options: {
						colorize: true,
						ignore: 'pid,hostname',
						translateTime: 'HH:MM:ss',
					},
				},
			}),
		});

export const createLogger = (module: string) => logger.child({ module });
