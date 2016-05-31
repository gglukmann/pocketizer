var __request_code;
var __access_token_string;

/**
* Gets content from localStorage and from Pocket API to see if there are newer links
*/
function getContent () {
  xmlhttp = makeXmlhttprequest("POST", "https://getpocket.com/v3/get", true);
  // check if time from last check exists, then update from that time, else update all
  if (localStorage.getItem('timeFromLastCheck')) {
    xmlhttp.send("consumer_key=" + consumer_key + "&" + __access_token_string + "&sort=newest&state=unread&since=" + localStorage.getItem('timeFromLastCheck'));
  } else {
    xmlhttp.send("consumer_key=" + consumer_key + "&" + __access_token_string + "&sort=newest&state=unread");
  }

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
      // set time from last check eq time now to localstorage (unix timestamp)
      localStorage.setItem('timeFromLastCheck', Math.floor(Date.now() / 1000));

      let a = JSON.parse(xmlhttp.response);
      let b = [];

      if (localStorage.getItem('listFromLocalStorage')) {
        b = JSON.parse(localStorage.getItem('listFromLocalStorage'));
      }

      Object.keys(a.list).forEach(function(key) {
        b.push(a.list[key]);
      });

      // TODO: sort by date added
      localStorage.setItem('listFromLocalStorage', JSON.stringify(b));

      render();
    } else {
      console.log(xmlhttp);
    }
  }

  document.getElementById("status").innerHTML = "Update successful!";
  setTimeout(function () {
    document.getElementById("status").innerHTML = "";
  }, 2000);
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
    let title;

    if (a[key].resolved_title == '' && a[key].given_title == '') {
      title = a[key].resolved_url;
    } else if (a[key].resolved_title == '' && a[key].given_title != '') {
      title = a[key].given_title;
    } else {
      title = a[key].resolved_title;
    }

    let textNode = document.createTextNode(title);
    let excerptNode = document.createTextNode(a[key].excerpt);
    let linkNode = document.createTextNode(a[key].resolved_url);

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

    listElement.appendChild(itemElement);

    // li.item
    //   div.item__content
    //     a.item__fake-link
    //     a.item__title
    //     div.item__excerpt
  });
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

  document.getElementById("status").innerHTML = "Updating..."
  consumer_key = getPocketConsumerKey();
  getRequestCode(consumer_key);
}

window.onload = function(){
  importPocket();
};
