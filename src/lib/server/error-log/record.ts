import {
	ERROR_LOG_MESSAGE_MAX_LENGTH,
	ERROR_LOG_STACK_MAX_LENGTH,
	type RecordAppErrorInput
} from '$lib/domain/error-log';
import {
	DrizzleErrorLogRepository,
	type IErrorLogRepository
} from '$lib/infrastructure/repositories/error-log.repository';
import {
	errorMessageFromUnknown,
	errorStackFromUnknown,
	sanitizeErrorMessage,
	truncateForLog
} from './sanitize';

const defaultRepository = new DrizzleErrorLogRepository();

export function prepareErrorLogEntry(
	input: RecordAppErrorInput | { error: unknown; path: string; userId?: string | null; statusCode?: number | null }
): RecordAppErrorInput {
	if ('error' in input) {
		const stack = errorStackFromUnknown(input.error);
		return {
			message: truncateForLog(errorMessageFromUnknown(input.error), ERROR_LOG_MESSAGE_MAX_LENGTH),
			stack: stack
				? truncateForLog(stack, ERROR_LOG_STACK_MAX_LENGTH)
				: null,
			path: input.path,
			userId: input.userId ?? null,
			statusCode: input.statusCode ?? null
		};
	}

	return {
		message: truncateForLog(sanitizeErrorMessage(input.message), ERROR_LOG_MESSAGE_MAX_LENGTH),
		stack: input.stack
			? truncateForLog(input.stack, ERROR_LOG_STACK_MAX_LENGTH)
			: null,
		path: input.path,
		userId: input.userId ?? null,
		statusCode: input.statusCode ?? null
	};
}

export async function recordAppError(
	input: RecordAppErrorInput | { error: unknown; path: string; userId?: string | null; statusCode?: number | null },
	repository: IErrorLogRepository = defaultRepository
): Promise<void> {
	try {
		const entry = prepareErrorLogEntry(input);
		const id = crypto.randomUUID();
		await repository.insert({ ...entry, id });
		await repository.enforceRetention();
	} catch {
		// Never break the request path because logging failed.
	}
}
