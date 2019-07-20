const migrateSettings = () => {
    getSetting("version", 0).then(last_version => {
        let current_version = parseFloat(browser.runtime.getManifest().version);
        if (last_version !== current_version) browser.tabs.create({ url: "release_notes.html" });
        setSetting("version", current_version);
    });
};

const collapseThread = id => {
    let MAX_LENGTH = 100;
    getSetting("collapsed_threads", []).then(collapsed => {
        if (collapsed.indexOf(id) < 0) {
            collapsed.unshift(id);

            // remove a bunch if it gets too big
            if (collapsed.length > MAX_LENGTH * 1.25) collapsed.splice(MAX_LENGTH);

            setSetting("collapsed_threads", collapsed);
        }
    });
};

const unCollapseThread = id => {
    getSetting("collapsed_threads", []).then(collapsed => {
        let index = collapsed.indexOf(id);
        if (index >= 0) {
            collapsed.splice(index, 1);
            setSetting("collapsed_threads", collapsed);
        }
    });
};

const addContextMenus = () => {
    // get rid of any old and busted context menus
    browser.contextMenus.removeAll();

    // add some basic context menus
    browser.contextMenus.create({
        title: "Show comment history",
        contexts: ["link"],
        onclick: showCommentHistoryClick,
        documentUrlPatterns: ["https://*.shacknews.com/*"],
        targetUrlPatterns: ["https://*.shacknews.com/profile/*"]
    });
};

const startNotifications = () => {
    browser.notifications.onClicked.addListener(notificationClicked);
    pollNotifications();
};

const pollNotifications = () => {
    getSetting("notificationuid").then(notificationuid => {
        //console.log("Notification UID is " + notificationuid);
        if (notificationuid) {
            let _dataBody = `clientId=${notificationuid}`;
            postXHR({
                url: "https://winchatty.com/v2/notifications/waitForNotification",
                header: { "Content-Type": "application/x-www-form-urlencoded" },
                data: _dataBody
            })
                .then(resp => {
                    let notifications = resp;
                    if (!notifications.error) {
                        //console.log("notification response text: " + res.responseText);
                        if (notifications.messages) {
                            for (let i = 0; i < notifications.messages.length; i++) {
                                let n = notifications.messages[i];
                                browser.notifications.create("ChromeshackNotification" + n.postId.toString(), {
                                    type: "basic",
                                    title: n.subject,
                                    message: n.body,
                                    iconUrl: "images/icon.png"
                                });
                            }
                        }
                        //If everything was successful, poll again in 15 seconds.
                        setTimeout(pollNotifications, 15000);
                        return;
                    } else {
                        if (notifications.code === "ERR_UNKNOWN_CLIENT_ID") {
                            browser.notifications.create("ErrorChromeshackNotification", {
                                type: "basic",
                                title: "ChromeShack Error",
                                message:
                                    "Notifications are no longer enabled for this client, please try enabling them again.",
                                iconUrl: "images/icon.png"
                            });
                            setSetting("notificationuid", "");
                            setSetting("notifications", false);
                            return;
                        } else if (notifications.code == "ERR_CLIENT_NOT_ASSOCIATED") {
                            browser.tabs.query({ url: "https://winchatty.com/v2/notifications/ui/login*" }, tabs => {
                                // If they're not already logging in somewhere, they need to.  Otherwise we'll just leave it alone instead of bringing it to the front or anything annoying like that.
                                if (tabs.length === 0) {
                                    browser.tabs.create({
                                        url:
                                            "https://winchatty.com/v2/notifications/ui/login?clientId=" +
                                            notificationuid
                                    });
                                }
                            });
                        }
                    }
                    setTimeout(pollNotifications, 60000);
                })
                .catch(err => {
                    console.log(err);
                    setTimeout(pollNotifications, 60000);
                });
        }
    });
};

const notificationClicked = notificationId => {
    if (notificationId.indexOf("ChromeshackNotification") > -1) {
        let postId = notificationId.replace("ChromeshackNotification", "");
        let url = "https://www.shacknews.com/chatty?id=" + postId + "#item_" + postId;
        browser.tabs.create({ url: url });
        browser.notifications.clear(notificationId);
    }
};

