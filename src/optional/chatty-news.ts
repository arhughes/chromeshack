import { arrHas, fetchSafe, parseToElement, timeOverThresh } from "../core/common";
import { enabledContains, getSetting, setSetting } from "../core/settings";
import "../styles/chatty-news.css";

export const ChattyNews = {
    // 15 minute threshold
    timeout: 1000 * 60 * 15,

    async checkTime(delayInMs: number) {
        const lastFetchTime = (await getSetting("chatty_news_lastfetchtime", Date.now())) as number;
        const overThresh = timeOverThresh(lastFetchTime, delayInMs);
        if (lastFetchTime > -1 || !!overThresh) {
            // update if necessary or start fresh
            await setSetting("chatty_news_lastfetchtime", overThresh);
            return true;
        } else return false;
    },

    async populateNewsBox(container: Element) {
        let rss = (await getSetting("chatty_news_lastfetchdata")) as ShackRSSItem[];
        const overTimeout = await ChattyNews.checkTime(ChattyNews.timeout);
        if (overTimeout || !arrHas(rss)) {
            // cache each successful fetch for 15 minutes
            rss = await fetchSafe({
                url: "https://www.shacknews.com/feed/rss",
                // REVIEWER NOTE: this is sanitized through DOMPurify in fetch.ts:75
                parseType: { chattyRSS: true },
            });
            await setSetting("chatty_news_lastfetchdata", rss);
        }

        const newsBox = container?.querySelector("#recent-articles") as HTMLElement;
        for (const item of rss || []) {
            const newsItemFragment = parseToElement(/*html*/ `
                <li>
                    <a
                        class="truncated"
                        rel="noopener"
                        target="_blank"
                        href="${item.link}"
                        title="${item.content}"
                    >
                        <span>${item.title}</span>
                    </a>
                </li>
            `);
            newsBox?.append(newsItemFragment);
        }
        return container;
    },

    async apply() {
        if (document.querySelector("div.chatty-news")) return;
        const is_enabled = await enabledContains(["chatty_news"]);
        if (is_enabled) {
            // move all non-media elements into an alignment container for better responsiveness
            const articleBox = document.querySelector(".article-content") as HTMLElement;
            const articleChildren = [...document.querySelectorAll(".article-content p:not(:nth-child(2))")];
            const alignmentBox = document.createElement("div");
            const subAlignmentBox = document.createElement("div");
            // double check this is the full chatty page
            const is_chatty = document.querySelector(".pagenavigation");
            alignmentBox.setAttribute("id", "chattynews__aligner");
            subAlignmentBox.setAttribute("id", "links__aligner");
            // leave our other text centered at the bottom of the article box
            for (const [i, p] of articleChildren.entries() || [])
                if (i !== articleChildren.length - 1) subAlignmentBox.appendChild(p);
                else alignmentBox.appendChild(p);

            alignmentBox?.appendChild(subAlignmentBox);

            const newsBoxFragment = parseToElement(/*html*/ `
                <div class="chatty-news">
                    <h2>Recent Articles</h2>
                    <hr class="chatty-news-sep" />
                    <div><ul id="recent-articles"></ul></div>
                </div>
            `);
            // populate the newly created newsBox from the Chatty RSS server's articles
            const newsBox = await ChattyNews.populateNewsBox(newsBoxFragment);
            alignmentBox?.append(newsBox);
            articleBox?.append(alignmentBox);
            if ((await enabledContains(["thread_pane"])) && is_chatty)
                articleBox?.classList?.add("thread__pane__enabled");
            articleBox?.classList?.add("chatty__news__enabled");
        }
    },

    async install() {
        await ChattyNews.apply();
    },
};
