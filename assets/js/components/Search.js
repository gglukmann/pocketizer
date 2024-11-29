import pocket from '../App.js';
import apiService from '../services/ApiService.js';
import * as globals from '../utils/globals.js';
import * as helpers from '../utils/helpers.js';

class Search {
    /**
     * constructor
     */
    constructor() {
        this.state = {
            value: {},
            hasSearched: false,
        };
        this.itemsShown = 0;

        this.makeSearchClick = this.handleMakeSearchClick.bind(this);
        this.closeSearchClick = this.handleCloseSearchClick.bind(this);
        this.debouncedSearch = helpers.debounce(this.search, 300);
        this.handleInfiniteScroll = this.infiniteScroll.bind(this);
    }

    /**
     * Initialize search plugin.
     *
     * @function init
     * @return {void}
     */
    init() {
        this.bindEvents();
    }

    /**
     * Show search input.
     *
     * @function show
     * @return {void}
     */
    show() {
        helpers.addClass(document.querySelector('#js-searchForm'), 'is-active');
        document.querySelector('#js-searchInput').focus();
        helpers.addClass(document.querySelector('#js-searchButton'), 'is-disabled');
    }

    /**
     * Bind all events.
     *
     * @function bindEvents
     * @return {void}
     */
    bindEvents() {
        document.querySelector('#js-searchInput').addEventListener('input', this.makeSearchClick, false);
        document.querySelector('#js-emptySearch').addEventListener('click', this.closeSearchClick, false);
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        document.querySelector('#js-searchInput').removeEventListener('input', this.makeSearchClick, false);
        document.querySelector('#js-emptySearch').removeEventListener('click', this.closeSearchClick, false);
    }

    /**
     * Has been searched.
     *
     * @function hasSearched
     * @return {Boolean} - Has been searched.
     */
    hasSearched() {
        return this.state.hasSearched;
    }

    /**
     * Handle search keyup event.
     *
     * @function handleMakeSearchClick
     * @param {Event} event - Keyup event.
     * @return {void}
     */
    handleMakeSearchClick(event) {
        if (event.target.value.length >= 3) {
            this.debouncedSearch(event.target.value);
        }
    }

    /**
     * Handle close search click.
     *
     * @function handleCloseSearchClick
     * @param {Event} event - Click event.
     * @return {void}
     */
    handleCloseSearchClick(event) {
        event.preventDefault();

        this.reset(true);
    }

    /**
     * Hide search input.
     *
     * @function hide
     * @return {void}
     */
    hide(hideMessage) {
        helpers.removeClass(document.querySelector('#js-searchForm'), 'is-active');
        helpers.removeClass(document.querySelector('#js-searchButton'), 'is-disabled');
        helpers.show(document.querySelector('#js-filterButtons'), true);

        if (hideMessage) {
            helpers.hide(document.querySelector('#js-results-message'));
        }
    }

    /**
     * Reset search results.
     *
     * @function reset
     * @param {Boolean} doHide - If search input should be hidden too.
     * @return {void}
     */
    reset(doHide) {
        document.querySelector('#js-searchInput').value = '';
        helpers.hide(document.querySelector('#js-results-message'));

        if (this.state.hasSearched) {
            pocket.render();
        }

        if (doHide) {
            this.state.hasSearched = false;
            this.state.value = {};
            this.itemsShown = 0;
            this.hide(true);
        }
    }

    /**
     * Search from localStorage array.
     *
     * @function search
     * @param {String} value - Value to search.
     * @return {void}
     */
    async search(value) {
        if (value.length === 0) {
            this.reset();
            return;
        }

        this.state.hasSearched = true;

        const searchIcon = document.querySelector('#js-searchIcon');
        const searchingIcon = document.querySelector('#js-searchingIcon');
        helpers.hide(searchIcon);
        helpers.show(searchingIcon);
        const loader = document.querySelector('#js-loader');
        helpers.show(loader, true);

        const resultsMessage = document.querySelector('#js-results-message');
        helpers.hide(resultsMessage);

        const searchCountElement = document.querySelector('#js-searchCount');
        const isTag = value.startsWith('#') || value.startsWith('tag:');

        helpers.hide(document.querySelector('#js-filterButtons'));
        document.querySelector('#js-searchValue').innerText = value;
        helpers.clearChildren(document.querySelector('#js-list'));

        searchCountElement.innerText = 0;

        if (isTag) {
            document.querySelector('#js-searchInput').value = value;

            if (value.startsWith('#')) {
                value = value.substr(1);
            } else if (value.startsWith('tag:')) {
                value = value.substr(4);
            }

            this.state.value = { tag: value };
            const response = await apiService.paginate({ offset: this.itemsShown, tag: value });
            searchCountElement.innerText = response.total;
            const array = helpers.sortBySortId(helpers.transformObjectToArray(response.list));

            pocket.createItems(array);
        } else {
            this.state.value = { search: value };
            const response = await apiService.paginate({ offset: this.itemsShown, search: value });
            searchCountElement.innerText = response.total;
            const array = helpers.sortBySortId(helpers.transformObjectToArray(response.list));

            pocket.createItems(array);
        }

        this.itemsShown = globals.LOAD_COUNT;
        pocket.createSentinel();
        pocket.createSentinelObserver(this.handleInfiniteScroll);

        helpers.show(searchIcon);
        helpers.hide(searchingIcon);
        helpers.hide(loader);

        helpers.show(resultsMessage);
        const resultsStringElement = document.querySelector('#js-resultsString');
        const resultsStringPrefix = document.querySelector('#js-resultsStringPrefix');
        const tagString = isTag ? ` ${chrome.i18n.getMessage('TAG')}` : '';
        const currentListString =
            pocket.getActivePage() === globals.PAGES.LIST
                ? ` ${chrome.i18n.getMessage('MY_LIST')}`
                : ` ${chrome.i18n.getMessage('ARCHIVE')}`;

        resultsStringElement.innerText = chrome.i18n.getMessage('RESULTS_MESSAGE') + tagString;
        resultsStringPrefix.innerText = chrome.i18n.getMessage('IN') + currentListString;
        helpers.show(searchCountElement, true);
    }

    async infiniteScroll() {
        pocket.loading = true;
        const loader = document.querySelector('#js-loader');
        helpers.show(loader, true);
        helpers.showMessage(`${chrome.i18n.getMessage('LOADING')}...`, true, false, false);

        const response = await apiService.paginate({ offset: this.itemsShown, ...this.state.value });
        this.handlePaginationResponse(response);

        helpers.showMessage(`${chrome.i18n.getMessage('LOADING')}`);
        helpers.hide(loader);
        pocket.loading = false;
    }

    handlePaginationResponse(response) {
        // Change shown items count; used for next query offset
        this.itemsShown += globals.LOAD_COUNT;

        const array = helpers.sortBySortId(helpers.transformObjectToArray(response.list));
        pocket.createItems(array);

        if (response.total > this.itemsShown) {
            pocket.moveSentinel();
        } else {
            pocket.removeSentinel();
        }
    }

    /**
     * Destroy plugin.
     *
     * @function destroy
     * @return {void}
     */
    destroy() {
        this.state.hasSearched = false;
        this.state.value = {};
        this.itemsShown = 0;
        this.hide(true);
        this.removeEvents();
    }
}

const search = new Search();
export default search;
