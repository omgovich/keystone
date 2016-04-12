import {
	ADD_FILTER,
	CLEAR_FILTER,
	CLEAR_ALL_FILTERS,
	SELECT_LIST,
	ITEMS_LOADED,
	LOAD_ITEMS,
	DELETE_ITEM,
	SET_ACTIVE_COLUMNS,
	SET_ACTIVE_SEARCH,
	SET_ACTIVE_SORT,
	SET_CURRENT_PAGE,
	ITEM_LOADING_ERROR,
} from './constants';

export function selectList (id) {
	return {
		type: SELECT_LIST,
		id,
	};
}

export function loadItems () {
	return (dispatch, getState) => {
		dispatch({ type: LOAD_ITEMS });
		const state = getState();
		const currentList = state.lists.currentList;
		currentList.loadItems({
			search: state.lists.active.search,
			filters: state.lists.active.filters,
			sort: state.lists.active.sort,
			columns: state.lists.active.columns,
			page: state.lists.page,
		}, (err, items) => {
			// TODO: graceful error handling
			if (items) {
				// if (page.index !== drag.page && drag.item) {
				// 	// add the dragging item
				// 	if (page.index > drag.page) {
				// 		_items.results.unshift(drag.item);
				// 	} else {
				// 		_items.results.push(drag.item);
				// 	}
				// }
				// _itemsResultsClone = items.results.slice(0);
				//
				// if (options.success && options.id) {
				// 	// flashes a success background on the row
				// 	_rowAlert.success = options.id;
				// }
				// if (options.fail && options.id) {
				// 	// flashes a failure background on the row
				// 	_rowAlert.fail = options.id;
				// }
				dispatch(itemsLoaded(items));
			} else {
				dispatch(itemLoadingError(err));
			}
		});
	};
}

export function downloadItems (format, columns) {
	return (dispatch, getState) => {
		const lists = getState().lists;
		const currentList = lists.currentList;
		const url = currentList.getDownloadURL({
			search: lists.active.search,
			filters: lists.active.filters,
			sort: lists.active.sort,
			columns: columns ? currentList.expandColumns(columns) : lists.active.columns,
			format: format,
		});
		window.open(url);
	};
}

export function itemsLoaded (items) {
	return {
		type: ITEMS_LOADED,
		items,
	};
}

export function itemLoadingError (err) {
	return {
		type: ITEM_LOADING_ERROR,
		err,
	};
}

export function deleteItem (id) {
	return {
		type: DELETE_ITEM,
		id,
	};
}

export function deleteItems (ids) {
	return (dispatch, getState) => {
		for (var i = 0; i < ids.length; i++) {
			dispatch(deleteItem(ids[i]));
		}
	};
}

export function setActiveSearch (searchString) {
	return {
		type: SET_ACTIVE_SEARCH,
		searchString,
	};
}

export function setActiveSort (path) {
	return {
		type: SET_ACTIVE_SORT,
		path,
	};
}

export function setActiveColumns (columns) {
	if (Array.isArray(columns)) columns = columns.join(',');
	// if (columns === _list.defaultColumnPaths) columns = undefined;
	return {
		type: SET_ACTIVE_COLUMNS,
		columns,
	};
}

export function setCurrentPage (index) {
	if (index === 1) index = undefined;
	return {
		type: SET_CURRENT_PAGE,
		index,
	};
}

function addFilter (filter) {
	return {
		type: ADD_FILTER,
		filter,
	};
}

export function clearFilter (path) {
	return {
		type: CLEAR_FILTER,
		path,
	};
}

export function clearAllFilters () {
	return {
		type: CLEAR_ALL_FILTERS,
	};
}

export function setFilter (path, value) {
	return (dispatch, getState) => {
		const state = getState();
		const activeFilters = state.lists.active.filters;
		const currentList = state.lists.currentList;
		// Get current filter
		let filter = activeFilters.filter(i => i.field.path === path)[0];
		// If a filter exists already, update its value
		if (filter) {
			filter.value = value;
		// Otherwise construct a new one
		} else {
			const field = currentList.fields[path];
			if (!field) {
				console.warn('Invalid Filter path specified:', path);
				return;
			}
			filter = {
				field,
				value,
			};
		}
		dispatch(addFilter(filter));
		dispatch(setCurrentPage(1));
	};
}
