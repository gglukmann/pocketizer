class Trending {
    /**
     * constructor
     */
    constructor() {
        this.openTrendingCollapse = this.handleOpenTrendingCollapse.bind(this);
    }

    /**
     * Hide all trending elements.
     *
     * @function hideAll
     * @return {void}
     */
    hideAll() {
        document.querySelector('#js-trending').style.display = 'none';
    }

    /**
     * Show all trending elements.
     *
     * @function showAll
     * @return {void}
     */
    showAll() {
        document.querySelector('#js-trending').removeAttribute('style');
    }

    /**
     * Check if trending list should be shown.
     *
     * @function handleTrendingSection
     * @return {void}
     */
    handleTrendingSection() {
        if (localStorage.getItem('isTrendingShown') === 'true') {
            collapse.open('#js-trendingCollapseTrigger', '#js-trendingCollapse');
        } else {
            collapse.close('#js-trendingCollapseTrigger', '#js-trendingCollapse');
        }

        document.addEventListener('open.collapse', this.openTrendingCollapse, false);

        this.getTrending();
    }

    /**
     * Handle open trending collapse and load pictures.
     *
     * @function handleOpenTrendingCollapse
     * @return {void}
     */
    handleOpenTrendingCollapse() {
        lazyload.load();
    }

    /**
     * Get trending stories.
     *
     * @function getTrending
     * @return {void}
     */
    getTrending() {
        const trendingItemsCount = 4;

        apiService.getTrending(trendingItemsCount)
            .then(response => {
                this.handleTrendingResponse(response);
            });
    }

    /**
     * Handle trending fetch response.
     *
     * @function handleTrendingResponse
     * @param {Object} response - Response from fetch.
     * @return {void}
     */
    handleTrendingResponse(response) {
        let items = response.list;

        for (let key in items) {
            let newItem = item.createAdItem(items[key]);
            item.render(newItem, 'trendingList');
        }

        // TODO: if already added to list. add is-saved class and Saved text to button

        recommend.bindSaveAdItemToPocketClicks();
    }

    /**
     * Destroy.
     *
     * @function destroy
     * @return {void}
     */
    destroy() {
        document.removeEventListener('open.collapse', this.openTrendingCollapse, false);
    }
}

const trending = new Trending();
