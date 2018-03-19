class Recommend {
    /**
     * constructor
     */
    constructor() {
        this.items_shown = 0;
        this.load_count_ad = 1;

        this.saveAdItemToPocketClick = this.handleSaveAdItemToPocketClick.bind(this);
    }

    /**
     * Show Recommended page links.
     *
     * @function showRecommendedPageLink
     * @return {void}
     */
    showRecommendedPageLink() {
        document.querySelector('[data-page="recommend"]').removeAttribute('style');
        document.querySelector('#js-recommendSelector').removeAttribute('style');
    }

    /**
     * Create recommended items observer to load them when sentinel is visible.
     *
     * @function createAdItemsObserver
     * @return {void}
     */
    createAdItemsObserver() {
        const sentinel = document.querySelector('#js-sentinel');

        const io = new IntersectionObserver(entries => {
            if (entries[0].intersectionRatio <= 0) {
                return;
            }

            this.infiniteScrollRecommendations();
        });

        io.observe(sentinel);
    }

    /**
     * Load recommendations when changing page to Recommended.
     *
     * @function loadRecommendations
     * @return {void}
     */
    loadRecommendations() {
        let array = JSON.parse(localStorage.getItem('listFromLocalStorage'));

        this.getRecommendations([array[0]])
            .then(() => {
                pocket.createSentinel();
                this.createAdItemsObserver();
                // load one more because sentinel might be already shown and can't be used to load
                this.infiniteScrollRecommendations();
                helper.showMessage(chrome.i18n.getMessage('SYNCHRONIZING'));
            });
    }

    /**
     * Load more recommendations when scrolling.
     *
     * @function infiniteScrollRecommendations
     * @return {void}
     */
    infiniteScrollRecommendations() {
        helper.showMessage(`${chrome.i18n.getMessage('LOADING')}...`, true, false, false);

        let array = JSON.parse(localStorage.getItem('listFromLocalStorage'));

        array.shift(); // remove first item because it is already loaded on first load
        array = array.filter((i, index) => (index >= this.items_shown && index < this.items_shown + this.load_count_ad));

        this.items_shown += this.load_count_ad;

        if (array.length === 0) {
            helper.showMessage(chrome.i18n.getMessage('EVERYTHING_LOADED'), true, false, true);
        } else {
            helper.showMessage(chrome.i18n.getMessage('LOADING'));
        }

        this.getRecommendations(array)
            .then(() => {
                const sentinel = document.querySelector('#js-sentinel');
                const list = document.querySelector('#js-list');

                helper.append(list, sentinel);
            });

        lazyload.load();
    }

    /**
     * Get recommended stories.
     *
     * @function getRecommendations
     * @param {Array[]} array - Array of one item from listFromLocalStorage.
     * @return {void}
     */
    getRecommendations(array) {
        return apiService.getRecommendations(array[0].resolved_id)
            .then(response => this.handleRecommendedResponse(response));
    }

    /**
     * Handle recommende fetch response.
     *
     * @function handleRecommendedResponse
     * @param {Object} response - Resposne from fetch.
     * @return {Promise} - Promise when all items are rendered.
     */
    handleRecommendedResponse(response) {
        return new Promise(resolve => {
            let items = response.feed;

            for (let key in items) {
                let newItem = item.createAdItem(items[key].item, 'recommend');
                item.render(newItem);
            }

            lazyload.load();

            resolve(true);
        });
    }

    /**
     * Bind ad items save to pocket links
     *
     * @function bindSaveAdItemToPocketClicks
     * @return {void}
     */
    bindSaveAdItemToPocketClicks() {
        document.body.addEventListener('click', this.saveAdItemToPocketClick, false);
    }

    /**
     * Remove save ad item to pocket clicks.
     *
     * @function removeSaveAdItemToPocketClicks
     * @return {void}
     */
    removeSaveAdItemToPocketClicks() {
        document.body.removeEventListener('click', this.saveAdItemToPocketClick, false);
    }

    /**
     * Handle save ad item to pocket click.
     *
     * @function handleSaveAdItemToPocketClick
     * @param  {Event} e - Click event.
     * @return {void}
     */
    handleSaveAdItemToPocketClick(e) {
        if (e.target.classList.contains('js-addNewFromAd')) {
            e.preventDefault();
            helper.showMessage(`${chrome.i18n.getMessage('CREATING_ITEM')}...`, true, false, false);

            let data = {
                url: e.target.dataset.link
            };

            item.add(data);

            helper.addClass(e.target, 'is-saved');
            e.target.childNodes[1].innerText = chrome.i18n.getMessage('SAVED');
        }
    }
}

const recommend = new Recommend();
