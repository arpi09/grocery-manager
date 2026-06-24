import { describe, it } from 'vitest';
import { assertStrictOpenAiSchema } from '$lib/server/testing/assert-strict-openai-schema';
import { ADMIN_INSIGHTS_SCHEMA } from './admin-insights';

describe('ADMIN_INSIGHTS_SCHEMA', () => {
	it('lists every property as required for OpenAI strict json_schema', () => {
		assertStrictOpenAiSchema(ADMIN_INSIGHTS_SCHEMA);
	});
});
