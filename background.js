// -------------------------------------------------------
//
//  General services worker listeners
//
// -------------------------------------------------------

self.addEventListener('install', function(event) {
    console.debug('activate', event);
});
self.addEventListener('activate', function (event) {
    console.debug('activate', event);
});

self.addEventListener('message', function (event) {
	console.debug('message', event.data);
})

// -------------------------------------------------------
//
//  chrome listeners
//
// -------------------------------------------------------

chrome.action.onClicked.addListener(() => {
	console.debug("chrome.action.onClicked.addListener");	
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.debug("chrome.runtime.onMessage", message);	
});	

chrome.contextMenus.onClicked.addListener((info, win) => {
	console.debug("chrome.contextMenus.onClicked", info.selectionText, info);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

	const notRunWithinTheLastSecond = (url, dt) => {
		const diff = dt - chrome._LAST_RUN[url]
		
		if (diff < 1000){
			return false
		} else {
			return true
		}
	}
	
	if (!chrome._LAST_RUN) chrome._LAST_RUN = {}
	
	if (!chrome._LAST_RUN[tab.url] || notRunWithinTheLastSecond(tab.url, new Date())) {
	
		if (tab.status == "complete" && tab.url.indexOf("/project-deserve") > -1 && tab.url.startsWith("https://github.com/")) {
			console.debug("chrome.tabs.onUpdated.addListener", tab);	
			
			chrome.scripting.insertCSS({
				target: {tabId: tabId, allFrames: false},
				files: ["./converse.css", "./tingle.min.css"]
			},
			(injectionResults) => {
				console.debug('css injectionResults', injectionResults);
			});	

			chrome.scripting.executeScript({
				injectImmediately: true,
				target: {tabId: tabId, allFrames: false},
				files: ["./webcomponents-bundle.js", "./tingle.min.js", "./libsignal-protocol.min.js", "./converse.js", "./emojis.js", "./packages/jitsimeet/jitsimeet.js", "./packages/actions/actions.js", "./packages/location/location.js", "./extension.js"]
			},
			(injectionResults) => {
				console.debug('js injectionResults', injectionResults);
			});	
			
			chrome._LAST_RUN[tab.url]= new Date();
		}
	}
});