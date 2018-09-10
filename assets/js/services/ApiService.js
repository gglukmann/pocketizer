import __consumer_key from '../../../env.js';
import { authService } from './index.js';
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
     * Get data from pocket api.
     *
     * @function get
     * @return {Promise} - Response from pocket api.
     */
    async get() {
        this._fetchData.body = {
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            detailType: 'complete',
        };

        let state;

        switch (pocket.getActivePage()) {
            case 'list':
                if (helpers.getFromStorage('listSince')) {
                    this._fetchData.body.since = helpers.getFromStorage('listSince');
                } else {
                    state = 'unread';
                }
                break;
            case 'archive':
                if (pocket.isArchiveLoaded()) {
                    this._fetchData.body.since = helpers.getFromStorage('archiveSince');
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

        return await helpers.makeFetch(globals.API.url_get, this._fetchData)
            .catch(error => {
                console.log(error);
                helpers.showMessage(chrome.i18n.getMessage('ERROR_GETTING_CONTENT'), false);
            });
    }

    /**
     * Make actions.
     *
     * @function send
     * @param {Array} actions - Array of current action data.
     * @return {Promise} - Response from pocket api.
     */
    async send(actions) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            actions: actions,
        });

        return await helpers.makeFetch(globals.API.url_send, this._fetchData)
            .catch(error => {
                console.log(error);
                helpers.showMessage(chrome.i18n.getMessage('ACTION'), false);
            });
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
            url: data.url,
        });

        return await helpers.makeFetch(globals.API.url_add, this._fetchData)
            .catch(error => {
                console.log(error);
                helpers.showMessage(chrome.i18n.getMessage('ERROR_ADDING'), false);
            });
    }
}

const apiService = new ApiService();
export default apiService;
