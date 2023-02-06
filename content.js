var $iq, $msg, $pres, _ , __, dayjs, converse_html, _converse, exten, config, setupAvatar, videoHolder, video, emailAddress;
const nickColors = {}, anonAvatars = {};

function getSetting(name, value) {
	return value;
}

var converse_api = (function(api)
{
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		console.log("chrome.runtime.onMessage", message);
		
		if (message?.action == "take_photo") {
			takePhoto();
		}
	});
	
	window.addEventListener("unload", function()  {
		console.debug("converse_api addListener unload");
	});
	
	window.addEventListener("DOMContentLoaded", function()  {
		console.debug("converse_api addListener DOMContentLoaded");
	});

	window.addEventListener("load", function()  {
		console.debug("converse_api addListener load");	

		document.addEventListener('click', (event) => {		
			setTimeout(customizeUI, 1000);				
		});
			
		startConverse();
	});
	
	function startConverse() 
	{
		function handleResponse(data) {
			console.debug("handleResponse", data);

			if (data.message && data.settings) {	
				exten = data;			
				sessionStorage.setItem("project.deserve.token", exten.settings.pade_access_token);
				
				customizeUI();	
				
				if (exten.settings.pade_enable_converse) {
					setupConverse();
				}					
			}
		}

		function handleError(error) {
			console.error("handleError", error);
		}		
					
		const username = document.querySelector('meta[name="user-login"]')?.getAttribute("content") || sessionStorage.getItem("project.deserve.user") || "visitor-" + Math.random().toString(36).substr(2, 9);;
		const repository = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]')?.getAttribute("content")?.split("/")[1];	
		
		chrome.runtime.sendMessage({action: 'load_config', username, repository}).then(handleResponse, handleError);			
	}
		
	function setupConverse()    {	
		console.debug("setupConverse", exten);	
				
		config = {
			theme: 'concord',
			assets_path: "./dist",			
			allow_non_roster_messaging: true,
			loglevel: 'info',
			authentication: 'login',
			auto_login: true,
			discover_connection_methods: false,					
			jid:  exten.message.username + "@" + exten.settings.pade_domain,
			password: exten.settings.pade_access_token,
			default_domain: exten.settings.pade_domain,
			domain_placeholder: exten.settings.pade_domain,
			locked_domain: exten.settings.pade_domain,
			auto_away: 300,
			auto_reconnect: true,
			nickname: exten.settings.pade_name,
			bosh_service_url: exten.settings.pade_server_url + '/http-bind/',
			auto_join_rooms:[],
			auto_join_private_chats: [],
			message_archiving: 'always',
			websocket_url: exten.settings.pade_server_url.replaceAll("http", "ws") + '/ws/',
			jitsimeet_url: 'https://pade.chat:5443/ofmeet',
			jitsimeet_modal: true,
			whitelisted_plugins: ['deserve', 'jitsimeet', 'actions']
		}

		if (exten.message.repository) {			
			config.auto_join_rooms = [exten.message.repository + '@conference.' + exten.settings.pade_domain];
		}

		console.debug("converse_api setupConverse", config);

		converse.plugins.add("deserve", {
			dependencies: [],

			initialize: function () {
				_converse = this._converse;
				$iq = converse.env.$iq;
				$msg = converse.env.$msg;
				$pres = converse.env.$pres;
				_ = converse.env._;
				__ = _converse.__;
				dayjs = converse.env.dayjs;
				converse_html = converse.env.html;	
				
				_converse.api.listen.on('connected', async function() {
					const token = sessionStorage.getItem("project.deserve.token");
					console.debug("connected", token);					
		
					setupTimer();					
/*					
					if (token) {
						const response = await fetch("https://api.github.com/orgs/project-deserve/members", {method: "GET", headers: {authorization: token}});
						const members = await response.json();							
						console.debug("github rest api - members", members);	
					}	
*/
				});
				
				_converse.api.listen.on('messageNotification', function (data)
				{
					console.debug("messageNotification", data);
					location.reload();
				})				

				_converse.api.listen.on('chatRoomViewInitialized', function (view)
				{
					console.debug("chatRoomViewInitialized", view);
					addPadeUI();										
				});
				
				_converse.api.listen.on('chatBoxViewInitialized', function (view)
				{
					console.debug("chatBoxViewInitialized", view);
					addPadeUI();					
				});
				
				_converse.api.listen.on('chatBoxClosed', function (chatbox)
				{
					console.debug("chatBoxClosed", chatbox);
					addPadeUI();
				});	

				_converse.api.waitUntil('VCardsInitialized').then(() => {				
					const vcards = _converse.vcards.models;							
					for (let i=0; i < vcards.length; i++) setAvatar(vcards[i]);	
					
				}).catch(function (err) {
					console.error('waiting for VCardsInitialized error', err);
				});	

				_converse.api.listen.on('rosterContactInitialized', function(contact) {
					setAvatar(contact);
				});	

				_converse.api.listen.on('parseMessage', async (stanza, attrs) => {
					return parseStanza(stanza, attrs);
				});	
				
				_converse.api.listen.on('parseMUCMessage', async (stanza, attrs) => {
					return parseStanza(stanza, attrs);
				});				
			}

		});

		converse.initialize( config );		
	};	

	//-------------------------------------------------------
	//
	//  UI
	//
	//-------------------------------------------------------	

	function customizeUI() {		
		modifyTab("Code", "code", "Heath Records");
		modifyTab("Issues", "issues", "Heath Issues");
		modifyTab("Discussions", "discussions", "Doctor Discussions");
		modifyTab("Wiki", "wiki", "Clinical Information");		
		modifyTab("Pull requests", "pull-requests");	
		modifyTab("Actions", "actions");		
		modifyTab("Projects", "projects");		
		modifyTab("Security", "security");		
		modifyTab("Insights", "insights");	
		
		const heading = document.querySelector(".position-relative.js-header-wrapper");
		if (heading) heading.style.setProperty("display", "none", "important");		
		
		const branchTag = document.querySelector(".file-navigation.mb-3.d-flex.flex-items-start  .flex-self-center.flex-self-stretch.d-none.d-lg-flex.flex-items-center.lh-condensed-ultra");
		if (branchTag) branchTag.style.setProperty("display", "none", "important");
		
		const branchSelectMenu = document.querySelector("#branch-select-menu");
		if (branchSelectMenu) branchSelectMenu.style.display = 'none';
		
		const getRepo = document.querySelector("get-repo");
		if (getRepo) getRepo.style.display = 'none';	
		
		const pageheadActions = document.querySelector(".pagehead-actions.flex-shrink-0.d-none.d-md-inline");
		if (pageheadActions) pageheadActions.style.setProperty("display", "none", "important");
		
		const mainbar = document.querySelector("div.Layout-main div.Box.mb-3");
		if (mainbar) mainbar.style.display = 'none';	

		let subdir = document.querySelector('div[data-test-selector="subdirectory-container"] div.Box.mb-3');
		if (subdir) subdir.style.display = 'none';	

		if (location.href.indexOf("/Personal%20Health%20Records") > -1) {
			subdir = document.querySelector('div.Box.mb-3');
			if (subdir) subdir.style.display = 'none';	
		}			
		
		const sidebars = document.querySelectorAll("div.Layout-sidebar .h4.mb-3");
		
		sidebars.forEach((sidebar) => {
			if (sidebar.innerHTML == 'Languages') sidebar.parentNode.style.display = 'none';
			if (sidebar.innerHTML == 'About') sidebar.parentNode.style.display = 'none';			
		})	

		const menu = document.querySelector('ul[data-view-component="true"].UnderlineNav-body.list-style-none');
		const chatButton = document.querySelector("#pade-button");
		
		if (exten?.settings.pade_enable_converse && menu && !chatButton) {
			const ele = document.createElement("li");
			ele.innerHTML = '<a id="pade-button" class="UnderlineNav-item no-wrap js-responsive-underlinenav-item js-selected-navigation-item"><img width="16" src="https://github.com/project-deserve/browser-extension/raw/main/img/logo_32.png" /><span data-content="Pade">Pàdé Dokita</span></a>';
			ele.classList.add("d-inline-flex");
			menu.appendChild(ele);

			ele.addEventListener('click', (event) => {		
				location.reload();				
			});				
		}
		
		if (location.href.indexOf("/issues/") > -1 && location.href.indexOf("/issues/new") == -1) {
			const webcamButton = document.querySelector("#pade-webcam-button");
			
			if (!webcamButton) {
				const ele = document.createElement("li");
				ele.innerHTML = '<a id="pade-webcam-button" class="UnderlineNav-item no-wrap js-responsive-underlinenav-item js-selected-navigation-item"><img width="16" src="https://github.com/project-deserve/browser-extension/raw/main/img/logo_32.png" /><span data-content="Pade">Show Webcam</span></a>';
				ele.classList.add("d-inline-flex");
				menu.appendChild(ele);	
				
				ele.addEventListener('click', (event) => {		
					takePhoto();			
				});	
			}				
			
			customizeIssues();
		}
	}
	
	function customizeIssues() {
		const identities = document.querySelectorAll('h3[dir="auto"]');
		let id = null;
		
		for (identity of identities) {
			//console.debug("customizeIssues", identity.innerText, identity.nextElementSibling?.innerText);

			if (identity.innerText == "Email Address") {
				videoHolder = identity.parentNode;	
				const node = identity.nextElementSibling;
				
				if (node && node.innerHTML.startsWith("<a href=")) {
					emailAddress = node.innerText;
				}					
			}

			if (identity.innerText.indexOf("Patient Appointment:") > -1) {
				const anchor = identity.querySelector('a')?.getAttribute("href");			
				console.debug("customizeIssues", anchor);
				id = anchor.split("/")[8];	
			}
			
			if (identity.innerText == "Identity Number") {			
				const node = identity.nextElementSibling;
				
				if (node && !node.innerHTML.startsWith("<a href=")) {
					id = node.innerText;
					node.innerHTML = `<a href="https://github.com/project-deserve/clinic-alpha-one/tree/main/Personal%20Health%20Records/${id}">${id}</a>&nbsp;&nbsp;<h1><button id="print_registration">Print</button></h1>`;

					const printButton = node.querySelector('#print_registration');					
					
					if (printButton) printButton.addEventListener('click', (event) => {		
						printRegistration(id);
					});
				}
			}
		}

		const h1Divs = document.querySelectorAll('h1[dir="auto"]');
		let element = null;
		
		for (h1Div of h1Divs) 
		{			
			if (id && h1Div.innerHTML == "Prescription") {
				const prescription = h1Div.nextElementSibling.innerText;
				h1Div.innerHTML = `<button data-prescription="${prescription}" id="pade_print_prescription">Print</button>&nbsp;&nbsp;<button data-prescription="${prescription}" id="pade_email_prescription">Email</button>`;
				element = h1Div;
			}
		}	

		if (id && element) {
			const printPrescriptionButton = element.querySelector('#pade_print_prescription');					
			const emailPrescriptionButton = element.querySelector('#pade_email_prescription');		
			console.debug("prescription buttons", printPrescriptionButton, emailPrescriptionButton);
				
			if (emailPrescriptionButton) emailPrescriptionButton.addEventListener('click', (event) => {		
				const prescription = event.target.getAttribute("data-prescription") + "\n\n";
				console.debug("email", prescription);
				location.href = `mailto:${emailAddress}?subject=Project Deserve Prescription&body=${prescription}`
			});
			
			
			if (printPrescriptionButton) printPrescriptionButton.addEventListener('click', (event) => {		
				const prescription = event.target.getAttribute("data-prescription");
				console.debug("printing", prescription);
				
				if (exten.settings.pade_printer_name) {
					JSPM.JSPrintManager.auto_reconnect = true;
					JSPM.JSPrintManager.start();

					JSPM.JSPrintManager.WS.onStatusChanged = function () 
					{				
						if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Open)
							printPrescription(id, prescription);
						else if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Closed) {
							alert('JSPrintManager (JSPM) is not installed or not running! Download JSPM Client App from https://neodynamic.com/downloads/jspm');
							return false;
						}
						else if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Blocked) {
							alert('JSPM has blocked this website!');
							return false;
						}					
					};		
				}				
			});		
		}
	}
	
	function takePhoto() {

		if (location.href.indexOf("/issues/") > -1) 
		{			
			if (videoHolder) 
			{
				if (!video) {
					video = document.createElement("video");
					video.autoplay = true;
					video.playsinline = true;
					videoHolder.appendChild(video);	
					
					const button = document.createElement("div");
					button.innerHTML = `<button id="pade_take_photo">Take Photo and Paste</button>`;					
					videoHolder.appendChild(button);

					button.addEventListener('click', (event) => {		
						const track = video.srcObject.getVideoTracks()[0];
						const imageCapture = new ImageCapture(track);

						imageCapture.grabFrame().then(function (bitmap) {
							console.debug('customizeIssues snapping bitmap', bitmap);	
							
							const canvas = document.createElement('canvas');
							canvas.width = bitmap.width;
							canvas.height = bitmap.height;	
							
							const context = canvas.getContext('2d');
							context.drawImage(bitmap, 0, 0);	

							canvas.toBlob(function (blob) {
								navigator.clipboard.write([
									new ClipboardItem({
										'image/png': blob
									})
								]);	
							});													
						})						
					});

					navigator.mediaDevices.getUserMedia({video: true, audio: false}).then((stream) => {
						console.debug('customizeIssues stream: ', stream, video);				
						video.srcObject = stream;
					})
					.catch(error => {
					  console.error('customizeIssues error: ', error);
					});	
				}					
			}
		}			
	}
	
	function printRegistration(id) {
		console.debug("printRegistration", exten.settings.pade_printer_name, id);
		
		let cpj = new JSPM.ClientPrintJob();
		cpj.clientPrinter = new JSPM.InstalledPrinter(exten.settings.pade_printer_name);

		let esc = '\x1B'; 			//ESC byte in hex notation
		let newLine = '\x0A'; 		//LF byte in hex notation

		let cmds = esc + "@"; 		//Initializes the printer (ESC @)
		cmds += esc + '!' + '\x00'; 	
		cmds += '-------------------------------'; 	
		cmds += newLine;	
		cmds += esc + '!' + '\x38'; 	//Emphasized + Double-height + Double-width mode selected (ESC ! (8 + 16 + 32)) 56 dec => 38 hex
		cmds += 'Project Deserve'; 	
		cmds += newLine;	
		cmds += esc + '!' + '\x08'; 			
		cmds += id;				
		cmds += newLine;			
		cmds += '-------------------------------'; 	
		cmds += newLine + newLine;
		
		cpj.printerCommands = cmds;
		cpj.sendToClient();		
	}
	
	function printPrescription(id, prescription) {	
		console.debug("printPrescription", exten.settings.pade_printer_name, id, prescription);

		let cpj = new JSPM.ClientPrintJob();
		cpj.clientPrinter = new JSPM.InstalledPrinter(exten.settings.pade_printer_name);

		let esc = '\x1B'; 			//ESC byte in hex notation
		let newLine = '\x0A'; 		//LF byte in hex notation

		let cmds = esc + "@"; 		//Initializes the printer (ESC @)
		cmds += esc + '!' + '\x00'; 	
		cmds += '-------------------------------'; 	
		cmds += newLine;	
		cmds += esc + '!' + '\x38'; 	//Emphasized + Double-height + Double-width mode selected (ESC ! (8 + 16 + 32)) 56 dec => 38 hex
		cmds += 'Project Deserve'; 	
		cmds += newLine;	
		cmds += esc + '!' + '\x08'; 			
		cmds += id;			
		cmds += newLine + newLine;	
		cmds += esc + '!' + '\x00'; 			
		cmds += prescription;	
		cmds += newLine;			
		cmds += '-------------------------------'; 	
		cmds += newLine + newLine;
		
		cpj.printerCommands = cmds;
		cpj.sendToClient();		
	}
	
	function newElement(el, id, html, className) {
		const ele = document.createElement(el);
		if (id) ele.id = id;
		if (html) ele.innerHTML = html;
		if (className) ele.classList.add(className);
		document.body.appendChild(ele);
		return ele;
	}	
	
	function modifyTab(before, id, after) {
		const parent = document.querySelector('#' + id + '-tab');		
		const code = document.querySelector('#' + id + '-tab span[data-content="' + before + '"]');
		
		if (code) {			
			if (after) {
				code.innerHTML = after;			
			} else parent.style.display = 'none';
		}
	}	
	
	function createConverse() {		
		const div = document.createElement('div');
		const control = "#conversejs.converse-overlayed .toggle-controlbox {display: none;}\n";
		const chatroom = "#conversejs .chat-head-chatroom, #conversejs.converse-embedded .chat-head-chatroom { background-color: #eee; }\n";
		const chatbox = "#conversejs.converse-overlayed #minimized-chats .minimized-chats-flyout .chat-head { background-color: #eee;}";

		div.innerHTML = '<style>' + control + chatroom + chatbox + '</style><div id="conversejs" class="theme-concord"></div>';
		document.body.appendChild(div);				
	}
	
	function setAvatar(contact) {
		//console.debug("setAvatar - old", contact);	
		
		if (_converse.DEFAULT_IMAGE == contact.get('image') && contact.get('jid')) {
			let label = contact.get('jid');
			
			if (_converse.connection.jid.startsWith(contact.get('jid'))) {
				label = exten.message.username;
			}
			else
			
			if (contact.get('fullname')) {
				label = contact.get('fullname');
			}
			else
				
			if (contact.get('nickname')) {
				label = contact.get('nickname');
			}
			else {
				const pos = contact.get('jid').indexOf("/");
												
				if (pos > -1) {
					label = contact.get('jid').substring(pos + 1);
				}
			}

			const dataUri = createAvatar(label);
			const avatar = dataUri.split(";base64,");

			contact.save("image", avatar[1]);
			contact.save("image_type", "image/png");
			
			console.debug("setAvatar - new", contact);				
		}		
	}	
	
	async function parseStanza(stanza, attrs) {
		return attrs;
	}	

	function addPadeUI() {	

	}	
	
	function setupTimer() {	
		//console.debug("setupTimer render");
		setupTimeAgo();	
		renderReactions();						
		setTimeout(setupTimer, 10000);	
	}

	function setupTimeAgo() {
		//console.debug("timeago render");
		timeago.cancel();
		const locale = navigator.language.replace('-', '_');
		
		const elements = document.querySelectorAll('.chat-msg__time');
		
		for (let i=0; i < elements.length; i++)
		{
			if (!elements[i].querySelector('.chat-msg__time_span')) {
				const timestamp = elements[i].getAttribute('timestamp');	
				const pretty_time = elements[i].innerHTML;				
				const timeAgo = timeago.format(new Date(pretty_time));
				elements[i].innerHTML = '<span class="chat-msg__time_span" title="' + pretty_time + '" datetime="' + timestamp + '">' + timeAgo + '</span>';
			}
		}
		
		timeago.render(document.querySelectorAll('.chat-msg__time_span'), locale);
	}
	
	function renderAvatars() {
		//console.debug("renderAvatars");		
		const avatars = document.querySelectorAll(".message.chat-msg.delayed.groupchat.chat-msg--with-avatar");		
		
		for (avatar of avatars) {
			if (!avatar.querySelector('img')) {			
				const from = Strophe.getResourceFromJid(avatar.getAttribute("data-from"));
				let datauri = anonAvatars[from];
				
				if (!datauri) {
					datauri = createAvatar(from);
					anonAvatars[from] = datauri;					
				}
				const node = avatar.querySelector("converse-avatar");	
				
				if (node) {					
					node.innerHTML = "<img width='40' src='" + datauri + "' />";
				}
			}
		}
	}

	function renderReactions() {
		const models = _converse.chatboxes.models;	
		//console.debug("rections render", models);
		const msgReactions = new Map();

		for (model of models)
		{
			if (model.messages) 
			{
				for (message of model.messages.models)
				{
					const reactionId = message.get('reaction_id');	
					const reactionEmoji = message.get('reaction_emoji');
					
					if (reactionId) 
					{
						//console.debug("renderReactions", model.get('id'), reactionId, reactionEmoji);
						
						if (!msgReactions.has(reactionId)) {
							msgReactions.set(reactionId, {emojis: new Map(), reactionId});
						}
						
						const emojis = msgReactions.get(reactionId).emojis;
						
						if (!emojis.has(reactionEmoji)) {
							emojis.set(reactionEmoji, {count: 0, code: converse.env.utils.shortnamesToEmojis(reactionEmoji)});
						}					
						
						emojis.get(reactionEmoji).count++;						
					}
				}
			}
		}

		for (const reaction of msgReactions.values()) {
			//console.debug("rections item", reaction);		
			const el = document.querySelector('[data-msgid="' + reaction.reactionId + '"]');	
			
			if (el) {			
				let reactionDiv = el.querySelector('.pade-reaction');
				
				if (!reactionDiv) {
					const msgText = el.querySelector('.chat-msg__text');
					reactionDiv = newElement('div', null, null, 'pade-reaction');	
					msgText.insertAdjacentElement('afterEnd', reactionDiv);
				}			
					
				let div = "";
				
				for (const emoji of reaction.emojis.values()) {	
					//console.debug("rections emoji", emoji);	
					div = div + '<span class="chat-msg__reaction">' + emoji.code + '&nbsp' + emoji.count + '</span>';
				}
				
				reactionDiv.innerHTML = div;	
			}
		}
	}
	
	function setupMUCAvatars() {
		let elements = document.querySelectorAll('.list-item.controlbox-padded');	
		console.debug("setupMUCAvatars", elements);	
			
		for (let i=0; i < elements.length; i++)
		{
			if (!elements[i].querySelector('.pade-avatar')) {		
				const jid = elements[i].getAttribute('data-room-jid') || elements[i].getAttribute('data-headline-jid');
				console.debug("setupMUCAvatars", jid);		
				
				if (jid) {
					const img = createAvatar(jid);
					const avatar = newElement('span', null, '<img style="border-radius: var(--avatar-border-radius); margin-right: 10px;" src="' + img + '" class="avatar avatar" width="30" height="30" />', 'pade-avatar');
					elements[i].prepend(avatar);
				}
			}			
		}	
	}	
	
	function createAvatar(nickname, width, height, font) {
		console.debug("createAvatar", nickname);	
		
		if (_converse.vcards)
		{
			let vcard = _converse.vcards.findWhere({'jid': nickname});
			if (!vcard) vcard = _converse.vcards.findWhere({'nickname': nickname});
			if (vcard && vcard.get('image') && _converse.DEFAULT_IMAGE != vcard.get('image')) return "data:" + vcard.get('image_type') + ";base64," + vcard.get('image');
		}	

		if (!nickname) nickname = "Unknown";
		nickname = nickname.toLowerCase();

		if (!width) width = 128;
		if (!height) height = 128;
		if (!font) font = "64px Arial";

		var canvas = document.createElement('canvas');
		canvas.style.display = 'none';
		canvas.width = width;
		canvas.height = height;
		document.body.appendChild(canvas);
		var context = canvas.getContext('2d');
		context.fillStyle = getRandomColor(nickname);
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.font = font;
		context.fillStyle = "#fff";
		context.textAlign = "center";		

		var first, last, pos = nickname.indexOf("@");
		if (pos > 0) nickname = nickname.substring(0, pos);

		// try to split nickname into words at different symbols with preference
		let words = nickname.split(/[, ]/); // "John W. Doe" -> "John "W." "Doe"  or  "Doe,John W." -> "Doe" "John" "W."
		if (words.length == 1) words = nickname.split("."); // "John.Doe" -> "John" "Doe"  or  "John.W.Doe" -> "John" "W" "Doe"
		if (words.length == 1) words = nickname.split("-"); // "John-Doe" -> "John" "Doe"  or  "John-W-Doe" -> "John" "W" "Doe"

		if (words && words[0] && words.first != '') {
			const firstInitial = words[0][0]; // first letter of first word
			var lastInitial = null; // first letter of last word, if any

			const lastWordIdx = words.length - 1; // index of last word
			
			if (lastWordIdx > 0 && words[lastWordIdx] && words[lastWordIdx] != '') {
				lastInitial = words[lastWordIdx][0]; // first letter of last word
			}

			// if nickname consist of more than one words, compose the initials as two letter
			var initials = firstInitial;
			
			if (lastInitial) {
				// if any comma is in the nickname, treat it to have the lastname in front, i.e. compose reversed
				initials = nickname.indexOf(",") == -1 ? firstInitial + lastInitial : lastInitial + firstInitial;
			}

			const metrics = context.measureText(initials.toUpperCase());
			context.fillText(initials.toUpperCase(), width / 2, (height - metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2 + metrics.actualBoundingBoxAscent);

			var data = canvas.toDataURL();
			document.body.removeChild(canvas);
		}

		return canvas.toDataURL();
	}	
	
	function getRandomColor(nickname) {
		if (nickColors[nickname])
		{
			return nickColors[nickname];
		}
		else {
			var letters = '0123456789ABCDEF';
			var color = '#';

			for (var i = 0; i < 6; i++) {
				color += letters[Math.floor(Math.random() * 16)];
			}
			nickColors[nickname] = color;
			return color;
		}
	}	

	//-------------------------------------------------------
	//
	//  Startup
	//
	//-------------------------------------------------------
	
	createConverse();
	return api;

}(converse_api || {}));