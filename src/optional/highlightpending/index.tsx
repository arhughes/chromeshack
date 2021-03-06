import React from "react";
import { render } from "react-dom";
import { parseToElement } from "../../core/common";
import { enabledContains } from "../../core/settings";
import "../../styles/highlight_pending.css";
import { HighlightPendingApp } from "./HighlightPendingApp";

const HighlightPendingPosts = {
    async install() {
        const isEnabled = await enabledContains(["highlight_pending_new_posts"]);
        const selectedPage = document.querySelector("a.selected_page") as HTMLAnchorElement;
        const isFirstPage = selectedPage?.href?.match(/page=1$/i);
        const isChatty = !!(document.getElementById("newcommentbutton") && isFirstPage);
        const container = document.querySelector("#hpnp__app__container");
        const positionElem = document.querySelector(".header-bottom .logo.alt > a");
        if (isEnabled && !container && positionElem) {
            const appContainer = parseToElement(`<div id="hpnp__app__container" />`) as HTMLElement;
            // put our HPNP app next to the Shacknews logo in the top-left
            positionElem.parentElement.classList?.add("hpnp__enabled");
            render(<HighlightPendingApp threaded={isChatty} elRef={appContainer} />, appContainer);
            positionElem.append(appContainer);
        }
    },
};

export { HighlightPendingPosts };
