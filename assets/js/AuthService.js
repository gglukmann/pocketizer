'use strict';

class AuthService {
    constructor() {
        this._fetchData = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF8',
                'X-Accept': 'application/json'
            }
        }
    }

    async authenticate() {
        try {
            let code = await this.getRequestToken();
            let auth = await this.launchChromeWebAuthFlow(code);
            let user = await this.getAccessToken(code);

            return {
                "status": "authenticated",
                "user": user
            };
        } catch(e) {
            throw new Error(e);
        }
    }

    /**
     * Get Request token from Pocket.
     *
     * @function getRequestToken
     * @return {void}
     */
    getRequestToken() {
        document.querySelector('#js-status').innerText = chrome.i18n.getMessage('AUTHENTICATING') + "...";

        this._fetchData.body = JSON.stringify({
            consumer_key: __consumer_key,
            redirect_uri: API.redirect_url
        });

        const that = this;

        return new Promise((resolve, reject) => {
            let code = makeFetch(API.url_request, that._fetchData)
                .then(response => {
                    return response.code;
                })
                .catch(error => {
                    console.log(error);
                    showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
                });

            resolve(code);
        });
    }

    /**
     * Open Pocket auth view from Chrome launchWebAuthFlow.
     *
     * @function launchChromeWebAuthFlow
     * @return {void}
     */
    launchChromeWebAuthFlow(requestToken) {
        let options = {
            'url': `${API.url_auth}?request_token=${requestToken}&redirect_uri=${API.redirect_url}`,
            'interactive': true
        }

        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(options, redirectUrl => {
                document.querySelector('#js-login').disabled = false;

                if (chrome.runtime.lastError) {
                    console.log(new Error(chrome.runtime.lastError.message));
                    showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
                    return false;
                }

                resolve(requestToken);
            });
        });
    }

    /**
     * Get access token from Pocket.
     *
     * @function getAccessToken
     * @return {void}
     */
    getAccessToken(requestToken) {
        this._fetchData.body = JSON.stringify({
            consumer_key: __consumer_key,
            code: requestToken
        });

        const that = this;

        return new Promise((resolve, reject) => {
            let user = makeFetch(API.url_authorize, that._fetchData)
                .then(response => {
                    that.setToken(response.access_token);

                    localStorage.setItem('username', response.username);

                    return response.username;
                })
                .catch(error => {
                    console.log(error);
                    showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
                });

            resolve(user);
        });
    }

    getToken() {
        if (!localStorage.getItem('token')) {
            return false;
        }

        return localStorage.getItem('token');
    }

    setToken(token) {
        localStorage.setItem('token', token);
    }

    isLoggedIn() {
        if (!this.getToken()) {
            return false;
        }

        return true;
    }
}

const AuthService = new AuthService();
