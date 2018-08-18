class Helper {
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
     * @param {String|Boolean} attribute Attribute name if used for translation.
     * @return {void}
     */
    replaceI18n(obj, tag, attribute = false) {
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

        for (let whiteListedAttribute of whiteListAttributes) {
            let attributes = [...document.querySelectorAll('[' + whiteListedAttribute + ']')];

            for (let attr of attributes) {
                let tag = attr.getAttribute(whiteListedAttribute);

                this.replaceI18n(attr, tag, whiteListedAttribute);
            }
        }
    }

    /**
     * Make async fetch.
     *
     * @function makeFetch
     * @param {String} url - Url to make fetch to.
     * @param {Object} options - Fetch body.
     * @return {JSON} Fetch response in JSON.
     */
    static async makeFetch(url, options) {
        try {
            return await window.fetch(url, options);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    /**
     * Create HTMLElement.
     *
     * @function createNode
     * @param {String} element - Element type.
     * @return {HTMLElement} - Created HTMLElement.
     */
    static createNode(element) {
        return document.createElement(element);
    }

    /**
     * Create text node.
     *
     * @function createTextNode
     * @param {String} element - Text to add to HTMLElement.
     * @return {Object} - Created text node.
     */
    static createTextNode(element) {
        return document.createTextNode(element);
    }

    /**
     * Append element to parent.
     *
     * @function append
     * @param {Element|Node} parent - Parent element.
     * @param {Element|Node|Object} el - Child element.
     * @return {Element} - Element with appended child.
     */
    static append(parent, el) {
        return parent.appendChild(el);
    }

    /**
     * Prepent element to parent.
     *
     * @function prepend
     * @param {Element} parent - Parent element.
     * @param {Element} el - Child element.
     * @return {Element} - Element with appended child.
     */
    static prepend(parent, el) {
        return parent.prepend(el);
    }

    /**
     * Prepend element to array.
     *
     * @function prepend
     * @param {Array[]} array - Array where to add.
     * @param {*} value - Value to add to array.
     * @return {Array[]} - Array with prepended item.
     */
    static prependArray(array, value) {
        let newArray = array.slice();
        newArray.unshift(value);

        return newArray;
    }

    /**
     * Convert unix time to datetime format dd.mm.yyyy.
     *
     * @function timeConverter
     * @param {Number} UNIX - Unix timestamp in seconds.
     * @return {String} - dd.mm.yyyy.
     */
    static timeConverter(UNIX){
        let d = new Date(UNIX * 1000);
        let year = d.getFullYear();
        let month = ('0' + (d.getMonth() + 1)).slice(-2);
        let date = ('0' + d.getDate()).slice(-2);
        return date + '.' + month + '.' + year;
    }

    /**
     * Returns current unix timestamp in seconds.
     *
     * @function getCurrentUNIX
     * @return {Number} - Current time unix timestamp in seconds.
     */
    static getCurrentUNIX() {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * Calculate time difference between two unix timestamps in seconds.
     *
     * @function calcTimeDifference
     * @param {Number | String} date1
     * @param {Number | String} date2
     * @return {Number} - Time difference in seconds.
     */
    static calcTimeDifference(date1, date2) {
        return parseInt(date1, 10) - parseInt(date2, 10);
    }

    /**
     * Disable window scrolling.
     *
     * @function disableScroll
     * @param {Boolean} hideScrollbar - If scrollbar should be hidden.
     * @returns {void}
     */
    static disableScroll(hideScrollbar) {
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
    static enableScroll() {
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
     * @param {Element} element - HTMLElement.
     * @param {String} className - Class name to add.
     * @returns {void}
     */
    static addClass(element, className) {
        element.classList.add(className);
    }

    /**
     * Remove class from HTMLElement.
     *
     * @function removeClass
     * @param {Element} element - HTMLElement.
     * @param {String} className - Class name to remove.
     * @returns {void}
     */
    static removeClass(element, className) {
        if (typeof className === 'object') {
            element.classList.remove(...className);
            return;
        }

        element.classList.remove(className);
    }

    /**
     * Hide element.
     *
     * @function hide
     * @param {Element|HTMLElement} element - Element to hide.
     * @return {void}
     */
    static hide(element) {
        element.style.display = 'none';
    }

    /**
     * Show element.
     *
     * @function hide
     * @param {Element|HTMLElement} element - Element to show.
     * @param {Boolean} doRemove - If remove style to show element.
     * @param {String} display - CSS display property.
     * @return {void}
     */
    static show(element, doRemove, display = 'block') {
        if (doRemove) {
            return element.removeAttribute('style');
        }

        element.style.display = display;
    }

    /**
     * Clear HTML inside element.
     *
     * @function clearChildren
     * @param {Element|HTMLElement} element - Element to clear children.
     * @return {void}
     */
    static clearChildren(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    /**
     * Check if connected to internet.
     *
     * @function checkInternetConnection
     * @param {*} navigator - Navigator object from window.
     * @return {Boolean} - If is online.
     */
    static checkInternetConnection(navigator) {
        return navigator.onLine;
    }

    /**
     * Set to storage.
     *
     * @function setToStorage
     * @param {String | Number} key
     * @param {String | Number | Boolean} value
     * @return {void}
     */
    static setToStorage(key, value) {
        localStorage.setItem(key, value);
    }

    /**
     * Get from storage.
     *
     * @function getFromStorage
     * @param {String | Number} key
     * @return {String | Number | Boolean}
     */
    static getFromStorage(key) {
        return localStorage.getItem(key);
    }

    /**
     * Remove from storage.
     *
     * @function removeFromStorage
     * @param {String | Number} key
     * @return {String | Number} - Given key.
     */
    static removeFromStorage(key) {
        localStorage.removeItem(key);
        return key;
    }
}

const helper = new Helper();
