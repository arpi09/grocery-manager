const REDACTED = '[REDACTED]';

/** Keys whose values must never appear in persisted error logs. */
const SENSITIVE_KEY = /^(password|passwordHash|password_hash|token|secret|apiKey|api_key|authorization|cookie|session)$/i;

export function truncateForLog(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value;
	}
	return `${value.slice(0, maxLength)}… [truncated]`;
}

export function sanitizeErrorText(value: string): string {
	let result = value;

	result = result.replace(/password\s*[=:]\s*\S+/gi, `password=${REDACTED}`);
	result = result.replace(/"password"\s*:\s*"[^"]*"/gi, `"password":"${REDACTED}"`);
	result = result.replace(/'password'\s*:\s*'[^']*'/gi, `'password':'${REDACTED}'`);
	result = result.replace(/passwordHash\s*[=:]\s*\S+/gi, `passwordHash=${REDACTED}`);
	result = result.replace(/Bearer\s+\S+/gi, `Bearer ${REDACTED}`);
	result = result.replace(/lucia_session=[^;\s]+/gi, `lucia_session=${REDACTED}`);
	result = result.replace(/\bsk-[a-zA-Z0-9]{8,}\b/g, REDACTED);
	result = result.replace(/OPENAI_API_KEY\s*[=:]\s*\S+/gi, `OPENAI_API_KEY=${REDACTED}`);
	result = result.replace(
		/"(token|secret|apiKey|api_key|authorization|session|password)"\s*:\s*"([^"]*)"/gi,
		`"$1":"${REDACTED}"`
	);

	return result;
}

export function sanitizeErrorMessage(message: string): string {
	return sanitizeErrorText(message);
}

export function errorMessageFromUnknown(error: unknown): string {
	if (error instanceof Error) {
		return sanitizeErrorMessage(error.message || error.name || 'Error');
	}
	if (typeof error === 'string') {
		return sanitizeErrorMessage(error);
	}
	try {
		return sanitizeErrorMessage(JSON.stringify(error));
	} catch {
		return 'Unknown error';
	}
}

export function errorStackFromUnknown(error: unknown): string | null {
	if (!(error instanceof Error) || !error.stack) {
		return null;
	}
	return sanitizeErrorText(error.stack);
}

export function isSensitiveFormField(name: string): boolean {
	return SENSITIVE_KEY.test(name);
}
