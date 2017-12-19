'use strict';

class ApiService {
    /**
     * @constructor
     */
    constructor() {
        this._fetchData = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF8'
            }
        }
    }

    /**
     * Get data from pocket api.
     *
     * @function get
     * @param {String} state - List type to get.
     * @return {Promise} - Response from pocket api.
     */
    async get() {
        this._fetchData.body = {
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            detailType: 'complete'
        };

        let state;

        switch (pocket.getActivePage()) {
            case 'list':
                if (localStorage.getItem('listSince')) {
                    this._fetchData.body.since = localStorage.getItem('listSince');
                } else {
                    state = 'unread';
                }
            break;
            case 'archive':
                if (pocket.isArchiveLoaded()) {
                    this._fetchData.body.since = localStorage.getItem('archiveSince');
                } else {
                    state = 'archive';
                }
            break;
        }

        this._fetchData.body.state = this._fetchData.body.since ? 'all' : state;

        if (pocket.fullSync) {
            this._fetchData.body.since = null;

            switch (pocket.getActivePage()) {
                case 'list':
                    this._fetchData.body.state = 'unread';
                    break;
                case 'archive':
                    this._fetchData.body.state = 'archive';
                    break;
            }
        }

        this._fetchData.body = JSON.stringify(this._fetchData.body);

        let data = await helper.makeFetch(API.url_get, this._fetchData)
            .then(response => response.json())
            .catch(error => {
                console.log(error);
                helper.showMessage(chrome.i18n.getMessage('ERROR_GETTING_CONTENT'), false);
            });

        return data;
    }

    /**
     * Make actions
     *
     * @function send
     * @param {Array} actions - Array of current action data.
     * @return {Promise} - Response from pocket api.
     */
    async send(actions) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            actions: actions
        });

        let action = await helper.makeFetch(API.url_send, this._fetchData)
            .then(response => response.json())
            .catch(error => {
                console.log(error);
                helper.showMessage(chrome.i18n.getMessage('ACTION'), false);
            });

        return action;
    }

    /**
     * Add new item to Pocket.
     *
     * @function add
     * @param {Object} data - New item object.
     * @return {Promise} - Response from pocket api.
     */
    async add(data) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            url: data.url
        });

        let add = await helper.makeFetch(API.url_add, this._fetchData)
            .then(response => response.json())
            .catch(error => {
                console.log(error);
                helper.showMessage(chrome.i18n.getMessage('ERROR_ADDING'), false);
            });

        return add;
    }

    /**
     * Get trending stories.
     *
     * @function getTrending
     * @return {Promise} - Response from pocket api.
     */
    async getTrending(count) {
        this._fetchData.body = JSON.stringify({
            consumer_key: __consumer_key,
            count: count,
            lang: chrome.i18n.getUILanguage(),
            version: 2
        });

        let getTrending = await helper.makeFetch(API.url_getTrending, this._fetchData)
            .then(response => response.json())
            .catch(error => {
                console.log(error);
                helper.showMessage(chrome.i18n.getMessage('ERROR_GETTING_TRENDING'), false);
            });

        return getTrending;
    }

    /**
     * Get recommended stories.
     *
     * @function getRecommendations
     * @param {String} resolved_id - Id to get recommended items to.
     * @return {Promise} - Response from pocket api.
     */
    async getRecommendations(resolved_id) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            count: 40,
            locale_lang: chrome.i18n.getUILanguage(),
            version: 4,
            resolved_id: resolved_id
        });

        let getRecommendations = await helper.makeFetch(API.url_getRecommendations, this._fetchData)
            .then(response => response.json())
            .catch(error => {
                console.log(error);
                helper.showMessage(chrome.i18n.getMessage('ERROR_GETTING_RECOMMENDED'), false);
            });

        return getRecommendations;
    }
}

const apiService = new ApiService();
