/**
 * Create HTMLElement.
 *
 * @function createNode
 * @param  {String} element - Element type.
 * @return {HTMLElement} - Created HTMLElement.
 */
function createNode(element) {
    return document.createElement(element);
}

/**
 * Create text node.
 *
 * @function createTextNode
 * @param  {String} element - Text to add to HTMLElement.
 * @return {Object} - Created text node.
 */
function createTextNode(element) {
    return document.createTextNode(element);
}

/**
 * Append element to parent.
 *
 * @function append
 * @param  {HTMLElement} parent - Parent element.
 * @param  {HTMLElement} el - Child element.
 * @return {HTMLElement} - Element with appended child.
 */
function append(parent, el) {
    return parent.appendChild(el);
}

/**
 * Convert unix time to datetime format dd.mm.yyyy.
 *
 * @function timeConverter
 * @param  {Number} UNIX - Unix timestamp.
 * @return {Number} - dd.mm.yyyy.
 */
function timeConverter(UNIX){
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
function getCurrentUNIX() {
    return Math.floor(Date.now() / 1000);
}

/**
 * Shows success message.
 *
 * @function showMessage
 * @param  {String} message - Message text first part.
 * @param {Boolean} isSuccess - If is success or fail.
 * @return {void}
 */
function showMessage(message, isSuccess = true) {
    if (isSuccess) {
        message += " successful!";
    } else {
        message += " failed!";
    }

    document.getElementById('status').innerText = message;

    setTimeout(() => {
        document.getElementById('status').innerText = "";
    }, 2000);
}

/**
 * Replace message key with chrome i18n text.
 *
 * @function replace_i18n
 * @param  {HTMLElement} obj Element with message.
 * @param  {String} tag Message string.
 * @return {void}
 */
function replace_i18n(obj, tag) {
    var msg = tag.replace(/__MSG_(\w+)__/g, (match, v1) => {
        return v1 ? chrome.i18n.getMessage(v1) : '';
    });

    if (msg !== tag) {
        obj.innerHTML = msg;
    }
}

/**
 * Localize by replacing __MSG_***__ meta tags.
 *
 * @function localizeHtml
 * @return {void}
 */
function localizeHtml() {
    // Localize using __MSG_***__ data tags
    var data = document.querySelectorAll('[data-translate]');

    for (var i in data) {
        if (data.hasOwnProperty(i)) {
            var obj = data[i];
            var tag = obj.dataset.translate.toString();

            replace_i18n(obj, tag);
        }
    }

    // Localize everything else by replacing all __MSG_***__ tags
    var page = document.getElementsByTagName('html');

    for (var j = 0; j < page.length; j++) {
        var obj = page[j];
        var tag = obj.innerHTML.toString();

        replace_i18n(obj, tag);
    }
}
