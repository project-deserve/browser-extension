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
			let config = {};
			
			chrome.storage.local.get('settings', function(data) {
				if (data.settings) config = data.settings;
				
				config["pade_server_url"] = getSetting("pade_server_url");
				config["pade_access_token"] = getSetting("pade_access_token");
				config["pade_domain"] = getSetting("pade_domain");

				config["pade_username"] = getSetting("pade_username");				
				config["pade_name"] = getSetting("pade_name");				
				config["pade_email"] = getSetting("pade_email");
				config["pade_printer_name"] = getSetting("pade_printer_name");	
				config["pade_enable_converse"] = getSetting("pade_enable_converse");					

				chrome.storage.local.set({settings: config}, function() {
					console.debug('chrome.storage is set for settings', config);

					if (config["pade_enable_converse"]) {
						registerXmppUser(config, (status) => {
							
							if (status === Strophe.Status.REGISTERED || status === Strophe.Status.CONFLICT) {
								settings.manifest.actionResponse.element.innerHTML = "";
								chrome.runtime.reload();
							} else {
								settings.manifest.actionResponse.element.innerHTML = "Unable to create or update user profile. Check data provided - Error code: " + status;
							}
						});		
					} else {
						settings.manifest.actionResponse.element.innerHTML = "Instant messaging disabled";
						chrome.runtime.reload();						
					}						
				});
			});			
		})

        settings.manifest.testPrinter.addEvent("action", function ()  
		{
			const printer = getSetting("pade_printer_name", null);
			
			if (printer) {
				JSPM.JSPrintManager.auto_reconnect = true;
				JSPM.JSPrintManager.start();

				JSPM.JSPrintManager.WS.onStatusChanged = function () 
				{				
					if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Open)
						testPrinter(printer);
					else if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Closed) {
						settings.manifest.actionResponse.element.innerHTML = 'JSPrintManager (JSPM) is not installed or not running! Download JSPM Client App from https://neodynamic.com/downloads/jspm';
						return false;
					}
					else if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Blocked) {
						settings.manifest.actionResponse.element.innerHTML = 'JSPM has blocked this website!';
						return false;
					}					
				};		
			}
        });		

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

function testPrinter(printer) {
	console.debug("testPrinter", printer);

	let cpj = new JSPM.ClientPrintJob();
	cpj.clientPrinter = new JSPM.InstalledPrinter(printer);

	let esc = '\x1B'; 			//ESC byte in hex notation
	let newLine = '\x0A'; 		//LF byte in hex notation

	let cmds = esc + "@"; 		//Initializes the printer (ESC @)
	cmds += esc + '!' + '\x00'; 	//Character font A selected (ESC ! 0)
	cmds += '------------------------------'; 	
	cmds += newLine;	
	cmds += esc + '!' + '\x38'; 	//Emphasized + Double-height + Double-width mode selected (ESC ! (8 + 16 + 32)) 56 dec => 38 hex
	cmds += 'Project Deserve'; 	//text to print
	cmds += newLine + newLine;
	cmds += esc + '!' + '\x00'; 	//Character font A selected (ESC ! 0)
	cmds += 'Nivaquine                 5.00'; 
	cmds += newLine;
	cmds += 'Aspirin                   3.78';
	cmds += newLine + newLine;
	cmds += 'Vitamin D                 8.78';
	cmds += newLine;
	cmds += 'Vitamin K                 0.44';
	cmds += newLine;
	cmds += 'Zinc                      9.22';
	cmds += newLine;
	cmds += 'Vitamin C                10.00';
	cmds += newLine;
	cmds += 'Agbo                      0.78';
	cmds += newLine;
	cmds += esc + '!' + '\x00'; 	//Character font A selected (ESC ! 0)
	cmds += '------------------------------'; 	
	cmds += newLine + newLine;
	
	cpj.printerCommands = cmds;
	cpj.sendToClient();	
}

function registerXmppUser(settings, cb) {
	const url = settings["pade_server_url"] + '/http-bind/';
	const connection = new Strophe.Connection(url);	
	
	const callback = function (status) 
	{
		if (status === Strophe.Status.REGISTER) {
			
			if (validData(settings)) {
				connection.register.fields.username = settings["pade_username"];
				connection.register.fields.name = settings["pade_name"];
				connection.register.fields.email = settings["pade_email"];
				connection.register.fields.password = settings["pade_access_token"];
				connection.register.submit();
			} else {
				cb(-1);
			}
			
		} else if (status === Strophe.Status.REGISTERED) {
			console.debug("callback - registered!");
			connection.disconnect();				
            cb(status);			
			
		} else if (status === Strophe.Status.CONFLICT) {
			console.warn("callback - user already existed!");
			connection.disconnect();				
            cb(status);			
			
		} else if (status === Strophe.Status.NOTACCEPTABLE) {
			console.error("callback - registration form not properly filled out.");
			connection.disconnect();	
            cb(status);					
			
		} else if (status === Strophe.Status.REGIFAIL) {
			console.error("callback - In-Band Registration failed at " + url);
			connection.disconnect();	
            cb(status);	
		}
	};
		
	connection.register.connect(settings["pade_domain"], callback);		
}

function validData(data) {
	let valid = true;
	const settings = Object.getOwnPropertyNames(data);
	console.debug("validData", settings);
			
	for (let setting of settings) {
		console.debug("validData", setting);
		if (!data[setting] || data[setting] == "") valid = false;
	}
	
	return valid;
}

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
