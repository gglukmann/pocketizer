import * as helpers from './helpers.js';

/**
 * Toggle all props for offline theme.
 *
 * @function toggleOfflineTheme
 * @return {void}
 */
function toggleOfflineTheme() {
    const isOnline = helpers.checkInternetConnection();

    if (isOnline) {
        helpers.removeClass(document.body, 'theme-offline');
        helpers.hide(document.querySelector('#js-offlineStatus'));
        document.querySelector('#js-login').disabled = false;
    } else {
        helpers.addClass(document.body, 'theme-offline');
        helpers.show(document.querySelector('#js-offlineStatus'), true);
        document.querySelector('#js-login').disabled = true;
    }
}

/**
 * Check internet connection and handle everything when offline.
 *
 * @function handleInternetConnection
 * @return {void}
 */
export function handleInternetConnection() {
    toggleOfflineTheme();

    window.addEventListener('offline', this.toggleOfflineTheme, false);
    window.addEventListener('online', this.toggleOfflineTheme, false);

    document.querySelector('#js-offlineRefresh').addEventListener('click', (event) => {
        helpers.addClass(event.target, 'is-syncing');
        window.location.reload();
    });
}
