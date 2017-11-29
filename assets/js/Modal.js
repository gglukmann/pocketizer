'use strict';

class Modal {
    constructor() {
        this.container = false;
        this.preventClose = false;
    }

    init() {
        this.bindClickEvents();
    }

    bindClickEvents() {
        document.body.addEventListener('click', e => {
            if (e.target.dataset.modalTarget && e.target.dataset.modalTarget !== '') {
                e.preventDefault();

                if (e.target.dataset.modalType && e.target.dataset.modalType === 'delete') {
                    this.preventClose = true;
                }

                this.open(e.target.dataset.modalTarget);
            }

            if (e.target.dataset.modalAction && e.target.dataset.modalAction === 'close') {
                this.close();
            }
        });

        document.body.addEventListener('keyup', e => {
            if (!this.preventClose) {
                if (e.keyCode === 27) {
                    this.close();
                }
            }
        });
    }

    open(target) {
        this.element = document.querySelector(target);

        let previousModals = document.querySelectorAll('.modal-container.is-visible');
        if (previousModals.length > 0) {
            previousModals.forEach(item => {
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

    close() {
        helper.enableScroll();
        this.container.classList.remove('is-visible');

        const event = new Event('closed.modal');
        document.dispatchEvent(event);
    }
}

const modal = new Modal();
