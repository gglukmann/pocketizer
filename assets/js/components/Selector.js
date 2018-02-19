'use strict';

class Selector {
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
        document.body.addEventListener('change', e => {
            if (e.target.classList.contains('selector__input')) {
                this.selectRadio();
            }
        });
    }

    selectRadio() {
        const value = document.querySelector('[name=selector-color]:checked').value;

        document.body.classList.remove('theme-' + localStorage.getItem('theme'));
        localStorage.setItem('theme', value);
        document.body.classList.add('theme-' + value);
    }
}

const selector = new Selector();
