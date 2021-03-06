import { browser } from "webextension-polyfill-ts";

export const scrollByKeyFix = async () => {
    try {
        return browser.tabs.executeScript({
            code: /*javascript*/ `
// monkeypatch nuChatty's broken scroll-post-by-A/Z functionality
function check_event_target(a) {
    // use chrome/firefox methods to check the event target
    return a.target && a.target.nodeName !== "TEXTAREA" && a.target.nodeName !== "INPUT";
}
function chat_onkeypress(b) {
    if (!b) b = window.event;
    const first_load = sLastClickedItem === -1 && sLastClickedRoot === -1;
    const _url = window.location.href;
    const _postid = _url && _url.split("item_")[1];
    const _item = _postid && document.querySelector("li#item_" + _postid);
    const _root = _item && _item.closest("div.root");
    const _rootid = _root && parseInt(_root.id.substr(5));
    if (first_load && _rootid && _postid) clickItem(_rootid, _postid);

    const is_valid_target = sLastClickedItem !== -1 && sLastClickedRoot !== -1 && check_event_target(b);
    const a = String.fromCharCode(b.keyCode);
    const id = a === "Z"
        ? get_item_number_from_item_string(get_next_item_for_root(sLastClickedRoot, sLastClickedItem))
        : a === "A"
        ? get_item_number_from_item_string(get_prior_item_for_root(sLastClickedRoot, sLastClickedItem))
        : false;

    if (is_valid_target && id) {
        clickItem(sLastClickedRoot, id);
        const elem = document.querySelector("li#item_" + id + " span.oneline_body");
        elem.click();
    }
    return true;
}
var previous = document.getElementById("scrollbykeyfix-wjs");
var scrollByKeyFix = document.createElement("script");
scrollByKeyFix.id = "scrollbykeyfix-wjs";
scrollByKeyFix.textContent = \`\${check_event_target.toString()}\${chat_onkeypress.toString()}\`;
if (!previous) document.getElementsByTagName("body")[0].append(scrollByKeyFix);
undefined;`,
        });
    } catch (e) {
        /* eat exceptions here */
    }
};
