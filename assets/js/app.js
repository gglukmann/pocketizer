'use strict';

const pocketExtension = (() => {
    const apiUrl = 'https://getpocket.com/';
    const apiVersion = 'v3';

    const __redirect_url = chrome.identity.getRedirectURL() + 'oauth';
    const __url_request = apiUrl + apiVersion + '/oauth/request';
    const __url_authorize = apiUrl + apiVersion + '/oauth/authorize';
    const __url_auth = apiUrl + '/auth/authorize';
    const __url_get = apiUrl + apiVersion + '/get';
    const __url_send = apiUrl + apiVersion + '/send';

    let __request_token;
    let __access_token;

    /**
    * Gets content from localStorage and from Pocket API to see if there are newer links
    * @method getContent
    * @param  {String} [page='list'] Default show 'my list' view
    * @return {void}
    */
    function getContent(page = 'list') {
        let state;

        switch (page) {
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
            sortGetResponse(response, page);
        })
        .catch(error => {
            console.log(error);
            showMessage('Getting new content', false);
        });
    }

    /**
    * Sort get response, add to localstorage and render page again
    * @method sortGetResponse
    * @param  {Object} response response from fetch
    * @return {void}
    */
    function sortGetResponse(response, page) {
        let b = [];
        let items = response.list;

        for (let key in items) {
            b.push(items[key]);
        }

        b.sort((x, y) => {
            return x.sort_id - y.sort_id;
        });

        switch (page) {
            case 'list':
            localStorage.setItem('listFromLocalStorage', JSON.stringify(b));
            localStorage.setItem('listCount', b.length);

            render('list');
            break;
            case 'archive':
            localStorage.setItem('archiveListFromLocalStorage', JSON.stringify(b));
            localStorage.setItem('archiveCount', b.length);

            render('archive');
            break;
        }

        showMessage('Synchronizing');
    }

    /**
    * Renders from localStorage
    * @method render
    * @param  {String} [page='list'] Default render 'my list' view
    * @return {void}
    */
    function render(page = 'list') {
        let a;
        let listElement;

        switch (page) {
            case 'list':
                a = JSON.parse(localStorage.getItem('listFromLocalStorage'));
                listElement = document.getElementById('list');
                document.getElementById('count').innerHTML = Sanitizer.escapeHTML`${localStorage.getItem('listCount')}`;
            break;
            case 'archive':
                a = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));
                listElement = document.getElementById('archive-list');
                document.getElementById('count').innerHTML = Sanitizer.escapeHTML`${localStorage.getItem('archiveCount')}`;
            break;
        }
        listElement.innerHTML = "";

        if (a.length == 0) {
            document.getElementById('empty-list-message').style.display = 'block';
        } else {
            document.getElementById('empty-list-message').style.display = 'none';
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

            if (a[key].resolved_title == '' && a[key].given_title == '') {
                title = a[key].resolved_url;
            } else if (a[key].resolved_title == '' && a[key].given_title != '') {
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
            favouriteElement.setAttribute('title', 'Toggle favourited state');
            favouriteElement.setAttribute('data-id', a[key].item_id);
            append(contentElement, favouriteElement);

            let textNode = createTextNode(title);
            let linkNode = createTextNode(a[key].resolved_url);
            let pocketLinkNode = createTextNode('Open in Pocket');
            let timeNode = createTextNode(timeConverter(a[key].time_added));
            let readNode;
            let isRead = false;
            let deleteNode = createTextNode('Delete');

            switch (page) {
                case 'list':
                readNode = createTextNode('Mark as read');
                isRead = false;
                break;
                case 'archive':
                readNode = createTextNode('Mark unread')
                isRead = true;
                break;
            };

            timeElement.setAttribute('class', 'item__time');
            timeElement.setAttribute('title', 'Date added');
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
            pocketLinkElement.setAttribute('title', 'Open in Pocket');
            append(pocketLinkElement, pocketLinkNode);

            linkElement.setAttribute('class', 'item__link');
            linkElement.setAttribute('href', a[key].resolved_url);
            linkElement.setAttribute('title', a[key].resolved_url);
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

        // Add empty items to the end of list to prevent last items stretch
        for (var i = 0; i < 4; i++) {
            let itemElement = createNode('li');
            itemElement.setAttribute('class', 'item item--empty');
            append(listElement, itemElement);
        }
    }

    /**
    * Binds click events for action buttons
    * @method bindActionClickEvents
    * @return {void}
    */
    function bindActionClickEvents() {
        document.body.addEventListener('click', function(e) {
            if (e.target.classList.contains('js-toggleFavouriteButton')) {
                e.preventDefault();
                let id = e.target.getAttribute('data-id');
                let isFavourited = e.target.getAttribute('data-favourite');
                let page = document.getElementById('page').value;

                toggleActionState('favourite', id, page, isFavourited);
            } else if (e.target.classList.contains('js-deleteButton')) {
                e.preventDefault();
                let id = e.target.getAttribute('data-id');
                let page = document.getElementById('page').value;

                toggleActionState('delete', id, page);
            } else if (e.target.classList.contains('js-toggleReadButton')) {
                e.preventDefault();
                let id = e.target.getAttribute('data-id');
                let page = document.getElementById('page').value;

                toggleActionState('read', id, page);
            }
        });

        document.getElementById('js-logout').addEventListener('click', () => {
            logout();
        }, false);
    }

    /**
    * Bind menu change click events
    * @method bindMenuClickEvents
    * @return {void}
    */
    function bindMenuClickEvents() {
        document.body.addEventListener('click', function(e) {
            if (e.target.classList.contains('js-changeMenu')) {
                e.preventDefault();
                let page = e.target.dataset.page;

                changePage(page);
            }
        });
    }

    /**
    * Bind login button click event
    * @method bindLoginClickEvent
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
    * Toggles item state
    * @method toggleActionState
    * @param  {String}  state                Current state
    * @param  {Number}  id                   Item id
    * @param  {String}  page                 Page name
    * @param  {Boolean} [isFavourited=false] If should be favourited
    * @return {void}
    */
    function toggleActionState(state, id, page, isFavourited = false) {
        let action;

        if (state == 'read') {
            switch (page) {
                case 'archive':
                action = 'readd';
                document.getElementById("status").innerHTML = "Unarchiving...";
                break;
                case 'list':
                action = 'archive';
                document.getElementById("status").innerHTML = "Archiving...";
                break;
            }
        } else if (state == 'favourite') {
            action = (isFavourited == "true" ? "unfavorite" : "favorite");
            document.getElementById("status").innerHTML = "Processing...";
        } else if (state == 'delete') {
            action = 'delete';
            document.getElementById("status").innerHTML = "Deleting...";
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

            switch (page) {
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
                        break;
                        case 'favourite':
                        a[i].favorite = (isFavourited == "true" ? 0 : 1);
                        break;
                    }
                }
            };

            switch (page) {
                case 'list':
                localStorage.setItem('listFromLocalStorage', JSON.stringify(a));
                localStorage.setItem('listCount', localStorage.getItem('listCount') - 1);
                document.getElementById('count').innerHTML = Sanitizer.escapeHTML`${localStorage.getItem('listCount')}`;

                render('list');

                if (state == 'read') {
                    showMessage('Archiving');
                } else if (state == 'favourite') {
                    showMessage('Processing');
                } else if (state == 'delete') {
                    showMessage('Deleting');
                }
                break;
                case 'archive':
                localStorage.setItem('archiveListFromLocalStorage', JSON.stringify(a));
                localStorage.setItem('archiveCount', localStorage.getItem('archiveCount') - 1);
                document.getElementById('count').innerHTML = Sanitizer.escapeHTML`${localStorage.getItem('archiveCount')}`;

                render('archive');

                if (state == 'read') {
                    showMessage('Unarchiving');
                } else if (state == 'favourite') {
                    showMessage('Processing');
                } else if (state == 'delete') {
                    showMessage('Deleting');
                }
                break;
            }
        })
        .catch(error => {
            console.log(error);
            showMessage('Action', false);
        });
    }

    /**
    * Change page between list and archive
    * @method changePage
    * @param  {String} page Page to change to
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

        switch (page) {
            case 'list':
            document.getElementById("page").value = "list";
            document.getElementById("title").innerHTML = "My Pocket List";
            document.getElementById("status").innerHTML = "Synchronizing...";

            getContent('list');

            document.getElementById('list').style.display = 'flex';
            document.getElementById('archive-list').style.display = 'none';
            break;
            case 'archive':
            document.getElementById("page").value = "archive";
            document.getElementById("title").innerHTML = "Archive";
            document.getElementById("status").innerHTML = "Synchronizing...";

            getContent('archive');

            document.getElementById('archive-list').style.display = 'flex';
            document.getElementById('list').style.display = 'none';
            break;
        }
    }

    /**
    * Shows success message
    * @method showMessage
    * @param  {String} message Message text first part
    * @param {Boolean} isSuccess If is success or fail
    * @return {void}
    */
    function showMessage(message, isSuccess = true) {
        if (isSuccess) {
            message += " successful!";
        } else {
            message += " failed!";
        }

        document.getElementById('status').innerText = message;

        setTimeout(() => {
            document.getElementById('status').innerText = "";
        }, 2000);
    }

    /**
    * Get access token from Pocket
    * @method getAccessToken
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
            showMessage('Authentication', false);
        });
    }


    /**
    * Open Pocket auth view from Chrome launchWebAuthFlow
    * @method launchChromeWebAuthFlow
    * @return {void}
    */

    function launchChromeWebAuthFlow() {
        chrome.identity.launchWebAuthFlow({'url': __url_auth + '?request_token=' + __request_token + '&redirect_uri=' + __redirect_url, 'interactive': true}, (redirectUrl) => {
            if (chrome.runtime.lastError) {
                console.log(new Error(chrome.runtime.lastError.message));
                document.getElementById('js-login').disabled = false;
                return;
            }

            document.getElementById('js-login').disabled = false;

            getAccessToken();
        });
    }

    /**
    * Get Request token from Pocket
    * @method getRequestToken
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
            showMessage('Getting token', false);
        });
    }

    /**
    * Show right elements when coming to new tab or logging in
    * @method showLoggedInContent
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
    * Show right content after loging in
    * @method loggedIn
    * @return {void}
    */
    function loggedIn() {
        document.getElementById('status').innerText = "Synchronizing...";

        showLoggedInContent();

        // get content from pocket api
        getContent('list');

        bindMenuClickEvents();
        bindActionClickEvents();
    }

    /**
    * Show content from localStorage and start sync with Pocket
    * @method startSync
    * @return {void}
    */
    function startSync() {
        document.getElementById('status').innerText = "Synchronizing...";

        render('list');

        showLoggedInContent();

        if (localStorage.getItem('username')) {
            document.getElementById('username').innerText = localStorage.getItem('username');
        }

        bindMenuClickEvents();
        bindActionClickEvents();

        getContent('list');
    }

    /**
    * Start login flow
    * @method startLogin
    * @return {void}
    */
    function startLogin() {
        getRequestToken();
    }

    /**
    * Clear localStorage and show and hide right elements
    * @method logout
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
