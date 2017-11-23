'use strict';

class Pocket {
    /**
     * @constructor
     */
    constructor() {
        this.active_page = 'list';
        this.items_shown = 0;
        this.load_count = 22;

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
        localizeHtml();

        if (AuthService.isLoggedIn()) {
            this.startSync();
        } else {
            // TODO: user variabels for querySelector
            document.querySelector('#js-default-message').style.display = 'block';
            this.bindLoginClickEvent();
        }

        window.addEventListener('scroll', () => this.handleScroll());
    }

    /**
     * Gets content from localStorage and from Pocket API to see if there are newer links.
     *
     * @function getContent
     * @return {void}
     */
    getContent() {
        let state;

        switch (this.active_page) {
            case 'list':
                state = 'unread';
            break;
            case 'archive':
                state = 'archive';
            break;
        }

        let fetchData = {
            method: 'POST',
            body: JSON.stringify({
                access_token: AuthService.getToken(),
                consumer_key: __consumer_key,
                state: state,
                detailType: 'complete'
            }),
            headers: {
                'Content-Type': 'application/json; charset=UTF8'
            }
        }

        makeFetch(API.url_get, fetchData)
            .then(response => {
                this.sortGetResponse(response);
            })
            .catch(error => {
                console.log(error);
                showMessage(chrome.i18n.getMessage('ERROR_GETTING_CONTENT'), false);
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

        switch (this.active_page) {
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
        showMessage(chrome.i18n.getMessage('SYNCHRONIZING'));
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

        switch (this.active_page) {
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
        array = array.filter((i, index) => (index < this.load_count));

        if (array.length == 0) {
            document.querySelector('#js-empty-list-message').style.display = 'block';
        } else {
            document.querySelector('#js-empty-list-message').style.display = 'none';

            this.createItems(array);
        }
    }

    /**
     * Creates items and appends to DOM.
     *
     * @function createItems
     * @param  {Array} a Array of items.
     * @return {void}
     */
    createItems(a) {
        let listElement = document.querySelector('#js-list');

        Object.keys(a).forEach(key => {
            let itemElement = createNode('li');
            let contentElement = createNode('div');
            let excerptElement = createNode('div');
            let titleElement = createNode('a');
            let linkElement = createNode('a');
            let fakeLinkElement = createNode('a');
            let readButtonElement = createNode('a');
            let deleteButtonElement = createNode('a');
            let favouriteElement = createNode('a');
            let pocketLinkElement = createNode('a');
            let timeElement = createNode('div');
            let title;
            let link;

            if (a[key].resolved_title == '' && a[key].given_title == '') {
                title = a[key].resolved_url;
            } else if (a[key].resolved_title == '' || a[key].given_title != '') {
                title = a[key].given_title;
            } else {
                title = a[key].resolved_title;
            }

            if (a[key].favorite == 1) {
                favouriteElement.setAttribute('data-favourite', 'true');
            } else {
                favouriteElement.setAttribute('data-favourite', 'false');
            }
            favouriteElement.setAttribute('class', 'item__favourite js-toggle-favourite-button');
            favouriteElement.setAttribute('href', '#0');
            favouriteElement.setAttribute('title', chrome.i18n.getMessage('TOGGLE_FAVOURITED_STATE'));
            favouriteElement.setAttribute('data-id', a[key].item_id);
            append(contentElement, favouriteElement);

            let textNode = createTextNode(title);
            let pocketLinkNode = createTextNode(chrome.i18n.getMessage('OPEN_IN_POCKET'));
            let timeNode = createTextNode(timeConverter(a[key].time_added));
            let readNode;
            let isRead = false;
            let deleteNode = createTextNode(chrome.i18n.getMessage('DELETE'));

            switch (this.active_page) {
                case 'list':
                    readNode = createTextNode(chrome.i18n.getMessage('MARK_READ'));
                    isRead = false;
                break;
                case 'archive':
                    readNode = createTextNode(chrome.i18n.getMessage('MARK_UNREAD'))
                    isRead = true;
                break;
            };

            timeElement.setAttribute('class', 'item__time');
            timeElement.setAttribute('title', chrome.i18n.getMessage('DATE_ADDED'));
            append(timeElement, timeNode);

            readButtonElement.setAttribute('class', 'item__set-read js-toggleReadButton');
            readButtonElement.setAttribute('href', '#0');
            readButtonElement.setAttribute('data-id', a[key].item_id);
            readButtonElement.setAttribute('data-read', isRead);
            append(readButtonElement, readNode);

            deleteButtonElement.setAttribute('class', 'item__delete js-deleteButton');
            deleteButtonElement.setAttribute('href', '#0');
            deleteButtonElement.setAttribute('data-id', a[key].item_id);
            append(deleteButtonElement, deleteNode);

            itemElement.setAttribute('class', 'item');
            contentElement.setAttribute('class', 'item__content');
            append(itemElement, contentElement);

            fakeLinkElement.setAttribute('href', a[key].resolved_url);
            fakeLinkElement.setAttribute('class', 'item__fake-link');

            titleElement.setAttribute('href', a[key].resolved_url);
            titleElement.setAttribute('class', 'item__title');
            append(titleElement, textNode);

            excerptElement.setAttribute('class', 'item__excerpt');

            if ((a[key].has_image == 1 || a[key].has_image == 2) && a[key].image) {
                let imageElement = createNode('img');
                imageElement.setAttribute('data-src', a[key].image.src);
                imageElement.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                imageElement.setAttribute('class', 'item__image lazyload');
                excerptElement.className += ' item__excerpt--image';
                append(excerptElement, imageElement);
            } else {
                let excerptNode = createTextNode(a[key].excerpt);
                append(excerptElement, excerptNode);
            }

            pocketLinkElement.setAttribute('class', 'item__pocket-link');
            pocketLinkElement.setAttribute('href', 'https://getpocket.com/a/read/' + a[key].item_id);
            pocketLinkElement.setAttribute('title', chrome.i18n.getMessage('OPEN_IN_POCKET'));
            append(pocketLinkElement, pocketLinkNode);

            linkElement.setAttribute('class', 'item__link');

            if (a[key].resolved_url == '' && a[key].given_url == '') {
                link = a[key].given_url;
            } else if (a[key].resolved_url == '' || a[key].given_url != '') {
                link = a[key].given_url;
            } else {
                link = a[key].resolved_url;
            }
            let linkNode = createTextNode(link);
            linkElement.setAttribute('href', link);
            linkElement.setAttribute('title', link);
            append(linkElement, linkNode);

            append(contentElement, fakeLinkElement);
            append(contentElement, titleElement);
            append(contentElement, timeElement);
            append(contentElement, excerptElement);
            append(contentElement, linkElement);
            append(contentElement, pocketLinkElement);
            append(contentElement, readButtonElement);
            append(contentElement, deleteButtonElement);

            append(listElement, itemElement);
        });
    }

    /**
     * Load more items.
     *
     * @function infiniteScroll
     * @return {void}
     */
    infiniteScroll() {
        let array;

        switch (this.active_page) {
            case 'list':
                array = JSON.parse(localStorage.getItem('listFromLocalStorage'));
            break;
            case 'archive':
                array = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));
            break;
        }

        array = array.filter((i, index) => (index >= this.items_shown && index < this.items_shown + this.load_count));

        this.items_shown += this.load_count;

        this.createItems(array);
    }

    /**
     * Scrolling on page handler.
     *
     * @function handleScroll
     * @return {void}
     */
    handleScroll() {
        this.scroll.lastKnownScrollY = window.scrollY;

        if (!this.scroll.ticking) {
            window.requestAnimationFrame(() => {
                if (this.scroll.lastKnownScrollY === document.documentElement.scrollHeight - window.innerHeight) {
                    this.infiniteScroll();
                }
                this.scroll.ticking = false;
            });

            this.scroll.ticking = true;
        }
    }

    /**
     * Binds click events for action buttons.
     *
     * @function bindActionClickEvents
     * @return {void}
     */
    bindActionClickEvents() {
        document.body.addEventListener('click', (e) => {
            let id = e.target.dataset.id;

            if (e.target.classList.contains('js-toggle-favourite-button')) {
                e.preventDefault();
                let isFavourited = e.target.dataset.favourite;
                isFavourited = (isFavourited == 'true'); // convert to boolean

                this.toggleActionState(e, 'favourite', id, isFavourited);
            } else if (e.target.classList.contains('js-deleteButton')) {
                e.preventDefault();
                this.toggleActionState(e, 'delete', id, false);
            } else if (e.target.classList.contains('js-toggleReadButton')) {
                e.preventDefault();
                this.toggleActionState(e, 'read', id, false);
            }
        });

        document.querySelector('#js-logout').addEventListener('click', () => {
            this.logout();
        }, false);
    }

    /**
     * Bind menu change click events.
     *
     * @function bindMenuClickEvents
     * @return {void}
     */
    bindMenuClickEvents() {
        document.body.addEventListener('click', (e) => {
            if (e.target.parentNode.classList.contains('js-changeMenu')) {
                e.preventDefault();
                let page = e.target.parentNode.dataset.page;

                this.changePage(page);
            }
        });
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
            switch (this.active_page) {
                case 'archive':
                    action = 'readd';
                    document.querySelector('#js-status').innerText = chrome.i18n.getMessage('UNARCHIVING') + '...';
                break;
                case 'list':
                    action = 'archive';
                    document.querySelector('#js-status').innerText = chrome.i18n.getMessage('ARCHIVING') + '...';
                break;
            }
        } else if (state == 'favourite') {
            action = (isFavourited === true ? 'unfavorite' : 'favorite');
            document.querySelector('#js-status').innerText = chrome.i18n.getMessage('PROCESSING') + '...';
        } else if (state == 'delete') {
            action = 'delete';
            document.querySelector('#js-status').innerText = chrome.i18n.getMessage('DELETING') + '...';
        }

        let actions = [{
            "action": action,
            "item_id": id,
            "time": getCurrentUNIX()
        }];

        let fetchData = {
            method: 'POST',
            body: JSON.stringify({
                access_token: AuthService.getToken(),
                consumer_key: __consumer_key,
                actions: actions
            }),
            headers: {
                'Content-Type': 'application/json; charset=UTF8'
            }
        }

        makeFetch(API.url_send, fetchData)
        .then(response => {
            let a;

            switch (this.active_page) {
                case 'list':
                    a = JSON.parse(localStorage.getItem('listFromLocalStorage'));
                break;
                case 'archive':
                    a = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));
                break;
            }

            for (let i = 0; i < a.length; i++) {
                if (a[i].item_id == id) {
                    switch (state) {
                        case 'read':
                        case 'delete':
                            a.splice(i, 1);

                            e.target.parentNode.parentNode.remove();

                            switch (this.active_page) {
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
                            e.target.parentNode.querySelector('.js-toggle-favourite-button').dataset.favourite = isFavourited;
                        break;
                    }
                }
            };

            switch (this.active_page) {
                case 'list':
                    localStorage.setItem('listFromLocalStorage', JSON.stringify(a));
                break;
                case 'archive':
                    localStorage.setItem('archiveListFromLocalStorage', JSON.stringify(a));
                break;
            }

            if (state == 'read') {
                if (this.active_page === 'list') {
                    showMessage(chrome.i18n.getMessage('ARCHIVING'));
                } else if (this.active_page === 'archive') {
                    showMessage(chrome.i18n.getMessage('UNARCHIVING'));
                }
            } else if (state == 'favourite') {
                showMessage(chrome.i18n.getMessage('PROCESSING'));
            } else if (state == 'delete') {
                showMessage(chrome.i18n.getMessage('DELETING'));
            }
        })
        .catch(error => {
            console.log(error);
            showMessage(chrome.i18n.getMessage('ACTION'), false);
        });
    }

