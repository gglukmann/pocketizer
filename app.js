var __request_code;
var __access_token_string;

// TODO: logout
// TODO: what happends when clicking small browser_action icon 
/**
* Gets content from localStorage and from Pocket API to see if there are newer links
*/
function getContent (page = 'list') {
  let state;
  switch (page) {
    case 'list':
    state = 'unread';
    break;
    case 'archive':
    state = 'archive';
    break;
  }
  xmlhttp = makeXmlhttprequest("POST", "https://getpocket.com/v3/get", true);
  xmlhttp.send("consumer_key=" + consumer_key + "&" + __access_token_string + "&state=" + state);

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

      switch (page) {
        case 'list':
        localStorage.setItem('listFromLocalStorage', JSON.stringify(b));
        render('list');
        break;
        case 'archive':
        localStorage.setItem('archiveListFromLocalStorage', JSON.stringify(b));
        render('archive');
        break;
      }

      showSuccessMessage('Synchronize');
      document.getElementById('default-message').style.display = 'none';
    } else {
      console.log(xmlhttp);
    }
  }
}

/**
* Renders from localStorage
*/
function render (page) {
  let a;
  let listElement;

  switch (page) {
    case 'list':
    a = JSON.parse(localStorage.getItem('listFromLocalStorage'));
    listElement = document.getElementById('list');
    break;
    case 'archive':
    a = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));
    listElement = document.getElementById('archive-list');
    break;
  }
  listElement.innerHTML = "";

  if (a.length == 0) {
    document.getElementById('empty-list-message').style.display = 'block';
  } else {
    document.getElementById('empty-list-message').style.display = 'none';
  }

  Object.keys(a).forEach(function(key) {
    let itemElement = document.createElement('li');
    let contentElement = document.createElement('div');
    let excerptElement = document.createElement('div');
    let titleElement = document.createElement('a');
    let linkElement = document.createElement('a');
    let fakeLinkElement = document.createElement('a');
    let readButtonElement = document.createElement('a');
    let deleteButtonElement = document.createElement('a');
    let favouriteElement = document.createElement('a');
    let timeElement = document.createElement('div');
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
    favouriteElement.setAttribute('class', 'item__favourite js-toggleFavouriteButton');
    favouriteElement.setAttribute('href', '#0');
    favouriteElement.setAttribute('title', 'Toggle favourited state');
    favouriteElement.setAttribute('data-id', a[key].item_id);
    contentElement.appendChild(favouriteElement);

    let textNode = document.createTextNode(title);
    let excerptNode = document.createTextNode(a[key].excerpt);
    let linkNode = document.createTextNode(a[key].resolved_url);
    let timeNode = document.createTextNode(timeConverter(a[key].time_added));
    let readNode;
    let isRead = false;
    let deleteNode = document.createTextNode('Delete');
    switch (page) {
      case 'list':
      readNode = document.createTextNode('Mark as read');
      isRead = false;
      break;
      case 'archive':
      readNode = document.createTextNode('Mark unread')
      isRead = true;
      break;
    };

    timeElement.setAttribute('class', 'item__time');
    timeElement.setAttribute('title', 'Date added');
    timeElement.appendChild(timeNode);

    readButtonElement.setAttribute('class', 'item__set-read js-toggleReadButton');
    readButtonElement.setAttribute('href', '#0');
    readButtonElement.setAttribute('data-id', a[key].item_id);
    readButtonElement.setAttribute('data-read', isRead);
    readButtonElement.appendChild(readNode);

    deleteButtonElement.setAttribute('class', 'item__delete js-deleteButton');
    deleteButtonElement.setAttribute('href', '#0');
    deleteButtonElement.setAttribute('data-id', a[key].item_id);
    deleteButtonElement.appendChild(deleteNode);

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
    linkElement.setAttribute('title', a[key].resolved_url);
    linkElement.appendChild(linkNode);

    contentElement.appendChild(fakeLinkElement);
    contentElement.appendChild(titleElement);
    contentElement.appendChild(timeElement);
    contentElement.appendChild(excerptElement);
    contentElement.appendChild(linkElement);
    contentElement.appendChild(readButtonElement);
    contentElement.appendChild(deleteButtonElement);

    listElement.appendChild(itemElement);

    // li.item
    //   div.item__content
    //     a.item__favourite
    //     a.item__fake-link
    //     a.item__title
    //     div.item__time
    //     div.item__excerpt
    //     a.item__link
    //     a.item__set-read
    //     a.item__delete
  });

  bindActionClickEvents();
}

/**
* Convert unix time to datetime format dd.mm.yyyy
*/
function timeConverter (UNIX){
  let d = new Date(UNIX * 1000);
  let year = d.getFullYear();
  let month = ('0' + (d.getMonth() + 1)).slice(-2);
  let date = ('0' + d.getDate()).slice(-2);
  return date + '.' + month + '.' + year;
}

/**
* Returns current unix timestamp
*/
function getCurrentUNIX () {
  return Math.floor(Date.now() / 1000);
}

