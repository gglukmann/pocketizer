class Pocket {
    /**
     * @constructor
     */
    constructor() {
        this.active_page = 'list';
        this.items_shown = 0;
        this.load_count = 18;
        this.load_count_ad = 1;

        this.scroll = {
            lastKnownScrollY: 0,
            ticking: false
        };

        this.fullSync = false;

        this.menuAndItemClicks = false;
        this.loggedOutClicks = false;
        this.logoutButtonClick = false;
        this.searchButtonClick = false;
        this.fullSyncButtonClick = false;
        this.saveAdItemToPocketClick = false;
    }

    /**
     * Initialize Pocket.
     *
     * @function init
     * @return {void}
     */
    init() {
        helper.localizeHtml();
        this.setTheme();

        if (localStorage.getItem('isTrendingShown') === 'true') {
            collapse.open('#js-trendingCollapseTrigger', '#js-trendingCollapse');
        } else {
            collapse.close('#js-trendingCollapseTrigger', '#js-trendingCollapse');
        }

        if (authService.isLoggedIn()) {
            this.startSync();
        } else {
            document.querySelector('#js-default-message').style.display = 'block';
            this.bindLoggedOutClickEvents();
        }

        this.getTrending();
    }

    /**
     * Set theme color on pocket load.
     *
     * @function setTheme
     * @return {void}
     */
    setTheme() {
        if (localStorage.getItem('theme')) {
           helper.addClass(document.body, 'theme-' + localStorage.getItem('theme'));

           const colorSelector = [...document.querySelectorAll('[name=selector-color]')];
           for (let selector of colorSelector) {
               if (selector.value === localStorage.getItem('theme')) {
                   selector.checked = true;
               }
           }
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
     * Get trending stories.
     *
     * @function getTrending
     * @return {void}
     */
    getTrending() {
        const trendingItemsCount = 4;

        apiService.getTrending(trendingItemsCount)
            .then(response => {
                this.handleTrendingResponse(response);
            });
    }

    /**
     * Handle trending fetch response.
     *
     * @function handleTrendingResponse
     * @param {Object} response - Response from fetch.
     * @return {void}
     */
    handleTrendingResponse(response) {
        let items = response.list;

        for (let key in items) {
            let newItem = item.createAdItem(items[key]);
            item.render(newItem, 'trendingList');
        }

        // TODO: if already added to list. add is-saved class and Saved text to button

        this.bindSaveAdItemToPocketClicks();
    }

    /**
     * Create recommended items observer to load them when sentinel is visible.
     *
     * @function createAdItemsObserver
     * @return {void}
     */
    createAdItemsObserver() {
        const sentinel = document.querySelector('#js-sentinel');

        const io = new IntersectionObserver(entries => {
            if (entries[0].intersectionRatio <= 0) {
                return;
            }

            this.infiniteScrollRecommendations();
        });

        io.observe(sentinel);
    }

    /**
     * Load recommendations when changing page to Recommended.
     *
     * @function loadRecommendations
     * @return {void}
     */
    loadRecommendations() {
        let array = JSON.parse(localStorage.getItem('listFromLocalStorage'));

        this.getRecommendations([array[0]])
            .then(() => {
                this.createSentinel();
                this.createAdItemsObserver();
            });
    }

    /**
     * Load more recommendations when scrolling.
     *
     * @function infiniteScrollRecommendations
     * @return {void}
     */
    infiniteScrollRecommendations() {
        helper.showMessage(`${chrome.i18n.getMessage('LOADING')}...`, true, false, false);

        let array = JSON.parse(localStorage.getItem('listFromLocalStorage'));

        array.shift(); // remove first item because it is already loaded on first load
        array = array.filter((i, index) => (index >= this.items_shown && index < this.items_shown + this.load_count_ad));

        this.items_shown += this.load_count_ad;

        if (array.length === 0) {
            helper.showMessage(chrome.i18n.getMessage('EVERYTHING_LOADED'), true, false, true);
        } else {
            helper.showMessage(chrome.i18n.getMessage('LOADING'));
        }

        this.getRecommendations(array)
            .then(() => {
                const sentinel = document.querySelector('#js-sentinel');
                const list = document.querySelector('#js-list');

                helper.append(list, sentinel);
            });
    }

    /**
     * Get recommended stories.
     *
     * @function getRecommendations
     * @param {Array[]} array - Array of one item from listFromLocalStorage.
     * @return {void}
     */
    getRecommendations(array) {
        return apiService.getRecommendations(array[0].resolved_id)
            .then(response => this.handleRecommendedResponse(response));
    }

    /**
     * Handle recommende fetch response.
     *
     * @function handleRecommendedResponse
     * @param {Object} response - Resposne from fetch.
     * @return {Promise} - Promise when all items are rendered.
     */
    handleRecommendedResponse(response) {
        return new Promise(resolve => {
            let items = response.feed;

            for (let key in items) {
                let newItem = item.createAdItem(items[key].item, 'recommend');
                item.render(newItem);
            }

            resolve(true);
        });
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

        for (let key in items) {
            array.push(items[key]);
        }

        if (isFirstLoad || this.fullSync) {
            array.sort((x, y) => x.sort_id - y.sort_id);

            localStorage.setItem(`${this.getActivePage()}FromLocalStorage`, JSON.stringify(array));
            localStorage.setItem(`${this.getActivePage()}Count`, array.length);
            localStorage.setItem(`${this.getActivePage()}Since`, response.since);

            if (this.fullSync) {
                const eventFullSync = new Event('synced');
                document.dispatchEvent(eventFullSync);
            }

            this.fullSync = false;
        } else {
            array.sort((x, y) => y.sort_id - x.sort_id);

            for (let key in array) {
                let newItem = array[key];
                let newArray;

                switch (newItem.status) {
                    // add to unread list
                    case "0":
                        newArray = JSON.parse(localStorage.getItem('listFromLocalStorage'));

                        // delete old item, if it is added from this extension
                        for (let i in newArray) {
                            if (newArray[i].item_id === newItem.item_id) {
                                newArray.splice(i, 1);
                            }
                        }

                        newArray = helper.prependArray(newArray, newItem);

                        localStorage.setItem('listFromLocalStorage', JSON.stringify(newArray));
                        localStorage.setItem('listCount', newArray.length);
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
                            newArray = helper.prependArray(newArray, newItem);

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
        document.querySelector('#js-list').innerHTML = '';

        if (array === null) {
            this.getContent();
        } else if (array.length === 0) {
            document.querySelector('#js-empty-list-message').style.display = 'block';
        } else {
            array = array.filter((item, index) => (index < this.load_count));
            document.querySelector('#js-empty-list-message').style.display = 'none';
            this.showRecommendedPageLink();

            this.createItems(array);
            this.createSentinel();
            this.createItemsObserver();
            lazyload.load();
        }
    }

    /**
     * Creates items and appends to DOM.
     *
     * @function createItems
     * @param {Array} array - Array of items.
     * @return {void}
     */
    createItems(array) {
        for (let key in array) {
            let newItem = item.create(array[key]);
            item.render(newItem);
        }
    }

    /**
     * Create empty div for observer to observe.
     *
     * @function createSentinel
     * @return {void}
     */
    createSentinel() {
        const list = document.querySelector('#js-list');
        let element = helper.createNode('div');

        element.setAttribute('id', 'js-sentinel');
        element.setAttribute('class', 'sentinel');

        helper.append(list, element);
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
            helper.append(list, sentinel);
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

        array = array.filter((i, index) => (index >= this.items_shown && index < this.items_shown + this.load_count));

        this.items_shown += this.load_count;

        if (array.length === 0) {
            helper.showMessage(chrome.i18n.getMessage('EVERYTHING_LOADED'), true, false, true);
        } else {
            helper.showMessage(chrome.i18n.getMessage('LOADING'));
        }

        this.createItems(array);
        lazyload.load();
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
     * Show Recommended page in menu.
     *
     * @function showRecommendedPage
     * @return {void}
     */
    showRecommendedPageLink() {
        document.querySelector('[data-page="recommend"]').removeAttribute('style');
    }

    /**
     * Binds click events for logged in buttons.
     *
     * @function bindLoggedInClickEvents
     * @return {void}
     */
    bindLoggedInClickEvents() {
        this.menuAndItemClicks = this.handleMenuAndItemClicks.bind(this);
        document.body.addEventListener('click', this.menuAndItemClicks, false);

        this.logoutButtonClick = this.logout.bind(this);
        document.querySelector('#js-logout').addEventListener('click', this.logoutButtonClick, false);

        this.searchButtonClick = this.handleSearchClick.bind(this);
        document.querySelector('#js-searchButton').addEventListener('click', this.searchButtonClick, false);

        this.fullSyncButtonClick = this.handleFullSyncClick.bind(this);
        document.querySelector('#js-fullSync').addEventListener('click', this.fullSyncButtonClick, false);
    }

    /**
     * Handle menu and item clicks.
     *
     * @function handleMenuAndItemClicks
     * @param {Event} e - Event from click.
     * @return {void}
     */
    handleMenuAndItemClicks(e) {
        if (e.target.classList.contains('js-toggleFavouriteButton')) {
            item.favourite(e);
        } else if (e.target.classList.contains('js-toggleReadButton')) {
            item.archive(e);
        } else if (e.target.classList.contains('js-deleteButton')) {
            item.delete(e);
        }

        if (e.target.parentNode.classList.contains('js-changeMenu')) {
            e.preventDefault();
            let page = e.target.parentNode.dataset.page;

            this.changePage(page);
        }
    }

    /**
     * Handle search button click.
     *
     * @function handleSearchClick
     * @return {void}
     */
    handleSearchClick() {
        search.show();
    }

    /**
     * Handle full sync button click.
     *
     * @function handleFullSyncClick
     * @param {Event} e - Click event.
     * @return {void}
     */
    handleFullSyncClick(e) {
        helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

        const target = e.target;
        const syncClass = 'is-syncing';

        helper.addClass(target, syncClass);
        this.fullSync = true;

        this.getContent();

        this.removeSyncedClassHandler = this.handleRemoveSyncedClass.bind(this, target, syncClass);
        document.addEventListener('synced', this.removeSyncedClassHandler, false);
    }

    /**
     * Handle full synced event.
     *
     * @function handleRemoveSyncedClass
     * @param {HTMLElement} target - Target HTMLElement.
     * @param {String} syncClass - Syncing class.
     * @returns {void}
     */
    handleRemoveSyncedClass(target, syncClass) {
        const syncedClass = 'is-synced';

        helper.removeClass(target, syncClass);
        helper.addClass(target, syncedClass);

        helper.addClass(target.children[0], 'hidden');
        helper.removeClass(target.children[1], 'hidden');

        setTimeout(() => {
            helper.removeClass(target, syncedClass);
            helper.addClass(target.children[1], 'hidden');
            helper.removeClass(target.children[0], 'hidden');
        }, 1500);

        document.removeEventListener('synced', this.removeSyncedClassHandler, false);
    }

    /**
     * Remove all logged in elements click events.
     *
     * @function removeLoggedInClickEvents
     * @return {void}
     */
    removeLoggedInClickEvents() {
        document.body.removeEventListener('click', this.menuAndItemClicks, false);
        document.querySelector('#js-logout').removeEventListener('click', this.logoutButtonClick, false);
        document.querySelector('#js-searchButton').removeEventListener('click', this.searchButtonClick, false);
        document.querySelector('#js-fullSync').removeEventListener('click', this.fullSyncButtonClick, false);
    }

    /**
     * Bind logged out buttons click events.
     *
     * @function bindLoggedOutClickEvents
     * @return {void}
     */
    bindLoggedOutClickEvents() {
        this.loggedOutClicks = this.handleLoginClick.bind(this);
        document.querySelector('#js-login').addEventListener('click', this.loggedOutClicks, false);
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
     * Remove logged out buttons clicks.
     *
     * @function removeLoggedOutClickEvents
     * @return {void}
     */
    removeLoggedOutClickEvents() {
        document.querySelector('#js-login').removeEventListener('click', this.loggedOutClicks, false);
    }

    /**
     * Bind ad items save to pocket links
     *
     * @function bindSaveAdItemToPocketClicks
     * @return {void}
     */
    bindSaveAdItemToPocketClicks() {
        this.saveAdItemToPocketClick = this.handleSaveAdItemToPocketClick.bind(this);
        document.body.addEventListener('click', this.saveAdItemToPocketClick, false);
    }

    /**
     * Handle save ad item to pocket click.
     *
     * @function handleSaveAdItemToPocketClick
     * @param  {Event} e - Click event.
     * @return {void}
     */
    handleSaveAdItemToPocketClick(e) {
        if (e.target.id === 'js-addNewFromAd') {
            e.preventDefault();
            helper.showMessage(`${chrome.i18n.getMessage('CREATING_ITEM')}...`, true, false, false);

            let data = {
                url: e.target.dataset.link
            };

            item.add(data);

            helper.addClass(e.target, 'is-saved');
            e.target.childNodes[1].innerText = chrome.i18n.getMessage('SAVED');
        }
    }

    /**
     * Remove save ad item to pocket clicks.
     *
     * @function removeAdItemToPocketClicks
     * @return {void}
     */
    removeAdItemToPocketClicks() {
        document.body.removeEventListener('click', this.saveAdItemToPocketClick, false);
    }

    /**
     * Changes item state.
     *
     * @function changeItemState
     * @param  {Event}  e - Event.
     * @param  {String}  state - Current state.
     * @param  {Number}  id - Item id.
     * @param  {Boolean} isFavourited - If should be favourited.
     * @return {void}
     */
    changeItemState(e, state, id, isFavourited) {
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
        }

        let actions = [{
            "action": action,
            "item_id": id,
            "time": helper.getCurrentUNIX()
        }];

        apiService.send(actions)
            .then(response => {
                if (response.status === 1) {
                    this.handleActionResponse(e, state, id, isFavourited, response);
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
     * @param {response} response - Response from Pocket api.
     * @return {void}
     */
    handleActionResponse(e, state, id, isFavourited, response) {
        let array = JSON.parse(localStorage.getItem(`${this.getActivePage()}FromLocalStorage`));

        for (let i in array) {
            if (array[i].item_id === id) {
                switch (state) {
                    case 'read':
                    case 'delete':
                        array.splice(i, 1);

                        const itemNode = e.target.parentNode.parentNode;
                        helper.addClass(itemNode, 'move-up');
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
        } else if (state === 'favourite') {
            helper.showMessage(chrome.i18n.getMessage('PROCESSING'));
        } else if (state === 'delete') {
            helper.showMessage(chrome.i18n.getMessage('DELETING'));
        }
    }

    /**
     * Add events to new item creating.
     *
     * @function bindAddNewItemEvents
     * @return {void}
     */
    bindAddNewItemEvents() {
        document.addEventListener('opened.modal', () => {
            document.querySelector('#js-newItemInput').focus();
        }, false);

        document.addEventListener('closed.modal', () => {
            document.querySelector('#js-newItemInput').value = '';
        }, false);

        document.newItemForm.addEventListener('submit', e => {
            const form = e.target;

            if (form.checkValidity()) {
                e.preventDefault();
                helper.showMessage(`${chrome.i18n.getMessage('CREATING_ITEM')}...`, true, false, false);

                if (pocket.getActivePage() === 'list') {
                    search.reset(true);
                }

                const rawData = new FormData(form);
                let data = {};

                for (let link of rawData.entries()) {
                    data[link[0]] = link[1];
                }

                item.add(data);
            }
        }, false);
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

        helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

        this.changeMenuActiveState(page);

        this.items_shown = 0;
        document.querySelector('#js-list').innerHTML = '';
        search.hide(true);

        switch (page) {
            case 'list':
                this.setActivePage('list');

                document.querySelector('#js-count-wrapper').removeAttribute('style');
                document.querySelector('#js-count').innerText = localStorage.getItem('listCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('MY_POCKET_LIST');
                document.querySelector('#js-searchButton').removeAttribute('style');
                document.querySelector('#js-fullSync').removeAttribute('style');
                trendingItem.showAll();

                this.render();
                this.getContent();
            break;
            case 'archive':
                this.setActivePage('archive');

                document.querySelector('#js-count-wrapper').removeAttribute('style');
                document.querySelector('#js-count').innerText = localStorage.getItem('archiveCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('ARCHIVE');
                document.querySelector('#js-searchButton').removeAttribute('style');
                document.querySelector('#js-fullSync').removeAttribute('style');
                trendingItem.hideAll();

                if (this.isArchiveLoaded()) {
                    this.render();
                }

                this.getContent();
            break;
            case 'recommend':
                this.setActivePage('recommend');

                document.querySelector('#js-count-wrapper').style.display = 'none';
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('RECOMMENDED');
                document.querySelector('#js-searchButton').style.display = 'none';
                document.querySelector('#js-fullSync').style.display = 'none';
                trendingItem.hideAll();

                this.loadRecommendations();
            break;
        }
    }

    /**
     * Show right menu item active state.
     *
     * @function changeMenuActiveState
     * @return {void}
     */
    changeMenuActiveState(page) {
        let menuLinkElements = document.querySelectorAll('.menu__link');

        for (let menuLink of menuLinkElements) {
            helper.removeClass(menuLink, 'is-active');

            if (menuLink.dataset.page === page) {
                helper.addClass(menuLink, 'is-active');
            }
        }
    }

    /**
     * Show or hide right elements when coming to new tab or logging in.
     *
     * @function toggleLoggedInContent
     * @return {void}
     */
    toggleLoggedInContent(isShown = false) {
        if (isShown) {
            document.querySelector('#js-default-message').style.display = 'none';
            document.querySelector('#js-count-wrapper').removeAttribute('style');
            document.querySelector('#js-menu').removeAttribute('style');
            document.querySelector('#js-list').removeAttribute('style');
            document.querySelector('#js-username').removeAttribute('style');
            document.querySelector('#js-logout').removeAttribute('style');
            document.querySelector('#js-addNewItemButton').removeAttribute('style');
            document.querySelector('#js-searchButton').removeAttribute('style');
            document.querySelector('#js-settings').removeAttribute('style');
            document.querySelector('#js-fullSync').removeAttribute('style');
            document.querySelector('#js-trendingCollapseTrigger').removeAttribute('style');
            document.querySelector('#js-trendingSeparator').removeAttribute('style');
            trendingItem.showAll();
        } else {
            document.querySelector('#js-empty-list-message').style.display = 'none';
            document.querySelector('#js-default-message').style.display = 'block';
            document.querySelector('#js-list').style.display = 'none';
            document.querySelector('#js-list').innerHTML = '';
            document.querySelector('#js-menu').style.display = 'none';
            document.querySelector('#js-username').style.display = 'none';
            document.querySelector('#js-logout').style.display = 'none';
            document.querySelector('#js-count-wrapper').style.display = 'none';
            document.querySelector('#js-count').innerHTML = '';
            document.querySelector('#js-addNewItemButton').style.display = 'none';
            document.querySelector('#js-searchButton').style.display = 'none';
            document.querySelector('#js-settings').style.display = 'none';
            document.querySelector('#js-fullSync').style.display = 'none';
            document.querySelector('#js-trendingCollapseTrigger').style.display = 'none';
            document.querySelector('#js-trendingSeparator').style.display = 'none';
            trendingItem.hideAll();
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

        helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

        this.toggleLoggedInContent(true);

        // get content from pocket api
        this.getContent();

        this.removeLoggedOutClickEvents();
        this.bindLoggedInClickEvents();
        this.bindAddNewItemEvents();

        header.init();
        search.init();
        modal.init();
        collapse.init();
        selector.init();
    }

    /**
     * Show content from localStorage and start sync with Pocket.
     *
     * @function startSync
     * @return {void}
     */
    startSync() {
        helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

        this.render();

        this.toggleLoggedInContent(true);

        if (localStorage.getItem('username')) {
            document.querySelector('#js-username').innerText = localStorage.getItem('username');
        }

        this.bindLoggedInClickEvents();
        this.bindAddNewItemEvents();

        header.init();
        search.init();
        modal.init();
        collapse.init();
        selector.init();

        this.getContent();
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
        this.changeMenuActiveState('list');

        this.toggleLoggedInContent(false);

        this.removeLoggedInClickEvents();
        this.bindLoggedOutClickEvents();
        this.removeAdItemToPocketClicks();

        header.destroy();
        search.destroy();
        modal.destroy();
        collapse.destroy();
        selector.destroy();

        helper.removeClass(document.body, ['theme-light', 'theme-dark', 'theme-sepia']);

        helper.showMessage(chrome.i18n.getMessage('LOGGING_OUT'));
    }
}

const pocket = new Pocket();

window.onload = (() => {
    pocket.init();
});
