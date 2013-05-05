function getSettings()
{
    // work around chrome bug 161028
    var s = {};
    for (var key in localStorage)
        s[key] = localStorage[key];
    return s;
}

function getSetting(name, default_value)
{
    var value = localStorage[name];
    if (!value)
        return default_value;
    return JSON.parse(value);
}

function deleteSetting(name)
{
    for (var key in localStorage)
    {
        if (key == name) {
            localStorage.splice(key, 1);
        }
    }
}

function migrateSettings(version)
{
    if (version == 1.26)
    {
        var derp = getSetting('lol_ugh_threshhold', false);
        if (derp != false)
        {
            setSetting('lol_ugh_threshold', derp);
            deleteSetting('lol_ugh_threshhold');
        }
    }

    // add 'ugh' tag if not already added
    if (version == 1.25 || version == 1.26)
    {
        var tags = getSetting("lol_tags", false);
        if (tags != false)
        {
            var has_ugh = false;
            for (var i = 0; i < tags.length; i++)
                if (tags[i].name == 'ugh')
                    has_ugh = true;

            if (!has_ugh)
            {
                tags.push({name: "ugh", color: "#0b0"});
                setSetting('lol_tags', tags);
            }
        }
    }

    var current_version = chrome.app.getDetails().version;
    if (version != current_version)
    {
        chrome.tabs.create({url: "release_notes.html"});
    }

    setSetting("version", current_version);
}

function setSetting(name, value)
{
    localStorage[name] = JSON.stringify(value);
}

function showPageAction(tabId, url)
{
    chrome.pageAction.setIcon({ "tabId": tabId, "path": "shack.png" });
    chrome.pageAction.show(tabId);
}


function collapseThread(id)
{
    var MAX_LENGTH = 100;

    var collapsed = getSetting("collapsed_threads", []);

    if (collapsed.indexOf(id) < 0)
    {
        collapsed.unshift(id);

        // remove a bunch if it gets too big
        if (collapsed.length > MAX_LENGTH * 1.25)
            collapsed.splice(MAX_LENGTH);

        setSetting("collapsed_threads", collapsed);
    }
}

function unCollapseThread(id)
{
    var collapsed = getSetting("collapsed_threads", []);
    var index = collapsed.indexOf(id);
    if (index >= 0)
    {
        collapsed.splice(index, 1);
        setSetting("collapsed_threads", collapsed);
    }
}

function addContextMenus()
{
    // get rid of any old and busted context menus
    chrome.contextMenus.removeAll();

    // add some basic context menus
    chrome.contextMenus.create(
    {
        title: "Show comment history",
        contexts: [ 'link' ],
        onclick: showCommentHistoryClick,
        documentUrlPatterns: [ "http://*.shacknews.com/*" ],
        targetUrlPatterns: [ "http://*.shacknews.com/profile/*" ]
    });
}

function showCommentHistoryClick(info, tab)
{
    var match = /\/profile\/(.+)$/.exec(info.linkUrl);
    if (match)
    {
        var search_url = "http://winchatty.com/search?author=" + escape(match[1]);
        chrome.tabs.create({windowId: tab.windowId, index: tab.index + 1, url: search_url});
    }
}

function extendLoginCookie()
{
	chrome.cookies.onChanged.addListener(function(changeInfo) {
		if(changeInfo.removed) return; //Cookie was removed, don't do anything.
		var cookie = changeInfo.cookie;

		if(changeInfo.cause === "explicit")
		{
			if(cookie.name === "_shack_li_")
			{
//				alert("Cookie CHANGE\n" +
//					"Cause: " + changeInfo.cause + "\n" +
//					"Domain: " + cookie.domain + "\n" +
//					"Url: " + cookie.url + "\n" +
//					"Name: " + cookie.name + "\n" +
//					"Value: " + cookie.value + "\n" +
//					"Expiration: " + cookie.expirationDate);

				var cookieUrl = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
				var token = {
					url : cookieUrl,
					name : cookie.name,
					value : cookie.value,
					expirationDate : (new Date().getTime() / 1000) + 2592000, //Extend 30 days
					secure : cookie.secure
				};

				chrome.cookies.set(token);//, function(c1) {
//					if(c1 == null)
//					{
//						alert("Error extending cookie: " + chrome.runtime.lastError.message);
//					}
//					else
//					{
////						var origDate = new Date(1970, 0, 1);
////						origDate.setSeconds(exp);
//						var newDate = new Date(1970, 0, 1);
//						newDate.setSeconds(c1.expirationDate);
//
//						console.log("Cookie extended from \n"
//							+ origDate.toString() +
//							"\n to \n"
//							+ newDate.toString() +
//							"Domain: " + c1.domain + "\n" +
//							"Url: " + c1.url + "\n" +
//							"Name: " + c1.name + "\n" +
//							"Value: " + c1.value);
//					}
//				});
			}
		}
	});
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse)
{
    if (request.name == "getSettings")
    {
        var tab = sender.tab;
        if (tab)
            showPageAction(tab.id, tab.url);
        sendResponse(getSettings());
    }
	 else if (request.name == "extendLoginCookie")
	     extendLoginCookie();
    else if (request.name == "setSetting")
        setSetting(request.key, request.value);
    else if (request.name == "collapseThread")
        collapseThread(request.id);
    else if (request.name == "unCollapseThread")
        unCollapseThread(request.id);
    else
        sendResponse();
});

addContextMenus();

// attempt to update version settings
var last_version = getSetting("version", 0);
migrateSettings(last_version);
