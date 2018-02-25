class Settings {
    /**
     * @constructor
     */
    constructor() {
        this.colorSelectorChange = this.handleColorSelectorChange.bind(this);
        this.pageSelectorChange = this.handlePageSelectorChange.bind(this);
    }

    /**
     * Initialize settings.
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
        document.addEventListener('select.selector', this.colorSelectorChange, false);
        document.addEventListener('select.selector', this.pageSelectorChange, false);
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        document.removeEventListener('select.selector', this.colorSelectorChange, false);
        document.removeEventListener('select.selector', this.pageSelectorChange, false);
    }

    /**
     * Set theme color on pocket load.
     *
     * @function setTheme
     * @return {void}
     */
    setTheme() {
        const theme = localStorage.getItem('theme');
        if (theme) {
            helper.addClass(document.body, 'theme-' + theme);

            const colorSelector = [...document.querySelectorAll('[name=selector-color]')];
            for (let selector of colorSelector) {
                if (selector.value === theme) {
                    selector.checked = true;
                }
            }
        }
    }

    /**
     * Get default page to load on extension load.
     *
     * @function getDefaultPage
     * @return {String | null}
     */
    getDefaultPage() {
        return localStorage.getItem('defaultPage');
    }

    /**
     * Set default page on pocket load.
     *
     * @function loadDefaultPage
     * @return {void}
     */
    loadDefaultPage() {
        const defaultPage = settings.getDefaultPage();
        if (defaultPage && defaultPage !== 'list' && PAGES.includes(defaultPage)) {
            pocket.changePage(defaultPage);
        }

        if (defaultPage) {
            const pageSelector = [...document.querySelectorAll('[name=selector-page]')];
            for (let selector of pageSelector) {
                if (selector.value === defaultPage) {
                    selector.checked = true;
                }
            }
        }
    }

    /**
     * Handle default page selector in settings.
     *
     * @function handlePageSelectorChange
     * @param {Event} e - Selector change event.
     * @return {void}
     */
    handlePageSelectorChange(e) {
        if (e.detail.name === 'selector-page') {
            const page = e.detail.value.toString();
            if (PAGES.includes(page)) {
                localStorage.setItem('defaultPage', page);
            }
        }
    }

    /**
     * Handle selector change event for color change.
     *
     * @function handleColorSelectorChange
     * @param {Event} e - Selector change event.
     * @return {void}
     */
    handleColorSelectorChange(e) {
        if (e.detail.name === 'selector-color') {
            const value = e.detail.value.toString();

            document.body.classList.remove('theme-' + localStorage.getItem('theme'));
            localStorage.setItem('theme', value);
            document.body.classList.add('theme-' + value);
        }
    }

    /**
     * Add events to new item creating.
     *
     * @function bindAddNewItemEvents
     * @return {void}
     */
    bindAddNewItemEvents() {
        document.addEventListener('opened.modal', () => {
            document.querySelector('#js-newItemInput').focus();
        }, false);

        document.addEventListener('closed.modal', () => {
            document.querySelector('#js-newItemInput').value = '';
        }, false);

        document.newItemForm.addEventListener('submit', e => {
            const form = e.target;

            if (form.checkValidity()) {
                e.preventDefault();
                helper.showMessage(`${chrome.i18n.getMessage('CREATING_ITEM')}...`, true, false, false);

                if (pocket.getActivePage() === 'list') {
                    search.reset(true);
                }

                const rawData = new FormData(form);
                let data = {};

                for (let link of rawData.entries()) {
                    data[link[0]] = link[1];
                }

                item.add(data);
            }
        }, false);
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
