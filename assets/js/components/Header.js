class Header {
    /**
     * constructor
     */
    constructor() {
        this.options = {
            scrolledClass: 'is-scrolled',
        };

        this.timeout = false;
        this.scrollHeader = false;
    }

    /**
     * Initialize header.
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
        this.scrollHeader = this.handleScrollHeader.bind(this);
        window.addEventListener('scroll', this.scrollHeader, false);
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        window.removeEventListener('scroll', this.scrollHeader, false);
    }

    /**
     * Handle window scroll event.
     *
     * @function handleScrollHeader
     * @return {void}
     */
    handleScrollHeader() {
        if (!this.timeout) {
            window.requestAnimationFrame(this.toggleScrolledClass.bind(this));

            this.timeout = true;
        }
    }

    /**
     * Toggle scrolled class.
     *
     * @function toggleScrolledClass
     * @return {void}
     */
    toggleScrolledClass() {
        const scrollPosition = window.scrollY;
        const header = document.querySelector('#js-header');

        if (scrollPosition > 10) {
            helper.addClass(header, this.options.scrolledClass);
        } else {
            helper.removeClass(header, this.options.scrolledClass);
        }

        this.timeout = false;
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

const header = new Header();