const showCommentHistoryClick = (info, tab) => {
    let match = /\/profile\/(.+)$/.exec(info.linkUrl);
    if (match) {
        let search_url = "https://winchatty.com/search?author=" + escape(match[1]);
        browser.tabs.create({ windowId: tab.windowId, index: tab.index + 1, url: search_url });
    }
};

browser.runtime.onMessage.addListener(async (request, sender) => {
    if (request.name === "collapseThread") return Promise.resolve(collapseThread(request.id));
    else if (request.name === "unCollapseThread") return Promise.resolve(unCollapseThread(request.id));
    else if (request.name === "launchIncognito")
        // necessary for opening nsfw links in an incognito window
        return Promise.resolve(browser.windows.create({ url: request.value, incognito: true }));
    else if (request.name === "allowedIncognitoAccess")
        // necessary for knowing when to open nsfw media in an incognito window
        return Promise.resolve(browser.extension.isAllowedIncognitoAccess());
    else if (request.name === "chatViewFix") {
        // scroll-to-post fix for Chatty
        return browser.tabs
            .executeScript(null, { code: `window.monkeyPatchCVF === undefined` })
            .then(res => {
                if (res) {
                    browser.tabs.executeScript({ file: "int/chatViewFix.js" });
                }
            })
            .catch(err => console.log(err));
    } else if (request.name === "injectLightbox") {
        // a media element's HTML is passed into the to-be-injected lightbox instantiator here
        return browser.tabs
            .executeScript(null, { code: `window.basicLightbox === undefined` })
            .then(res => {
                const injectLightboxFunc = () => {
                    browser.tabs
                        .executeScript(null, { code: `let _mediaHTML = \`${request.elemText}\`;` })
                        .then(() => browser.tabs.executeScript(null, { file: "int/injectLightbox.js" }));
                };

                if (res) {
                    browser.tabs
                        .executeScript(null, { file: "ext/basiclightbox/basicLightbox-5.0.2.min.js" })
                        .then(injectLightboxFunc);
                } else {
                    injectLightboxFunc();
                }
            })
            .catch(err => console.log(err));
    } else if (request.name === "injectCarousel") {
        // we pass an element's css selector into Swiper for carousel injection here
        return browser.tabs
            .executeScript(null, { code: `window.Swiper === undefined` })
            .then(res => {
                if (res) {
                    browser.tabs
                        .executeScript(null, { file: "ext/swiper/swiper-4.5.0.min.js" })
                        .then(() =>
                            browser.tabs
                                .executeScript(null, { code: `let _carouselSelect = "${request.select}";` })
                                .then(() => browser.tabs.executeScript(null, { file: "int/injectCarousel.js" }))
                        );
                } else {
                    browser.tabs
                        .executeScript(null, { code: `let _carouselSelect = "${request.select}";` })
                        .then(() => browser.tabs.executeScript(null, { file: "int/injectCarousel.js" }));
                }
            })
            .catch(err => console.log(err));
    } else if (request.name === "scrollByKeyFix") {
        // scroll-by-key fix for Chatty
        return browser.tabs.executeScript(null, { file: "int/scrollByKeyFix.js" }).catch(err => console.log(err));
    } else if (request.name === "corbFetch") return fetchSafe(request.url, request.optionsObj, request.ovrBool);
    else if (request.name === "corbPost") {
        let _fd = await JSONToFormData(request.data);
        return new Promise((resolve, reject) => {
            return postXHR({
                url: request.optionsObj.url,
                headers: request.optionsObj.headers,
                override: request.optionsObj.override,
                data: _fd
            })
                .then(resolve)
                .catch(reject);
        });
    }

    return Promise.resolve();
});

/*
    Workaround for Twitter API's lack of support for cross-domain JSON fetch.
    NOTE: we override only responses from "api.twitter.com" and sanitize the fetch result
        with a fetch() helper in common.js so only non-HTML containing JSON is ever used.
*/
const responseListener = details => {
    details.responseHeaders.push({ name: "Access-Control-Allow-Headers", value: "*" });
    details.responseHeaders.push({ name: "Access-Control-Allow-Methods", value: "GET" });
    return { responseHeaders: details.responseHeaders };
};
browser.webRequest.onHeadersReceived.removeListener(responseListener);
browser.webRequest.onHeadersReceived.addListener(responseListener, { urls: ["https://api.twitter.com/*"] }, [
    "blocking",
    "responseHeaders"
]);

addContextMenus();

// attempt to update version settings
migrateSettings();

startNotifications();
