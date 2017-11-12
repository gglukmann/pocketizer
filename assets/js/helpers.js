/**
* Create HTMLElement
* @method createNode
* @param  {String} element Element type
* @return {HTMLElement}         Created HTMLElement
*/
function createNode(element) {
    return document.createElement(element);
}

/**
* Create text node
* @method createTextNode
* @param  {String} element Text to add to HTMLElement
* @return {Object}         Created text node
*/
function createTextNode(element) {
    return document.createTextNode(element);
}

/**
* Append element to parent
* @method append
* @param  {HTMLElement} parent Parent element
* @param  {HTMLElement} el     Child element
* @return {HTMLElement}        Element with appended child
*/
function append(parent, el) {
    return parent.appendChild(el);
}

/**
* Convert unix time to datetime format dd.mm.yyyy
* @method timeConverter
* @param  {Number} UNIX Unix timestamp
* @return {Number}      dd.mm.yyyy
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
* @method getCurrentUNIX
* @return {Number} Current time unix timestamp
*/
function getCurrentUNIX() {
    return Math.floor(Date.now() / 1000);
}
