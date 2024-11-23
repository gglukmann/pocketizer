import __consumer_key from '../../../env.js';
import { authService } from './index.js';
import pocket from '../App.js';
import * as helpers from '../utils/helpers.js';
import * as globals from '../utils/globals.js';

class ApiService {
    /**
     * @constructor
     */
    constructor() {
        this._fetchData = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF8',
            },
        };
    }

    /**
     * Paginate data.
     *
     * @function paginate
     * @param {Object} offset - Offset object.
     * @return {Promise} - Response from pocket api.
     */
    paginate({ offset = 0 }) {
        const body = {
            count: globals.LOAD_COUNT,
            total: '1',
            sort: 'newest',
            offset,
        };
        switch (pocket.getActivePage()) {
            case globals.PAGES.LIST:
                body.state = 'unread';
                break;
            case globals.PAGES.ARCHIVE:
                body.state = 'archive';
                break;
        }
        return this.get(body);
    }

    /**
     * Sync data.
     *
     * @function sync
     * @return {Promise} - Response from pocket api.
     */
    sync() {
        const body = {};

        if (pocket.fullSync) {
            body.since = null;

            switch (pocket.getActivePage()) {
                case globals.PAGES.LIST:
                    body.state = 'unread';
                    break;
                case globals.PAGES.ARCHIVE:
                    body.state = 'archive';
                    break;
            }

            return this.get(body);
        }

        let state;

        switch (pocket.getActivePage()) {
            case globals.PAGES.LIST:
                const listSince = helpers.getFromStorage('listSince');

                if (listSince) {
                    body.since = listSince;
                } else {
                    state = 'unread';
                }
                break;
            case globals.PAGES.ARCHIVE:
                if (pocket.isArchiveLoaded()) {
                    body.since = helpers.getFromStorage('archiveSince');
                } else {
                    state = 'archive';
                }
                break;
        }

        body.state = body.since ? 'all' : state;

        return this.get(body);
    }

    /**
     * Get data from pocket api.
     *
     * @function get
     * @param {Object} body - body object for fetch
     * @return {Promise} - Response from pocket api.
     */
    get(body) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            detailType: 'complete',
            ...body,
        });

        try {
            return helpers.makeFetch(globals.API.url_get, this._fetchData);
        } catch (error) {
            console.error(error);
            helpers.showMessage(chrome.i18n.getMessage('ERROR_GETTING_CONTENT'), false);

            if (error.response.status === 401) {
                pocket.logout();
            }
        }
    }

    /**
     * Make actions.
     *
     * @function send
     * @param {Array} actions - Array of current action data.
     * @return {Promise} - Response from pocket api.
     */
    send(actions) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            actions: actions,
        });

        try {
            return helpers.makeFetch(globals.API.url_send, this._fetchData);
        } catch (error) {
            console.error(error);
            helpers.showMessage(chrome.i18n.getMessage('ACTION'), false);

            if (error.response.status === 401) {
                pocket.logout();
            }
        }
    }

    /**
     * Add new item to Pocket.
     *
     * @function add
     * @param {Object} data - New item object.
     * @return {Promise} - Response from pocket api.
     */
    add(data) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            url: data.url,
        });

        try {
            return helpers.makeFetch(globals.API.url_add, this._fetchData);
        } catch (error) {
            console.error(error);
            helpers.showMessage(chrome.i18n.getMessage('ERROR_ADDING'), false);

            if (error.response.status === 401) {
                pocket.logout();
            }
        }
    }
}

const apiService = new ApiService();
export default apiService;
