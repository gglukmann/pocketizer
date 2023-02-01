// Called when the user clicks on the browser action.
chrome.action.onClicked.addListener(async () => {
    chrome.tabs.create({ url: 'index.html' });
});
