import React from "react";
import { render } from "react-dom";
import { elemMatches, parseToElement } from "../../core/common";
import { getUsername } from "../../core/notifications";
import "../../styles/userpopup.css";
import { UserPopupApp } from "./UserPopupApp";

export const UserPopup = {
    cachedEl: null as HTMLElement,

    install() {
        document.addEventListener("click", UserPopup.clickHandler);
        UserPopup.cacheInjectables();
    },

    cacheInjectables() {
        const appContainer = parseToElement(`<div class="userDropdown" />`);
        UserPopup.cachedEl = appContainer as HTMLElement;
    },

    async clickHandler(e: MouseEvent) {
        const mini_mode = window.matchMedia("(max-width: 1024px)");
        if (mini_mode.matches) return;

        const _this = e?.target as HTMLElement;
        const userLink = elemMatches(_this, "span.user > a");
        const accountLink = _this && elemMatches(_this, "header .header-bottom .tools ul li a[href='/settings']");
        const accountName = accountLink
            ? (accountLink?.parentNode?.parentNode?.querySelector("#user_posts") as HTMLLIElement)?.textContent
            : "";
        accountLink?.setAttribute("id", "userDropdownTrigger");

        if (userLink || accountLink) {
            e.preventDefault();
            const _username = userLink?.textContent || accountName;
            const _elem = userLink || accountLink;
            const containerRef = _elem?.querySelector(".userDropdown") as HTMLUListElement;
            const loggedInUsername = await getUsername();
            const isLoggedInUser = loggedInUsername?.toUpperCase() === _username?.toUpperCase();

            if (!containerRef && _elem) {
                render(
                    <UserPopupApp username={_username} isLoggedInUser={isLoggedInUser} isUserBadge={!!userLink} />,
                    UserPopup.cachedEl,
                );
                _elem.appendChild(UserPopup.cachedEl);
            }
        }
    },
};
