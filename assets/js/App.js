import { header, item, modal, search, selector, settings, tags } from './components/index.js';
import { apiService, authService } from './services/index.js';
import * as connection from './utils/connection.js';
import * as globals from './utils/globals.js';
import * as helpers from './utils/helpers.js';

class App {
    constructor() {
        this.active_page = globals.PAGES.LIST;
        this.items_shown = 0;

        this.scroll = {
            lastKnownScrollY: 0,
            ticking: false,
        };

        this.loading = false;
        this.fullSync = false;
        this.order = settings.getOrder();

        this.itemClicks = this.handleItemClicks.bind(this);
        this.loggedOutClicks = this.handleLoginClick.bind(this);
        this.logoutButtonClick = this.logout.bind(this);
        this.keyDowns = this.handleKeyDowns.bind(this);

        this.handleInfiniteScroll = this.infiniteScroll.bind(this);
    }

    /**
     * Initialize Pocketizer.
     *
     * @function init
     * @return {void}
     */
    init() {
        connection.handleInternetConnection();
        helpers.localizeHtml();
        settings.loadTheme(); // this is here for faster load time
        settings.loadViewType();

        if (authService.isLoggedIn()) {
            this.startSync();
        } else {
            helpers.show(document.querySelector('#js-default-message'));
            this.bindLoggedOutClickEvents();
        }
    }

    /**
     * Get active page string.
     *
     * @function getActivePage
     * @return {String} - Active page name.
     */
    getActivePage() {
        return this.active_page;
    }

    /**
     * Set active page.
     *
     * @function setActivePage
     * @param {String} page - Page string to make active.
     * @return {String} - Active page name.
     */
    setActivePage(page) {
        return (this.active_page = page);
    }

    /**
     * Gets content from localStorage and from Pocket API to see if there are newer links.
     *
     * @function getContent
     * @return {void}
     */
    async getContent() {
        const response = await apiService.sync();
        this.handleApiGetResponse(response);
    }

    /**
     * Sort get response, add to localStorage and render page again.
     *
     * @function handleApiGetResponse
     * @param  {Object} response - response from fetch.
     * @return {void}
     */
    handleApiGetResponse(response) {
        let array = helpers.transformObjectToArray(response.list);
        let isFirstLoad = false;

        switch (this.getActivePage()) {
            case globals.PAGES.LIST:
                if (!helpers.getFromStorage('listSince')) {
                    isFirstLoad = true;
                }
                break;
            case globals.PAGES.ARCHIVE:
                if (!this.isArchiveLoaded()) {
                    isFirstLoad = true;
                }
                break;
        }

        if (isFirstLoad || this.fullSync) {
            array.sort((x, y) => x.sort_id - y.sort_id);

            helpers.setToStorage(`${this.getActivePage()}FromLocalStorage`, JSON.stringify(array));
            helpers.setToStorage(`${this.getActivePage()}Since`, response.since);

            tags.createTags(array, true);

            if (this.fullSync) {
                const eventFullSync = new Event('synced');
                document.dispatchEvent(eventFullSync);
            }

            this.fullSync = false;
        } else {
            array.sort((x, y) => y.sort_id - x.sort_id);

            for (const key in array) {
                let newItem = array[key];
                let newArray;

                switch (newItem.status) {
                    // add to unread list
                    case '0':
                        newArray = JSON.parse(helpers.getFromStorage('listFromLocalStorage'));

                        // delete old item, if it is added from this extension
                        for (const i in newArray) {
                            if (newArray[i].item_id === newItem.item_id) {
                                newArray.splice(i, 1);
                            }
                        }

                        newArray = helpers.prependArray(newArray, newItem);

                        tags.createTags(newArray);

                        helpers.setToStorage('listFromLocalStorage', JSON.stringify(newArray));

                        break;
                    // add to archive list
                    case '1':
                        // delete old item, if it is added to archive from somewhere else and is in unread list in extension
                        newArray = JSON.parse(helpers.getFromStorage('listFromLocalStorage'));
                        newArray = newArray.filter((item) => item.item_id !== newItem.item_id);

                        helpers.setToStorage('listFromLocalStorage', JSON.stringify(newArray));

                        // only add to localStorage archive list if archive is loaded
                        if (this.isArchiveLoaded()) {
                            newArray = JSON.parse(helpers.getFromStorage('archiveFromLocalStorage'));
                            newArray = helpers.prependArray(newArray, newItem);

                            helpers.setToStorage('archiveFromLocalStorage', JSON.stringify(newArray));
                        }
                        break;
                    // delete from unread or archive list
                    case '2':
                        let listArray = JSON.parse(helpers.getFromStorage('listFromLocalStorage'));
                        listArray = listArray.filter((item) => item.item_id !== newItem.item_id);

                        helpers.setToStorage('listFromLocalStorage', JSON.stringify(listArray));

                        if (this.isArchiveLoaded()) {
                            let archiveArray = JSON.parse(helpers.getFromStorage('archiveFromLocalStorage'));
                            archiveArray = archiveArray.filter((item) => item.item_id !== newItem.item_id);

                            helpers.setToStorage('archiveFromLocalStorage', JSON.stringify(archiveArray));
                        }
                        break;
                }
            }

            helpers.setToStorage('listSince', response.since);
            if (this.isArchiveLoaded()) {
                helpers.setToStorage('archiveSince', response.since);
            }
        }

        this.changeListCount(response.total);
        this.render();
        helpers.showMessage(chrome.i18n.getMessage('SYNCHRONIZING'));
    }

