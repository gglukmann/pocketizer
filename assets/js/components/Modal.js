import * as helpers from '../utils/helpers.js';

class Modal {
    /**
     * @constructor
     */
    constructor() {
        this.container = false;
        this.preventClose = false;

        this.containerClick = this.handleContainerClick.bind(this);
        this.openModalClick = this.handleOpenModalClick.bind(this);
        this.modalKeydown = this.handleModalKeydown.bind(this);
    }

    /**
     * Initialize modal.
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
        document.body.addEventListener('click', this.openModalClick, false);
        document.body.addEventListener('keydown', this.modalKeydown, false);
    }

    /**
     * Remove all modal events.
     *
     * @function removeEvent
     * @return {void}
     */
    removeEvents() {
        document.body.removeEventListener('click', this.openModalClick, false);
        document.body.removeEventListener('keydown', this.modalKeydown, false);
    }

    /**
     * Handle open modal click event.
     *
     * @function handleOpenModalClick
     * @param {Event} event - Click event.
     * @return {void}
     */
    handleOpenModalClick(event) {
        if (event.target.dataset.modalPreventClose && event.target.dataset.modalPreventClose === 'true') {
            this.preventClose = true;
        }

        if (event.target.dataset.modalTarget && event.target.dataset.modalTarget !== '') {
            event.preventDefault();

            this.open(event.target.dataset.modalTarget);
        }

        if (event.target.dataset.modalAction && event.target.dataset.modalAction === 'close') {
            this.close();
        }
    }

    /**
     * Handle keydown event.
     *
     * @function handleModalKeydown
     * @param {Event} event - Keydown event.
     * @return {void}
     */
    handleModalKeydown(event) {
        if (
            !this.preventClose &&
            (event.target.id !== 'js-tagsInput' ||
                event.target.parentNode.querySelector('.autocomplete') === null ||
                !event.target.parentNode.querySelector('.autocomplete').classList.contains('is-open')) &&
            event.keyCode === 27
        ) {
            this.close();
        }
    }

    /**
     * Open modal.
     *
     * @function open
     * @param {String} target - Target element string.
     * @param {Boolean} preventClose - If close should be prevented with enter, esc or backdrop click.
     * @return {void}
     */
    open(target, preventClose = false) {
        this.preventClose = preventClose ? preventClose : this.preventClose;
        this.element = document.querySelector(target);
        let oldParent = false;

        let previousModals = document.querySelectorAll('.modal-container.is-visible');
        if (previousModals.length > 0) {
            previousModals.forEach(() => {
                this.close();
            });
        }

        const eventOpen = new Event('open.modal');
        document.dispatchEvent(eventOpen);

        this.container = helpers.createNode('div');
        this.container.setAttribute('class', 'modal-container');
        this.inner = helpers.createNode('div');
        this.inner.setAttribute('class', 'modal-container__inner');

        if (!this.preventClose) {
            this.container.addEventListener('click', this.containerClick, false);
        }

        if (this.element.parentNode.parentNode.classList.contains('modal-container')) {
            oldParent = this.element.parentNode.parentNode;
        }

        helpers.append(this.inner, this.element);
        helpers.append(this.container, this.inner);
        helpers.append(document.body, this.container);

        if (oldParent) {
            oldParent.remove();
        }

        this.container.classList.add('is-visible');
        helpers.disableScroll(true);

        const eventOpened = new Event('opened.modal');
        document.dispatchEvent(eventOpened);
    }

    /**
     * Handle container click.
     *
     * @function handleContainerClick
     * @param {Event} event - Click event.
     * @return {void}
     */
    handleContainerClick(event) {
        if (event.target === event.currentTarget) {
            event.preventDefault();
            this.close();
        }
    }

    /**
     * Close modal.
     *
     * @function close
     * @return {void}
     */
    close() {
        if (this.container && this.container.classList.contains('is-visible')) {
            this.container.removeEventListener('click', this.containerClick, false);
            helpers.enableScroll();
            this.container.classList.remove('is-visible');

            const event = new Event('closed.modal');
            document.dispatchEvent(event);
        }
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

const modal = new Modal();
export default modal;
