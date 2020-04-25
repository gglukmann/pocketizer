import * as helpers from '../utils/helpers.js';
import pocket from '../App.js';
import { search } from './index.js';

class Header {
    /**
     * constructor
     */
    constructor() {
        this.options = {
            scrolledClass: 'is-scrolled',
        };

        this.timeout = false;
        this.scrollHeader = this.handleScrollHeader.bind(this);
        this.menuClicks = this.handleMenuClicks.bind(this);
        this.searchButtonClick = this.handleSearchClick.bind(this);
        this.fullSyncButtonClick = this.handleFullSyncClick.bind(this);
    }

    /**
     * Initialize header.
     *
     * @function init
     * @return {void}
     */
    init() {
        this.bindEvents();
    }

    /**
     * Bind all events.
     *
     * @function bindEvents
     * @return {void}
     */
    bindEvents() {
        window.addEventListener('scroll', this.scrollHeader, false);
        document.body.addEventListener('click', this.menuClicks, false);
        document.querySelector('#js-searchButton').addEventListener('click', this.searchButtonClick, false);
        document.querySelector('#js-fullSync').addEventListener('click', this.fullSyncButtonClick, false);
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        window.removeEventListener('scroll', this.scrollHeader, false);
        document.body.removeEventListener('click', this.menuClicks, false);
        document.querySelector('#js-searchButton').removeEventListener('click', this.searchButtonClick, false);
        document.querySelector('#js-fullSync').removeEventListener('click', this.fullSyncButtonClick, false);
    }

    /**
     * Handle window scroll event.
     *
     * @function handleScrollHeader
     * @return {void}
     */
    handleScrollHeader() {
        if (!this.timeout) {
            window.requestAnimationFrame(this.toggleScrolledClass.bind(this));

            this.timeout = true;
        }
    }

    /**
     * Toggle scrolled class.
     *
     * @function toggleScrolledClass
     * @return {void}
     */
    toggleScrolledClass() {
        const scrollPosition = window.scrollY;
        const header = document.querySelector('#js-header');

        if (scrollPosition > 10) {
            helpers.addClass(header, this.options.scrolledClass);
        } else {
            helpers.removeClass(header, this.options.scrolledClass);
        }

        this.timeout = false;
    }

    /**
     * Show right menu item active state.
     *
     * @function changeMenuActiveState
     * @return {void}
     */
    changeMenuActiveState(page) {
        let menuLinkElements = document.querySelectorAll('.menu__link');

        for (const menuLink of menuLinkElements) {
            helpers.removeClass(menuLink, 'is-active');

            if (menuLink.dataset.page === page) {
                helpers.addClass(menuLink, 'is-active');
            }
        }
    }

    /**
     * Handle menu clicks.
     *
     * @function handleMenuClicks
     * @param {Event} e - Event from click.
     * @return {void}
     */
    handleMenuClicks(e) {
        if (e.target.classList.contains('js-changeMenu')) {
            e.preventDefault();
            let page = e.target.dataset.page;

            pocket.changePage(page);
        }
    }

    /**
     * Handle search button click.
     *
     * @function handleSearchClick
     * @return {void}
     */
    handleSearchClick() {
        search.show();
    }

    /**
     * Handle full sync button click.
     *
     * @function handleFullSyncClick
     * @param {Event} e - Click event.
     * @return {void}
     */
    handleFullSyncClick(e) {
        helpers.showMessage(`${chrome.i18n.getMessage('SYNCHRONIZING')}...`, true, false, false);

        const target = e.target;
        const syncClass = 'is-syncing';

        helpers.addClass(target, syncClass);
        pocket.fullSync = true;

        pocket.getContent();

        this.removeSyncedClassHandler = this.handleRemoveSyncedClass.bind(this, target, syncClass);
        document.addEventListener('synced', this.removeSyncedClassHandler, false);
    }

    /**
     * Handle full synced event.
     *
     * @function handleRemoveSyncedClass
     * @param {HTMLElement} target - Target HTMLElement.
     * @param {String} syncClass - Syncing class.
     * @returns {void}
     */
    handleRemoveSyncedClass(target, syncClass) {
        const syncedClass = 'is-synced';

        helpers.removeClass(target, syncClass);
        helpers.addClass(target, syncedClass);

        helpers.addClass(target.children[0], 'hidden');
        helpers.removeClass(target.children[1], 'hidden');

        setTimeout(() => {
            helpers.removeClass(target, syncedClass);
            helpers.addClass(target.children[1], 'hidden');
            helpers.removeClass(target.children[0], 'hidden');
        }, 1500);

        document.removeEventListener('synced', this.removeSyncedClassHandler, false);
    }

    /**
     * Destroy plugin.
     *
     * @function destroy
     * @return {void}
     */
    destroy() {
        this.removeEvents();
    }
}

const header = new Header();
export default header;