    /**
     * Change list count.
     *
     * @function changeListCount
     * @param {Number} total - Total number of items.
     * @return {void}
     */
    changeListCount(total) {
        const cachedTotal = helpers.getFromStorage(`${this.getActivePage()}Count`);

        if (!total && !cachedTotal) {
            helpers.hide(document.querySelector('#js-count-wrapper'));
            return;
        }

        helpers.show(document.querySelector('#js-count-wrapper'), true);

        if (total && total !== cachedTotal) {
            helpers.setToStorage(`${this.getActivePage()}Count`, total);
            document.querySelector('#js-count').innerText = total;
        } else {
            document.querySelector('#js-count').innerText = cachedTotal;
        }
    }

    /**
     * Renders from localStorage.
     *
     * @function render
     * @return {void}
     */
    render() {
        const array = JSON.parse(helpers.getFromStorage(`${this.getActivePage()}FromLocalStorage`));

        this.items_shown = globals.LOAD_COUNT;

        document.querySelector('#js-count').innerText = helpers.getFromStorage(`${this.getActivePage()}Count`);
        helpers.clearChildren(document.querySelector('#js-list'));

        if (array === null) {
            this.getContent();
        } else if (array.length === 0) {
            helpers.show(document.querySelector('#js-empty-list-message'));
            helpers.hide(document.querySelector('#js-filterButtons'));
        } else {
            tags.createTags(array);

            const items = array.filter((_, index) => index < globals.LOAD_COUNT);

            helpers.hide(document.querySelector('#js-empty-list-message'));
            helpers.show(document.querySelector('#js-filterButtons'), true);

            this.createItems(items);
            this.createSentinel();
            this.createSentinelObserver(this.handleInfiniteScroll);
        }
    }

    /**
     * Creates items and appends to DOM.
     *
     * @function createItems
     * @param {Array} array - Array of items.
     * @return {Array[]}
     */
    createItems(array) {
        return array.map((element) => {
            const itemElement = item.create(element);
            return item.render(itemElement);
        });
    }

    /**
     * Create empty div for observer to observe.
     *
     * @function createSentinel
     * @return {void}
     */
    createSentinel() {
        const list = document.querySelector('#js-list');
        const element = helpers.createNode('li');

        element.setAttribute('id', 'js-sentinel');
        element.setAttribute('class', 'sentinel');

        helpers.append(list, element);
    }

