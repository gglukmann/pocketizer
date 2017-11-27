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
     * @param  {String}  state List type to get.
     * @return {Promise}       Response from api.
     */
    async get(state) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            state: state,
            detailType: 'complete'
        });

        let data = await helper.makeFetch(API.url_get, this._fetchData)
            .then(response => {
                return response;
            })
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
     * @param  {Array}  actions Array of current action data.
     * @return {Promise}         Response from pocket api.
     */
    async send(actions) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            actions: actions
        });

        let action = await helper.makeFetch(API.url_send, this._fetchData)
            .then(response => {
                return response;
            })
            .catch(error => {
                console.log(error);
                helper.showMessage(chrome.i18n.getMessage('ACTION'), false);
            });

        return action;
    }
}

const apiService = new ApiService();
