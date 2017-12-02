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
        let state;

        switch (this.getActivePage()) {
            case 'list':
                state = 'unread';
            break;
            case 'archive':
                state = 'archive';
            break;
        }

        apiService.get(state)
            .then(response => {
                this.sortGetResponse(response);
            });
    }

    /**
     * Sort get response, add to localstorage and render page again.
     *
     * @function sortGetResponse
     * @param  {Object} response - response from fetch.
     * @return {void}
     */
    sortGetResponse(response) {
        let array = [];
        let items = response.list;

        for (let key in items) {
            array.push(items[key]);
        }

        array.sort((x, y) => {
            return x.sort_id - y.sort_id;
        });

        switch (this.getActivePage()) {
            case 'list':
                localStorage.setItem('listFromLocalStorage', JSON.stringify(array));
                localStorage.setItem('listCount', array.length);
            break;
            case 'archive':
                localStorage.setItem('archiveListFromLocalStorage', JSON.stringify(array));
                localStorage.setItem('archiveCount', array.length);
            break;
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
        let array;
        let listElement;

        switch (this.getActivePage()) {
            case 'list':
                array = JSON.parse(localStorage.getItem('listFromLocalStorage'));

                document.querySelector('#js-count').innerText = localStorage.getItem('listCount');
            break;
            case 'archive':
                array = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));

                document.querySelector('#js-count').innerText = localStorage.getItem('archiveCount');
            break;
        }

        this.items_shown = this.load_count;

        document.querySelector('#js-list').innerHTML = "";

        if (array === null) {
            this.getContent();
        } else if (array.length === 0) {
            document.querySelector('#js-empty-list-message').style.display = 'block';
        } else {
            array = array.filter((i, index) => (index < this.load_count));
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
        let array;

        switch (this.getActivePage()) {
            case 'list':
                array = JSON.parse(localStorage.getItem('listFromLocalStorage'));
            break;
            case 'archive':
                array = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));
            break;
        }

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
     * Toggles item state.
     *
     * @function toggleActionState
     * @param  {Event}  e - Event.
     * @param  {String}  state - Current state.
     * @param  {Number}  id - Item id.
     * @param  {Boolean} isFavourited - If should be favourited.
     * @return {void}
     */
    toggleActionState(e, state, id, isFavourited) {
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
        let a;

        switch (this.getActivePage()) {
            case 'list':
                a = JSON.parse(localStorage.getItem('listFromLocalStorage'));
            break;
            case 'archive':
                a = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));
            break;
        }

        for (let i = 0; i < a.length; i++) {
            if (a[i].item_id === id) {
                switch (state) {
                    case 'read':
                    case 'delete':
                        a.splice(i, 1);

                        e.target.parentNode.parentNode.remove();

                        switch (this.getActivePage()) {
                            case 'list':
                                localStorage.setItem('listCount', localStorage.getItem('listCount') - 1);
                                document.querySelector('#js-count').innerText = localStorage.getItem('listCount');
                            break;
                            case 'archive':
                                localStorage.setItem('archiveCount', localStorage.getItem('archiveCount') - 1);
                                document.querySelector('#js-count').innerText = localStorage.getItem('archiveCount');
                            break;
                        }
                    break;
                    case 'favourite':
                        a[i].favorite = (isFavourited === true ? 0 : 1);

                        isFavourited = !isFavourited;
                        e.target.parentNode.querySelector('.js-toggleFavouriteButton').dataset.favourite = isFavourited;
                    break;
                }
            }
        };

        switch (this.getActivePage()) {
            case 'list':
                localStorage.setItem('listFromLocalStorage', JSON.stringify(a));
            break;
            case 'archive':
                localStorage.setItem('archiveListFromLocalStorage', JSON.stringify(a));
            break;
        }

        if (state == 'read') {
            if (this.getActivePage() === 'list') {
                helper.showMessage(chrome.i18n.getMessage('ARCHIVING'));
            } else if (this.getActivePage() === 'archive') {
                helper.showMessage(chrome.i18n.getMessage('UNARCHIVING'));
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
                helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

                this.render();
                this.getContent();
            break;
            case 'archive':
                this.setActivePage('archive');

                document.querySelector('#js-count').innerText = localStorage.getItem('archiveCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('ARCHIVE');
                helper.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

                if (localStorage.getItem('archiveCount')) {
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
        } else {
            document.querySelector('#js-default-message').style.display = 'block';
            document.querySelector('#js-list').style.display = 'none';
            document.querySelector('#js-menu').style.display = 'none';
            document.querySelector('#js-username').style.display = 'none';
            document.querySelector('#js-logout').style.display = 'none';
            document.querySelector('#js-count-wrapper').style.display = 'none';
            document.querySelector('#js-addNewItemButton').style.display = 'none';
            document.querySelector('#js-searchButton').style.display = 'none';
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
