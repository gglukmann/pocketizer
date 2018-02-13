'use strict';

class Search {
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

        this.bindEvents();
    }

    /**
     * Bind events.
     *
     * @function bindEvents
     * @return {void}
     */
    bindEvents() {
        document.querySelector('#js-searchInput').addEventListener('keyup', e => {
            this.search(e.target.value);
        });

        document.querySelector('#js-emptySearch').addEventListener('click', e => {
            e.preventDefault();

            this.reset();
            this.hide();
        });
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

        pocket.render();

        if (doHide) {
            this.hide();
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

        Object.keys(array).forEach(key => {
            let searchableTitle = '';
            let searchableUrl = '';

            if (array[key].resolved_title && array[key].resolved_title !== '') {
                searchableTitle = array[key].resolved_title;
            } else if (array[key].given_title && array[key].given_title !== '') {
                searchableTitle = array[key].given_title;
            }

            if (array[key].resolved_url && array[key].resolved_url !== '') {
                searchableUrl = array[key].resolved_url;
            } else {
                searchableUrl = array[key].given_url;
            }

            if (searchableTitle.toLowerCase().indexOf(value) > -1 || searchableUrl.toLowerCase().indexOf(value) > -1) {
                let newItem = item.create(array[key]);
                item.render(newItem);

                count++;
            }
        });

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
    }
}

const search = new Search();
