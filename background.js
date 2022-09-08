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

chrome.contextMenus.onClicked.addListener((info, win) => {
	console.debug("chrome.contextMenus.onClicked", info.selectionText, info);
});

chrome.action.onClicked.addListener((tab) => {	
	chrome.tabs.reload(tab.id);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("chrome.runtime.onMessage", message);

	if (message.action == "load_config") {	
		chrome.storage.local.get('settings', function(data) {		
			sendResponse({settings: data.settings, message});
		});			
	}
	return true;
});	

chrome.commands.onCommand.addListener((command) => {
	console.debug('Command:', command);
	
	if (command == "reset_pade") {
		chrome.runtime.reload();
	}
});	