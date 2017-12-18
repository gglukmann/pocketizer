'use strict';

class TrendingItem {
    /**
     * Create new trending item.
     *
     * @function create
     * @param  {Object} element - Element to create.
     * @return {HTMLElement} - Created element.
     */
    create(element) {
        let itemElement = helper.createNode('li');
        let contentElement = helper.createNode('div');
        let fakeLinkElement = helper.createNode('a');
        let backgroundElement = helper.createNode('div');
        let titleElement = helper.createNode('a');
        let sourceElement = helper.createNode('a');
        let saveElement = helper.createNode('a');

        // parent elements
        itemElement.setAttribute('class', 'item item--trending');
        contentElement.setAttribute('class', 'item__content');
        helper.append(itemElement, contentElement);

        // fake link
        fakeLinkElement.setAttribute('href', element.resolved_url);
        fakeLinkElement.setAttribute('class', 'item__link-fake');

        // background
        backgroundElement.style.backgroundImage = 'url(' + element.images[1].src + ')';
        backgroundElement.setAttribute('class', 'item__background js-lazyload');

        // title
        let titleNode = helper.createTextNode(element.title);
        titleElement.setAttribute('href', element.resolved_url);
        titleElement.setAttribute('title', element.title);
        titleElement.setAttribute('class', 'item__title');
        helper.append(titleElement, titleNode);

        // source
        sourceElement.setAttribute('class', 'item__link-source');
        let sourceNode = helper.createTextNode(element.resolved_url);
        sourceElement.setAttribute('href', element.resolved_url);
        sourceElement.setAttribute('title', element.resolved_url);
        helper.append(sourceElement, sourceNode);

        // save to pocket
        saveElement.setAttribute('class', 'item__link-save');
        let saveNode = helper.createTextNode(chrome.i18n.getMessage('SAVE_TO_POCKET'));
        saveElement.setAttribute('href', '#0');
        saveElement.dataset.link = element.resolved_url;
        saveElement.setAttribute('title', element.resolved_url);
        saveElement.setAttribute('id', 'js-addNewFromTrendingItem');
        // svg
        let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.setAttribute('viewBox', '0 0 26 26');
        svgElement.setAttribute('class', 'icon item__link-svg');
        let pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute('d', 'M26,4a2,2,0,0,0-2-2H2A2,2,0,0,0,0,4v9c0,0.1,0,.2,0,0.4s0,0.4,0,.6c0,4,5.8,11,13,11s13-7,13-11c0-.2,0-0.4,0-0.6s0-.2,0-0.4V4Zm-5.5,7-6,6a1.9,1.9,0,0,1-2.9,0l-6-6A1.7,1.7,0,0,1,8,8.5l5,5,5-5a1.7,1.7,0,0,1,2.5,0h0A1.7,1.7,0,0,1,20.5,11Z');
        helper.append(svgElement, pathElement);
        helper.append(saveElement, svgElement);
        helper.append(saveElement, saveNode);

        // append everything to parent
        helper.append(contentElement, fakeLinkElement);
        helper.append(contentElement, backgroundElement);
        helper.append(contentElement, titleElement);
        helper.append(contentElement, sourceElement);
        helper.append(contentElement, saveElement);

        return itemElement;
    }

    /**
     * Render item to DOM.
     *
     * @function render
     * @param  {HTMLElement} itemElement - Element to render.
     * @return {HTMLElement} - Rendered element.
     */
    render(itemElement) {
        const listElement = document.querySelector('#js-trendingList');

        return helper.append(listElement, itemElement);
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
}

const trendingItem = new TrendingItem();
