var __request_code;
var __access_token_string;

/**
* Gets content from localStorage and Pocket API to see if there are newer links
*/
function get_content () {
  xmlhttp = make_xmlhttprequest("POST", "https://getpocket.com/v3/get", true)
  xmlhttp.send("consumer_key=" + consumer_key + "&" + __access_token_string + "&sort=newest&count=10&state=unread");
  // &since=" + new Date().getTime()

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
      // TODO: check if new, then add, else do nothing
      if (localStorage){
        // TODO: create array and add only items to localstorage
        localStorage.setItem('listFromLocalStorage', JSON.stringify(xmlhttp.response));
      }
      add_to_list(xmlhttp.response);
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
function add_to_list (data) {
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

function get_redirect_url () {
  return chrome.identity.getRedirectURL();
}

function get_pocket_consumer_key () {
  return "55040-ed8b0dbe5ae62e1c6ed82f28";
}

function make_xmlhttprequest (method, url, flag) {
  xmlhttp = new XMLHttpRequest();
  xmlhttp.open(method, url, flag);
  xmlhttp.setRequestHeader( "Content-type","application/x-www-form-urlencoded" );
  return xmlhttp;
}

function get_request_code (consumer_key) {
  redirect_url = get_redirect_url();
  xmlhttp = make_xmlhttprequest ('POST', 'https://getpocket.com/v3/oauth/request', true)
  xmlhttp.onreadystatechange = function () {
    if ( xmlhttp.readyState === 4 ) {

      if (xmlhttp.status === 200) {
        request_code = xmlhttp.responseText.split('=')[1];
        __request_code = request_code;
        lauch_chrome_webAuthFlow_and_return_access_token(request_code);
      } else {
        document.getElementById("status").innerHTML = "Authentication failed!"
      }
    }
  }
  xmlhttp.send("consumer_key="+ consumer_key +"&redirect_uri="+ redirect_url)
}

function get_access_token () {
  xmlhttp = make_xmlhttprequest('POST', 'https://getpocket.com/v3/oauth/authorize', true);
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      access_token_string = xmlhttp.responseText.split('&')[0];
      __access_token_string = access_token_string;

      // get content from pocket api
      get_content();
    }
  }
  xmlhttp.send( "consumer_key="+ consumer_key +"&code="+ request_code )
}

function lauch_chrome_webAuthFlow_and_return_access_token (request_code) {
  redirect_url = get_redirect_url();
  chrome.identity.launchWebAuthFlow ({'url': "https://getpocket.com/auth/authorize?request_token="+ request_code + "&redirect_uri="+ redirect_url, 'interactive': true}, function(redirect_url) {
    get_access_token(consumer_key, request_code);
  });
}

function import_pocket () {
  if (localStorage && localStorage.getItem('listFromLocalStorage')){
    render(JSON.parse(localStorage.getItem('listFromLocalStorage')));
  }

  document.getElementById("status").innerHTML = "Updating..."
  consumer_key = get_pocket_consumer_key();
  get_request_code(consumer_key);
}

window.onload = function(){
  import_pocket();
};
