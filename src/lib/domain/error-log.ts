export const ERROR_LOG_MAX_ENTRIES = 200;
export const ERROR_LOG_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const ERROR_LOG_STACK_MAX_LENGTH = 8_000;
export const ERROR_LOG_MESSAGE_MAX_LENGTH = 2_000;
export const ERROR_LOG_ADMIN_LIST_DEFAULT = 50;
export const ERROR_LOG_ADMIN_LIST_MAX = 100;

export interface AppErrorEntry {
	id: string;
	message: string;
	stack: string | null;
	path: string;
	userId: string | null;
	statusCode: number | null;
	createdAt: Date;
}

export interface RecordAppErrorInput {
	message: string;
	stack?: string | null;
	path: string;
	userId?: string | null;
	statusCode?: number | null;
}
