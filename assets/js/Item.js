'use strict';

class Item {
    /**
     * Create new item and append to list.
     *
     * @param  {Object} element     Element from pocket.
     * @param  {String} active_page List type.
     * @return {void}
     */
    create(element, active_page) {
        let itemElement = createNode('li');
        let contentElement = createNode('div');
        let excerptElement = createNode('div');
        let titleElement = createNode('a');
        let linkElement = createNode('a');
        let fakeLinkElement = createNode('a');
        let readButtonElement = createNode('a');
        let deleteButtonElement = createNode('a');
        let favouriteElement = createNode('a');
        let pocketLinkElement = createNode('a');
        let timeElement = createNode('div');
        let title;
        let link;

        if (element.resolved_title == '' && element.given_title == '') {
            title = element.resolved_url;
        } else if (element.resolved_title == '' || element.given_title != '') {
            title = element.given_title;
        } else {
            title = element.resolved_title;
        }

        if (element.favorite == 1) {
            favouriteElement.setAttribute('data-favourite', 'true');
        } else {
            favouriteElement.setAttribute('data-favourite', 'false');
        }
        favouriteElement.setAttribute('class', 'item__favourite js-toggle-favourite-button');
        favouriteElement.setAttribute('href', '#0');
        favouriteElement.setAttribute('title', chrome.i18n.getMessage('TOGGLE_FAVOURITED_STATE'));
        favouriteElement.setAttribute('data-id', element.item_id);
        append(contentElement, favouriteElement);

        let textNode = createTextNode(title);
        let pocketLinkNode = createTextNode(chrome.i18n.getMessage('OPEN_IN_POCKET'));
        let timeNode = createTextNode(timeConverter(element.time_added));
        let readNode;
        let isRead = false;
        let deleteNode = createTextNode(chrome.i18n.getMessage('DELETE'));

        switch (active_page) {
            case 'list':
                readNode = createTextNode(chrome.i18n.getMessage('MARK_READ'));
                isRead = false;
            break;
            case 'archive':
                readNode = createTextNode(chrome.i18n.getMessage('MARK_UNREAD'))
                isRead = true;
            break;
        };

        timeElement.setAttribute('class', 'item__time');
        timeElement.setAttribute('title', chrome.i18n.getMessage('DATE_ADDED'));
        append(timeElement, timeNode);

        readButtonElement.setAttribute('class', 'item__set-read js-toggleReadButton');
        readButtonElement.setAttribute('href', '#0');
        readButtonElement.setAttribute('data-id', element.item_id);
        readButtonElement.setAttribute('data-read', isRead);
        append(readButtonElement, readNode);

        deleteButtonElement.setAttribute('class', 'item__delete js-deleteButton');
        deleteButtonElement.setAttribute('href', '#0');
        deleteButtonElement.setAttribute('data-id', element.item_id);
        append(deleteButtonElement, deleteNode);

        itemElement.setAttribute('class', 'item');
        contentElement.setAttribute('class', 'item__content');
        append(itemElement, contentElement);

        fakeLinkElement.setAttribute('href', element.resolved_url);
        fakeLinkElement.setAttribute('class', 'item__fake-link');

        titleElement.setAttribute('href', element.resolved_url);
        titleElement.setAttribute('class', 'item__title');
        append(titleElement, textNode);

        excerptElement.setAttribute('class', 'item__excerpt');

        if ((element.has_image == 1 || element.has_image == 2) && element.image) {
            let imageElement = createNode('img');
            imageElement.setAttribute('data-src', element.image.src);
            imageElement.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
            imageElement.setAttribute('class', 'item__image lazyload');
            excerptElement.className += ' item__excerpt--image';
            append(excerptElement, imageElement);
        } else {
            let excerptNode = createTextNode(element.excerpt);
            append(excerptElement, excerptNode);
        }

        pocketLinkElement.setAttribute('class', 'item__pocket-link');
        pocketLinkElement.setAttribute('href', 'https://getpocket.com/a/read/' + element.item_id);
        pocketLinkElement.setAttribute('title', chrome.i18n.getMessage('OPEN_IN_POCKET'));
        append(pocketLinkElement, pocketLinkNode);

        linkElement.setAttribute('class', 'item__link');

        if (element.resolved_url == '' && element.given_url == '') {
            link = element.given_url;
        } else if (element.resolved_url == '' || element.given_url != '') {
            link = element.given_url;
        } else {
            link = element.resolved_url;
        }
        let linkNode = createTextNode(link);
        linkElement.setAttribute('href', link);
        linkElement.setAttribute('title', link);
        append(linkElement, linkNode);

        append(contentElement, fakeLinkElement);
        append(contentElement, titleElement);
        append(contentElement, timeElement);
        append(contentElement, excerptElement);
        append(contentElement, linkElement);
        append(contentElement, pocketLinkElement);
        append(contentElement, readButtonElement);
        append(contentElement, deleteButtonElement);

        this.render(itemElement);
    }

    /**
     * Append element to list.
     *
     * @param  {HTMLElement} itemElement Element to render.
     * @return {void}
     */
    render(itemElement) {
        const listElement = document.querySelector('#js-list');
        append(listElement, itemElement);
    }
}

const item = new Item();
