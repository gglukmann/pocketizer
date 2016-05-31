var __request_code;
var __access_token_string;

/**
* Gets content from localStorage and from Pocket API to see if there are newer links
*/
function getContent () {
  xmlhttp = makeXmlhttprequest("POST", "https://getpocket.com/v3/get", true);
  xmlhttp.send("consumer_key=" + consumer_key + "&" + __access_token_string + "&state=unread");

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
      let a = JSON.parse(xmlhttp.response);
      let b = [];

      Object.keys(a.list).forEach(function(key) {
        b.push(a.list[key]);
      });

      b.sort(function(x, y) {
        return x.sort_id - y.sort_id;
      });

      localStorage.setItem('listFromLocalStorage', JSON.stringify(b));

      render();

      showSuccessMessage('Synchronize');
    } else {
      console.log(xmlhttp);
    }
  }
}

/**
* Renders from localStorage
*/
function render () {
  let a = JSON.parse(localStorage.getItem('listFromLocalStorage'));
  let listElement = document.getElementById('list');
  listElement.innerHTML = "";

  Object.keys(a).forEach(function(key) {
    let itemElement = document.createElement('li');
    let contentElement = document.createElement('div');
    let excerptElement = document.createElement('div');
    let titleElement = document.createElement('a');
    let linkElement = document.createElement('a');
    let fakeLinkElement = document.createElement('a');
    let readButtonElement = document.createElement('a');
    let favouriteElement = document.createElement('a');
    let title;

    if (a[key].resolved_title == '' && a[key].given_title == '') {
      title = a[key].resolved_url;
    } else if (a[key].resolved_title == '' && a[key].given_title != '') {
      title = a[key].given_title;
    } else {
      title = a[key].resolved_title;
    }

    if (a[key].favorite == 1) {
      favouriteElement.setAttribute('data-favourite', 'true');
    } else {
      favouriteElement.setAttribute('data-favourite', 'false');
    }
    favouriteElement.setAttribute('class', 'item__favourite js-markAsFavouriteButton');
    favouriteElement.setAttribute('href', '#0');
    favouriteElement.setAttribute('title', 'Toggle favourited state');
    favouriteElement.setAttribute('data-id', a[key].item_id);
    contentElement.appendChild(favouriteElement);

    let textNode = document.createTextNode(title);
    let excerptNode = document.createTextNode(a[key].excerpt);
    let linkNode = document.createTextNode(a[key].resolved_url);
    let readNode = document.createTextNode('Mark as read');

    readButtonElement.setAttribute('class', 'item__set-read js-markAsReadButton');
    readButtonElement.setAttribute('href', '#0');
    readButtonElement.setAttribute('data-id', a[key].item_id);
    readButtonElement.appendChild(readNode);

    itemElement.setAttribute('class', 'item');
    contentElement.setAttribute('class', 'item__content');
    itemElement.appendChild(contentElement);

    fakeLinkElement.setAttribute('href', a[key].resolved_url);
    fakeLinkElement.setAttribute('class', 'item__fake-link');

    titleElement.setAttribute('href', a[key].resolved_url);
    titleElement.setAttribute('class', 'item__title');
    titleElement.appendChild(textNode);
    excerptElement.setAttribute('class', 'item__excerpt');
    excerptElement.appendChild(excerptNode);
    linkElement.setAttribute('class', 'item__link');
    linkElement.setAttribute('href', a[key].resolved_url);
    linkElement.appendChild(linkNode);

    contentElement.appendChild(fakeLinkElement);
    contentElement.appendChild(titleElement);
    contentElement.appendChild(excerptElement);
    contentElement.appendChild(linkElement);
    contentElement.appendChild(readButtonElement);

    listElement.appendChild(itemElement);

    // li.item
    //   div.item__content
    //     a.item__fake-link
    //     a.item__title
    //     div.item__excerpt
  });

  bindReadClickEvents();
}

/**
* Binds click events for action buttons
*/
function bindReadClickEvents () {
  var buttonClass = document.getElementsByClassName('js-markAsReadButton');
  for (var i = 0; i < buttonClass.length; i++ ) {
    buttonClass[i].addEventListener('click', function( ev ) {
      ev.preventDefault();
      let id = this.getAttribute('data-id');

      markAsRead(id);
    }, false);
  }

  var favouriteButtonClass = document.getElementsByClassName('js-markAsFavouriteButton');
  for (var i = 0; i < favouriteButtonClass.length; i++ ) {
    favouriteButtonClass[i].addEventListener('click', function( ev ) {
      ev.preventDefault();
      let id = this.getAttribute('data-id');
      let isFavourited = this.getAttribute('data-favourite');

      toggleFavouritedState(id, isFavourited);
    }, false);
  }
}

