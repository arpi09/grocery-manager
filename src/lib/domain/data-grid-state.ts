export type DataGridSortDirection = 'asc' | 'desc';

export const DATA_GRID_PAGE_SIZE_OPTIONS = [5, 10, 25] as const;
export type DataGridPageSize = (typeof DATA_GRID_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_DATA_GRID_PAGE_SIZE: DataGridPageSize = 10;
export const DEFAULT_DATA_GRID_PAGE = 1;
export const DEFAULT_DATA_GRID_SORT_DIRECTION: DataGridSortDirection = 'asc';

export interface DataGridState<F extends string = string, S extends string = string> {
	q: string;
	filter: F;
	sort: S;
	dir: DataGridSortDirection;
	page: number;
	pageSize: DataGridPageSize;
}

export interface DataGridPipelineAdapters<TRow, F extends string, S extends string> {
	matchesFacet: (row: TRow, filter: F) => boolean;
	matchesSearch: (row: TRow, q: string) => boolean;
	compare: (a: TRow, b: TRow, sort: S, dir: DataGridSortDirection) => number;
}

export interface DataGridPipelineResult<TRow> {
	allRows: TRow[];
	pageRows: TRow[];
	totalCount: number;
	pageCount: number;
	page: number;
	rangeStart: number;
	rangeEnd: number;
}

export function parseDataGridSortDirection(value: string | null | undefined): DataGridSortDirection {
	return value === 'desc' ? 'desc' : 'asc';
}

export function parseDataGridPage(value: string | null | undefined): number {
	const parsed = Number.parseInt(value ?? '', 10);
	return Number.isFinite(parsed) && parsed >= 1 ? parsed : DEFAULT_DATA_GRID_PAGE;
}

export function parseDataGridPageSize(value: string | null | undefined): DataGridPageSize {
	const parsed = Number.parseInt(value ?? '', 10);
	if (parsed === 5 || parsed === 10 || parsed === 25) {
		return parsed;
	}
	return DEFAULT_DATA_GRID_PAGE_SIZE;
}

export function clampPage(page: number, pageCount: number): number {
	if (pageCount < 1) {
		return DEFAULT_DATA_GRID_PAGE;
	}
	return Math.min(Math.max(page, 1), pageCount);
}

export function computePageCount(totalCount: number, pageSize: number): number {
	if (totalCount <= 0) {
		return 1;
	}
	return Math.ceil(totalCount / pageSize);
}

export function computeRange(
	totalCount: number,
	page: number,
	pageSize: number
): Pick<DataGridPipelineResult<unknown>, 'rangeStart' | 'rangeEnd' | 'pageCount' | 'page'> {
	const pageCount = computePageCount(totalCount, pageSize);
	const clampedPage = clampPage(page, pageCount);
	if (totalCount === 0) {
		return { rangeStart: 0, rangeEnd: 0, pageCount, page: clampedPage };
	}
	const rangeStart = (clampedPage - 1) * pageSize + 1;
	const rangeEnd = Math.min(clampedPage * pageSize, totalCount);
	return { rangeStart, rangeEnd, pageCount, page: clampedPage };
}

export function applyFacet<TRow, F extends string>(
	rows: TRow[],
	filter: F,
	matchesFacet: (row: TRow, filter: F) => boolean
): TRow[] {
	return rows.filter((row) => matchesFacet(row, filter));
}

export function applySearch<TRow>(
	rows: TRow[],
	q: string,
	matchesSearch: (row: TRow, query: string) => boolean
): TRow[] {
	const normalized = q.trim();
	if (!normalized) {
		return rows;
	}
	return rows.filter((row) => matchesSearch(row, normalized));
}

export function sortRows<TRow, S extends string>(
	rows: TRow[],
	sort: S,
	dir: DataGridSortDirection,
	compare: (a: TRow, b: TRow, sort: S, direction: DataGridSortDirection) => number
): TRow[] {
	return [...rows].sort((a, b) => compare(a, b, sort, dir));
}

export function paginateRows<TRow>(
	rows: TRow[],
	page: number,
	pageSize: number
): DataGridPipelineResult<TRow> {
	const totalCount = rows.length;
	const { rangeStart, rangeEnd, pageCount, page: clampedPage } = computeRange(totalCount, page, pageSize);
	const startIndex = (clampedPage - 1) * pageSize;
	const pageRows = rows.slice(startIndex, startIndex + pageSize);
	return {
		allRows: rows,
		pageRows,
		totalCount,
		pageCount,
		page: clampedPage,
		rangeStart,
		rangeEnd
	};
}

export function runDataGridPipeline<TRow, F extends string, S extends string>(
	rawRows: TRow[],
	state: DataGridState<F, S>,
	adapters: DataGridPipelineAdapters<TRow, F, S>
): DataGridPipelineResult<TRow> {
	const faceted = applyFacet(rawRows, state.filter, adapters.matchesFacet);
	const searched = applySearch(faceted, state.q, adapters.matchesSearch);
	const sorted = sortRows(searched, state.sort, state.dir, adapters.compare);
	return paginateRows(sorted, state.page, state.pageSize);
}
