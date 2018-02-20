class Collapse {
    /**
     * constructor
     */
    constructor() {
        this.openCollapseClick = false;
    }

    /**
     * Initialize collapse.
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
        this.openCollapseClick = this.handleOpenCollapseClick.bind(this);
        document.body.addEventListener('click', this.openCollapseClick, false);
    }

    /**
     * Handle open click event.
     *
     * @function handleOpenCollapseClick
     * @param {Event} e - Click event.
     * @return {void}
     */
    handleOpenCollapseClick(e) {
        if (e.target.dataset.collapseTarget && e.target.dataset.collapseTarget !== '') {
            e.preventDefault();

            this.trigger = e.target;
            this.element = document.querySelector(e.target.dataset.collapseTarget);

            if (this.isOpen()) {
                this.close();
            } else {
                this.open();
            }
        }
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        document.body.removeEventListener('click', this.openCollapseClick, false);
    }

    /**
     * Check if collapse is open.
     *
     * @function isOpen
     * @return {boolean}
     */
    isOpen() {
        if (!this.trigger.classList.contains('is-active')) {
            return false;
        }

        return true;
    }

    /**
     * Open collapse.
     *
     * @function open
     * @param {String} trigger - Trigger element string.
     * @param {String} target - Target element string.
     * @return {void}
     */
    open(trigger, target) {
        this.trigger = this.trigger || document.querySelector(trigger);
        this.element = this.element || document.querySelector(target);

        const eventOpen = new Event('open.collapse');
        document.dispatchEvent(eventOpen);

        this.trigger.classList.add('is-active');
        this.element.classList.add('is-open');

        if (this.trigger.id === 'js-trendingCollapseTrigger') {
            localStorage.setItem('isTrendingShown', true);
        }

        const eventOpened = new Event('opened.collapse');
        document.dispatchEvent(eventOpened);
    }

    /**
     * Close collapse.
     *
     * @function close
     * @return {void}
     */
    close(trigger, target) {
        this.trigger = this.trigger || document.querySelector(trigger);
        this.element = this.element || document.querySelector(target);

        const eventClose = new Event('close.collapse');
        document.dispatchEvent(eventClose);

        this.trigger.classList.remove('is-active');
        this.element.classList.remove('is-open');

        if (this.trigger.id === 'js-trendingCollapseTrigger') {
            localStorage.setItem('isTrendingShown', false);
        }

        const eventClosed = new Event('closed.collapse');
        document.dispatchEvent(eventClosed);
    }

    /**
     * Destroy plugin.
     *
     * @function destroy
     * @return {void}
     */
    destroy() {
        this.close();
        this.removeEvents();
    }
}

const collapse = new Collapse();
