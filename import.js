var __request_code;
var __access_token_string;

/**
* Gets content from localStorage and from Pocket API to see if there are newer links
*/
function getContent () {
  xmlhttp = makeXmlhttprequest("POST", "https://getpocket.com/v3/get", true)
  xmlhttp.send("consumer_key=" + consumer_key + "&" + __access_token_string + "&sort=newest&count=10&state=unread");
  // &since=" + new Date().getTime()

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
      // TODO: check if new, then add, else do nothing
      if (localStorage){
        // TODO: create array and add only items to localstorage
        localStorage.setItem('listFromLocalStorage', JSON.stringify(xmlhttp.response));
      }
      addToList(xmlhttp.response);
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
* Adds to list if new items exist
*/
function addToList (data) {
  let rows = JSON.parse(localStorage.getItem('listFromLocalStorage')) || [];
}

/**
* Renders from localStorage
*/
function render (data) {
  let a = JSON.parse(data);
  let listElement = document.getElementById('list');

  Object.keys(a.list).forEach(function(key) {
    let nodeElement = document.createElement("LI");
    let linkElement = document.createElement('a');
    let textNode = document.createTextNode(a.list[key].resolved_title);

    linkElement.setAttribute('href', a.list[key].resolved_url);
    linkElement.appendChild(textNode);
    nodeElement.appendChild(linkElement);
    listElement.appendChild(nodeElement);
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
  if (localStorage && localStorage.getItem('listFromLocalStorage')){
    render(JSON.parse(localStorage.getItem('listFromLocalStorage')));
  }

  document.getElementById("status").innerHTML = "Updating..."
  consumer_key = getPocketConsumerKey();
  getRequestCode(consumer_key);
}

window.onload = function(){
  importPocket();
};
