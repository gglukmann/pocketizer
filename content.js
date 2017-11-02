chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);
        if (request.message === "clicked_browser_action") {
            chrome.runtime.sendMessage({"message": "open_new_tab"});
        }
    }
);
