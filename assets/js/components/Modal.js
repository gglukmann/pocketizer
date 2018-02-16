'use strict';

class Modal {
    /**
     * @constructor
     */
    constructor() {
        this.container = false;
        this.preventClose = false;
    }

    /**
     * Initialize modal.
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
            if (e.target.dataset.modalPreventClose && e.target.dataset.modalPreventClose === 'true') {
                this.preventClose = true;
            }

            if (e.target.dataset.modalTarget && e.target.dataset.modalTarget !== '') {
                e.preventDefault();

                this.open(e.target.dataset.modalTarget);
            }

            if (e.target.dataset.modalAction && e.target.dataset.modalAction === 'close') {
                this.close();
            }
        });

        document.body.addEventListener('keydown', e => {
            if (!this.preventClose) {
                if (e.keyCode === 27) {
                    this.close();
                }
            }
        });
    }

    /**
     * Open modal.
     *
     * @function open
     * @param {String} target - Target element string.
     * @param {Boolean} preventClose - If close should be prevented with enter, esc or backdrop click.
     * @return {void}
     */
    open(target, preventClose) {
        this.preventClose = preventClose ? preventClose : this.preventClose;
        this.element = document.querySelector(target);

        let previousModals = document.querySelectorAll('.modal-container.is-visible');
        if (previousModals.length > 0) {
            previousModals.forEach(() => {
                this.close();
            });
        }

        const eventOpen = new Event('open.modal');
        document.dispatchEvent(eventOpen);

        if (!this.container.length) {
            this.container = helper.createNode('div');
            this.container.setAttribute('class', 'modal-container');
            this.inner = helper.createNode('div');
            this.inner.setAttribute('class', 'modal-container__inner');

            if (!this.preventClose) {
                this.container.addEventListener('click', e => {
                    if (e.target === e.currentTarget) {
                        e.preventDefault();
                        this.close();
                    }
                });
            }

            helper.append(this.inner, this.element);
            helper.append(this.container, this.inner);
            helper.append(document.body, this.container);
        }

        this.container.classList.add('is-visible');
        helper.disableScroll(true);

        const eventOpened = new Event('opened.modal');
        document.dispatchEvent(eventOpened);
    }

    /**
     * Close modal.
     *
     * @function close
     * @return {void}
     */
    close() {
        if (this.container && this.container.classList.contains('is-visible')) {
            helper.enableScroll();
            this.container.classList.remove('is-visible');

            const event = new Event('closed.modal');
            document.dispatchEvent(event);
        }
    }
}

const modal = new Modal();
