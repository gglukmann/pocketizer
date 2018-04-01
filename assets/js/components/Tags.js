class Tags {
    constructor() {
        this.tagClicks = this.handleTagClicks.bind(this);
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
        document.body.addEventListener('click', this.tagClicks, false);
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        document.body.removeEventListener('click', this.tagClicks, false);
    }

    /**
     * Handle all clicks within tag component.
     *
     * @function handleTagClicks
     * @param e {Event} - Click event.
     * @return {void}
     */
    handleTagClicks(e) {
        if (e.target.classList.contains('js-tagsLink')) {
            e.preventDefault();

            search.search(e.target.hash);
            search.show();
        } else if (e.target.id === 'js-tagsAllLink') {
            search.reset(true);
        }

        if (e.target.id === 'js-tagsMoreLink') {
            e.preventDefault();

            this.toggleTooltip();
        } else if (e.target.id !== 'js-tagsMoreLink') {
            this.closeTooltip();
        }
    }

    /**
     * Show or hide tooltip.
     *
     * @function toggleTooltip
     * @return {void}
     */
    toggleTooltip() {
        const tagsTooltip = document.querySelector('#js-tagsTooltip');

        if (tagsTooltip.classList.contains('is-visible')) {
            this.closeTooltip();
        } else {
            this.showTooltip();
        }
    }

    /**
     * Show tooltip.
     *
     * @function showTooltip
     * @return {*}
     */
    showTooltip() {
        const tagsTooltip = document.querySelector('#js-tagsTooltip');
        return helper.addClass(tagsTooltip, 'is-visible');
    }

    /**
     * Hide tooltip.
     *
     * @function hideTooltip
     * @return {*}
     */
    closeTooltip() {
        const tagsTooltip = document.querySelector('#js-tagsTooltip');
        return helper.removeClass(tagsTooltip, 'is-visible');
    }

    /**
     * Add all tags to localStorage.
     *
     * @function createTags
     * @param {Array} array - Array of items to find tags.
     * @param {Boolean} isFullSync - Is array coming from full sync.
     * @return {void}
     */
    createTags(array, isFullSync) {
        for (const item of array) {
            if (item.tags) {
                for (const tag in item.tags) {
                    this.addTag(tag, isFullSync);
                }
            }
        }

        this.renderTags();
    }

    /**
     * Add tags to dom.
     *
     * @function renderTags
     * @return {void}
     */
    renderTags() {
        const tagsArray = JSON.parse(localStorage.getItem('tags'));

        if (!tagsArray.length) {
            return;
        }

        document.querySelector('#js-tags').removeAttribute('style');
        const tagsElement = document.querySelector('#js-tagsList');
        const tagsTooltipElement = document.querySelector('#js-tagsTooltipList');

        helper.clearChildren(tagsElement);
        helper.clearChildren(tagsTooltipElement);

        for (const tag of tagsArray) {
            const tagElement = this.createTag(tag);
            this.renderTag(tagsElement, tagElement, tagsTooltipElement);
        }
    }

    /**
     * Create tag HTMLElement.
     *
     * @function createTag
     * @param tag {String} - Tag name string.
     * @return {HTMLElement}
     */
    createTag(tag) {
        let listElement = helper.createNode('li');
        let linkElement = helper.createNode('a');
        let tagNode = helper.createTextNode(tag);

        listElement.setAttribute('class', 'tags__item');
        linkElement.setAttribute('href', `#${tag}`);
        linkElement.setAttribute('class', 'btn btn--link tags__link js-tagsLink');
        linkElement.setAttribute('title', `${chrome.i18n.getMessage('TAG')}: ${tag}`);

        helper.append(linkElement, tagNode);
        helper.append(listElement, linkElement);

        return listElement;
    }

    /**
     * Add HTMLElement to DOM.
     *
     * @function renderTag
     * @param tagsElement {HTMLElement} - Tags wrapper element in DOM (ul).
     * @param tagElement {HTMLElement} - Tag element on add to DOM.
     * @param tagsTooltipElement {HTMLElement} - Tags tooltip wrapper element in DOM (ul).
     * @return {*}
     */
    renderTag(tagsElement, tagElement, tagsTooltipElement) {
        if (tagsElement.children.length < 5) {
            return helper.append(tagsElement, tagElement);
        }

        return helper.append(tagsTooltipElement, tagElement);
    }

    /**
     * Add tags to localStorage.
     *
     * @function addTag
     * @param {String} tag - Tag string.
     * @param {Boolean} isFullSync - If is full sync, remove all tags from localStorage and add from server.
     * @return {void}
     */
    addTag(tag, isFullSync) {
        const tagsArray = isFullSync ? [] : (JSON.parse(localStorage.getItem('tags')) || []);

        if (!tagsArray.includes(tag)) {
            tagsArray.push(tag);
            tagsArray.sort();

            localStorage.setItem('tags', JSON.stringify(tagsArray));
        }
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

const tags = new Tags();
