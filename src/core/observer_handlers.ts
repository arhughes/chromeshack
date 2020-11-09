import { browser } from "webextension-polyfill-ts";
import { arrHas, elemMatches, locatePostRefs } from "./common";
import { disableTwitch, scrollToElement } from "./common/dom";
import {
    fullPostsCompletedEvent,
    processEmptyTagsLoadedEvent,
    processPostBoxEvent,
    processPostEvent,
    processPostRefreshEvent,
    processRefreshIntentEvent,
    processReplyEvent,
    processTagDataLoadedEvent,
} from "./events";
import type { PostEventArgs, RefreshMutation } from "./events.d";
import { setUsername } from "./notifications";
import { ChromeShack } from "./observer";
import { getEnabled, getEnabledSuboption, mergeTransientSettings } from "./settings";

const checkReplyCeiling = (rootEl: HTMLElement) => {
    // Both FF & Chrome get bogged down by nuLOL tags loading into extremely large threads
    // ... so we set an arbitrary ceiling here based on performance of a moderate-spec machine
    // ... which gets used for the nuLOL refresh/reply fixes that try to keep tag data up-to-date.
    const replies = rootEl?.querySelectorAll("li .capcontainer li[id^='item_']");
    const tags = rootEl?.querySelectorAll("li .capcontainer .lol-tags");
    const totalReplies = (!window.chrome && replies?.length < 333) || replies.length < 750;
    const totalTags = (!window.chrome && tags?.length < 35) || tags?.length < 75;
    return totalTags || totalReplies;
};

const asyncResolveTags = (post: HTMLElement, timeout?: number) => {
    const removeUnusedTagline = (post: HTMLElement) => {
        // avoid having a duplicate (unused) tagline
        const rootTags = post?.querySelectorAll(".root>ul>li > .fullpost span.lol-tags");
        const postTags = post?.querySelectorAll("li li.sel > .fullpost span.lol-tags");
        if (rootTags.length > 1) rootTags[0].parentElement.removeChild(rootTags[0]);
        if (postTags.length > 1) postTags[0].parentElement.removeChild(postTags[0]);
    };
    const collectTagData = (post: HTMLElement) => {
        const postTags = [
            ...post?.querySelectorAll(".fullpost > .postmeta .lol-tags > .tag-container"),
        ] as HTMLElement[];
        const postTagsWithData = arrHas(postTags)
            ? postTags.reduce((acc, t: HTMLSpanElement) => {
                  const withData = elemMatches(t, ".nonzero");
                  if (withData) acc.push(withData);
                  return acc;
              }, [] as HTMLElement[])
            : [];
        return arrHas(postTagsWithData) ? postTagsWithData : null;
    };

    const _timeout = timeout || 1000; // 1s timeout by default
    const intervalStep = 100; // 100ms
    return new Promise((resolve, reject) => {
        let tagsTimer = 0;
        if (!post) return reject(null);
        const tagsInterval = setInterval(() => {
            // check every timeStep for data being loaded up to a timeout
            const tagCheckResult = collectTagData(post);
            if (tagsTimer <= _timeout && arrHas(tagCheckResult)) {
                removeUnusedTagline(post);
                clearInterval(tagsInterval);
                return resolve(tagCheckResult);
            } else if (tagsTimer > _timeout) {
                removeUnusedTagline(post);
                clearInterval(tagsInterval);
                return reject(null);
            }
            tagsTimer += intervalStep;
        }, intervalStep);
    });
};
export const handleTagsEvent = (args: PostEventArgs) => {
    const { post } = args || {};
    // count all the tags in this post and raise events based on whether they contain data
    return asyncResolveTags(post)
        .then((tagData: HTMLElement[]) => {
            const _args = { ...args, tagData };
            processTagDataLoadedEvent.raise(_args);
            return _args;
        })
        .catch((emptyTags: HTMLElement[]) => {
            const _args = { ...args, emptyTags };
            processEmptyTagsLoadedEvent.raise(_args);
            return _args;
        });
};

export const handlePostRefresh = async (args: PostEventArgs, mutation?: RefreshMutation) => {
    const { post, root, postid, rootid } = args || {};
    const postOL = post?.querySelector(".oneline_body") as HTMLElement;
    const replyOL = root?.querySelector(`li#item_${mutation.postid} .oneline_body`) as HTMLElement;
    processPostRefreshEvent.raise(args, mutation);
    const disableTags = await getEnabled("hide_tagging_buttons");
    const _elem = postOL || replyOL;
    // reopen the previously open post (if applicable)
    if (!disableTags && postid !== rootid && _elem) {
        scrollToElement(_elem);
        _elem.click();
    }
    ChromeShack.refreshing = [...ChromeShack.refreshing.filter((r) => r.rootid !== args.rootid)];
};

