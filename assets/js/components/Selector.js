class Selector {
    /**
     * constructor
     */
    constructor() {
        this.selectorClick = this.handleSelectorClick.bind(this);
    }

    /**
     * Initialize selector.
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
        document.body.addEventListener('change', this.selectorClick, false);
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        document.body.removeEventListener('change', this.selectorClick, false);
    }

    /**
     * Handle selector click.
     *
     * @function handleSelectClick
     * @param {Event} e - Change event.
     * @return {void}
     */
    handleSelectorClick(e) {
        if (e.target.classList.contains('selector__input')) {
            this.selectRadio();
        }
    }

    /**
     * Select selector and change theme class on body.
     *
     * @function selectRadio
     * @return {void}
     */
    selectRadio() {
        const value = document.querySelector('[name=selector-color]:checked').value;

        document.body.classList.remove('theme-' + localStorage.getItem('theme'));
        localStorage.setItem('theme', value);
        document.body.classList.add('theme-' + value);
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

const selector = new Selector();
