import * as helpers from '../utils/helpers.js';
import * as globals from '../utils/globals.js';
import { selector, search, item } from './index.js';
import pocket from '../App.js';

class Settings {
    /**
     * @constructor
     */
    constructor() {
        this.selectorChange = this.handleSelectorChange.bind(this);
        this.focusAddInput = this.handleFocusAddInput.bind(this);
        this.resetAddInput = this.handleResetAddInput.bind(this);
        this.submitNewItem = this.handleSubmitNewItem.bind(this);
    }

    /**
     * Initialize settings.
     *
     * @function init
     * @return {void}
     */
    init() {
        this.bindEvents();
        this.loadOrder();
        this.loadUpdateInterval();
        this.loadArchiveAfterOpen();
        this.loadAskDeleteConfirmation();
    }

    /**
     * Bind all events.
     *
     * @function bindEvents
     * @return {void}
     */
    bindEvents() {
        document.addEventListener('select.selector', this.selectorChange, false);
        document.addEventListener('opened.modal', this.focusAddInput, false);
        document.addEventListener('closed.modal', this.resetAddInput, false);
        document.newItemForm.addEventListener('submit', this.submitNewItem, false);
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        document.removeEventListener('select.selector', this.selectorChange, false);
        document.removeEventListener('opened.modal', this.focusAddInput, false);
        document.removeEventListener('closed.modal', this.resetAddInput, false);
        document.newItemForm.removeEventListener('submit', this.submitNewItem, false);
    }

    /**
     * Set default page to load on extension load.
     *
     * @function setDefaultPage
     * @param {String} page - Page to set.
     * @return {void}
     */
    setDefaultPage(page = globals.PAGES.LIST) {
        helpers.setToStorage('defaultPage', page);
    }

    /**
     * Get default page to load on extension load.
     *
     * @function getDefaultPage
     * @return {String | null}
     */
    getDefaultPage() {
        return helpers.getFromStorage('defaultPage') || globals.PAGES.LIST;
    }

    /**
     * Set default theme if none is provided.
     *
     * @function setTheme
     * @param {String} theme - Theme to set.
     * @return {void}
     */
    setTheme(theme = globals.THEMES.SYSTEM_PREFERENCE) {
        helpers.setToStorage('theme', theme);
    }

    /**
     * Get theme to load on extension load.
     *
     * @function getTheme
     * @return {String | null}
     */
    getTheme() {
        return helpers.getFromStorage('theme');
    }

    /**
     * Set items order.
     *
     * @function setOrder
     * @param {String} order - Order to set.
     * @return {void}
     */
    setOrder(order = globals.ORDER.DESCENDING) {
        helpers.setToStorage('order', order);
    }

    /**
     * Get items order to load on extension load.
     *
     * @function getOrder
     * @return {String | null}
     */
    getOrder() {
        return helpers.getFromStorage('order');
    }

    /**
     * Set update interval.
     *
     * @function setUpdateInterval
     * @param {String} interval - Interval to set.
     * @return {void}
     */
    setUpdateInterval(interval = globals.UPDATE_INTERVALS[0]) {
        return helpers.setToStorage('updateInterval', interval);
    }

    /**
     * Get update interval to load on extension load.
     *
     * @function getUpdateInterval
     * @return {String | null}
     */
    getUpdateInterval() {
        return helpers.getFromStorage('updateInterval') || globals.UPDATE_INTERVALS[0];
    }

    /**
     * Set the value of "archive after open"
     *
     * @function setArchiveAfterOpen
     * @param {String} val - ['enabled', 'disabled']
     * @return {void}
     */
    setArchiveAfterOpen(val) {
        helpers.setToStorage('archiveAfterOpen', val);
    }

    /**
     * Get "archive after open" to load on extension load.
     *
     * @function getArchiveAfterOpen
     * @return {String | null}
     */
    getArchiveAfterOpen() {
        return helpers.getFromStorage('archiveAfterOpen');
    }