export const handleRootAdded = async (mutation: RefreshMutation) => {
    const { postid, rootid, parentid } = mutation || {};
    const root = document.querySelector(`li#item_${rootid}`);
    const post = document.querySelector(`li#item_${postid || parentid}`);
    const reply = parentid && post?.querySelector("li.sel.last");
    const raisedArgs = { post: reply || post, postid: parentid || postid, root, rootid } as PostEventArgs;
    if (reply && root && !(await getEnabled("hide_tagging_buttons"))) processReplyEvent.raise(raisedArgs, mutation);
    else if (post && root)
        handleTagsEvent(raisedArgs)
            .then((neArgs) => handlePostRefresh(neArgs, mutation))
            .catch((eArgs) => handlePostRefresh(eArgs, mutation));
};

export const handleReplyAdded = async (args: PostEventArgs) => {
    const { post, root } = args || {};
    const postRefreshBtn = post?.querySelector("div.refresh > a") as HTMLElement;
    const disableTags = await getEnabled("hide_tagging_buttons");
    const shouldRefresh = checkReplyCeiling(root);
    ChromeShack.refreshing = [...ChromeShack.refreshing.filter((r) => r.rootid !== args.rootid)];
    // avoid refreshing a thread after replying if this would cause a performance problem
    if (!disableTags && postRefreshBtn && shouldRefresh) postRefreshBtn.click();
    else if (!disableTags && postRefreshBtn && !shouldRefresh)
        console.log("too many replies in this thread - skipping nuLOL post reply fix");
};

export const handleRefreshClick = async (e: MouseEvent) => {
    const _this = e?.target as HTMLElement;
    const refreshBtn = elemMatches(_this, "div.refresh > a");
    if (refreshBtn) {
        const raisedArgs = await locatePostRefs(refreshBtn);
        const { root, postid, rootid, is_root } = raisedArgs || {};
        processRefreshIntentEvent.raise(raisedArgs);
        const rootRefreshBtn = root?.querySelector("div.refresh > a") as HTMLElement;
        const foundIdx = ChromeShack.refreshing.findIndex((r) => r.rootid === rootid);
        const shouldRefresh = checkReplyCeiling(root);
        const disableTags = await getEnabled("hide_tagging_buttons");
        if (foundIdx === -1 && shouldRefresh) ChromeShack.refreshing.unshift({ postid, rootid });
        // avoid unnecessary tag refreshes by refreshing the root only
        if (!disableTags && !is_root && shouldRefresh) {
            e.preventDefault();
            rootRefreshBtn.click();
        } else if (!disableTags && !is_root && !shouldRefresh)
            // account for extremely large threads causing performance issues
            console.log("too many replies in this thread - skipping nuLOL refresh fix");
    }
};

export const processObserverInstalled = async () => {
    await mergeTransientSettings();

    // monkey patch the 'clickItem()' method on Chatty once we're done loading
    await browser.runtime.sendMessage({ name: "chatViewFix" }).catch(console.log);
    // monkey patch chat_onkeypress to fix busted a/z buttons on nuLOL enabled chatty
    await browser.runtime.sendMessage({ name: "scrollByKeyFix" }).catch(console.log);
    // disable article Twitch player if we're running Cypress tests for a speed boost
    if (await getEnabledSuboption("testing_mode")) disableTwitch();

    document.addEventListener("click", handleRefreshClick);
    processReplyEvent.addHandler(handleReplyAdded);

    // set our current logged-in username once upon refreshing the Chatty
    const loggedInUsername = document.getElementById("user_posts")?.textContent || "";
    if (loggedInUsername) await setUsername(loggedInUsername);
};

export const processPost = (args: PostEventArgs) => {
    processPostEvent.raise(args);
    handleTagsEvent(args);
};
export const processFullPosts = async () => {
    await processObserverInstalled();
    const fullposts = [...document.querySelectorAll("div.fullpost")] as HTMLElement[];
    const process = async (el: HTMLElement) => {
        const args = await locatePostRefs(el);
        const { post, root } = args || {};
        if (root || post) processPost(args);
    };
    await Promise.all(fullposts.map(process));
    fullPostsCompletedEvent.raise();
};
export const processPostBox = (postbox: HTMLElement) => {
    if (postbox) processPostBoxEvent.raise({ postbox });
};
