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
        Helper.addClass(document.querySelector('#js-searchForm'), 'is-active');
        document.querySelector('#js-searchInput').focus();
        Helper.addClass(document.querySelector('#js-searchButton'), 'is-disabled');
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
     * @param {Event} e - Keyup event.
     * @return {void}
     */
    handleMakeSearchClick(e) {
        if (e.target.value.length >= 3) {
            this.search(e.target.value);
        }
    }

    /**
     * Handle close search click.
     *
     * @function handleCloseSearchClick
     * @param {Event} e - Click event.
     * @return {void}
     */
    handleCloseSearchClick(e) {
        e.preventDefault();

        this.reset(true);
    }

    /**
     * Hide search input.
     *
     * @function hide
     * @return {void}
     */
    hide(hideMessage) {
        Helper.removeClass(document.querySelector('#js-searchForm'), 'is-active');
        Helper.removeClass(document.querySelector('#js-searchButton'), 'is-disabled');

        if (hideMessage) {
            Helper.hide(document.querySelector('#js-results-message'));
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
        Helper.hide(document.querySelector('#js-results-message'));

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
    search(value) {
        if (value.length === 0) {
            this.reset();
            return;
        }

        const isTag = value.startsWith('#') || value.startsWith('tag:');

        this.state.hasSearched = true;

        document.querySelector('#js-results-message').removeAttribute('style');
        document.querySelector('#js-searchValue').innerText = value;
        Helper.clearChildren(document.querySelector('#js-list'));

        if (isTag) {
            document.querySelector('#js-searchInput').value = value;

            if (value.startsWith('#')) {
                value = value.substr(1);
            } else if (value.startsWith('tag:')) {
                value = value.substr(4);
            }
        }

        value = value.toLowerCase();

        let array = JSON.parse(localStorage.getItem(`${pocket.getActivePage()}FromLocalStorage`));
        let count = 0;

        if (isTag) {
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
            for (const arrayItem of array) {
                let searchableTitle = '';
                let searchableUrl = '';

                if (arrayItem.resolved_title && arrayItem.resolved_title !== '') {
                    searchableTitle = arrayItem.resolved_title;
                } else if (arrayItem.given_title && arrayItem.given_title !== '') {
                    searchableTitle = arrayItem.given_title;
                }

                if (arrayItem.resolved_url && arrayItem.resolved_url !== '') {
                    searchableUrl = arrayItem.resolved_url;
                } else {
                    searchableUrl = arrayItem.given_url;
                }

                if (searchableTitle.toLowerCase().indexOf(value) > -1 || searchableUrl.toLowerCase().indexOf(value) > -1) {
                    const newItem = item.create(arrayItem);
                    item.render(newItem);

                    count++;
                }
            }
        }

        const resultsStringElement = document.querySelector('#js-resultsString');
        const searchCountElement = document.querySelector('#js-searchCount');
        const resultsStringPrefix = document.querySelector('#js-resultsStringPrefix');
        const tagString = isTag ? ` ${chrome.i18n.getMessage('TAG')}` : '';
        const currentListString = pocket.getActivePage() === 'list' ? ` ${chrome.i18n.getMessage('MY_LIST')}` : ` ${chrome.i18n.getMessage('ARCHIVE')}`;
        if (count === 0) {
            resultsStringElement.innerText = chrome.i18n.getMessage('NO_RESULTS_MESSAGE') + tagString;
            resultsStringPrefix.innerText = chrome.i18n.getMessage('IN') + currentListString;
            Helper.hide(searchCountElement);
        } else {
            resultsStringElement.innerText = (count === 1 ? chrome.i18n.getMessage('RESULT_MESSAGE') : chrome.i18n.getMessage('RESULTS_MESSAGE')) + tagString;
            resultsStringPrefix.innerText = chrome.i18n.getMessage('IN') + currentListString;
            searchCountElement.removeAttribute('style');
            searchCountElement.innerText = count;
        }

        lazyload.load();
        item.calcBackgroundHeights();
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
