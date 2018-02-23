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
        helper.addClass(document.querySelector('#js-searchForm'), 'is-active');
        document.querySelector('#js-searchInput').focus();
        helper.addClass(document.querySelector('#js-searchButton'), 'is-disabled');
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
     * Handle search keyup event.
     *
     * @function handleMakeSearchClick
     * @param {Event} e - Keyup event.
     * @return {void}
     */
    handleMakeSearchClick(e) {
        this.state.hasSearched = true;

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
        helper.removeClass(document.querySelector('#js-searchForm'), 'is-active');
        helper.removeClass(document.querySelector('#js-searchButton'), 'is-disabled');

        if (hideMessage) {
            document.querySelector('#js-results-message').style.display = 'none';
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
        document.querySelector('#js-results-message').style.display = 'none';

        if (pocket.getActivePage() === 'list') {
            trendingItem.showAll();
        }

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

        trendingItem.hideAll();
        document.querySelector('#js-results-message').removeAttribute('style');
        document.querySelector('#js-searchValue').innerText = value;
        document.querySelector('#js-list').innerHTML = '';
        value = value.toLowerCase();

        let array = JSON.parse(localStorage.getItem(`${pocket.getActivePage()}FromLocalStorage`));
        let count = 0;

        for (let arrayItem of array) {
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
                let newItem = item.create(arrayItem);
                item.render(newItem);

                count++;
            }
        }

        const resultsStringElement = document.querySelector('#js-resultsString');
        const searchCountElement = document.querySelector('#js-searchCount');
        if (count === 0) {
            resultsStringElement.innerText = chrome.i18n.getMessage('NO_RESULTS_MESSAGE');
            searchCountElement.style.display = 'none';
        } else {
            resultsStringElement.innerText = chrome.i18n.getMessage('RESULTS_MESSAGE');
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
