'use strict';

class AuthService {
    /**
     * @constructor
     */
    constructor() {
        this._fetchData = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF8',
                'X-Accept': 'application/json'
            }
        }
    }

    /**
     * Start authentication.
     *
     * @function authenticate
     * @return {Promise} Authenticated user.
     */
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
        showMessage(`${chrome.i18n.getMessage('AUTHENTICATING')}...`, true, false, false);

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
                    showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
                    reject(error);
                });

            resolve(code);
        });
    }

    /**
     * Open Pocket auth view from Chrome launchWebAuthFlow.
     *
     * @function launchChromeWebAuthFlow
     * @param {String} requestToken Request token from Pocket.
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
                    showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
                    reject(chrome.runtime.lastError.message);
                }

                resolve(requestToken);
            });
        });
    }

    /**
     * Get access token from Pocket.
     *
     * @function getAccessToken
     * @param {String} requestToken Request token from Pocket.
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
                    showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
                    reject(error);
                });

            resolve(user);
        });
    }

    /**
     * Get token from localStorage.
     *
     * @function getToken
     * @return {String} Token.
     */
    getToken() {
        if (!localStorage.getItem('token')) {
            return false;
        }

        return localStorage.getItem('token');
    }

    /**
     * Set token to localStorage.
     *
     * @function setToken
     * @param {String} token Token.
     */
    setToken(token) {
        localStorage.setItem('token', token);
    }

    /**
     * Check if user is logged in.
     *
     * @function isLoggedIn
     * @return {Boolean} If user is logged in.
     */
    isLoggedIn() {
        if (!this.getToken()) {
            return false;
        }

        return true;
    }
}

const authService = new AuthService();
