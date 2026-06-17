export interface MetricBarSegment {
	key: string;
	value: number;
	color: string;
	label?: string;
}

export interface MetricBarSegmentWithWidth extends MetricBarSegment {
	widthPercent: number;
}

/** Normalizes segment values into horizontal bar width percentages (0–100). */
export function computeMetricBarWidths(segments: MetricBarSegment[]): MetricBarSegmentWithWidth[] {
	const safeSegments = segments.map((segment) => ({
		...segment,
		value: Math.max(0, segment.value)
	}));
	const total = safeSegments.reduce((sum, segment) => sum + segment.value, 0);

	if (total <= 0) {
		return safeSegments.map((segment) => ({ ...segment, widthPercent: 0 }));
	}

	return safeSegments.map((segment) => ({
		...segment,
		widthPercent: (segment.value / total) * 100
	}));
}
