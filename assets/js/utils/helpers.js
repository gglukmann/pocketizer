/**
 * Shows success message.
 *
 * @function showMessage
 * @param {String} message - Message text first part.
 * @param {Boolean} isSuccess - If is success or fail.
 * @param {Boolean} hasSuffix - If has suffix.
 * @param {Boolean} hasEnding - If should be removed after 2 seconds.
 * @param {Number} timeout - Timeout for how long to show message.
 * @return {void}
 */
export function showMessage(message, isSuccess = true, hasSuffix = true, hasEnding = true, timeout = 2000) {
    if (hasSuffix) {
        message += ` ${chrome.i18n.getMessage(isSuccess ? 'SUCCESSFUL' : 'FAILED')}!`;
    }

    const statusElement = document.querySelector('#js-status');
    statusElement.innerText = message;

    if (hasEnding) {
        setTimeout(() => {
            statusElement.innerText = '';
        }, timeout);
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
export function replaceI18n(obj, tag, attribute = false) {
    const msg = tag.replace(/__MSG_(\w+)__/g, (match, v1) => {
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
export function localizeHtml() {
    const data = document.querySelectorAll('[data-translate]');

    for (const i in data) {
        if (data.hasOwnProperty(i)) {
            const obj = data[i];
            const tag = obj.dataset.translate.toString();

            this.replaceI18n(obj, tag);
        }
    }

    // Localize whitelisted attributes by replacing all __MSG_***__ tags
    const whiteListAttributes = ['title', 'placeholder'];

    for (const whiteListedAttribute of whiteListAttributes) {
        const attributes = [...document.querySelectorAll('[' + whiteListedAttribute + ']')];

        for (const attr of attributes) {
            const tag = attr.getAttribute(whiteListedAttribute);

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
export async function makeFetch(url, options) {
    try {
        const response = await window.fetch(url, options);
        if (!response.ok) {
            throw { response };
        }
        return await response.json();
    } catch (event) {
        console.error(event);
        throw { response: event.response };
    }
}

/**
 * Create HTMLElement.
 *
 * @function createNode
 * @param {String} element - Element type.
 * @return {HTMLElement} - Created HTMLElement.
 */
export function createNode(element) {
    return document.createElement(element);
}

/**
 * Create text node.
 *
 * @function createTextNode
 * @param {String} element - Text to add to HTMLElement.
 * @return {Object} - Created text node.
 */
export function createTextNode(element) {
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
export function append(parent, el) {
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
export function prepend(parent, el) {
    return parent.prepend(el);
}

/**
 * Prepend element to array.
 *
 * @function prependArray
 * @param {Array[]} array - Array where to add.
 * @param {*} value - Value to add to array.
 * @return {Array[]} - Array with prepended item.
 */
export function prependArray(array, value) {
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
export function timeConverter(UNIX) {
    const d = new Date(UNIX * 1000);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const date = ('0' + d.getDate()).slice(-2);
    return date + '.' + month + '.' + year;
}

/**
 * Returns current unix timestamp in seconds.
 *
 * @function getCurrentUNIX
 * @return {Number} - Current time unix timestamp in seconds.
 */
export function getCurrentUNIX() {
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
export function calcTimeDifference(date1, date2) {
    return parseInt(date1, 10) - parseInt(date2, 10);
}

/**
 * Disable window scrolling.
 *
 * @function disableScroll
 * @param {Boolean} hideScrollbar - If scrollbar should be hidden.
 * @returns {void}
 */
export function disableScroll(hideScrollbar) {
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
export function enableScroll() {
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
export function addClass(element, className) {
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
export function removeClass(element, className) {
    if (typeof className === 'object') {
        element.classList.remove(...className);
        return;
    }

    element.classList.remove(className);
}

/**
 * Toggle class from HTMLElement.
 *
 * @function toggleClass
 * @param {Element} element - HTMLElement.
 * @param {String} className - Class name to toggle.
 * @returns {void}
 */
export function toggleClass(element, className) {
    element.classList.toggle(className);
}

/**
 * Hide element.
 *
 * @function hide
 * @param {Element|HTMLElement} element - Element to hide.
 * @return {void}
 */
export function hide(element) {
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
export function show(element, doRemove, display = 'block') {
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
export function clearChildren(element) {
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
export function checkInternetConnection() {
    return window.navigator.onLine;
}

/**
 * Set to storage.
 *
 * @function setToStorage
 * @param {String | Number} key
 * @param {String | Number | Boolean} value
 * @return {void}
 */
export function setToStorage(key, value) {
    localStorage.setItem(key, value);
}

/**
 * Get from storage.
 *
 * @function getFromStorage
 * @param {String | Number} key
 * @return {String | Number | Boolean}
 */
export function getFromStorage(key) {
    return localStorage.getItem(key);
}

/**
 * Remove from storage.
 *
 * @function removeFromStorage
 * @param {String | Number} key
 * @return {String | Number} - Given key.
 */
export function removeFromStorage(key) {
    localStorage.removeItem(key);
    return key;
}

/**
 * Get future date.
 *
 * @function getFutureDate
 * @param {Number} days - Days count to add
 * @return {Date} - Date object of future.
 */
export function getFutureDate(days) {
    const now = new Date();
    now.setDate(now.getDate() + parseInt(days, 10));

    return now;
}

/**
 * Shuffle array.
 *
 * @export
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
export function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Transform object to array.
 *
 * @function transformArray
 * @param {Object} items - Object to transform.
 * @return {Array} - Array from object.
 */
export function transformObjectToArray(items) {
    let array = [];
    for (const key in items) {
        array.push(items[key]);
    }
    return array;
}
