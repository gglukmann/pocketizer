'use strict';

class Helper {
    /**
     * Create HTMLElement.
     *
     * @function createNode
     * @param {String} element - Element type.
     * @return {HTMLElement} - Created HTMLElement.
     */
    createNode(element) {
        return document.createElement(element);
    }

    /**
     * Create text node.
     *
     * @function createTextNode
     * @param {String} element - Text to add to HTMLElement.
     * @return {Object} - Created text node.
     */
    createTextNode(element) {
        return document.createTextNode(element);
    }

    /**
     * Append element to parent.
     *
     * @function append
     * @param {HTMLElement} parent - Parent element.
     * @param {HTMLElement} el - Child element.
     * @return {HTMLElement} - Element with appended child.
     */
    append(parent, el) {
        return parent.appendChild(el);
    }

    /**
     * Prepent element to parent.
     *
     * @function prepend
     * @param {HTMLElement} parent - Parent element.
     * @param {HTMLElement} el - Child element.
     * @return {HTMLElement} - Element with appended child.
     */
    prepend(parent, el) {
        return parent.prepend(el);
    }

    /**
     * Prepend element to array.
     *
     * @function prepend
     * @param {Array[]} array - Array where to add.
     * @param {Any} value - Value to add to array.
     * @return {Array[]} - Array with prepended item.
     */
    prependArray(array, value) {
        let newArray = array.slice();
        newArray.unshift(value);

        return newArray;
    }

    /**
     * Convert unix time to datetime format dd.mm.yyyy.
     *
     * @function timeConverter
     * @param {Number} UNIX - Unix timestamp.
     * @return {Number} - dd.mm.yyyy.
     */
    timeConverter(UNIX){
        let d = new Date(UNIX * 1000);
        let year = d.getFullYear();
        let month = ('0' + (d.getMonth() + 1)).slice(-2);
        let date = ('0' + d.getDate()).slice(-2);
        return date + '.' + month + '.' + year;
    }

    /**
     * Returns current unix timestamp
     *
     * @function getCurrentUNIX
     * @return {Number} - Current time unix timestamp.
     */
    getCurrentUNIX() {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * Shows success message.
     *
     * @function showMessage
     * @param {String} message - Message text first part.
     * @param {Boolean} isSuccess - If is success or fail.
     * @param {Boolean} hasSuffix - If has suffix.
     * @param {Boolean} hasEnding - If should be removed after 2 seconds.
     * @return {void}
     */
    showMessage(message, isSuccess = true, hasSuffix = true, hasEnding = true) {
        if (hasSuffix) {
            if (isSuccess) {
                message += ` ${chrome.i18n.getMessage('SUCCESSFUL')}!`;
            } else {
                message += ` ${chrome.i18n.getMessage('FAILED')}!`;
            }
        }

        const statusElement = document.querySelector('#js-status');
        statusElement.innerText = message;

        if (hasEnding) {
            setTimeout(() => {
                statusElement.innerText = "";
            }, 2000);
        }
    }

    /**
     * Replace message key with chrome i18n text.
     *
     * @function replaceI18n
     * @param {HTMLElement} obj Element with message.
     * @param {String} tag Message string.
     * @param {String} attribute Attribute name if used for translation.
     * @return {void}
     */
    replaceI18n(obj, tag, attribute) {
        let msg = tag.replace(/__MSG_(\w+)__/g, (match, v1) => {
            return v1 ? chrome.i18n.getMessage(v1) : '';
        });

        if (msg !== tag) {
            if (attribute) {
                obj.setAttribute(attribute, msg);
                return;
            }

            obj.textContent = msg;
        }
    }

    /**
     * Localize by replacing __MSG_***__ meta tags.
     *
     * @function localizeHtml
     * @return {void}
     */
    localizeHtml() {
        // Localize using __MSG_***__ data tags
        const data = document.querySelectorAll('[data-translate]');

        for (let i in data) {
            if (data.hasOwnProperty(i)) {
                let obj = data[i];
                let tag = obj.dataset.translate.toString();

                this.replaceI18n(obj, tag);
            }
        }

        // Localize whitelisted attributes by replacing all __MSG_***__ tags
        const whiteListAttributes = ['title', 'placeholder'];

        whiteListAttributes.forEach(whiteListedAttribute => {
            let attributes = [...document.querySelectorAll('[' + whiteListedAttribute + ']')];

            attributes.forEach(attr => {
                let tag = attr.getAttribute(whiteListedAttribute);

                this.replaceI18n(attr, tag, whiteListedAttribute);
            });
        });
    }

    /**
     * Make async fetch.
     *
     * @function makeFetch
     * @param {String} url - Url to make fetch to.
     * @param {Object} options - Fetch body.
     * @return {JSON} Fetch response in JSON.
     */
    async makeFetch(url, options) {
        try {
            return await fetch(url, options);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    /**
     * Disable window scrolling.
     *
     * @function disableScroll
     * @param {Boolean} hideScrollbar - If scrollbar should be hidden.
     * @returns {void}
     */
    disableScroll(hideScrollbar) {
        if (!document.body.classList.contains('scroll-disabled')) {
            const curScroll = window.scrollY;

            this.addClass(document.body, 'scroll-disabled');
            if (hideScrollbar) {
                this.addClass(document.body, 'scroll-disabled--hide-scrollbar');
            }

            document.body.style.top = -curScroll + 'px';
        }
    }

    /**
    * Enable window scrolling.
    *
     * @function enableScroll
    * @returns {void}
    */
    enableScroll() {
        const bodyScroll = parseInt(document.body.style.top, 10);

        this.removeClass(document.body, 'scroll-disabled');
        this.removeClass(document.body, 'scroll-disabled--hide-scrollbar');

        if (bodyScroll) {
            document.documentElement.scrollTop = document.body.scrollTop = -bodyScroll;
            document.body.style.top = 0;
        }
    }

    /**
     * Add class to HTMLElement.
     *
     * @function addClass
     * @param {HTMLElement} element - HTMLElement.
     * @param {String} className - Class name to add.
     * @returns {void}
     */
    addClass(element, className) {
        element.classList.add(className);
    }

    /**
     * Remove class from HTMLElement.
     *
     * @function removeClass
     * @param {HTMLElement} element - HTMLElement.
     * @param {String} className - Class name to remove.
     * @returns {void}
     */
    removeClass(element, className) {
        if (typeof className === 'object') {
            element.classList.remove(...className);
            return;
        }

        element.classList.remove(className);
    }
}

const helper = new Helper();