    /**
     * Set the value of view type
     *
     * @function setViewType
     * @param {String} type - View type
     * @return {void}
     */
    setViewType(type = globals.VIEW_TYPES.GRID) {
        helpers.setToStorage('viewType', type);
    }

    /**
     * Get "view type" to load on extension load.
     *
     * @function getViewType
     * @return {String | null}
     */
    getViewType() {
        return helpers.getFromStorage('viewType');
    }

    /**
     * Set ask delete confirmation.
     *
     * @function setAskDeleteConfirmation
     * @param {Boolean} val - ['enabled', 'disabled'].
     * @return {void}
     */
    setAskDeleteConfirmation(ask) {
        return helpers.setToStorage('askDeleteConfirmation', ask);
    }

    /**
     * Get whether ask delete confirmation.
     *
     * @function getAskDeleteConfirmation
     * @return {Boolean | null}
     */
    getAskDeleteConfirmation() {
        return helpers.getFromStorage('askDeleteConfirmation') || 'enabled';
    }

    /**
     * Load and set theme color on pocket load.
     *
     * @function loadTheme
     * @return {void}
     */
    loadTheme() {
        let theme = this.getTheme();

        if (!theme && !Object.values(globals.THEMES).includes(theme)) {
            this.setTheme();
            theme = this.getTheme();
        }

        if (Object.values(globals.THEMES).includes(theme)) {
            if (theme === globals.THEMES.SYSTEM_PREFERENCE) {
                const mql = window.matchMedia('(prefers-color-scheme: dark)');
                const hasMediaQueryPreference = typeof mql.matches === 'boolean';

                if (hasMediaQueryPreference) {
                    if (mql.matches) {
                        helpers.addClass(document.body, theme);
                        helpers.addClass(document.body, 'theme-system-preference-dark');
                    } else {
                        helpers.addClass(document.body, theme);
                        helpers.removeClass(document.body, 'theme-system-preference-dark');
                    }
                }
            } else {
                helpers.addClass(document.body, theme);
            }

            const colorSelector = [...document.querySelectorAll('[name=selector-theme]')];
            for (const selector of colorSelector) {
                if (selector.value === theme) {
                    selector.checked = true;
                }
            }
        }
    }

    /**
     * Set default page on pocket load.
     *
     * @function loadDefaultPage
     * @return {void}
     */
    loadDefaultPage() {
        let defaultPage = this.getDefaultPage();

        if (defaultPage !== globals.PAGES.LIST && !Object.values(globals.PAGES).includes(defaultPage)) {
            defaultPage = globals.PAGES.LIST;
            this.setDefaultPage(defaultPage);
        }

        pocket.changePage(defaultPage, true);

        if (defaultPage) {
            const pageSelector = [...document.querySelectorAll('[name=selector-page]')];
            for (const selector of pageSelector) {
                if (selector.value === defaultPage) {
                    selector.checked = true;
                }
            }
        }
    }

    /**
     * Set order button direction and init selector in settings.
     * This function does not handle real ordering of items, this is done in App.js
     *
     * @function loadOrder
     * @return {void}
     */
    loadOrder() {
        const order = this.getOrder();

        if (order) {
            this.rotateOrderButton(order);

            const orderSelector = [...document.querySelectorAll('[name=selector-order]')];
            for (const selector of orderSelector) {
                if (selector.value === order) {
                    selector.checked = true;
                }
            }
        }
    }

    /**
     * Add class and change text in order by button.
     *
     * @function rotateOrderButton
     * @param {String} order - Order.
     * @param {Event} event - Event from button click.
     * @return {void}
     */
    rotateOrderButton(order, event) {
        const orderButton = document.querySelector('#js-orderButton');
        const target = event?.target ?? orderButton;

        switch (order) {
            case globals.ORDER.ASCENDING:
            default:
                helpers.removeClass(target, 'is-rotated');
                orderButton.setAttribute('title', chrome.i18n.getMessage('SHOW_ITEMS_OLDEST_FIRST'));
                break;
            case globals.ORDER.DESCENDING:
                helpers.addClass(target, 'is-rotated');
                orderButton.setAttribute('title', chrome.i18n.getMessage('SHOW_ITEMS_NEWEST_FIRST'));
                break;
        }
    }

