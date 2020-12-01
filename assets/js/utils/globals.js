export const API_URL = 'https://getpocket.com/';
export const API_VERSION = 'v3';

export const API = {
    redirect_url: chrome.identity.getRedirectURL() + 'oauth',
    url_request: API_URL + API_VERSION + '/oauth/request',
    url_authorize: API_URL + API_VERSION + '/oauth/authorize',
    url_auth: API_URL + 'auth/authorize',
    url_get: API_URL + API_VERSION + '/get',
    url_send: API_URL + API_VERSION + '/send',
    url_add: API_URL + API_VERSION + '/add',
};

export const LOAD_COUNT = 18;

export const PAGES = {
    LIST: 'list',
    ARCHIVE: 'archive',
};

export const THEMES = {
    LIGHT: 'theme-light',
    DARK: 'theme-dark',
    SEPIA: 'theme-sepia',
    SYSTEM_PREFERENCE: 'theme-system-preference',
};

export const UPDATE_INTERVALS = ['0', '1800', '3600', '18000', '86400'];

export const ORDER = {
    DESCENDING: 'desc',
    ASCENDING: 'asc',
    RANDOM: 'random',
};

export const VIEW_TYPES = {
    GRID: 'grid',
    LIST: 'list',
};
