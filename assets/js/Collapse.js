'use strict';

class Collapse {
    /**
     * Initialize collapse.
     *
     * @function init
     * @return {void}
     */
    init() {
        this.bindClickEvents();
    }

    /**
     * Bind all click events.
     *
     * @function bindClickEvents
     * @return {void}
     */
    bindClickEvents() {
        document.body.addEventListener('click', e => {
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
        });
    }

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
}

const collapse = new Collapse();
