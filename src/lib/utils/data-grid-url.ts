import {
	DEFAULT_DATA_GRID_PAGE,
	DEFAULT_DATA_GRID_PAGE_SIZE,
	DEFAULT_DATA_GRID_SORT_DIRECTION,
	parseDataGridPage,
	parseDataGridPageSize,
	parseDataGridSortDirection,
	type DataGridPageSize,
	type DataGridSortDirection,
	type DataGridState
} from '$lib/domain/data-grid-state';

export const DATA_GRID_PARAM_Q = 'q';
export const DATA_GRID_PARAM_FILTER = 'filter';
export const DATA_GRID_PARAM_SORT = 'sort';
export const DATA_GRID_PARAM_DIR = 'dir';
export const DATA_GRID_PARAM_PAGE = 'page';
export const DATA_GRID_PARAM_PAGE_SIZE = 'pageSize';

const DATA_GRID_PARAMS = new Set([
	DATA_GRID_PARAM_Q,
	DATA_GRID_PARAM_FILTER,
	DATA_GRID_PARAM_SORT,
	DATA_GRID_PARAM_DIR,
	DATA_GRID_PARAM_PAGE,
	DATA_GRID_PARAM_PAGE_SIZE
]);

export interface DataGridUrlDefaults<F extends string, S extends string> {
	filter: F;
	sort: S;
	dir?: DataGridSortDirection;
	page?: number;
	pageSize?: DataGridPageSize;
}

export function parseDataGridStateFromSearchParams<F extends string, S extends string>(
	searchParams: URLSearchParams,
	parseFilter: (value: string | null) => F,
	parseSort: (value: string | null) => S,
	defaults: DataGridUrlDefaults<F, S>
): DataGridState<F, S> {
	return {
		q: searchParams.get(DATA_GRID_PARAM_Q) ?? '',
		filter: parseFilter(searchParams.get(DATA_GRID_PARAM_FILTER)),
		sort: parseSort(searchParams.get(DATA_GRID_PARAM_SORT)),
		dir: parseDataGridSortDirection(searchParams.get(DATA_GRID_PARAM_DIR) ?? defaults.dir),
		page: parseDataGridPage(searchParams.get(DATA_GRID_PARAM_PAGE) ?? String(defaults.page ?? DEFAULT_DATA_GRID_PAGE)),
		pageSize: parseDataGridPageSize(
			searchParams.get(DATA_GRID_PARAM_PAGE_SIZE) ?? String(defaults.pageSize ?? DEFAULT_DATA_GRID_PAGE_SIZE)
		)
	};
}

export function buildDataGridUrl<F extends string, S extends string>(
	pathname: string,
	state: DataGridState<F, S>,
	defaults: DataGridUrlDefaults<F, S>,
	preserveParams?: URLSearchParams
): string {
	const url = new URL(pathname, 'http://local');
	if (preserveParams) {
		for (const [key, value] of preserveParams) {
			if (!DATA_GRID_PARAMS.has(key)) {
				url.searchParams.append(key, value);
			}
		}
	}

	const trimmedQuery = state.q.trim();
	if (trimmedQuery) {
		url.searchParams.set(DATA_GRID_PARAM_Q, trimmedQuery);
	} else {
		url.searchParams.delete(DATA_GRID_PARAM_Q);
	}

	if (state.filter !== defaults.filter) {
		url.searchParams.set(DATA_GRID_PARAM_FILTER, state.filter);
	} else {
		url.searchParams.delete(DATA_GRID_PARAM_FILTER);
	}

	if (state.sort !== defaults.sort) {
		url.searchParams.set(DATA_GRID_PARAM_SORT, state.sort);
	} else {
		url.searchParams.delete(DATA_GRID_PARAM_SORT);
	}

	const defaultDir = defaults.dir ?? DEFAULT_DATA_GRID_SORT_DIRECTION;
	if (state.dir !== defaultDir) {
		url.searchParams.set(DATA_GRID_PARAM_DIR, state.dir);
	} else {
		url.searchParams.delete(DATA_GRID_PARAM_DIR);
	}

	const defaultPage = defaults.page ?? DEFAULT_DATA_GRID_PAGE;
	if (state.page !== defaultPage) {
		url.searchParams.set(DATA_GRID_PARAM_PAGE, String(state.page));
	} else {
		url.searchParams.delete(DATA_GRID_PARAM_PAGE);
	}

	const defaultPageSize = defaults.pageSize ?? DEFAULT_DATA_GRID_PAGE_SIZE;
	if (state.pageSize !== defaultPageSize) {
		url.searchParams.set(DATA_GRID_PARAM_PAGE_SIZE, String(state.pageSize));
	} else {
		url.searchParams.delete(DATA_GRID_PARAM_PAGE_SIZE);
	}

	return `${url.pathname}${url.search}`;
}