    /**
     * Set update interval and change to right selector.
     *
     * @function loadUpdateInterval
     * @return {void}
     */
    loadUpdateInterval() {
        const updateInterval = this.getUpdateInterval();

        if (updateInterval) {
            const updateIntervalSelector = [...document.querySelectorAll('[name=selector-update-interval]')];
            for (const selector of updateIntervalSelector) {
                if (selector.value === updateInterval) {
                    selector.checked = true;
                }
            }
        }
    }

    /**
     * Load the "archive after open" option
     *
     * @function loadArchiveAfterOpen
     * @return {void}
     */
    loadArchiveAfterOpen() {
        const archiveAfterOpen = this.getArchiveAfterOpen();

        if (archiveAfterOpen) {
            const archiveAfterOpenSelector = [...document.querySelectorAll('[name=selector-archive-after-open]')];
            for (const selector of archiveAfterOpenSelector) {
                if (selector.value === archiveAfterOpen) {
                    selector.checked = true;
                }
            }
        }
    }

    /**
     * Load the "view type" option
     *
     * @function loadViewType
     */
    loadViewType() {
        const viewType = this.getViewType();

        if (viewType) {
            if (viewType === globals.VIEW_TYPES.LIST) {
                helpers.addClass(document.querySelector('main'), 'container--narrow');
            }

            this.showRightViewTypeButton(viewType);

            const viewTypeSelector = [...document.querySelectorAll('[name=selector-view-type]')];
            for (const selector of viewTypeSelector) {
                if (selector.value === viewType) {
                    selector.checked = true;
                }
            }
        }
    }

    /**
     * Add class and change text in view type by button.
     *
     * @function showRightViewTypeButton
     * @param {String} viewType - View type.
     * @param {Event} event - Event from button click.
     * @return {void}
     */
    showRightViewTypeButton(viewType, event) {
        const viewTypeButton = document.querySelector('#js-viewTypeButton');
        const target = event && event.target ? event.target : viewTypeButton;

        if (viewType === globals.VIEW_TYPES.LIST) {
            helpers.addClass(target, 'is-view-type-list');
            viewTypeButton.setAttribute('title', chrome.i18n.getMessage('DISPLAY_IN_GRID'));
        } else {
            helpers.removeClass(target, 'is-view-type-list');
            viewTypeButton.setAttribute('title', chrome.i18n.getMessage('DISPLAY_IN_LIST'));
        }
    }

    /**
     * Load the "ask delete confirmation" option
     *
     * @function loadAskDeleteConfirmation
     * @return {void}
     */
    loadAskDeleteConfirmation() {
        const askDeleteConfirmation = this.getAskDeleteConfirmation();

        if (askDeleteConfirmation) {
            const askDeleteConfirmationSelector = [
                ...document.querySelectorAll('[name=selector-ask-delete-confirmation]'),
            ];
            for (const selector of askDeleteConfirmationSelector) {
                if (selector.value === askDeleteConfirmation) {
                    selector.checked = true;
                }
            }
        }
    }

