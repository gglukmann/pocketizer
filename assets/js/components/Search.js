import * as helpers from '../utils/helpers.js';
import * as globals from '../utils/globals.js';
import pocket from '../App.js';
import item from './Item.js';
import apiService from '../services/ApiService.js';

class Search {
    /**
     * constructor
     */
    constructor() {
        this.state = {
            hasSearched: false,
        };

        this.makeSearchClick = this.handleMakeSearchClick.bind(this);
        this.closeSearchClick = this.handleCloseSearchClick.bind(this);
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
        document.querySelector('#js-searchInput').addEventListener('keyup', this.makeSearchClick, false);
        document.querySelector('#js-emptySearch').addEventListener('click', this.closeSearchClick, false);
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        document.querySelector('#js-searchInput').removeEventListener('keyup', this.makeSearchClick, false);
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
            this.search(event.target.value);
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

        const searchIcon = document.querySelector('#js-searchIcon');
        const searchingIcon = document.querySelector('#js-searchingIcon');
        helpers.hide(searchIcon);
        helpers.show(searchingIcon);

        const searchCountElement = document.querySelector('#js-searchCount');
        const isTag = value.startsWith('#') || value.startsWith('tag:');

        this.state.hasSearched = true;

        helpers.hide(document.querySelector('#js-filterButtons'));
        helpers.show(document.querySelector('#js-results-message'));
        document.querySelector('#js-searchValue').innerText = value;
        helpers.clearChildren(document.querySelector('#js-list'));

        let count = 0;
        searchCountElement.innerText = count;

        if (isTag) {
            document.querySelector('#js-searchInput').value = value;

            if (value.startsWith('#')) {
                value = value.substr(1);
            } else if (value.startsWith('tag:')) {
                value = value.substr(4);
            }

            const response = await apiService.search({ tag: value });
            const array = helpers.transformObjectToArray(response.list);

            for (const arrayItem of array) {
                if (value !== 'untagged' && arrayItem.tags) {
                    for (const tag in arrayItem.tags) {
                        if (tag.toLowerCase() === value) {
                            const newItem = item.create(arrayItem);
                            item.render(newItem);

                            count++;
                        }
                    }
                } else if (value === 'untagged' && !arrayItem.tags) {
                    const newItem = item.create(arrayItem);
                    item.render(newItem);

                    count++;
                }
            }
        } else {
            const response = await apiService.search({ search: value });
            const array = helpers.transformObjectToArray(response.list);

            for (const arrayItem of array) {
                const newItem = item.create(arrayItem);
                item.render(newItem);

                count++;
            }
        }

        helpers.show(searchIcon);
        helpers.hide(searchingIcon);

        const resultsStringElement = document.querySelector('#js-resultsString');
        const resultsStringPrefix = document.querySelector('#js-resultsStringPrefix');
        const tagString = isTag ? ` ${chrome.i18n.getMessage('TAG')}` : '';
        const currentListString =
            pocket.getActivePage() === globals.PAGES.LIST
                ? ` ${chrome.i18n.getMessage('MY_LIST')}`
                : ` ${chrome.i18n.getMessage('ARCHIVE')}`;
        if (count === 0) {
            resultsStringElement.innerText = chrome.i18n.getMessage('NO_RESULTS_MESSAGE') + tagString;
            resultsStringPrefix.innerText = chrome.i18n.getMessage('IN') + currentListString;
            helpers.hide(searchCountElement);
        } else {
            resultsStringElement.innerText =
                (count === 1 ? chrome.i18n.getMessage('RESULT_MESSAGE') : chrome.i18n.getMessage('RESULTS_MESSAGE')) +
                tagString;
            resultsStringPrefix.innerText = chrome.i18n.getMessage('IN') + currentListString;
            helpers.show(searchCountElement, true);
            searchCountElement.innerText = count;
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
        this.hide(true);
        this.removeEvents();
    }
}

const search = new Search();
export default search;
