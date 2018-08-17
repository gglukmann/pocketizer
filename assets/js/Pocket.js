class Pocket {
    /**
     * @constructor
     */
    constructor() {
        this.active_page = 'list';
        this.items_shown = 0;
        this.load_count = 18;

        this.scroll = {
            lastKnownScrollY: 0,
            ticking: false
        };

        this.fullSync = false;
        this.orderItemsAsc = localStorage.getItem('order') && localStorage.getItem('order') === 'desc' ? false : true;

        this.itemClicks = this.handleItemClicks.bind(this);
        this.loggedOutClicks = this.handleLoginClick.bind(this);
        this.logoutButtonClick = this.logout.bind(this);
    }

    /**
     * Initialize Pocket.
     *
     * @function init
     * @return {void}
     */
    init() {
        helper.localizeHtml();
        settings.loadTheme();

        if (authService.isLoggedIn()) {
            this.startSync();
        } else {
            Helper.show(document.querySelector('#js-default-message'));
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
        return this.active_page = page;
    }

    /**
     * Gets content from localStorage and from Pocket API to see if there are newer links.
     *
     * @function getContent
     * @return {void}
     */
    getContent() {
        apiService.get()
            .then(response => {
                this.handleApiGetResponse(response);
            });
    }

    /**
     * Sort get response, add to localstorage and render page again.
     *
     * @function handleApiGetResponse
     * @param  {Object} response - response from fetch.
     * @return {void}
     */
    handleApiGetResponse(response) {
        let array = [];
        let items = response.list;
        let isFirstLoad = false;

        switch (this.getActivePage()) {
            case 'list':
                if (!localStorage.getItem('listSince')) {
                    isFirstLoad = true;
                }
                break;
            case 'archive':
                // TODO: Remove old list name sometime in the future
                if (localStorage.getItem('archiveListFromLocalStorage')) {
                    isFirstLoad = true;
                    localStorage.removeItem('archiveListFromLocalStorage');
                } else {
                    if (!this.isArchiveLoaded()) {
                        isFirstLoad = true;
                    }
                }
                break;
        }

        for (const key in items) {
            array.push(items[key]);
        }

        if (isFirstLoad || this.fullSync) {
            array.sort((x, y) => x.sort_id - y.sort_id);

            localStorage.setItem(`${this.getActivePage()}FromLocalStorage`, JSON.stringify(array));
            localStorage.setItem(`${this.getActivePage()}Count`, array.length.toString());
            localStorage.setItem(`${this.getActivePage()}Since`, response.since);

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
                    case "0":
                        newArray = JSON.parse(localStorage.getItem('listFromLocalStorage'));

                        // delete old item, if it is added from this extension
                        for (const i in newArray) {
                            if (newArray[i].item_id === newItem.item_id) {
                                newArray.splice(i, 1);
                            }
                        }

                        newArray = Helper.prependArray(newArray, newItem);

                        tags.createTags(newArray);

                        localStorage.setItem('listFromLocalStorage', JSON.stringify(newArray));
                        localStorage.setItem('listCount', newArray.length.toString());
                        break;
                    // add to archive list
                    case "1":
                        // delete old item, if it is added to archive from somewhere else and is in unread list in extension
                        newArray = JSON.parse(localStorage.getItem('listFromLocalStorage'));
                        newArray = newArray.filter(item => item.item_id !== newItem.item_id);

                        localStorage.setItem('listFromLocalStorage', JSON.stringify(newArray));
                        localStorage.setItem('listCount', newArray.length);

                        // only add to localstorage archive list if archive is loaded
                        if (this.isArchiveLoaded()) {
                            newArray = JSON.parse(localStorage.getItem('archiveFromLocalStorage'));
                            newArray = Helper.prependArray(newArray, newItem);

                            localStorage.setItem('archiveFromLocalStorage', JSON.stringify(newArray));
                            localStorage.setItem('archiveCount', newArray.length);
                        }
                        break;
                    // delete from unread or archive list
                    case "2":
                        let listArray = JSON.parse(localStorage.getItem('listFromLocalStorage'));

                        listArray = listArray.filter(item => item.item_id !== newItem.item_id);

                        localStorage.setItem('listFromLocalStorage', JSON.stringify(listArray));
                        localStorage.setItem('listCount', listArray.length);

                        if (this.isArchiveLoaded()) {
                            let archiveArray = JSON.parse(localStorage.getItem('archiveFromLocalStorage'));
                            archiveArray = archiveArray.filter(item => item.item_id !== newItem.item_id);

                            localStorage.setItem('archiveFromLocalStorage', JSON.stringify(archiveArray));
                            localStorage.setItem('archiveCount', archiveArray.length);
                        }
                        break;
                }
            }

            localStorage.setItem('listSince', response.since);
            if (this.isArchiveLoaded()) {
                localStorage.setItem('archiveSince', response.since);
            }
        }

        this.render();
        helper.showMessage(chrome.i18n.getMessage('SYNCHRONIZING'));
    }

    /**
     * Renders from localStorage.
     *
     * @function render
     * @return {void}
     */
    render() {
        let array = JSON.parse(localStorage.getItem(`${this.getActivePage()}FromLocalStorage`));

        this.items_shown = this.load_count;

        document.querySelector('#js-count').innerText = localStorage.getItem(`${this.getActivePage()}Count`);
        Helper.clearChildren(document.querySelector('#js-list'));

        if (array === null) {
            this.getContent();
        } else if (array.length === 0) {
            Helper.show(document.querySelector('#js-empty-list-message'));
            Helper.hide(document.querySelector('#js-orderButton'));
        } else {
            tags.createTags(array);

            if (!this.orderItemsAsc) {
                array = array.reverse();
            }

            array = array.filter((item, index) => (index < this.load_count));
            Helper.hide(document.querySelector('#js-empty-list-message'));
            Helper.show(document.querySelector('#js-orderButton'), true);

            const domItemsArray = this.createItems(array);
            this.createSentinel();
            this.createItemsObserver();
            lazyload.load();
            item.calcBackgroundHeights(domItemsArray);
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
        const newArray = [];
        let newItem;

        for (const key in array) {
            let newItem = item.create(array[key]);
            newItem = item.render(newItem);
            newArray.push(newItem);
        }

        return newArray;
    }

    /**
     * Create empty div for observer to observe.
     *
     * @function createSentinel
     * @return {void}
     */
    createSentinel() {
        const list = document.querySelector('#js-list');
        let element = Helper.createNode('div');

        element.setAttribute('id', 'js-sentinel');
        element.setAttribute('class', 'sentinel');

        Helper.append(list, element);
    }

    /**
     * Create IntersectionObserver to load more items on scroll.
     *
     * @function createItemsObserver
     * @return {void}
     */
    createItemsObserver() {
        const sentinel = document.querySelector('#js-sentinel');
        const list = document.querySelector('#js-list');

        const io = new IntersectionObserver(entries => {
            if (entries[0].intersectionRatio <= 0) {
                return;
            }

            this.infiniteScroll();
            Helper.append(list, sentinel);
        });

        io.observe(sentinel);
    }

    /**
     * Load more items.
     *
     * @function infiniteScroll
     * @return {void}
     */
    infiniteScroll() {
        helper.showMessage(`${chrome.i18n.getMessage('LOADING')}...`, true, false, false);
        let array = JSON.parse(localStorage.getItem(`${this.getActivePage()}FromLocalStorage`));

        if (!this.orderItemsAsc) {
            array = array.reverse();
        }

        array = array.filter((i, index) => (index >= this.items_shown && index < this.items_shown + this.load_count));

        this.items_shown += this.load_count;

        if (array.length === 0) {
            helper.showMessage(chrome.i18n.getMessage('EVERYTHING_LOADED'), true, false, true);
        } else {
            helper.showMessage(chrome.i18n.getMessage('LOADING'));
        }

        const domItemsArray = this.createItems(array);
        lazyload.load();
        item.calcBackgroundHeights(domItemsArray);
    }

    /**
     * Is Archive list loaded.
     *
     * @function isArchiveLoaded
     * @return {Boolean} If is loaded.
     */
    isArchiveLoaded() {
        return !!localStorage.getItem('archiveSince');
    }

    /**
     * Binds click events for logged in buttons.
     *
     * @function bindLoggedInEvents
     * @return {void}
     */
    bindLoggedInEvents() {
        document.body.addEventListener('click', this.itemClicks, false);
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
        document.querySelector('#js-logout').removeEventListener('click', this.logoutButtonClick, false);
    }

    /**
     * Handle item clicks.
     *
     * @function handleItemClicks
     * @param {Event} e - Event from click.
     * @return {void}
     */
    handleItemClicks(e) {
        if (e.target.classList.contains('js-toggleFavouriteButton')) {
            item.favourite(e);
        } else if (e.target.classList.contains('js-toggleReadButton')) {
            item.archive(e);
        } else if (e.target.classList.contains('js-deleteButton')) {
            item.delete(e);
        } else if (e.target.classList.contains('js-tagsButton')) {
            item.addTags(e);
        } else if (e.target.id === 'js-orderButton') {
            this.orderItemsAsc = !this.orderItemsAsc;
            this.render();
            settings.rotateOrderButton(this.orderItemsAsc, e);
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
     * @param  {Event}  e - Event.
     * @param  {String}  state - Current state.
     * @param  {Number}  id - Item id.
     * @param  {Boolean} isFavourited - If should be favourited.
     * @param  {String}  tags - Tags to replace.
     * @return {void}
     */
    changeItemState(e, state, id, isFavourited = false, tags) {
        let action;

        if (state === 'read') {
            switch (this.getActivePage()) {
                case 'archive':
                    action = 'readd';
                    helper.showMessage(`${chrome.i18n.getMessage('UNARCHIVING')}...`, true, false, false);
                break;
                case 'list':
                    action = 'archive';
                    helper.showMessage(`${chrome.i18n.getMessage('ARCHIVING')}...`, true, false, false);
                break;
            }
        } else if (state === 'favourite') {
            action = (isFavourited === true ? 'unfavorite' : 'favorite');
            helper.showMessage(`${chrome.i18n.getMessage('PROCESSING')}...`, true, false, false);
        } else if (state === 'delete') {
            action = 'delete';
            helper.showMessage(`${chrome.i18n.getMessage('DELETING')}...`, true, false, false);
        } else if (state === 'tags') {
            action = 'tags_replace';
            helper.showMessage(`${chrome.i18n.getMessage('PROCESSING')}...`, true, false, false);
        }

        const actions = [{
            "action": action,
            "item_id": id,
            "time": Helper.getCurrentUNIX()
        }];

        if (state === 'tags') {
            actions[0].tags = tags;
        }

        apiService.send(actions)
            .then(response => {
                if (response.status === 1) {
                    this.handleActionResponse(e, state, id, isFavourited, response, tags);
                }
            })
            .catch(error => {
                console.log(error);
                helper.showMessage(chrome.i18n.getMessage('ACTION'), false);
            });
    }

    /**
     * Handles item state change after Pocket api success.
     *
     * @function handleActionResponse
     * @param {Event} e - Event.
     * @param {String} state - Current state.
     * @param {Number} id - Item id.
     * @param {Boolean} isFavourited - If should be favourited.
     * @param {Object} response - Response from Pocket api.
     * @param {String} tags - Tags, if they are added.
     * @return {void}
     */
    handleActionResponse(e, state, id, isFavourited, response, tags) {
        let array = JSON.parse(localStorage.getItem(`${this.getActivePage()}FromLocalStorage`));

        for (const i in array) {
            if (array[i].item_id === id) {
                switch (state) {
                    case 'read':
                    case 'delete':
                        array.splice(i, 1);

                        const itemNode = e.target.parentNode.parentNode;
                        Helper.addClass(itemNode, 'move-up');
                        setTimeout(() => {
                            itemNode.remove();
                        }, 500);

                        localStorage.setItem(`${this.getActivePage()}Count`, parseInt(localStorage.getItem(`${this.getActivePage()}Count`), 10) - 1);

                        document.querySelector('#js-count').innerText = localStorage.getItem(`${this.getActivePage()}Count`);
                    break;
                    case 'favourite':
                        array[i].favorite = (isFavourited === true ? 0 : 1);

                        isFavourited = !isFavourited;
                        e.target.parentNode.querySelector('.js-toggleFavouriteButton').dataset.favourite = isFavourited;
                    break;
                    case 'tags':
                        if (tags.length) {
                            e.target.dataset.tags = tags;
                        }
                    break;
                }
            }
        }

        localStorage.setItem(`${this.getActivePage()}FromLocalStorage`, JSON.stringify(array));

        if (state === 'read') {
            switch (this.getActivePage()) {
                case 'list':
                    helper.showMessage(chrome.i18n.getMessage('ARCHIVING'));
                    break;
                case 'archive':
                    helper.showMessage(chrome.i18n.getMessage('UNARCHIVING'));
                    break;
            }
        } else if (state === 'favourite' || state === 'tags') {
            helper.showMessage(chrome.i18n.getMessage('PROCESSING'));
        } else if (state === 'delete') {
            helper.showMessage(chrome.i18n.getMessage('DELETING'));
        }
    }

    /**
     * Change page between list and archive.
     *
     * @function changePage
     * @param {String} page - Page to change to.
     * @return {void}
     */
    changePage(page) {
        page = page ? page : 'list';

        if (!PAGES.includes(page)) {
            return;
        }

        helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

        header.changeMenuActiveState(page);

        this.items_shown = 0;
        Helper.clearChildren(document.querySelector('#js-list'));
        search.hide(true);

        Helper.show(document.querySelector('#js-count-wrapper'), true);
        Helper.show(document.querySelector('#js-searchButton'), true);
        Helper.show(document.querySelector('#js-fullSync'), true);

        switch (page) {
            case 'list':
                this.setActivePage('list');

                document.querySelector('#js-count').innerText = localStorage.getItem('listCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('MY_LIST');

                this.orderItemsAsc = !localStorage.getItem('order') || localStorage.getItem('order') === 'asc' ? true : false;

                this.render();
                this.getContent();
            break;
            case 'archive':
                this.setActivePage('archive');

                document.querySelector('#js-count').innerText = localStorage.getItem('archiveCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('ARCHIVE');

                this.orderItemsAsc = true;

                if (this.isArchiveLoaded()) {
                    this.render();
                }

                this.getContent();
            break;
        }

        settings.rotateOrderButton(this.orderItemsAsc);

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
            Helper.hide(document.querySelector('#js-default-message'));
            Helper.show(document.querySelector('#js-count-wrapper'), true);
            Helper.show(document.querySelector('#js-menu'), true);
            Helper.show(document.querySelector('#js-list'), true);
            Helper.show(document.querySelector('#js-username'), true);
            Helper.show(document.querySelector('#js-logout'), true);
            Helper.show(document.querySelector('#js-addNewItemButton'), true);
            Helper.show(document.querySelector('#js-searchButton'), true);
            Helper.show(document.querySelector('#js-settings'), true);
            Helper.show(document.querySelector('#js-fullSync'), true);
            Helper.show(document.querySelector('#js-orderButton'), true);
        } else {
            Helper.show(document.querySelector('#js-default-message'));
            document.querySelector('#js-count').innerText = '0';
            Helper.clearChildren(document.querySelector('#js-list'));
            Helper.hide(document.querySelector('#js-empty-list-message'));
            Helper.hide(document.querySelector('#js-list'));
            Helper.hide(document.querySelector('#js-menu'));
            Helper.hide(document.querySelector('#js-username'));
            Helper.hide(document.querySelector('#js-logout'));
            Helper.hide(document.querySelector('#js-count-wrapper'));
            Helper.hide(document.querySelector('#js-addNewItemButton'));
            Helper.hide(document.querySelector('#js-searchButton'));
            Helper.hide(document.querySelector('#js-settings'));
            Helper.hide(document.querySelector('#js-fullSync'));
            Helper.hide(document.querySelector('#js-tags'));
            Helper.hide(document.querySelector('#js-orderButton'));
        }
    }

    /**
     * Show right content after loging in.
     *
     * @function loggedIn
     * @return {void}
     */
    loggedIn() {
        document.querySelector('#js-username').innerText = localStorage.getItem('username');
        document.querySelector('#js-title').innerText = chrome.i18n.getMessage('MY_LIST');

        helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

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
        helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

        this.toggleLoggedInContent(true);

        if (settings.getDefaultPage() === null || (settings.getDefaultPage() && settings.getDefaultPage() === 'list')) {
            this.render();
            document.querySelector('#js-title').innerText = chrome.i18n.getMessage('MY_LIST');
        } else {
            settings.loadDefaultPage();
        }

        if (localStorage.getItem('username')) {
            document.querySelector('#js-username').innerText = localStorage.getItem('username');
        }

        this.bindLoggedInEvents();

        header.init();
        search.init();
        modal.init();
        selector.init();
        item.init();
        settings.init();
        tags.init();

        if (!settings.getDefaultPage() || settings.getDefaultPage() === 'list') {
            this.getContent();
        }
    }

    /**
     * Start login flow.
     *
     * @function startLogin
     * @return {void}
     */
    startLogin() {
        authService.authenticate()
            .then((response) => {
                if (response.status !== 'authenticated') {
                    helper.showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
                    document.querySelector('#js-login').disabled = false;

                    this.logout();
                    return;
                }

                document.querySelector('#js-login').disabled = false;
                helper.showMessage(chrome.i18n.getMessage('AUTHENTICATION'));
                this.loggedIn();
            });
    }

    /**
     * Clear localStorage and show and hide right elements.
     *
     * @function logout
     * @return {void}
     */
    logout() {
        helper.showMessage(`${chrome.i18n.getMessage('LOGGING_OUT')}...`, true, false, false);
        localStorage.clear();
        this.setActivePage('list');
        header.changeMenuActiveState('list');

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
        Helper.removeClass(document.body, THEMES);

        helper.showMessage(chrome.i18n.getMessage('LOGGING_OUT'));
    }
}

const pocket = new Pocket();

window.onload = (() => {
    pocket.init();
});