    /**
     * Handle selector change in settings.
     *
     * @function handleSelectorChange
     * @param {Event} event - Selector change event.
     * @return {void}
     */
    handleSelectorChange(event) {
        switch (event.detail.name) {
            case 'selector-theme':
                const value = event.detail.value.toString();

                if (Object.values(globals.THEMES).includes(value)) {
                    if (value === globals.THEMES.SYSTEM_PREFERENCE) {
                        const mql = window.matchMedia('(prefers-color-scheme: dark)');
                        const hasMediaQueryPreference = typeof mql.matches === 'boolean';

                        if (hasMediaQueryPreference) {
                            if (mql.matches) {
                                helpers.removeClass(document.body, this.getTheme());
                                helpers.addClass(document.body, value);
                                helpers.addClass(document.body, 'theme-system-preference-dark');
                                this.setTheme(value);

                                selector.showMessage(event, true, `${chrome.i18n.getMessage('SAVED')}!`);
                            } else {
                                helpers.removeClass(document.body, this.getTheme());
                                helpers.removeClass(document.body, 'theme-system-preference-dark');
                                this.setTheme(value);

                                selector.showMessage(event, true, `${chrome.i18n.getMessage('SAVED')}!`);
                            }
                        }
                    } else {
                        helpers.removeClass(document.body, this.getTheme());
                        helpers.removeClass(document.body, 'theme-system-preference-dark');
                        helpers.addClass(document.body, value);
                        this.setTheme(value);

                        selector.showMessage(event, true, `${chrome.i18n.getMessage('SAVED')}!`);
                    }
                }
                break;
            case 'selector-page':
                const page = event.detail.value.toString();

                if (Object.values(globals.PAGES).includes(page)) {
                    this.setDefaultPage(page);

                    selector.showMessage(event, true, `${chrome.i18n.getMessage('SAVED')}!`);
                }
                break;
            case 'selector-order':
                const order = event.detail.value.toString();

                if (Object.values(globals.ORDER).includes(order)) {
                    this.setOrder(order);
                    selector.showMessage(event, true, `${chrome.i18n.getMessage('SAVED')}!`);
                }
                break;
            case 'selector-update-interval':
                const interval = event.detail.value.toString();

                if (globals.UPDATE_INTERVALS.includes(interval)) {
                    this.setUpdateInterval(interval);
                    selector.showMessage(event, true, `${chrome.i18n.getMessage('SAVED')}!`);
                }
                break;
            case 'selector-archive-after-open':
                const archiveAfterOpen = event.detail.value.toString();

                this.setArchiveAfterOpen(archiveAfterOpen);
                selector.showMessage(event, true, `${chrome.i18n.getMessage('SAVED')}!`);
                break;
            case 'selector-view-type':
                const viewType = event.detail.value.toString();

                if (Object.values(globals.VIEW_TYPES).includes(viewType)) {
                    this.setViewType(viewType);
                    selector.showMessage(event, true, `${chrome.i18n.getMessage('SAVED')}!`);
                }
                break;
            case 'selector-ask-delete-confirmation':
                const askDeleteConfirmation = event.detail.value.toString();

                this.setAskDeleteConfirmation(askDeleteConfirmation);
                selector.showMessage(event, true, `${chrome.i18n.getMessage('SAVED')}!`);
                break;
            default:
        }
    }

    /**
     * Focus new item input when opening modal.
     *
     * @function handleFocusAddInput
     * @return {void}
     */
    handleFocusAddInput() {
        document.querySelector('#js-newItemInput').focus();
    }

    /**
     * Reset new item input value when closing modal.
     *
     * @function handleResetAddInput
     * @return {void}
     */
    handleResetAddInput() {
        document.querySelector('#js-newItemInput').value = '';
    }

    /**
     * Handle submitting new item adding form.
     *
     * @function handleSubmitNewItem
     * @param {Event} event - Submit event.
     * @return {void}
     */
    handleSubmitNewItem(event) {
        const form = event.target;

        if (form.checkValidity()) {
            event.preventDefault();
            helpers.showMessage(`${chrome.i18n.getMessage('CREATING_ITEM')}...`, true, false, false);

            if (pocket.getActivePage() === globals.PAGES.LIST) {
                search.reset(true);
            }

            const rawData = new FormData(form);
            let data = {};

            for (const link of rawData.entries()) {
                data[link[0]] = link[1];
            }

            item.add(data);
        }
    }

    /**
     * If update interval difference is bigger than selected.
     *
     * @function isTimeToUpdate
     * @return {Boolean} - If is time to update.
     */
    isTimeToUpdate() {
        const timeDifference = helpers.calcTimeDifference(
            helpers.getCurrentUNIX(),
            helpers.getFromStorage(`${this.getDefaultPage()}Since`) || 0
        );

        return timeDifference >= this.getUpdateInterval();
    }

    /**
     * Destroy settings.
     *
     * @function destroy
     * @return {void}
     */
    destroy() {
        this.removeEvents();
    }
}

const settings = new Settings();
export default settings;