    /**
     * Change page between list and archive.
     *
     * @function changePage
     * @param  {String} page - Page to change to.
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
        document.querySelector('#js-list').innerHTML = "";

        switch (page) {
            case 'list':
                this.active_page = 'list';

                document.querySelector('#js-count').innerText = localStorage.getItem('listCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('MY_POCKET_LIST');
                document.querySelector('#js-status').innerText = chrome.i18n.getMessage('SYNCHRONIZING') + "...";

                this.render();
                this.getContent();
            break;
            case 'archive':
                this.active_page = 'archive';

                document.querySelector('#js-count').innerText = localStorage.getItem('archiveCount');
                document.querySelector('#js-title').innerText = chrome.i18n.getMessage('ARCHIVE');
                document.querySelector('#js-status').innerText = chrome.i18n.getMessage('SYNCHRONIZING') + "...";

                this.render();
                this.getContent();
            break;
        }
    }

    /**
     * Show right elements when coming to new tab or logging in.
     *
     * @function showLoggedInContent
     * @return {void}
     */
    showLoggedInContent() {
        document.querySelector('#js-default-message').style.display = 'none';
        document.querySelector('#js-count-wrapper').style.display = 'inline-block';
        document.querySelector('#js-menu').style.display = 'flex';
        document.querySelector('#js-list').style.display = 'flex';
        document.querySelector('#js-username').style.display = 'inline-block';
        document.querySelector('#js-logout').style.display = 'inline-block';
    }

