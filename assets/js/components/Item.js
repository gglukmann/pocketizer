import * as helpers from '../utils/helpers.js';
import * as globals from '../utils/globals.js';
import pocket from '../App.js';
import { modal, tags, search, settings } from './index.js';
import { apiService } from '../services/index.js';

class Item {
    /**
     * @constructor
     */
    constructor() {
        this.timeout = false;
        this.submitTags = this.handleSaveTagsClick.bind(this);
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
        document.tagsForm.addEventListener('submit', this.submitTags, false);
    }

    /**
     * Remove all events.
     *
     * @function removeEvents
     * @return {void}
     */
    removeEvents() {
        document.tagsForm.removeEventListener('submit', this.submitTags, false);
    }

    /**
     * Create new item and append to list.
     *
     * @param {Object} element - Element from pocket.
     * @return {HTMLElement} - Created element.
     */
    create(element) {
        const itemElement = helpers.createNode('li');
        const contentElement = helpers.createNode('a');
        const favouriteElement = helpers.createNode('a');
        const titleElement = helpers.createNode('h3');
        const timeAndTagsWrapperElement = helpers.createNode('div');
        const tagLinkElement = helpers.createNode('a');
        const timeElement = helpers.createNode('div');
        const linkElement = helpers.createNode('a');
        const readButtonElement = helpers.createNode('a');
        const deleteButtonElement = helpers.createNode('a');
        const pocketLinkElement = helpers.createNode('a');

        let link;
        if (element.resolved_url && element.resolved_url !== '') {
            link = element.resolved_url;
        } else {
            link = element.given_url;
        }

        // favourite
        favouriteElement.setAttribute('data-favourite', element.favorite === '1' ? 'true' : 'false');
        favouriteElement.setAttribute('class', 'item__favourite js-toggleFavouriteButton');
        favouriteElement.setAttribute('href', '#0');
        favouriteElement.setAttribute(
            'title',
            element.favorite === '1' ? chrome.i18n.getMessage('UNFAVOURITE') : chrome.i18n.getMessage('FAVOURITE')
        );
        favouriteElement.setAttribute('data-id', element.item_id);

        // title
        let title;
        if (element.title) {
            title = element.title;
        } else if (element.resolved_title && element.resolved_title !== '') {
            title = element.resolved_title;
        } else if (element.resolved_url && element.resolved_url !== '') {
            title = element.resolved_url;
        } else if (!element.resolved_title && !element.resolved_url) {
            title = element.given_url;
        }

        const titleTextNode = helpers.createTextNode(title);

        titleElement.setAttribute('class', 'item__title');
        helpers.append(titleElement, titleTextNode);

        // time and tags wrapper
        timeAndTagsWrapperElement.setAttribute('class', 'item__time-and-tags');

        //time
        if (element.time_added) {
            let timeNode = helpers.createTextNode(helpers.timeConverter(element.time_added));
            timeElement.setAttribute('title', chrome.i18n.getMessage('DATE_ADDED'));
            helpers.append(timeElement, timeNode);
        }

        // tags
        tagLinkElement.setAttribute('href', '#0');
        tagLinkElement.setAttribute('class', 'item__tags js-tagsButton');
        tagLinkElement.setAttribute('data-id', element.item_id);
        if (element.tags) {
            const tagsArray = [];
            for (const tag in element.tags) {
                if (element.tags.hasOwnProperty(tag)) {
                    tagsArray.push(tag);
                }
            }
            tagLinkElement.setAttribute('data-tags', tagsArray);
        }
        tagLinkElement.setAttribute('title', chrome.i18n.getMessage('TAGS'));
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute('viewBox', '0 0 541.9 541.9');
        svgElement.setAttribute('class', 'icon item__tags-svg');
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute(
            'd',
            'M84.7,121.2c-20.1,0-36.4-16.3-36.4-36.4c0-20.1,16.3-36.5,36.5-36.5c20.1,0,36.4,16.3,36.4,36.4C121.2,104.9,104.9,121.3,84.7,121.2z M526.3,299.6c-1.6-2.4-3.4-4.7-5.6-6.9L260.2,32.3c-17-17-50.6-31.5-74.7-32.3L42.4,0C18.4-0.7-0.7,18.4,0,42.4l0,143.1c0.8,24.1,15.3,57.7,32.3,74.7l260.5,260.5c2.1,2.1,4.4,4,6.8,5.6c28.6,22.3,70.1,20.6,96.3-5.6l124.8-124.9C547,369.7,548.6,328.2,526.3,299.6z'
        );
        helpers.append(svgElement, pathElement);
        helpers.append(tagLinkElement, svgElement);

        helpers.append(timeAndTagsWrapperElement, timeElement);
        helpers.append(timeAndTagsWrapperElement, tagLinkElement);

        // excerpt or image
        let excerptElement = helpers.createNode('div');
        if ((element.has_image === '1' || element.has_image === '2') && element.image) {
            excerptElement = helpers.createNode('figure');
            excerptElement.setAttribute('class', 'item__excerpt item__excerpt--image-wrapper');
            const imageElement = helpers.createNode('img');
            imageElement.setAttribute('class', 'item__excerpt-image');
            imageElement.setAttribute('src', element.image.src);
            imageElement.setAttribute('loading', 'lazy');
            imageElement.setAttribute('alt', title);
            helpers.append(excerptElement, imageElement);
        } else if (element.excerpt) {
            excerptElement.setAttribute('class', 'item__excerpt');
            let excerptNode = helpers.createTextNode(element.excerpt);
            helpers.append(excerptElement, excerptNode);
        }

        // mark as read/unread link
        let readNode;
        let isRead = false;

        switch (pocket.getActivePage()) {
            case globals.PAGES.LIST:
                readNode = helpers.createTextNode(chrome.i18n.getMessage('MARK_READ'));
                isRead = false;
                break;
            case globals.PAGES.ARCHIVE:
                readNode = helpers.createTextNode(chrome.i18n.getMessage('MARK_UNREAD'));
                isRead = true;
                break;
        }

        readButtonElement.setAttribute('href', '#0');
        readButtonElement.setAttribute('class', 'item__link item__link--set-read js-toggleReadButton');
        readButtonElement.setAttribute('data-id', element.item_id);
        readButtonElement.setAttribute('data-read', isRead);
        readButtonElement.setAttribute(
            'title',
            isRead ? chrome.i18n.getMessage('MARK_UNREAD') : chrome.i18n.getMessage('MARK_READ')
        );
        helpers.append(readButtonElement, readNode);

        // delete link
        const deleteNode = helpers.createTextNode(chrome.i18n.getMessage('DELETE'));
        deleteButtonElement.setAttribute('href', '#0');
        deleteButtonElement.setAttribute('class', 'item__link item__link--delete js-deleteButton');
        deleteButtonElement.setAttribute('data-id', element.item_id);
        deleteButtonElement.setAttribute('title', chrome.i18n.getMessage('DELETE'));
        helpers.append(deleteButtonElement, deleteNode);

        // open in pocket link
        const pocketLinkNode = helpers.createTextNode(chrome.i18n.getMessage('OPEN_IN_POCKET'));
        pocketLinkElement.setAttribute('href', 'https://app.getpocket.com/read/' + element.item_id);
        pocketLinkElement.setAttribute('class', 'item__link item__link--open-pocket');
        pocketLinkElement.setAttribute('title', chrome.i18n.getMessage('OPEN_IN_POCKET'));
        helpers.append(pocketLinkElement, pocketLinkNode);

        // domain link
        let domain = link.replace(/^(https?:|)\/\//, '');
        domain = domain.split('/')[0];
        const linkNode = helpers.createTextNode(domain);
        linkElement.setAttribute('href', link);
        linkElement.setAttribute('class', 'item__link');
        linkElement.setAttribute('title', link);
        helpers.append(linkElement, linkNode);

        // item
        contentElement.setAttribute('href', link);
        contentElement.setAttribute('data-id', element.item_id);
        contentElement.setAttribute('class', 'item js-link');
        helpers.append(itemElement, contentElement);

        // footer
        const footerElement = helpers.createNode('div');
        footerElement.setAttribute('class', 'item__footer');

        const titleWrapperElement = helpers.createNode('div');
        helpers.append(titleWrapperElement, titleElement);

        // append everything to item
        helpers.append(contentElement, titleWrapperElement);
        helpers.append(contentElement, timeAndTagsWrapperElement);
        helpers.append(contentElement, excerptElement);
        helpers.append(footerElement, pocketLinkElement);
        helpers.append(footerElement, deleteButtonElement);
        helpers.append(footerElement, linkElement);
        helpers.append(footerElement, readButtonElement);
        helpers.append(contentElement, footerElement);
        helpers.append(contentElement, favouriteElement);

        return itemElement;
    }

    /**
     * Append element to list.
     *
     * @param {HTMLElement} itemElement - Element to render.
     * @param {String} list - List type.
     * @param {Boolean} doPrepend - If item has to be prepended.
     * @return {*}
     */
    render(itemElement, list = globals.PAGES.LIST, doPrepend = false) {
        const listSelector = '#js-' + list;
        const listElement = document.querySelector(listSelector);

        if (doPrepend) {
            return helpers.prepend(listElement, itemElement);
        }

        return helpers.append(listElement, itemElement);
    }

    /**
     * Add new item to Pocket.
     *
     * @function addNewItem
     * @param {Object} data - Link in object.
     * @return {void}
     */
    async add(data) {
        const response = await apiService.add(data);

        modal.close();

        let array = JSON.parse(helpers.getFromStorage('listFromLocalStorage'));
        array = helpers.prependArray(array, response.item);
        helpers.setToStorage('listFromLocalStorage', JSON.stringify(array));

        helpers.setToStorage('listCount', (parseInt(helpers.getFromStorage('listCount'), 10) + 1).toString());
        if (pocket.getActivePage() === globals.PAGES.LIST) {
            document.querySelector('#js-count').innerText = helpers.getFromStorage('listCount');
        }

        helpers.showMessage(chrome.i18n.getMessage('CREATING_ITEM'));

        if (pocket.getActivePage() === globals.PAGES.LIST) {
            const createdItem = this.create(response.item);
            let doPrepend = false;

            if (pocket.order === globals.ORDER.ASCENDING) {
                doPrepend = true;
            }

            // array has new item but it is not in dom yet
            // #js-list has .sentinel too
            // that's why array.length and #js-list.childElementCount can be equal
            if (
                pocket.order !== globals.ORDER.ASCENDING &&
                array.length !== document.querySelector('#js-list').childElementCount
            ) {
                return;
            }

            this.render(createdItem, globals.PAGES.LIST, doPrepend);
        }
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
        const id = e.target.dataset.id;
        let isFavourited = e.target.dataset.favourite;
        isFavourited = isFavourited === 'true'; // convert to boolean

        pocket.changeItemState(e, 'favourite', id, isFavourited);
    }

    /**
     * Toggle item between archive and list.
     *
     * @function archive
     * @param {Event} e - Click event.
     * @return {void}
     */
    archive(e) {
        if (!settings.getArchiveAfterOpen()) {
            e.preventDefault();
        }

        const id = e.target.dataset.id;
        pocket.changeItemState(e, 'read', id);
    }

    /**
     * Open modal and delete item.
     *
     * @function delete
     * @param {Event} e - Click event.
     * @return {void}
     */
    delete(e) {
        e.preventDefault();

        if (settings.getAskDeleteConfirmation() === 'enabled') {
            modal.open('#js-deleteModal');

            const newEvent = this.handleDeleteClick.bind(this, e);

            document.querySelector('#js-deleteSubmit').addEventListener('click', newEvent, false);

            document.addEventListener(
                'closed.modal',
                () => {
                    document.querySelector('#js-deleteSubmit').removeEventListener('click', newEvent, false);
                },
                { once: true }
            );
        } else {
            this.handleDeleteClick(e);
        }
    }

    /**
     * Handle delete button click.
     *
     * @function handleDeleteClick
     * @param {Event} e - Delete button from item event.
     * @return {void}
     */
    handleDeleteClick(e) {
        const id = e.target.dataset.id;
        pocket.changeItemState(e, 'delete', id);
    }

    /**
     * Open modal and create click event to submit button.
     *
     * @function addTags
     * @param {Event} e - Click event.
     * @return {void}
     */
    addTags(e) {
        e.preventDefault();
        modal.open('#js-tagsModal');

        const tagsFormElements = document.tagsForm.elements;
        const tagsItemIdInput = tagsFormElements.namedItem('tagsItemId');
        const tagsInput = tagsFormElements.namedItem('tags');

        tagsItemIdInput.value = e.target.dataset.id;

        if (e.target.dataset.tags) {
            tagsInput.value = e.target.dataset.tags;
        }
        tagsInput.focus();

        document.addEventListener(
            'closed.modal',
            () => {
                tagsItemIdInput.value = '';
                tagsInput.value = '';
            },
            { once: true }
        );
    }

    /**
     * Handle tags submit button click.
     *
     * @function handleSaveTagsClick
     * @param {Event} e - Tags button from item event.
     * @return {void}
     */
    handleSaveTagsClick(e) {
        const form = e.target;

        if (form.checkValidity()) {
            e.preventDefault();

            const id = form.elements.namedItem('tagsItemId').value;
            const allTags = form.elements.namedItem('tags').value;
            const newTags = [];

            allTags.split(/\s*,\s*/).forEach((tag) => {
                if (!tag.length) {
                    return;
                }

                tag = tag.trim();
                newTags.push(tag);
                tags.addTag(tag.trim());
            });

            const newTagsString = newTags.join(',');

            pocket.changeItemState(e, 'tags', id, false, newTagsString);
            tags.renderTags();
            this.addTagsToItem();
            modal.close();
        }
    }

    /**
     * Add new tags back to item in DOM.
     *
     * @function addTagsToItem
     * @return {void}
     */
    addTagsToItem() {
        if (!search.hasSearched()) {
            pocket.getContent();
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

const item = new Item();
export default item;
