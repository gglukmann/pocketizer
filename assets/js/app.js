'use strict';

const pocketExtension = (() => {
    const apiUrl = 'https://getpocket.com/';
    const apiVersion = 'v3';

    const __redirect_url = chrome.identity.getRedirectURL() + 'oauth';
    const __url_request = apiUrl + apiVersion + '/oauth/request';
    const __url_authorize = apiUrl + apiVersion + '/oauth/authorize';
    const __url_auth = apiUrl + 'auth/authorize';
    const __url_get = apiUrl + apiVersion + '/get';
    const __url_send = apiUrl + apiVersion + '/send';

    let __request_token;
    let __access_token;
    let __active_page = 'list';
    let __items_shown = 0;
    const __load_count = 22;

    /**
     * Gets content from localStorage and from Pocket API to see if there are newer links.
     *
     * @function getContent
     * @return {void}
     */
    function getContent() {
        let state;

        switch (__active_page) {
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
                access_token: localStorage.getItem('token'),
                consumer_key: __consumer_key,
                state: state,
                detailType: 'complete'
            }),
            headers: {
                'Content-Type': 'application/json; charset=UTF8'
            }
        }

        fetch(__url_get, fetchData)
            .then(response => response.json())
            .then(response => {
                sortGetResponse(response);
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
    function sortGetResponse(response) {
        let b = [];
        let items = response.list;

        for (let key in items) {
            b.push(items[key]);
        }

        b.sort((x, y) => {
            return x.sort_id - y.sort_id;
        });

        switch (__active_page) {
            case 'list':
                localStorage.setItem('listFromLocalStorage', JSON.stringify(b));
                localStorage.setItem('listCount', b.length);
            break;
            case 'archive':
                localStorage.setItem('archiveListFromLocalStorage', JSON.stringify(b));
                localStorage.setItem('archiveCount', b.length);
            break;
        }

        render();
        showMessage(chrome.i18n.getMessage('SYNCHRONIZING'));
    }

    /**
     * Renders from localStorage.
     *
     * @function render
     * @return {void}
     */
    function render() {
        let a;
        let listElement;

        switch (__active_page) {
            case 'list':
                a = JSON.parse(localStorage.getItem('listFromLocalStorage'));
                a = a.filter((i, index) => (index < __load_count));

                listElement = document.getElementById('list');
                document.getElementById('count').innerText = localStorage.getItem('listCount');
            break;
            case 'archive':
                a = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));
                a = a.filter((i, index) => (index < __load_count));

                listElement = document.getElementById('archive-list');
                document.getElementById('count').innerText = localStorage.getItem('archiveCount');
            break;
        }

        __items_shown = __load_count;
        listElement.innerHTML = "";

        if (a.length == 0) {
            document.getElementById('empty-list-message').style.display = 'block';
        } else {
            document.getElementById('empty-list-message').style.display = 'none';

            createItems(a);
        }
    }

    /**
     * Creates items and appends to DOM.
     *
     * @function createItems
     * @param  {Array} a Array of items.
     * @return {void}
     */
    function createItems(a) {
        let listElement;

        switch (__active_page) {
            case 'list':
                listElement = document.getElementById('list');
            break;
            case 'archive':
                listElement = document.getElementById('archive-list');
            break;
        }

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
            favouriteElement.setAttribute('class', 'item__favourite js-toggleFavouriteButton');
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

            switch (__active_page) {
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

    function infiniteScroll() {
        let array;

        switch (__active_page) {
            case 'list':
                array = JSON.parse(localStorage.getItem('listFromLocalStorage'));
                array = array.filter((i, index) => (index >= __items_shown && index < __items_shown + __load_count));
            break;
            case 'archive':
                array = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));
                array = array.filter((i, index) => (index >= __items_shown && index < __items_shown + __load_count));
            break;
        }

        __items_shown = __items_shown + __load_count;

        createItems(array);
    }

    let lastKnownScrollPosition = 0;
    let ticking = false;

    window.addEventListener('scroll', (e) => {
        lastKnownScrollPosition = window.scrollY;

        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (lastKnownScrollPosition === document.documentElement.scrollHeight - window.innerHeight) {
                    infiniteScroll();
                }
                ticking = false;
            });

            ticking = true;
        }
    });

    /**
     * Binds click events for action buttons.
     *
     * @function bindActionClickEvents
     * @return {void}
     */
    function bindActionClickEvents() {
        document.body.addEventListener('click', (e) => {
            e.preventDefault();
            let id = e.target.dataset.id;

            if (e.target.classList.contains('js-toggleFavouriteButton')) {
                let isFavourited = e.target.dataset.favourite;
                isFavourited = (isFavourited == 'true'); // convert to boolean

                toggleActionState(e, 'favourite', id, isFavourited);
            } else if (e.target.classList.contains('js-deleteButton')) {
                toggleActionState(e, 'delete', id, false);
            } else if (e.target.classList.contains('js-toggleReadButton')) {
                toggleActionState(e, 'read', id, false);
            }
        });

        document.getElementById('js-logout').addEventListener('click', () => {
            logout();
        }, false);
    }

    /**
     * Bind menu change click events.
     *
     * @function bindMenuClickEvents
     * @return {void}
     */
    function bindMenuClickEvents() {
        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('js-changeMenu')) {
                e.preventDefault();
                let page = e.target.dataset.page;

                changePage(page);
            }
        });
    }

    /**
     * Bind login button click event.
     *
     * @function bindLoginClickEvent
     * @return {void}
     */
    function bindLoginClickEvent() {
        let loginButton = document.getElementById('js-login');
        loginButton.addEventListener('click', () => {
            startLogin();

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
    function toggleActionState(e, state, id, isFavourited) {
        let action;

        if (state == 'read') {
            switch (__active_page) {
                case 'archive':
                    action = 'readd';
                    document.getElementById('status').innerHTML = chrome.i18n.getMessage('UNARCHIVING') + '...';
                break;
                case 'list':
                    action = 'archive';
                    document.getElementById('status').innerHTML = chrome.i18n.getMessage('ARCHIVING') + '...';
                break;
            }
        } else if (state == 'favourite') {
            action = (isFavourited === true ? 'unfavorite' : 'favorite');
            document.getElementById('status').innerHTML = chrome.i18n.getMessage('PROCESSING') + '...';
        } else if (state == 'delete') {
            action = 'delete';
            document.getElementById('status').innerHTML = chrome.i18n.getMessage('DELETING') + '...';
        }

        let actions = [{
            "action": action,
            "item_id": id,
            "time": getCurrentUNIX()
        }];

        let fetchData = {
            method: 'POST',
            body: JSON.stringify({
                access_token: localStorage.getItem('token'),
                consumer_key: __consumer_key,
                actions: actions
            }),
            headers: {
                'Content-Type': 'application/json; charset=UTF8'
            }
        }

        fetch(__url_send, fetchData)
        .then(response => response.json())
        .then(response => {
            let a;

            switch (__active_page) {
                case 'list':
                    a = JSON.parse(localStorage.getItem('listFromLocalStorage'));

                    localStorage.setItem('listCount', localStorage.getItem('listCount') - 1);
                    document.getElementById('count').innerText = localStorage.getItem('listCount');
                break;
                case 'archive':
                    a = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));

                    localStorage.setItem('archiveCount', localStorage.getItem('archiveCount') - 1);
                    document.getElementById('count').innerText = localStorage.getItem('archiveCount');
                break;
            }

            for (let i = 0; i < a.length; i++) {
                if (a[i].item_id == id) {
                    switch (state) {
                        case 'read':
                        case 'delete':
                            a.splice(i, 1);

                            e.target.parentNode.parentNode.remove();
                        break;
                        case 'favourite':
                            a[i].favorite = (isFavourited === true ? 0 : 1);

                            isFavourited = !isFavourited;
                            e.target.parentNode.querySelector('.js-toggleFavouriteButton').dataset.favourite = isFavourited;
                        break;
                    }
                }
            };

            switch (__active_page) {
                case 'list':
                    localStorage.setItem('listFromLocalStorage', JSON.stringify(a));
                break;
                case 'archive':
                    localStorage.setItem('archiveListFromLocalStorage', JSON.stringify(a));
                break;
            }

            if (state == 'read') {
                showMessage(chrome.i18n.getMessage('UNARCHIVING'));
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
    function changePage(page) {
        let menuLinkElements = document.getElementsByClassName('menu__link');
        for (let i = 0; i < menuLinkElements.length; i++) {
            menuLinkElements[i].classList.remove('menu__link--active');
            if (menuLinkElements[i].getAttribute('data-page') == page) {
                menuLinkElements[i].classList.add('menu__link--active');
            }
        }

        __items_shown = 0;

        switch (page) {
            case 'list':
                __active_page = 'list';

                document.getElementById('count').innerText = localStorage.getItem('listCount');
                document.getElementById('title').innerHTML = chrome.i18n.getMessage('MY_POCKET_LIST');
                document.getElementById('status').innerHTML = chrome.i18n.getMessage('SYNCHRONIZING') + "...";

                getContent();

                document.getElementById('list').style.display = 'flex';
                document.getElementById('archive-list').style.display = 'none';
            break;
            case 'archive':
                __active_page = 'archive';

                document.getElementById('count').innerText = localStorage.getItem('archiveCount');
                document.getElementById('title').innerHTML = chrome.i18n.getMessage('ARCHIVE');
                document.getElementById('status').innerHTML = chrome.i18n.getMessage('SYNCHRONIZING') + "...";

                getContent();

                document.getElementById('archive-list').style.display = 'flex';
                document.getElementById('list').style.display = 'none';
            break;
        }
    }

    /**
     * Get access token from Pocket.
     *
     * @function getAccessToken
     * @return {void}
     */
    function getAccessToken() {
        let fetchData = {
            method: 'POST',
            body: JSON.stringify({
                consumer_key: __consumer_key,
                code: __request_token
            }),
            headers: {
                'Content-Type': 'application/json; charset=UTF8',
                'X-Accept': 'application/json'
            }
        }

        fetch(__url_authorize, fetchData)
        .then(response => response.json())
        .then(response => {
            __access_token = response.access_token;
            __request_token = __access_token;

            localStorage.setItem('token', __access_token);

            let username = response.username;

            localStorage.setItem('username', username);
            document.getElementById('username').innerText = username;

            loggedIn();
        })
        .catch(error => {
            console.log(error);
            showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
        });
    }

    /**
     * Open Pocket auth view from Chrome launchWebAuthFlow.
     *
     * @function launchChromeWebAuthFlow
     * @return {void}
     */
    function launchChromeWebAuthFlow() {
        let options = {
            'url': `${__url_auth}?request_token=${__request_token}&redirect_uri=${__redirect_url}`,
            'interactive': true
        }

        chrome.identity.launchWebAuthFlow(options, (redirectUrl) => {
            document.getElementById('js-login').disabled = false;

            if (chrome.runtime.lastError) {
                console.log(new Error(chrome.runtime.lastError.message));
                return;
            }

            getAccessToken();
        });
    }

    /**
     * Get Request token from Pocket.
     *
     * @function getRequestToken
     * @return {void}
     */
    function getRequestToken() {
        let fetchData = {
            method: 'POST',
            body: JSON.stringify({
                consumer_key: __consumer_key,
                redirect_uri: __redirect_url
            }),
            headers: {
                'Content-Type': 'application/json; charset=UTF8',
                'X-Accept': 'application/json'
            }
        }

        fetch(__url_request, fetchData)
        .then(response => response.json())
        .then(response => {
            __request_token = response.code;

            launchChromeWebAuthFlow();
        })
        .catch(error => {
            console.log(error);
            showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
        });
    }

    /**
     * Show right elements when coming to new tab or logging in.
     *
     * @function showLoggedInContent
     * @return {void}
     */
    function showLoggedInContent() {
        document.getElementById('default-message').style.display = 'none';
        document.getElementById('count-wrapper').style.display = 'inline-block';
        document.getElementById('menu').style.display = 'flex';
        document.getElementById('list').style.display = 'flex';
        document.getElementById('username').style.display = 'inline-block';
        document.getElementById('js-logout').style.display = 'inline-block';
    }

    /**
     * Show right content after loging in.
     *
     * @function loggedIn
     * @return {void}
     */
    function loggedIn() {
        document.getElementById('status').innerText = chrome.i18n.getMessage('SYNCHRONIZING') + "...";

        showLoggedInContent();

        // get content from pocket api
        getContent();

        bindMenuClickEvents();
        bindActionClickEvents();
    }

    /**
     * Show content from localStorage and start sync with Pocket.
     *
     * @function startSync
     * @return {void}
     */
    function startSync() {
        document.getElementById('status').innerText = chrome.i18n.getMessage('SYNCHRONIZING') + "...";

        render();

        showLoggedInContent();

        if (localStorage.getItem('username')) {
            document.getElementById('username').innerText = localStorage.getItem('username');
        }

        bindMenuClickEvents();
        bindActionClickEvents();

        getContent();
    }

    /**
     * Start login flow.
     *
     * @function startLogin
     * @return {void}
     */
    function startLogin() {
        getRequestToken();
    }

    /**
     * Clear localStorage and show and hide right elements.
     *
     * @function logout
     * @return {void}
     */
    function logout() {
        localStorage.clear();

        document.getElementById('default-message').style.display = 'block';
        document.getElementById('list').style.display = 'none';
        document.getElementById('archive-list').style.display = 'none';
        document.getElementById('menu').style.display = 'none';
        document.getElementById('username').style.display = 'none';
        document.getElementById('js-logout').style.display = 'none';
        document.getElementById('count-wrapper').style.display = 'none';

        bindLoginClickEvent();

        showMessage('Logout');
    }

    return {
        onload: () => {
            localizeHtml();

            if (localStorage.getItem('token')) {
                startSync();
            } else {
                document.getElementById('default-message').style.display = 'block';
                bindLoginClickEvent();
            }
        }
    };
})();

window.onload = pocketExtension.onload;
