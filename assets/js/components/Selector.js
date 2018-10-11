import * as helpers from '../utils/helpers.js';

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
            this.selectRadio(e);
        }
    }

    /**
     * Select selector and change theme class on body.
     *
     * @function selectRadio
     * @return {void}
     */
    selectRadio(e) {
        const eventSelector = new CustomEvent('select.selector', { detail: e.target });
        document.dispatchEvent(eventSelector);
    }

    /**
     * Create message DOM element.
     *
     * @function createMessageNode
     * @param {Boolean} isSuccess - Is success or error.
     * @param {String} message - Message to show.
     * @return {ActiveX.IXMLDOMNode}
     */
    createMessageNode(isSuccess, message) {
        const element = helpers.createNode('div');
        element.setAttribute('class', 'selector__message');

        helpers.addClass(element, `selector__message--${isSuccess ? 'success' : 'error'}`);

        const messageNode = helpers.createTextNode(message);
        helpers.append(element, messageNode);

        return element;
    }

    /**
     * Show message at the bottom of selector.
     *
     * @function showMessage
     * @param {Event} e - Selector checkbox change event.
     * @param {Boolean} isSuccess - Is success or error.
     * @param {String} message - Message to show.
     * @param {Number | *} timeout - Timeout for how long to show message.
     * @return {void}
     */
    showMessage(e, isSuccess, message, timeout = 2000) {
        const messageNode = this.createMessageNode(isSuccess, message);
        const component = e.detail.closest('.selector');

        for (const child of component.children) {
            if (child.classList.contains('selector__message')) {
                child.remove();
            }
        }

        helpers.append(component, messageNode);

        if (typeof timeout !== 'number') {
            return;
        }

        setTimeout(() => {
            messageNode.remove();
        }, timeout);
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
export default selector;
