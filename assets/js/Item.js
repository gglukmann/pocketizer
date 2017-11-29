'use strict';

class Item {
    /**
     * Create new item and append to list.
     *
     * @param {Object} element - Element from pocket.
     * @param {String} active_page - List type.
     * @return {void}
     */
    create(element, active_page) {
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

        if (element.resolved_title && element.resolved_title !== '') {
            title = element.resolved_title;
        } else if (element.resolved_url && element.resolved_url !== '') {
            title = element.resolved_url;
        } else if (!element.resolved_title && !element.resolved_url) {
            title = element.given_url;
        }

        if (element.favorite == 1) {
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

        switch (active_page) {
            case 'list':
                readNode = helper.createTextNode(chrome.i18n.getMessage('MARK_READ'));
                isRead = false;
            break;
            case 'archive':
                readNode = helper.createTextNode(chrome.i18n.getMessage('MARK_UNREAD'))
                isRead = true;
            break;
        };

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
        fakeLinkElement.setAttribute('class', 'item__fake-link');

        titleElement.setAttribute('href', link);
        titleElement.setAttribute('class', 'item__title');
        helper.append(titleElement, textNode);

        excerptElement.setAttribute('class', 'item__excerpt');

        if ((element.has_image == 1 || element.has_image == 2) && element.image) {
            let imageElement = helper.createNode('img');
            imageElement.setAttribute('data-src', element.image.src);
            imageElement.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
            imageElement.setAttribute('class', 'item__image js-lazyload');
            excerptElement.className += ' item__excerpt--image';
            helper.append(excerptElement, imageElement);
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

        let linkNode = helper.createTextNode(link);
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
     * Append element to list.
     *
     * @param {HTMLElement} itemElement - Element to render.
     * @param {Boolean} doPrepend - If item has to be prepended.
     * @return {void}
     */
    render(itemElement, doPrepend = false) {
        const listElement = document.querySelector('#js-list');

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

                let createdItem = this.create(response.item, 'list');
                this.render(createdItem, true);

                let array = JSON.parse(localStorage.getItem('listFromLocalStorage'));
                array = helper.prependArray(array, response.item);
                localStorage.setItem('listFromLocalStorage', JSON.stringify(array));

                localStorage.setItem('listCount', localStorage.getItem('listCount') - 1);
                document.querySelector('#js-count').innerText = localStorage.getItem('listCount');

                helper.showMessage(chrome.i18n.getMessage('CREATING_ITEM'));
            });
    }
}

const item = new Item();
