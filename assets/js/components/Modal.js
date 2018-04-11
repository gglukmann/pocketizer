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
     * @param {Event} e - Click event.
     * @return {void}
     */
    handleOpenModalClick(e) {
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
    }

    /**
     * Handle keydown event.
     *
     * @function handleModalKeydown
     * @param {Event} e - Keydown event.
     * @return {void}
     */
    handleModalKeydown(e) {
        if (
            !this.preventClose &&
            (e.target.id !== 'js-tagsInput' ||
            e.target.parentNode.querySelector('.autocomplete') === null ||
            !e.target.parentNode.querySelector('.autocomplete').classList.contains('is-open')) &&
            e.keyCode === 27
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

        this.container = Helper.createNode('div');
        this.container.setAttribute('class', 'modal-container');
        this.inner = Helper.createNode('div');
        this.inner.setAttribute('class', 'modal-container__inner');

        if (!this.preventClose) {
            this.container.addEventListener('click', this.containerClick, false);
        }

        if (this.element.parentNode.parentNode.classList.contains('modal-container')) {
            oldParent = this.element.parentNode.parentNode;
        }

        Helper.append(this.inner, this.element);
        Helper.append(this.container, this.inner);
        Helper.append(document.body, this.container);

        if (oldParent) {
            oldParent.remove();
        }

        this.container.classList.add('is-visible');
        Helper.disableScroll(true);

        const eventOpened = new Event('opened.modal');
        document.dispatchEvent(eventOpened);
    }

    /**
     * Handle container click.
     *
     * @function handleContainerClick
     * @param {Event} e - Click event.
     * @return {void}
     */
    handleContainerClick(e) {
        if (e.target === e.currentTarget) {
            e.preventDefault();
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
            Helper.enableScroll();
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
