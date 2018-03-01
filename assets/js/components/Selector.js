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
        let element = helper.createNode('div');

        element.setAttribute('class', 'selector__message');

        if (isSuccess) {
            element.classList.add('selector__message--success');
        } else {
            element.classList.add('selector__message--error');
        }

        let messageNode = helper.createTextNode(message);

        helper.append(element, messageNode);

        return element;
    }

    /**
     * Show message at the bottom of selector.
     *
     * @function showMessage
     * @param {Event} e - Selector checkbox change event.
     * @param {Boolean} isSuccess - Is success or error.
     * @param {String} message - Message to show.
     * @return {void}
     */
    showMessage(e, isSuccess, message) {
        const messageNode = this.createMessageNode(isSuccess, message);
        const component = e.detail.closest('.selector');
        let count = 0;

        for (const child of component.children) {
            if (child.classList.contains('selector__message')) {
                count++;
            }
        }

        if (count !== 0) {
            messageNode.remove();
        }

        helper.append(component, messageNode);

        setTimeout(() => {
            messageNode.remove();
        }, 2000);
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
