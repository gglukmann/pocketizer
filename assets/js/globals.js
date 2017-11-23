const API_URL = 'https://getpocket.com/';
const API_VERSION = 'v3';

const API = {
    redirect_url: chrome.identity.getRedirectURL() + 'oauth',
    url_request: API_URL + API_VERSION + '/oauth/request',
    url_authorize: API_URL + API_VERSION + '/oauth/authorize',
    url_auth: API_URL + 'auth/authorize',
    url_get: API_URL + API_VERSION + '/get',
    url_send: API_URL + API_VERSION + '/send'
}
