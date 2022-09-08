var $iq, $msg, $pres, _ , __, dayjs, converse_html, _converse, domain, url, userid, repo, token, config;
const PADE = '<svg data-view-component="true" class="octicon octicon-gear UnderlineNav-octicon d-none d-sm-inline" width="16" height="16" viewBox="0 0 32 32"><path d="M29.999 14l-6.001 3.999a3.961 3.961 0 00-1.408-3.02c2.034-1.224 3.406-3.431 3.406-5.978a7 7 0 00-14.001 0A6.97 6.97 0 0014.108 14h-3.667c.957-1.061 1.558-2.455 1.558-4A6 6 0 100 10c0 1.809.816 3.409 2.083 4.509A3.977 3.977 0 000 17.999v8a4.001 4.001 0 004 3.999h15.998c2.207 0 4-1.792 4-3.999v-1l6.001 4.999A2.001 2.001 0 0032 27.997V15.998A2.002 2.002 0 0029.999 14zM2.001 10a4 4 0 118 .002A4 4 0 012 10zm19.998 15.999A2.001 2.001 0 0119.998 28H4a2.002 2.002 0 01-2.002-2.001v-8c0-1.103.895-2.001 2.002-2.001h15.998c1.104 0 2.001.895 2.001 2.001v8zm-3-11.989a5.01 5.01 0 01-5.012-5.012 5.01 5.01 0 015.012-5.012 5.01 5.01 0 015.012 5.012 5.013 5.013 0 01-5.012 5.012zm11 3.487v10.496l-6.001-4.995v-3l6.001-4v1.499z"/></svg>';

function getSetting(name, value) {
	return value;
}

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

		document.addEventListener('click', (event) => {		
			setTimeout(customizeUI, 2000);				
		});
		
		customizeUI();		
		startConverse();
	});
	
	function startConverse() 
	{
		function handleResponse(data) {
			console.debug("handleResponse", data);

			if (data.message && data.settings) {
				domain = data.settings.pade_domain;
				url = data.settings.pade_server_url;
				userid = data.message.username;
				token = data.settings.pade_access_token;
				repo = data.message.repository;
			
				sessionStorage.setItem("project.deserve.token", token);
				setupConverse();	
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
		console.debug("setupConverse", userid, repo);	
				
		config = {
			theme: 'concord',
			assets_path: "./dist",			
			allow_non_roster_messaging: true,
			loglevel: 'info',
			authentication: 'anonymous',
			auto_login: true,
			discover_connection_methods: false,					
			jid:  domain,
			default_domain: domain,
			domain_placeholder: domain,
			locked_domain: domain,
			auto_away: 300,
			auto_reconnect: true,
			nickname: userid,
			bosh_service_url: url + '/http-bind/',
			auto_join_rooms:['deserve_chat@conference.' + domain],
			auto_join_private_chats: [],
			message_archiving: 'always',
			websocket_url: url.replaceAll("http", "ws") + '/ws/',
			jitsimeet_url: 'https://pade.chat:5443/ofmeet',
			jitsimeet_modal: true,
			whitelisted_plugins: ['deserve', 'jitsimeet', 'actions']
		}

		if (repo) {			
			config.auto_join_rooms = [repo + '@conference.' + domain];
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
		modifyTab("Pull requests", "pull-requests");	
		modifyTab("Actions", "actions");		
		modifyTab("Projects", "projects");		
		modifyTab("Security", "security");		
		modifyTab("Insights", "insights");	
		
		const mainbar = document.querySelector("div.Layout-main div.Box.mb-3");
		if (mainbar) mainbar.style.display = 'none';	

		const subdir = document.querySelector('div[data-test-selector="subdirectory-container"] div.Box.mb-3');
		if (subdir) subdir.style.display = 'none';			
		
		const sidebars = document.querySelectorAll("div.Layout-sidebar .h4.mb-3");
		
		sidebars.forEach((sidebar) => {
			if (sidebar.innerHTML == 'Languages') sidebar.parentNode.style.display = 'none';
		})	

		const menu = document.querySelector('ul[data-view-component="true"].UnderlineNav-body.list-style-none');
		const chatButton = document.querySelector("#pade-button");
		
		if (menu && !chatButton) {
			const ele = document.createElement("li");
			ele.innerHTML = '<a id="pade-button" class="UnderlineNav-item no-wrap js-responsive-underlinenav-item js-selected-navigation-item">' + PADE + '<span data-content="Pade">Pàdé Dokita</span></a>';
			ele.classList.add("d-inline-flex");
			menu.appendChild(ele);

			ele.addEventListener('click', (event) => {		
				location.reload();				
			});				
		}
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

	//-------------------------------------------------------
	//
	//  Startup
	//
	//-------------------------------------------------------
	
	createConverse();
	return api;

}(converse_api || {}));