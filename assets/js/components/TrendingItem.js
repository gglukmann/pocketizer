class TrendingItem {
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
}

const trendingItem = new TrendingItem();
