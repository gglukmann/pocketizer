'use strict';

class ApiService {
    constructor() {
        this._fetchData = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF8'
            }
        }
    }

    async get(state) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            state: state,
            detailType: 'complete'
        });

        let data = await makeFetch(API.url_get, this._fetchData)
            .then(response => {
                return response;
            })
            .catch(error => {
                console.log(error);
                showMessage(chrome.i18n.getMessage('ERROR_GETTING_CONTENT'), false);
            });

        return data;
    }

    async send(actions) {
        this._fetchData.body = JSON.stringify({
            access_token: authService.getToken(),
            consumer_key: __consumer_key,
            actions: actions
        });

        let action = await makeFetch(API.url_send, this._fetchData)
            .then(response => {
                return response;
            })
            .catch(error => {
                console.log(error);
                showMessage(chrome.i18n.getMessage('ACTION'), false);
            });

        return action;
    }
}

const apiService = new ApiService();
