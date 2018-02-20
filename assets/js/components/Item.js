class Item {
    /**
     * constructor
     */
    constructor() {
        this.timeout = false;
        this.pageResize = false;
    }

    /**
     * Initialize item.
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
        this.pageResize = this.handlePageResize.bind(this);
        window.addEventListener('resize', this.pageResize, false);
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        window.removeEventListener('resize', this.pageResize, false);
    }

    /**
     * Handle page resizing.
     *
     * @function handlePageResize
     * @return {void}
     */
    handlePageResize() {
        if (!this.timeout) {
            window.requestAnimationFrame(this.calcBackgroundHeights.bind(this));

            this.timeout = true;
        }
    }

    /**
     * Create new item and append to list.
     *
     * @param {Object} element - Element from pocket.
     * @return {HTMLElement} - Created element.
     */
    create(element) {
        let itemElement = helper.createNode('li');
        let contentElement = helper.createNode('div');
        let excerptElement = helper.createNode('div');
        let titleElement = helper.createNode('a');
        let linkElement = helper.createNode('a');
        let fakeLinkElement = helper.createNode('a');
        let readButtonElement = helper.createNode('a');
        let deleteButtonElement = helper.createNode('a');
        let favouriteElement = helper.createNode('a');
        let pocketLinkElement = helper.createNode('a');
        let timeElement = helper.createNode('div');
        let title;
        let link;

        if (element.title) {
            title = element.title;
        } else if (element.resolved_title && element.resolved_title !== '') {
            title = element.resolved_title;
        } else if (element.resolved_url && element.resolved_url !== '') {
            title = element.resolved_url;
        } else if (!element.resolved_title && !element.resolved_url) {
            title = element.given_url;
        }

        if (element.favorite === '1') {
            favouriteElement.setAttribute('data-favourite', 'true');
        } else {
            favouriteElement.setAttribute('data-favourite', 'false');
        }
        favouriteElement.setAttribute('class', 'item__favourite js-toggleFavouriteButton');
        favouriteElement.setAttribute('href', '#0');
        favouriteElement.setAttribute('title', chrome.i18n.getMessage('TOGGLE_FAVOURITED_STATE'));
        favouriteElement.setAttribute('data-id', element.item_id);
        helper.append(contentElement, favouriteElement);

        let textNode = helper.createTextNode(title);
        let pocketLinkNode = helper.createTextNode(chrome.i18n.getMessage('OPEN_IN_POCKET'));
        let timeNode = helper.createTextNode(helper.timeConverter(element.time_added));
        let readNode;
        let isRead = false;
        let deleteNode = helper.createTextNode(chrome.i18n.getMessage('DELETE'));

        switch (pocket.getActivePage()) {
            case 'list':
                readNode = helper.createTextNode(chrome.i18n.getMessage('MARK_READ'));
                isRead = false;
            break;
            case 'archive':
                readNode = helper.createTextNode(chrome.i18n.getMessage('MARK_UNREAD'));
                isRead = true;
            break;
        }

        if (element.time_added) {
            timeElement.setAttribute('class', 'item__time');
            timeElement.setAttribute('title', chrome.i18n.getMessage('DATE_ADDED'));
            helper.append(timeElement, timeNode);
        }

        readButtonElement.setAttribute('class', 'item__set-read js-toggleReadButton');
        readButtonElement.setAttribute('href', '#0');
        readButtonElement.setAttribute('data-id', element.item_id);
        readButtonElement.setAttribute('data-read', isRead);
        helper.append(readButtonElement, readNode);

        deleteButtonElement.setAttribute('class', 'item__delete js-deleteButton');
        deleteButtonElement.setAttribute('href', '#0');
        deleteButtonElement.setAttribute('data-id', element.item_id);
        helper.append(deleteButtonElement, deleteNode);

        itemElement.setAttribute('class', 'item');
        contentElement.setAttribute('class', 'item__content');
        helper.append(itemElement, contentElement);

        if (element.resolved_url && element.resolved_url !== '') {
            link = element.resolved_url;
        } else {
            link = element.given_url;
        }

        fakeLinkElement.setAttribute('href', link);
        fakeLinkElement.setAttribute('class', 'item__link-fake');

        titleElement.setAttribute('href', link);
        titleElement.setAttribute('class', 'item__title');
        helper.append(titleElement, textNode);

        excerptElement.setAttribute('class', 'item__excerpt');

        if ((element.has_image === '1' || element.has_image === '2') && element.image) {
            // let imageElement = helper.createNode('img');
            // imageElement.setAttribute('data-src', element.image.src);
            // imageElement.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
            // imageElement.setAttribute('class', 'item__image js-lazyload');
            // excerptElement.className += ' item__excerpt--image';
            // helper.append(excerptElement, imageElement);
            excerptElement.className += ' item__excerpt--background js-lazyload';
            excerptElement.dataset.src = element.image.src;
        } else {
            if (element.excerpt) {
                let excerptNode = helper.createTextNode(element.excerpt);
                helper.append(excerptElement, excerptNode);
            }
        }

        pocketLinkElement.setAttribute('class', 'item__pocket-link');
        pocketLinkElement.setAttribute('href', 'https://getpocket.com/a/read/' + element.item_id);
        pocketLinkElement.setAttribute('title', chrome.i18n.getMessage('OPEN_IN_POCKET'));
        helper.append(pocketLinkElement, pocketLinkNode);

        linkElement.setAttribute('class', 'item__link');

        let domain = link.replace(/^(https?:|)\/\//, '');
        domain = domain.split('/')[0];
        let linkNode = helper.createTextNode(domain);
        linkElement.setAttribute('href', link);
        linkElement.setAttribute('title', link);
        helper.append(linkElement, linkNode);

        helper.append(contentElement, fakeLinkElement);
        helper.append(contentElement, titleElement);
        helper.append(contentElement, timeElement);
        helper.append(contentElement, excerptElement);
        helper.append(contentElement, linkElement);
        helper.append(contentElement, pocketLinkElement);
        helper.append(contentElement, readButtonElement);
        helper.append(contentElement, deleteButtonElement);

        return itemElement;
    }

    /**
     * Create trending and recommended items.
     *
     * @function createAdItem
     * @param {Object} element - Element from pocket.
     * @param {String} [type='trending'] - Type for creating right class.
     * @return {HTMLElement} - Created element.
     */
    createAdItem(element, type = 'trending') {
        let itemElement = helper.createNode('li');
        let contentElement = helper.createNode('div');
        let fakeLinkElement = helper.createNode('a');
        let backgroundElement = helper.createNode('div');
        let titleElement = helper.createNode('a');
        let sourceElement = helper.createNode('a');
        let saveElement = helper.createNode('a');
        let saveElementText = helper.createNode('span');
        let itemClasses = 'item';

        // parent elements
        if (type === 'trending') {
            itemClasses += ' item--trending';
        } else if (type === 'recommend') {
            itemClasses += ' item--recommend';
        }
        itemElement.setAttribute('class', itemClasses);
        contentElement.setAttribute('class', 'item__content');
        helper.append(itemElement, contentElement);

        // fake link
        fakeLinkElement.setAttribute('href', element.resolved_url);
        fakeLinkElement.setAttribute('class', 'item__link-fake');
        fakeLinkElement.setAttribute('title', chrome.i18n.getMessage('OPEN_ITEM'));

        // background
        if (element.images[1]) {
            backgroundElement.dataset.src = element.images[1].src;
        }
        backgroundElement.setAttribute('class', 'item__background js-lazyload');

        // title
        let titleNode = helper.createTextNode(element.title);
        titleElement.setAttribute('href', element.resolved_url);
        titleElement.setAttribute('title', element.title);
        titleElement.setAttribute('class', 'item__title');
        helper.append(titleElement, titleNode);

        // source
        sourceElement.setAttribute('class', 'item__link-source');
        let domain = element.resolved_url.replace(/^(https?:|)\/\//, '');
        domain = domain.split('/')[0];
        let sourceNode = helper.createTextNode(domain);
        sourceElement.setAttribute('href', element.resolved_url);
        sourceElement.setAttribute('title', element.resolved_url);
        helper.append(sourceElement, sourceNode);

        // save to pocket
        saveElement.setAttribute('class', 'item__link-save');
        saveElement.setAttribute('href', '#0');
        saveElement.dataset.link = element.resolved_url;
        saveElement.setAttribute('title', chrome.i18n.getMessage('SAVE_TO_POCKET'));
        saveElement.setAttribute('id', 'js-addNewFromAd');
        // span with text
        let saveNode = helper.createTextNode(chrome.i18n.getMessage('SAVE_TO_POCKET'));
        saveElementText.setAttribute('class', 'item__link-text-child');
        helper.append(saveElementText, saveNode);
        // svg
        let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.setAttribute('viewBox', '0 0 26 26');
        svgElement.setAttribute('class', 'icon item__link-svg');
        let pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute('d', 'M26,4a2,2,0,0,0-2-2H2A2,2,0,0,0,0,4v9c0,0.1,0,.2,0,0.4s0,0.4,0,.6c0,4,5.8,11,13,11s13-7,13-11c0-.2,0-0.4,0-0.6s0-.2,0-0.4V4Zm-5.5,7-6,6a1.9,1.9,0,0,1-2.9,0l-6-6A1.7,1.7,0,0,1,8,8.5l5,5,5-5a1.7,1.7,0,0,1,2.5,0h0A1.7,1.7,0,0,1,20.5,11Z');
        helper.append(svgElement, pathElement);
        helper.append(saveElement, svgElement);
        helper.append(saveElement, saveElementText);

        // append everything to parent
        helper.append(contentElement, fakeLinkElement);
        helper.append(contentElement, backgroundElement);
        helper.append(contentElement, titleElement);
        helper.append(contentElement, sourceElement);
        helper.append(contentElement, saveElement);

        return itemElement;
    }

    /**
     * Append element to list.
     *
     * @param {HTMLElement} itemElement - Element to render.
     * @param {String} list - List type.
     * @param {Boolean} doPrepend - If item has to be prepended.
     * @return {void}
     */
    render(itemElement, list = 'list', doPrepend = false) {
        const listSelector = '#js-' + list;
        const listElement = document.querySelector(listSelector);

        if (doPrepend) {
            return helper.prepend(listElement, itemElement);
        }

        return helper.append(listElement, itemElement);
    }

    /**
     * Add new item Pocket.
     *
     * @function addNewItem
     * @param {Object} data - Link in object.
     * @return {void}
     */
    add(data) {
        apiService.add(data)
            .then(response => {
                modal.close();

                if (pocket.getActivePage() === 'list') {
                    let createdItem = this.create(response.item, 'list');
                    this.render(createdItem, 'list', true);
                }

                let array = JSON.parse(localStorage.getItem('listFromLocalStorage'));
                array = helper.prependArray(array, response.item);
                localStorage.setItem('listFromLocalStorage', JSON.stringify(array));

                localStorage.setItem('listCount', parseInt(localStorage.getItem('listCount'), 10) + 1);
                if (pocket.getActivePage() === 'list') {
                    document.querySelector('#js-count').innerText = localStorage.getItem('listCount');
                }

                helper.showMessage(chrome.i18n.getMessage('CREATING_ITEM'));
            });
    }

    /**
     * Toggle favourite state.
     *
     * @function favourite
     * @param {Event} e - Click event.
     * @return {void}
     */
    favourite(e) {
        e.preventDefault();
        let id = e.target.dataset.id;
        let isFavourited = e.target.dataset.favourite;
        isFavourited = (isFavourited === 'true'); // convert to boolean

        pocket.changeItemState(e, 'favourite', id, isFavourited);
    }

    /**
     * Toggle item between archive and list.
     *
     * @function archive
     * @param {e} e - Click event.
     * @return {void}
     */
    archive(e) {
        e.preventDefault();
        let id = e.target.dataset.id;
        pocket.changeItemState(e, 'read', id, false);
    }

    /**
     * Open modal and delete item.
     *
     * @function delete
     * @param {e} e - Click event.
     * @return {void}
     */
    delete(e) {
        e.preventDefault();
        let deleteItemEvent = e;
        modal.open('#js-deleteModal');

        let newEvent = this.handleDeleteClick.bind(this, deleteItemEvent);

        document.querySelector('#js-deleteSubmit').addEventListener('click', newEvent, false);

        document.addEventListener('closed.modal', () => {
            document.querySelector('#js-deleteSubmit').removeEventListener('click', newEvent, false);
        }, false);
    }

    /**
     * Handle delete button click.
     *
     * @function handleDeleteClick
     * @param {Event} deleteItemEvent - Delete button from item event.
     * @return {void}
     */
    handleDeleteClick(deleteItemEvent) {
        let id = deleteItemEvent.target.dataset.id;
        pocket.changeItemState(deleteItemEvent, 'delete', id, false);
    }

    /**
     * Calculate items images heights.
     *
     * @function calcBackgroundHeights
     * @return {void}
     */
    calcBackgroundHeights() {
        const items = document.querySelectorAll('.item__content');

        for (let item of [...items]) {
            let titleHeight = 0;
            for (let child of [...item.children]) {
                if (child.classList.contains('item__title')) {
                    titleHeight = child.offsetHeight;
                }
                if (child.classList.contains('item__excerpt--background')) {
                    child.style.height = 300 - (titleHeight + 20 + 52) + 'px';
                }
            }
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

const item = new Item();