/**
* Marks items as read
*/
function markAsRead (id) {
  document.getElementById("status").innerHTML = "Archiving...";

  var actions = [{
    "action": "archive",
    "item_id": id,
    "time": Math.floor(Date.now() / 1000)
  }];

  xmlhttp = makeXmlhttprequest("POST", "https://getpocket.com/v3/send", true);
  xmlhttp.send("consumer_key=" + consumer_key + "&" + __access_token_string + "&actions=" + JSON.stringify(actions));

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
      let a = JSON.parse(localStorage.getItem('listFromLocalStorage'));

      for (var i = 0; i < a.length; i++) {
        if (a[i].item_id == id) {
          a.splice(i, 1);
        }
      };

      localStorage.setItem('listFromLocalStorage', JSON.stringify(a));

      render();

      showSuccessMessage('Archiving');
    }
  }
}

/**
* Toggles items favourited state
*/
function toggleFavouritedState (id, isFavourited) {
  document.getElementById("status").innerHTML = "Processing...";

  var action = (isFavourited == "true" ? "unfavorite" : "favorite");

  var actions = [{
    "action": action,
    "item_id": id,
    "time": Math.floor(Date.now() / 1000)
  }];

  xmlhttp = makeXmlhttprequest("POST", "https://getpocket.com/v3/send", true);
  xmlhttp.send("consumer_key=" + consumer_key + "&" + __access_token_string + "&actions=" + JSON.stringify(actions));

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
      let a = JSON.parse(localStorage.getItem('listFromLocalStorage'));

      for (var i = 0; i < a.length; i++) {
        if (a[i].item_id == id) {
          a[i].favorite = (isFavourited == "true" ? 0 : 1);
        }
      };

      localStorage.setItem('listFromLocalStorage', JSON.stringify(a));

      render();

      showSuccessMessage('Processing');
    }
  }
}

function showSuccessMessage (message) {
  document.getElementById("status").innerHTML = message + " successful!";
  setTimeout(function () {
    document.getElementById("status").innerHTML = "";
  }, 2000);
}

function getRedirectUrl () {
  return chrome.identity.getRedirectURL();
}

function getPocketConsumerKey () {
  return "55040-ed8b0dbe5ae62e1c6ed82f28";
}

function makeXmlhttprequest (method, url, flag) {
  xmlhttp = new XMLHttpRequest();
  xmlhttp.open(method, url, flag);
  xmlhttp.setRequestHeader( "Content-type","application/x-www-form-urlencoded" );
  return xmlhttp;
}

function getRequestCode (consumer_key) {
  redirect_url = getRedirectUrl();
  xmlhttp = makeXmlhttprequest ('POST', 'https://getpocket.com/v3/oauth/request', true)
  xmlhttp.onreadystatechange = function () {
    if ( xmlhttp.readyState === 4 ) {

      if (xmlhttp.status === 200) {
        request_code = xmlhttp.responseText.split('=')[1];
        __request_code = request_code;
        lauchChromeWebAuthFlowAndReturnAccessToken(request_code);
      } else {
        document.getElementById("status").innerHTML = "Authentication failed!"
      }
    }
  }
  xmlhttp.send("consumer_key="+ consumer_key +"&redirect_uri="+ redirect_url)
}

function getAccessToken () {
  xmlhttp = makeXmlhttprequest('POST', 'https://getpocket.com/v3/oauth/authorize', true);
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      access_token_string = xmlhttp.responseText.split('&')[0];
      __access_token_string = access_token_string;

      let user_string = xmlhttp.responseText.split('&')[1];
      let user_name = decodeURIComponent(user_string.split('=')[1]);
      if (localStorage.getItem('username') != user_name) {
        localStorage.setItem('username', user_name);
        document.getElementById('user-name').innerHTML = user_name;
      }

      // get content from pocket api
      getContent();
    }
  }
  xmlhttp.send( "consumer_key="+ consumer_key +"&code="+ request_code )
}

function lauchChromeWebAuthFlowAndReturnAccessToken (request_code) {
  redirect_url = getRedirectUrl();
  chrome.identity.launchWebAuthFlow({'url': "https://getpocket.com/auth/authorize?request_token="+ request_code + "&redirect_uri="+ redirect_url, 'interactive': true}, function(redirect_url) {
    getAccessToken(consumer_key, request_code);
  });
}

function importPocket () {
  if (localStorage.getItem('listFromLocalStorage')){
    render();
  }
  if (localStorage.getItem('username')) {
    document.getElementById('user-name').innerHTML = localStorage.getItem('username');
  }

  document.getElementById("status").innerHTML = "Synchronizing..."
  consumer_key = getPocketConsumerKey();
  getRequestCode(consumer_key);
}

window.onload = function(){
  importPocket();
};