    /**
     * Show right content after loging in.
     *
     * @function loggedIn
     * @return {void}
     */
    loggedIn() {
        document.querySelector('#js-username').innerText = localStorage.getItem('username');

        document.querySelector('#js-status').innerText = chrome.i18n.getMessage('SYNCHRONIZING') + "...";

        this.showLoggedInContent();

        // get content from pocket api
        this.getContent();

        this.bindMenuClickEvents();
        this.bindActionClickEvents();
    }

    /**
     * Show content from localStorage and start sync with Pocket.
     *
     * @function startSync
     * @return {void}
     */
    startSync() {
        document.querySelector('#js-status').innerText = chrome.i18n.getMessage('SYNCHRONIZING') + "...";

        this.render();

        this.showLoggedInContent();

        if (localStorage.getItem('username')) {
            document.querySelector('#js-username').innerText = localStorage.getItem('username');
        }

        this.bindMenuClickEvents();
        this.bindActionClickEvents();

        this.getContent();
    }

    /**
     * Start login flow.
     *
     * @function startLogin
     * @return {void}
     */
    startLogin() {
        AuthService.authenticate().then((response) => {
            if (response.status !== 'authenticated') {
                showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
                this.logout();
            }

            showMessage(chrome.i18n.getMessage('AUTHENTICATION'));
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
        document.querySelector('#js-status').innerText = chrome.i18n.getMessage('LOGGING_OUT') + '...';
        localStorage.clear();

        document.querySelector('#js-default-message').style.display = 'block';
        document.querySelector('#js-list').style.display = 'none';
        document.querySelector('#js-menu').style.display = 'none';
        document.querySelector('#js-username').style.display = 'none';
        document.querySelector('#js-logout').style.display = 'none';
        document.querySelector('#js-count-wrapper').style.display = 'none';

        this.bindLoginClickEvent();

        showMessage('Logout');
    }
};

window.pocket = new Pocket();
window.onload = (() => {
    window.pocket.init();
});
