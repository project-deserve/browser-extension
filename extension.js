if (!window._converse) {
	let $iq, $msg, $pres, _ , __, dayjs, converse_html, _converse, hostname = location.hostname, host = location.host, loginModal;
		
	var converse_api = (function(api)
	{
		window.addEventListener("unload", function()  {
			console.debug("converse_api addListener unload");
		});
		
		window.addEventListener("DOMContentLoaded", function()  {
			console.debug("converse_api addListener DOMContentLoaded");
		});

		window.addEventListener("load", function()  {
			console.debug("converse_api addListener load");				
		});
			
		function setupConverse(username)    {	
			console.debug("setupConverse", username);
			
			var config =
			{
				theme: 'concord',
				assets_path: ".",			
				allow_non_roster_messaging: true,
				loglevel: 'info',
				authentication: 'anonymous',
				auto_login: true,
				discover_connection_methods: false,					
				jid:  hostname,
				default_domain: hostname,
				domain_placeholder: hostname,
				locked_domain: hostname,
				auto_away: 300,
				auto_reconnect: true,
				nickname: username,
				bosh_service_url: location.protocol + '//' + host + '/http-bind/',
				auto_join_rooms:['deserve_chat@conference.' + hostname],
				auto_join_private_chats: [],
				message_archiving: 'always',
				websocket_url: (host == "localhost:7070" || location.protocol == "http:" ? "ws://" : "wss://") + host + '/ws/',
				jitsimeet_url: 'https://pade.chat:5443/ofmeet',
				whitelisted_plugins: ['deserve', 'jitsimeet', 'actions', 'location']
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
						//const response = await fetch("https://api.github.com/repos/project-deserve/clinic-alpha-one/issues");
						//const issues = await response.json();							
						//console.debug("github rest api - issues", issues);						
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
		
		function getCredentials(callback) {
			const template = 
	`			<div class="modal-header">
					<h4 class="modal-title">Project Deserve - Login</h4>
				</div>
				<div class="modal-body">
					<form id="login_user" class="form-inline">
						<div class="form-group">
							<label for="user_name">Name</label>
							<input id="user_name" class="form-control" type="text"/>
						</div>
						<div class="form-group">
							<label for="user_password">Access Code</label>
							<input id="user_password" class="form-control" type="text"/>
						</div>
					</form>
				</div>
			`;

			if (!loginModal) {
				loginModal = new tingle.modal({
					footer: true,
					stickyFooter: false,
					closeMethods: ['overlay', 'button', 'escape'],
					closeLabel: 'Login',

					beforeOpen: function () {
						console.debug("beforeOpen");
					}
				});

				loginModal.setContent(template);

				loginModal.addFooterBtn("Login", 'tingle-btn tingle-btn-primary', () => {
					const username = document.querySelector('#user_name').value;
					const password = document.querySelector('#user_password').value;

					console.debug("Login", username);	
					callback(username, password);
					loginModal.close();				
				});

				loginModal.addFooterBtn("Close", 'tingle-btn tingle-btn-secondary', () => {
					loginModal.close();
				});
			}

			loginModal.open();
		}	

		//-------------------------------------------------------
		//
		//  Startup
		//
		//-------------------------------------------------------

		const div = document.createElement('div');
		const container = "#conversejs .converse-chatboxes {bottom: 45px;}\n";
		const control = "#conversejs.converse-overlayed .toggle-controlbox {display: none;}\n";
		const chatroom = "#conversejs .chat-head-chatroom, #conversejs.converse-embedded .chat-head-chatroom { background-color: #eee; }\n";
		const chatbox = "#conversejs.converse-overlayed #minimized-chats .minimized-chats-flyout .chat-head { background-color: #eee;}";

		div.innerHTML = '<style>' + control + chatroom + chatbox + '</style><div id="conversejs" class="theme-concord"></div>';
		document.body.appendChild(div);
			
		if (hostname != "localhost") {
			hostname = "pade.chat";
			host = "pade.chat:5443";			
		}	
		
		//const userid = document.querySelector(".avatar.avatar-user")?.parentNode.innerText.replaceAll("\n","").trim();		
		const userid = document.querySelector('meta[name="user-login"]')?.getAttribute("content");
		if (userid) setupConverse(userid);	
		return api;

	}(converse_api || {}));
}