/**
* Binds click events for action buttons
*/
function bindActionClickEvents () {
  var buttonClass = document.getElementsByClassName('js-toggleReadButton');
  for (var i = 0; i < buttonClass.length; i++ ) {
    buttonClass[i].addEventListener('click', function( ev ) {
      ev.preventDefault();
      let id = this.getAttribute('data-id');
      let page = document.getElementById('page').value;

      toggleActionState('read', id, page);
    }, false);
  }

  var deleteButtonClass = document.getElementsByClassName('js-deleteButton');
  for (var i = 0; i < deleteButtonClass.length; i++ ) {
    deleteButtonClass[i].addEventListener('click', function( ev ) {
      ev.preventDefault();
      let id = this.getAttribute('data-id');
      let page = document.getElementById('page').value;

      toggleActionState('delete', id, page);
    }, false);
  }

  var favouriteButtonClass = document.getElementsByClassName('js-toggleFavouriteButton');
  for (var i = 0; i < favouriteButtonClass.length; i++ ) {
    favouriteButtonClass[i].addEventListener('click', function( ev ) {
      ev.preventDefault();
      let id = this.getAttribute('data-id');
      let isFavourited = this.getAttribute('data-favourite');
      let page = document.getElementById('page').value;

      toggleActionState('favourite', id, page, isFavourited);
    }, false);
  }
}

/**
* Toggles items favourited state
*/
function toggleActionState (state, id, page, isFavourited = false) {
  let action;

  if (state == 'read') {
    switch (page) {
      case 'archive':
        action = 'readd';
        document.getElementById("status").innerHTML = "Unarchiving...";
      break;
      case 'list':
        action = 'archive';
        document.getElementById("status").innerHTML = "Archiving...";
      break;
    }
  } else if (state == 'favourite') {
    action = (isFavourited == "true" ? "unfavorite" : "favorite");
    document.getElementById("status").innerHTML = "Processing...";
  } else if (state == 'delete') {
    action = 'delete';
    document.getElementById("status").innerHTML = "Deleting...";
  }

  var actions = [{
    "action": action,
    "item_id": id,
    "time": getCurrentUNIX()
  }];

  xmlhttp = makeXmlhttprequest("POST", "https://getpocket.com/v3/send", true);
  xmlhttp.send("consumer_key=" + consumer_key + "&" + __access_token_string + "&actions=" + JSON.stringify(actions));

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
      let a;

      switch (page) {
        case 'archive':
        a = JSON.parse(localStorage.getItem('archiveListFromLocalStorage'));
        break;
        case 'list':
        a = JSON.parse(localStorage.getItem('listFromLocalStorage'));
        break;
      }

      for (var i = 0; i < a.length; i++) {
        if (a[i].item_id == id) {
          switch (state) {
            case 'read':
            case 'delete':
                a.splice(i, 1);
              break;
            case 'favourite':
                a[i].favorite = (isFavourited == "true" ? 0 : 1);
              break;
          }
        }
      };

      switch (page) {
        case 'archive':
          localStorage.setItem('archiveListFromLocalStorage', JSON.stringify(a));
          render('archive');
          if (state == 'read') {
            showSuccessMessage('Unarchiving');
          } else if (state == 'favourite') {
            showSuccessMessage('Processing');
          } else if (state == 'delete') {
            showSuccessMessage('Deleting');
          }
        break;
        case 'list':
          localStorage.setItem('listFromLocalStorage', JSON.stringify(a));
          render('list');
          if (state == 'read') {
            showSuccessMessage('Archiving');
          } else if (state == 'favourite') {
            showSuccessMessage('Processing');
          } else if (state == 'delete') {
            showSuccessMessage('Deleting');
          }
        break;
      }
    }
  }
}

/**
* Bind menu change click events
*/
function bindMenuClickEvents () {
  var changeMenuButtonClass = document.getElementsByClassName('js-changeMenu');
  for (var i = 0; i < changeMenuButtonClass.length; i++ ) {
    changeMenuButtonClass[i].addEventListener('click', function( ev ) {
      ev.preventDefault();
      let page = this.getAttribute('data-page');

      changePage(page);
    }, false);
  }
}

/**
* Change page from list to archive
*/
function changePage (page) {
  let menuLinkElements = document.getElementsByClassName('menu__link');
  for (var i = 0; i < menuLinkElements.length; i++ ) {
    menuLinkElements[i].classList.remove('menu__link--active');
    if (menuLinkElements[i].getAttribute('data-page') == page) {
      menuLinkElements[i].classList.add('menu__link--active');
    }
  }

  switch (page) {
    case 'list':
    document.getElementById("page").value = "list";
    document.getElementById("title").innerHTML = "My Pocket List";
    document.getElementById("status").innerHTML = "Synchronizing...";
    getContent('list');

    document.getElementById('list').style.display = 'flex';
    document.getElementById('archive-list').style.display = 'none';
    break;
    case 'archive':
    document.getElementById("page").value = "archive";
    document.getElementById("title").innerHTML = "Archive";
    document.getElementById("status").innerHTML = "Synchronizing...";
    getContent('archive');

    document.getElementById('archive-list').style.display = 'flex';
    document.getElementById('list').style.display = 'none';
    break;
  }
}

/**
* Shows success message
*/
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
      getContent('list');
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
  bindMenuClickEvents();

  if (localStorage.getItem('listFromLocalStorage')){
    render('list');
  }
  if (localStorage.getItem('username')) {
    document.getElementById('user-name').innerHTML = localStorage.getItem('username');
  }

  document.getElementById("status").innerHTML = "Synchronizing...";
  consumer_key = getPocketConsumerKey();
  getRequestCode(consumer_key);
}

function bindLoginClickEvent () {
  var loginButtonClass = document.getElementsByClassName('js-login');
  for (var i = 0; i < loginButtonClass.length; i++ ) {
    loginButtonClass[i].addEventListener('click', function( ev ) {
      ev.preventDefault();

      importPocket();
    }, false);
  }
}

window.onload = function () {
  if (localStorage.getItem('username')) {
    document.getElementById('default-message').style.display = 'none';
    importPocket();
  } else {
    document.getElementById('default-message').style.display = 'block';
    bindLoginClickEvent();
  }
};
