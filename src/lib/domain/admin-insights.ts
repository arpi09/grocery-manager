/** OpenAI strict json_schema for admin Decisions AI insights. */
export const ADMIN_INSIGHTS_SCHEMA = {
	type: 'object',
	properties: {
		summaryParagraphs: {
			type: 'array',
			items: { type: 'string' },
			minItems: 3,
			maxItems: 5
		},
		anomalyFlags: {
			type: 'array',
			items: { type: 'string' }
		},
		chartCaptions: {
			type: 'object',
			properties: {
				funnel: { type: 'string' },
				retention: { type: 'string' },
				events: { type: 'string' },
				heatmap: { type: 'string' },
				cohort: { type: 'string' }
			},
			required: ['funnel', 'retention', 'events', 'heatmap', 'cohort'],
			additionalProperties: false
		}
	},
	required: ['summaryParagraphs', 'anomalyFlags', 'chartCaptions'],
	additionalProperties: false
} as const;
