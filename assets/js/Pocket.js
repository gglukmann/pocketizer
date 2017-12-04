'use strict';

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
        }

        this.fullSync = false;
    }

    /**
     * Initialize Pocket.
     *
     * @function init
     * @return {void}
     */
    init() {
        helper.localizeHtml();

        if (authService.isLoggedIn()) {
            this.startSync();
        } else {
            document.querySelector('#js-default-message').style.display = 'block';
            this.bindLoginClickEvent();
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
                if (!this.isArchiveLoaded()) {
                    isFirstLoad = true;
                }
                break;
        }

        if (isFirstLoad || this.fullSync) {
            for (let key in items) {
                array.push(items[key]);
            }

            array.sort((x, y) => {
                return x.sort_id - y.sort_id;
            });

            localStorage.setItem(`${this.getActivePage()}FromLocalStorage`, JSON.stringify(array));
            localStorage.setItem(`${this.getActivePage()}Count`, array.length);
            localStorage.setItem(`${this.getActivePage()}Since`, response.since);

            this.fullSync = false;
        } else {
            for (let key in items) {
                let newItem = items[key];
                let newArray;

                switch (newItem.status) {
                    // add to unread list
                    case "0":
                        newArray = JSON.parse(localStorage.getItem('listFromLocalStorage'));

                        // delete old item, if it is added from this extension
                        newArray.forEach((item, i) => {
                            if (item.item_id === newItem.item_id) {
                                newArray.splice(i, 1);
                            }
                        });

                        newArray = helper.prependArray(newArray, newItem);
                        localStorage.setItem('listFromLocalStorage', JSON.stringify(newArray));

                        localStorage.setItem('listCount', parseInt(localStorage.getItem('listCount'), 10) + 1);
                        break;
                    // add to archive list
                    case "1":
                        // delete old item, if it is added to archive from somewhere else and is in unread list in extension
                        newArray = JSON.parse(localStorage.getItem('listFromLocalStorage'));
                        newArray = newArray.filter(item => item.item_id !== newItem.item_id);

                        localStorage.setItem('listFromLocalStorage', JSON.stringify(newArray));

                        // only add to localstorage archive list if archive is loaded
                        if (this.isArchiveLoaded()) {
                            newArray = JSON.parse(localStorage.getItem('archiveFromLocalStorage'));
                            newArray = helper.prependArray(newArray, newItem);
                            localStorage.setItem('archiveFromLocalStorage', JSON.stringify(newArray));

                            localStorage.setItem('archiveCount', parseInt(localStorage.getItem('archiveCount'), 10) + 1);
                        }
                        break;
                    // delete from unread or archive list
                    case "2":
                        let listArray = JSON.parse(localStorage.getItem('listFromLocalStorage'));
                        let archiveArray = JSON.parse(localStorage.getItem('archiveFromLocalStorage'));

                        listArray = listArray.filter(item => item.item_id !== newItem.item_id);
                        archiveArray = archiveArray.filter(item => item.item_id !== newItem.item_id);

                        localStorage.setItem('listFromLocalStorage', JSON.stringify(listArray));
                        localStorage.setItem('archiveFromLocalStorage', JSON.stringify(archiveArray));
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
        document.querySelector('#js-list').innerHTML = "";

        if (array === null) {
            this.getContent();
        } else if (array.length === 0) {
            document.querySelector('#js-empty-list-message').style.display = 'block';
        } else {
            array = array.filter((item, index) => (index < this.load_count));
            document.querySelector('#js-empty-list-message').style.display = 'none';

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
     * @param  {Array} a - Array of items.
     * @return {void}
     */
    createItems(a) {
        Object.keys(a).forEach(key => {
            let newItem = item.create(a[key], this.getActivePage());
            item.render(newItem);
        });
    }

    /**
     * Create empty div for observer to observe.
     *
     * @function createSentinel
     * @return {void}
     */
    createSentinel() {
        const list = document.querySelector('.list');
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
        if (localStorage.getItem('archiveSince')) {
            return true;
        }

        return false;
    }

    /**
     * Binds click events for action buttons.
     *
     * @function bindActionClickEvents
     * @return {void}
     */
    bindActionClickEvents() {
        document.body.addEventListener('click', e => {
            if (e.target.classList.contains('js-toggleFavouriteButton')) {
                item.favourite(e);
            } else if (e.target.classList.contains('js-toggleReadButton')) {
                item.archive(e);
            } else if (e.target.classList.contains('js-deleteButton')) {
                item.delete(e);
            }
        });

        document.querySelector('#js-logout').addEventListener('click', () => {
            this.logout();
        }, false);
    }

    /**
     * Bind header click events.
     *
     * @function bindHeaderClickEvents
     * @return {void}
     */
    bindHeaderClickEvents() {
        document.body.addEventListener('click', e => {
            if (e.target.parentNode.classList.contains('js-changeMenu')) {
                e.preventDefault();
                let page = e.target.parentNode.dataset.page;

                this.changePage(page);
            }
        });

        document.querySelector('#js-searchButton').addEventListener('click', e => {
            search.show();
        }, false);

        document.querySelector('#js-fullSync').addEventListener('click', e => {
            this.fullSync = true;
            helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);
            this.getContent();
        }, false);
    }

    /**
     * Bind login button click event.
     *
     * @function bindLoginClickEvent
     * @return {void}
     */
    bindLoginClickEvent() {
        let loginButton = document.querySelector('#js-login');
        loginButton.addEventListener('click', () => {
            this.startLogin();

            loginButton.disabled = true;
        }, false);
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

        if (state == 'read') {
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
        } else if (state == 'favourite') {
            action = (isFavourited === true ? 'unfavorite' : 'favorite');
            helper.showMessage(`${chrome.i18n.getMessage('PROCESSING')}...`, true, false, false);
        } else if (state == 'delete') {
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

        for (let i = 0; i < array.length; i++) {
            if (array[i].item_id === id) {
                switch (state) {
                    case 'read':
                    case 'delete':
                        array.splice(i, 1);

                        e.target.parentNode.parentNode.remove();

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
        };

        localStorage.setItem(`${this.getActivePage()}FromLocalStorage`, JSON.stringify(array));

        if (state == 'read') {
            switch (this.getActivePage()) {
                case 'list':
                    helper.showMessage(chrome.i18n.getMessage('ARCHIVING'));
                    break;
                case 'archive':
                    helper.showMessage(chrome.i18n.getMessage('UNARCHIVING'));
                    break;
            }
        } else if (state == 'favourite') {
            helper.showMessage(chrome.i18n.getMessage('PROCESSING'));
        } else if (state == 'delete') {
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
        document.addEventListener('opened.modal', e => {
            document.querySelector('#js-newItemInput').focus();
        }, false);

        document.addEventListener('closed.modal', e => {
            document.querySelector('#js-newItemInput').value = '';
        }, false);

        document.newItemForm.addEventListener('submit', e => {
            const form = document.newItemForm;

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
        helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

        let menuLinkElements = document.querySelectorAll('.menu__link');
        for (let i = 0; i < menuLinkElements.length; i++) {
            menuLinkElements[i].classList.remove('menu__link--active');
            if (menuLinkElements[i].dataset.page == page) {
                menuLinkElements[i].classList.add('menu__link--active');
            }
        }

        this.items_shown = 0;
        document.querySelector('#js-list').innerHTML = '';
        search.hide(true);

        switch (page) {
            case 'list':
                this.setActivePage('list');

                document.querySelector('#js-count').innerText = localStorage.getItem('listCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('MY_POCKET_LIST');

                this.render();
                this.getContent();
            break;
            case 'archive':
                this.setActivePage('archive');

                document.querySelector('#js-count').innerText = localStorage.getItem('archiveCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('ARCHIVE');

                if (this.isArchiveLoaded()) {
                   this.render();
                }

                this.getContent();
            break;
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
            document.querySelector('#js-fullSync').removeAttribute('style');
        } else {
            document.querySelector('#js-empty-list-message').style.display = 'none';
            document.querySelector('#js-default-message').style.display = 'block';
            document.querySelector('#js-list').style.display = 'none';
            document.querySelector('#js-menu').style.display = 'none';
            document.querySelector('#js-username').style.display = 'none';
            document.querySelector('#js-logout').style.display = 'none';
            document.querySelector('#js-count-wrapper').style.display = 'none';
            document.querySelector('#js-addNewItemButton').style.display = 'none';
            document.querySelector('#js-searchButton').style.display = 'none';
            document.querySelector('#js-fullSync').style.display = 'none';
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

        this.bindHeaderClickEvents();
        this.bindActionClickEvents();
        this.bindAddNewItemEvents();
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

        this.bindHeaderClickEvents();
        this.bindActionClickEvents();
        this.bindAddNewItemEvents();

        this.getContent();
    }

    /**
     * Start login flow.
     *
     * @function startLogin
     * @return {void}
     */
    startLogin() {
        authService.authenticate().then((response) => {
            if (response.status !== 'authenticated') {
                helper.showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
                this.logout();
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

        this.toggleLoggedInContent(false);

        this.bindLoginClickEvent();

        helper.showMessage(chrome.i18n.getMessage('LOGGING_OUT'));
    }
};

const pocket = new Pocket();
window.onload = (() => {
    pocket.init();
    modal.init();
});
