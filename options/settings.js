let hidDevice = null;
let streamDeck = null;

window.addEventListener("load", function()
{
    console.debug("options loaded");
	
	document.getElementById("avatar").addEventListener("click", () => {
		location.href= "./../index.html";
	});	
})

window.addEventListener("unload", function ()
{
    console.debug("options unloaded");
});

window.addEvent("domready", function () {

    document.getElementById("settings-label").innerHTML = chrome.i18n.getMessage('settings')

    doDefaults();

    new FancySettings.initWithManifest(function (settings)
    {				
        settings.manifest.pade_save.addEvent("action", function ()  
		{
			console.debug("storeSetting", name);
			let settings = {};
			
			chrome.storage.local.get('settings', function(data) {
				if (data.settings) settings = data.settings;
				
				settings["pade_server_url"] = getSetting("pade_server_url");
				settings["pade_access_token"] = getSetting("pade_access_token");
				settings["pade_domain"] = getSetting("pade_domain");

				chrome.storage.local.set({settings: settings}, function() {
				  console.debug('chrome.storage is set for settings', settings);	
                  chrome.runtime.reload();				  
				});
			});			
		})


        settings.manifest.factoryReset.addEvent("action", function ()  
		{
            if (confirm("Reset?")) {
                sessionStorage.clear();
                localStorage.clear();                
				chrome.storage.local.clear();	
				
                chrome.runtime.reload();
            }
        });		
	});
});


function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function doDefaults()
{
    setDefaultSetting("pade_server_url", "https://pade.chat:5443");	
    setDefaultSetting("pade_domain", "pade.chat");		
    setDefaultSetting("pade_contry_code", "en-GB");		
}

function setSetting(name, value)
{
    console.debug("setSetting", name, value);
    window.localStorage["store.settings." + name] = JSON.stringify(value);
}

function setDefaultSetting(name, defaultValue)
{
    console.debug("setDefaultSetting", name, defaultValue, window.localStorage["store.settings." + name]);

    if (!window.localStorage["store.settings." + name] && window.localStorage["store.settings." + name] != false)
    {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }
}

function getSetting(name, defaultValue)
{
    console.debug("getSetting", name);
    var value = defaultValue ? defaultValue : null;

    if (window.localStorage["store.settings." + name])  {
        value = JSON.parse(window.localStorage["store.settings." + name]);
    }

    return value;
}

function removeSetting(name)
{
    localStorage.removeItem("store.settings." + name);
}
