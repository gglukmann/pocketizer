import __consumer_key from '../../../env.js';
import * as helpers from '../utils/helpers.js';
import * as globals from '../utils/globals.js';

class AuthService {
    /**
     * @constructor
     */
    constructor() {
        this._fetchData = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF8',
                'X-Accept': 'application/json',
            },
        };
    }

    /**
     * Start authentication.
     *
     * @function authenticate
     * @return {Promise} Authenticated user.
     */
    async authenticate() {
        try {
            const { code } = await this.getRequestToken();
            await this.launchChromeWebAuthFlow(code);
            const { access_token, username } = await this.getAccessToken(code);

            this.setToken(access_token);
            helpers.setToStorage('username', username);

            return {
                status: 'authenticated',
                user: username,
            };
        } catch (e) {
            helpers.showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);
            document.querySelector('#js-login').disabled = false;
            throw new Error(e);
        }
    }

    /**
     * Get Request token from Pocket.
     *
     * @function getRequestToken
     * @return {Promise}
     */
    getRequestToken() {
        helpers.showMessage(`${chrome.i18n.getMessage('AUTHENTICATING')}...`, true, false, false);

        this._fetchData.body = JSON.stringify({
            consumer_key: __consumer_key,
            redirect_uri: globals.API.redirect_url,
        });

        return helpers.makeFetch(globals.API.url_request, this._fetchData);
    }

    /**
     * Open Pocket auth view from Chrome launchWebAuthFlow.
     *
     * @function launchChromeWebAuthFlow
     * @param {String} requestToken - Request token from Pocket.
     * @return {Promise}
     */
    async launchChromeWebAuthFlow(requestToken) {
        const options = {
            url: `${globals.API.url_auth}?request_token=${requestToken}&redirect_uri=${globals.API.redirect_url}`,
            interactive: true,
        };

        try {
            await chrome.identity.launchWebAuthFlow(options);

            return requestToken;
        } catch (error) {
            helpers.showMessage(chrome.i18n.getMessage('AUTHENTICATION'), false);

            return chrome.runtime.lastError.message;
        }
    }

    /**
     * Get access token from Pocket.
     *
     * @function getAccessToken
     * @param {String} requestToken - Request token from Pocket.
     * @return {Promise}
     */
    getAccessToken(requestToken) {
        this._fetchData.body = JSON.stringify({
            consumer_key: __consumer_key,
            code: requestToken,
        });

        return helpers.makeFetch(globals.API.url_authorize, this._fetchData);
    }

    /**
     * Get token from localStorage.
     *
     * @function getToken
     * @return {String} Token.
     */
    getToken() {
        return helpers.getFromStorage('token') || false;
    }

    /**
     * Set token to localStorage.
     *
     * @function setToken
     * @param {String} token - Token.
     * @return {void}
     */
    setToken(token) {
        helpers.setToStorage('token', token);
    }

    /**
     * Check if user is logged in.
     *
     * @function isLoggedIn
     * @return {Boolean} If user is logged in.
     */
    isLoggedIn() {
        return !!this.getToken();
    }
}

const authService = new AuthService();
export default authService;