    /**
     * Remove sentinel.
     *
     * @function removeSentinel
     * @return {void}
     */
    removeSentinel() {
        const sentinel = document.querySelector('#js-sentinel');
        sentinel.remove();
    }

    /**
     * Move sentinel to the end of the list.
     *
     * @function moveSentinel
     * @return {void}
     */
    moveSentinel() {
        const sentinel = document.querySelector('#js-sentinel');
        const list = document.querySelector('#js-list');
        helpers.append(list, sentinel);
    }

    /**
     * Create IntersectionObserver to load more items on scroll.
     *
     * @function createSentinelObserver
     * @return {void}
     */
    createSentinelObserver(cb) {
        const sentinel = document.querySelector('#js-sentinel');

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 1.0,
        };
        const callback = (entries) => {
            if (entries[0].isIntersecting && entries[0].intersectionRatio === 1 && !this.loading) {
                cb();
            }
        };

        const observer = new IntersectionObserver(callback, options);

        observer.observe(sentinel);
    }

    /**
     * Load more items.
     *
     * @function infiniteScroll
     * @return {void}
     */
    async infiniteScroll() {
        this.loading = true;
        const loader = document.querySelector('#js-loader');
        helpers.show(loader, true);
        helpers.showMessage(`${chrome.i18n.getMessage('LOADING')}...`, true, false, false);

        const response = await apiService.paginate({ offset: this.items_shown });
        this.handlePaginationResponse(response);

        helpers.showMessage(`${chrome.i18n.getMessage('LOADING')}`);
        helpers.hide(loader);
        this.loading = false;
    }

    /**
     * Handle pagination response.
     *
     * @function handlePaginationResponse
     * @param {Object} response - Response from pagination.
     * @return {void}
     */
    handlePaginationResponse(response) {
        this.changeListCount(response.total);

        // Change shown items count; used for next query offset
        this.items_shown += globals.LOAD_COUNT;

        const array = helpers.sortBySortId(helpers.transformObjectToArray(response.list));
        this.createItems(array);
        tags.createTags(array);

        if (response.total > this.items_shown) {
            this.moveSentinel();
        } else {
            this.removeSentinel();
        }
    }

    /**
     * Is Archive list loaded.
     *
     * @function isArchiveLoaded
     * @return {Boolean} If is loaded.
     */
    isArchiveLoaded() {
        return !!helpers.getFromStorage('archiveSince');
    }

    /**
     * Binds click events for logged in buttons.
     *
     * @function bindLoggedInEvents
     * @return {void}
     */
    bindLoggedInEvents() {
        document.body.addEventListener('click', this.itemClicks, false);
        document.body.addEventListener('keyup', this.keyDowns, false);
        document.querySelector('#js-logout').addEventListener('click', this.logoutButtonClick, false);
    }

    /**
     * Remove all logged in elements click events.
     *
     * @function removeLoggedInClickEvents
     * @return {void}
     */
    removeLoggedInClickEvents() {
        document.body.removeEventListener('click', this.itemClicks, false);
        document.body.removeEventListener('keydown', this.keyDowns, false);
        document.querySelector('#js-logout').removeEventListener('click', this.logoutButtonClick, false);
    }

    /**
     * Handle item clicks.
     *
     * @function handleItemClicks
     * @param {Event} event - Event from click.
     * @return {void}
     */
    async handleItemClicks(event) {
        if (event.target.classList.contains('js-toggleFavouriteButton')) {
            item.favourite(event);
        } else if (event.target.classList.contains('js-toggleReadButton')) {
            item.archive(event);
        } else if (event.target.classList.contains('js-deleteButton')) {
            item.delete(event);
        } else if (event.target.classList.contains('js-tagsButton')) {
            item.addTags(event);
        } else if (event.target.id === 'js-orderButton') {
            helpers.showMessage(`${chrome.i18n.getMessage('LOADING')}...`, true, false, false);
            this.order = this.order === globals.ORDER.ASCENDING ? globals.ORDER.DESCENDING : globals.ORDER.ASCENDING;
            settings.setOrder(this.order);
            settings.rotateOrderButton(this.order, event);
            const response = await apiService.changeOrder();
            this.handleApiGetResponse(response);
        } else if (event.target.id === 'js-viewTypeButton') {
            const mainSelector = document.querySelector('main');
            helpers.toggleClass(mainSelector, 'container--narrow');

            const viewType = mainSelector.classList.contains('container--narrow') ? 'list' : 'grid';
            settings.showRightViewTypeButton(viewType, event);
        } else if (event.target.classList.contains('js-link')) {
            const canSetAsArchived = settings.getArchiveAfterOpen() && this.getActivePage() === globals.PAGES.LIST;

            if (canSetAsArchived) {
                item.archive(event);
            }
        }
    }

    /**
     * Handle keyboard clicks.
     *
     * @function handleKeyDowns
     * @param {Event} event - Event from keyup.
     * @return {void}
     */
    handleKeyDowns(event) {
        // alt + f - opens search
        if (event.keyCode === 70 && event.altKey) {
            search.show();
        }
    }

    /**
     * Bind logged out buttons click events.
     *
     * @function bindLoggedOutClickEvents
     * @return {void}
     */
    bindLoggedOutClickEvents() {
        document.querySelector('#js-login').addEventListener('click', this.loggedOutClicks, false);
    }

    /**
     * Remove logged out buttons clicks.
     *
     * @function removeLoggedOutClickEvents
     * @return {void}
     */
    removeLoggedOutClickEvents() {
        document.querySelector('#js-login').removeEventListener('click', this.loggedOutClicks, false);
    }

    /**
     * Handle login button click.
     *
     * @function
     * @return {void}
     */
    handleLoginClick() {
        this.startLogin();

        document.querySelector('#js-login').disabled = true;
    }

    /**
     * Changes item state.
     *
     * @function changeItemState
     * @param  {Event}  event - Event.
     * @param  {String}  state - Current state.
     * @param  {Number}  id - Item id.
     * @param  {Boolean} isFavourited - If should be favourited.
     * @param  {String}  tags - Tags to replace.
     * @return {void}
     */
    async changeItemState(event, state, id, isFavourited = false, tags) {
        let action;

        if (state === 'read') {
            switch (this.getActivePage()) {
                case globals.PAGES.LIST:
                    action = 'archive';
                    helpers.showMessage(`${chrome.i18n.getMessage('ARCHIVING')}...`, true, false, false);
                    break;
                case globals.PAGES.ARCHIVE:
                    action = 'readd';
                    helpers.showMessage(`${chrome.i18n.getMessage('UNARCHIVING')}...`, true, false, false);
                    break;
            }
        } else if (state === 'favourite') {
            action = isFavourited === true ? 'unfavorite' : 'favorite';
            helpers.showMessage(`${chrome.i18n.getMessage('PROCESSING')}...`, true, false, false);
        } else if (state === 'delete') {
            action = 'delete';
            helpers.showMessage(`${chrome.i18n.getMessage('DELETING')}...`, true, false, false);
        } else if (state === 'tags') {
            action = 'tags_replace';
            helpers.showMessage(`${chrome.i18n.getMessage('PROCESSING')}...`, true, false, false);
        }

        const actions = [
            {
                action: action,
                item_id: id,
                time: helpers.getCurrentUNIX(),
            },
        ];

        if (state === 'tags') {
            actions[0].tags = tags;
        }

        try {
            const response = await apiService.send(actions);

            if (response.status === 1) {
                this.handleActionResponse(event, state, isFavourited, tags);
            }
        } catch (error) {
            console.log(error);
            helpers.showMessage(chrome.i18n.getMessage('ACTION'), false);
        }
    }

    /**
     * Handles item state change after Pocket api success.
     *
     * @function handleActionResponse
     * @param {Event} event - Event.
     * @param {String} state - Current state.
     * @param {Boolean} isFavourited - If should be favourited.
     * @param {String} tags - Tags, if they are added.
     * @return {void}
     */
    handleActionResponse(event, state, isFavourited, tags) {
        switch (state) {
            case 'read':
            case 'delete':
                const itemNode = event.target.parentNode.parentNode.parentNode;
                helpers.addClass(itemNode, 'move-up');
                setTimeout(() => {
                    itemNode.remove();
                }, 500);

                const newCount = parseInt(helpers.getFromStorage(`${this.getActivePage()}Count`), 10) - 1;
                helpers.setToStorage(`${this.getActivePage()}Count`, newCount);
                document.querySelector('#js-count').innerText = newCount;

                if (state === 'read') {
                    switch (this.getActivePage()) {
                        case globals.PAGES.LIST:
                            helpers.showMessage(chrome.i18n.getMessage('ARCHIVING'));
                            break;
                        case globals.PAGES.ARCHIVE:
                            helpers.showMessage(chrome.i18n.getMessage('UNARCHIVING'));
                            break;
                    }
                } else if (state === 'delete') {
                    helpers.showMessage(chrome.i18n.getMessage('DELETING'));
                }
                break;
            case 'favourite':
                isFavourited = !isFavourited;
                event.target.parentNode.querySelector('.js-toggleFavouriteButton').dataset.favourite = isFavourited;
                helpers.showMessage(chrome.i18n.getMessage('PROCESSING'));
                break;
            case 'tags':
                if (tags.length) {
                    event.target.dataset.tags = tags;
                }
                helpers.showMessage(chrome.i18n.getMessage('PROCESSING'));
                break;
        }
    }

    /**
     * Change page between list and archive.
     *
     * @function changePage
     * @param {String} page - Page to change to.
     * @return {void}
     */
    changePage(page, isPageLoad) {
        const newPage = page || globals.PAGES.LIST;

        if (!Object.values(globals.PAGES).includes(newPage)) {
            return;
        }

        header.changeMenuActiveState(newPage);

        this.items_shown = 0;
        helpers.clearChildren(document.querySelector('#js-list'));
        search.hide(true);

        helpers.show(document.querySelector('#js-count-wrapper'), true);
        helpers.show(document.querySelector('#js-searchButton'), true);
        helpers.show(document.querySelector('#js-fullSync'), true);

        switch (newPage) {
            case globals.PAGES.LIST:
                helpers.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);
                this.setActivePage(globals.PAGES.LIST);

                document.querySelector('#js-count').innerText = helpers.getFromStorage('listCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('MY_LIST');

                this.render();
                this.getContent();
                break;
            case globals.PAGES.ARCHIVE:
                this.setActivePage(globals.PAGES.ARCHIVE);

                document.querySelector('#js-count').innerText = helpers.getFromStorage('archiveCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('ARCHIVE');

                if (this.isArchiveLoaded()) {
                    this.render();
                }

                if (settings.isTimeToUpdate()) {
                    helpers.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);
                    this.getContent();
                }
                break;
        }

        settings.rotateOrderButton(this.order);

        window.scrollTo(0, 0);
    }

    /**
     * Show or hide right elements when coming to new tab or logging in.
     *
     * @function toggleLoggedInContent
     * @return {void}
     */
    toggleLoggedInContent(isShown = false) {
        if (isShown) {
            helpers.hide(document.querySelector('#js-default-message'));
            helpers.show(document.querySelector('#js-count-wrapper'), true);
            helpers.show(document.querySelector('#js-menu'), true);
            helpers.show(document.querySelector('#js-list'), true);
            helpers.show(document.querySelector('#js-username'), true);
            helpers.show(document.querySelector('#js-logout'), true);
            helpers.show(document.querySelector('#js-addNewItemButton'), true);
            helpers.show(document.querySelector('#js-searchButton'), true);
            helpers.show(document.querySelector('#js-settings'), true);
            helpers.show(document.querySelector('#js-fullSync'), true);
            helpers.show(document.querySelector('#js-filterButtons'), true);
        } else {
            helpers.show(document.querySelector('#js-default-message'));
            document.querySelector('#js-count').innerText = '0';
            helpers.clearChildren(document.querySelector('#js-list'));
            helpers.hide(document.querySelector('#js-empty-list-message'));
            helpers.hide(document.querySelector('#js-list'));
            helpers.hide(document.querySelector('#js-menu'));
            helpers.hide(document.querySelector('#js-username'));
            helpers.hide(document.querySelector('#js-logout'));
            helpers.hide(document.querySelector('#js-count-wrapper'));
            helpers.hide(document.querySelector('#js-addNewItemButton'));
            helpers.hide(document.querySelector('#js-searchButton'));
            helpers.hide(document.querySelector('#js-settings'));
            helpers.hide(document.querySelector('#js-fullSync'));
            helpers.hide(document.querySelector('#js-tags'));
            helpers.hide(document.querySelector('#js-filterButtons'));
        }
    }

    /**
     * Show right content after logging in.
     *
     * @function loggedIn
     * @return {void}
     */
    loggedIn() {
        document.querySelector('#js-username').innerText = helpers.getFromStorage('username');
        document.querySelector('#js-title').innerText = chrome.i18n.getMessage('MY_LIST');

        helpers.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

        this.toggleLoggedInContent(true);

        // get content from pocket api
        this.getContent();

        this.removeLoggedOutClickEvents();
        this.bindLoggedInEvents();

        header.init();
        search.init();
        modal.init();
        selector.init();
        item.init();
        settings.init();
        tags.init();
    }

    /**
     * Show content from localStorage and start sync with Pocket.
     *
     * @function startSync
     * @return {void}
     */
    startSync() {
        this.toggleLoggedInContent(true);

        if (
            settings.getDefaultPage() === null ||
            (settings.getDefaultPage() && settings.getDefaultPage() === globals.PAGES.LIST)
        ) {
            this.render();
            document.querySelector('#js-title').innerText = chrome.i18n.getMessage('MY_LIST');
        } else {
            settings.loadDefaultPage();
        }

        if (helpers.getFromStorage('username')) {
            document.querySelector('#js-username').innerText = helpers.getFromStorage('username');
        }

        this.bindLoggedInEvents();

        header.init();
        search.init();
        modal.init();
        selector.init();
        item.init();
        settings.init();
        tags.init();

        if (
            (!settings.getDefaultPage() || settings.getDefaultPage() === globals.PAGES.LIST) &&
            settings.isTimeToUpdate()
        ) {
            helpers.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);
            this.getContent();
        }
    }

    /**
     * Start login flow.
     *
     * @function startLogin
     * @return {void}
     */
    async startLogin() {
        const response = await authService.authenticate();

        if (response.status !== 'authenticated') {
            helpers.showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
            document.querySelector('#js-login').disabled = false;

            this.logout();
            return;
        }

        document.querySelector('#js-login').disabled = false;
        helpers.showMessage(chrome.i18n.getMessage('AUTHENTICATION'));
        this.loggedIn();
    }

    /**
     * Clear localStorage and show and hide right elements.
     *
     * @function logout
     * @return {void}
     */
    logout() {
        helpers.showMessage(`${chrome.i18n.getMessage('LOGGING_OUT')}...`, true, false, false);
        localStorage.clear();
        this.setActivePage(globals.PAGES.LIST);
        header.changeMenuActiveState(globals.PAGES.LIST);
        document.querySelector('#js-title').innerText = chrome.i18n.getMessage('EXTENSION_SHORT_NAME');

        this.removeLoggedInClickEvents();
        this.bindLoggedOutClickEvents();

        header.destroy();
        search.destroy();
        modal.destroy();
        selector.destroy();
        item.destroy();
        settings.destroy();
        tags.destroy();

        this.toggleLoggedInContent(false);

        helpers.showMessage(chrome.i18n.getMessage('LOGGING_OUT'));
    }
}

const pocket = new App();
export default pocket;
