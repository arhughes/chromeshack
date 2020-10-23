import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import { PostEventArgs } from "../../core";
import { detectMediaLink } from "../../core/api";
import { arrEmpty, arrHas, locatePostRefs, objHas } from "../../core/common";
import { processPostEvent, processPostRefreshEvent } from "../../core/events";
import { enabledContains } from "../../core/settings";
import { Expando } from "./Expando";

const MediaEmbedderWrapper = (props: { links: HTMLAnchorElement[]; item: HTMLElement; openByDefault?: boolean }) => {
    const { links, item, openByDefault } = props || {};
    const [children, setChildren] = useState(null as React.ReactNode[]);

    useEffect(() => {
        (async () => {
            if (arrHas(children) && item) {
                // replace each tagged link with its mounted version
                const taggedLinks = item.querySelectorAll(`a[id^='tagged_']`);
                for (const link of taggedLinks || []) {
                    const _this = link as HTMLAnchorElement;
                    const postid = _this.dataset.postid;
                    const idx = _this.dataset.idx;
                    const matched = item.querySelector(`div#expando_${postid}-${idx}`);
                    if (matched) link.replaceWith(matched);
                }
            }
        })();
    }, [item, children]);
    useEffect(() => {
        (async () => {
            // tag all matching links and save their resolved responses
            if (!arrHas(links)) return;
            const detectedLinks = arrHas(links)
                ? await links.reduce(async (acc, l, idx) => {
                      const detected = await detectMediaLink(l.href);
                      if (!detected) return await acc;
                      const { postid } = locatePostRefs(l);
                      const _acc = await acc;
                      if (objHas(detected)) {
                          // tag the detected link in the DOM so we can replace it later
                          l.setAttribute("id", `tagged_${postid}-${idx}`);
                          l.setAttribute("data-postid", `${postid}`);
                          l.setAttribute("data-idx", `${idx}`);
                          _acc.push(
                              <Expando
                                  key={idx}
                                  postid={postid}
                                  idx={idx}
                                  response={detected}
                                  options={{ openByDefault }}
                              />,
                          );
                      }
                      return _acc;
                  }, Promise.resolve([] as JSX.Element[]))
                : null;
            setChildren(detectedLinks);
        })();
    }, [links, openByDefault]);
    return <>{children}</>;
};

export const MediaEmbedder = {
    install() {
        processPostEvent.addHandler(MediaEmbedder.processPost);
        processPostRefreshEvent.addHandler(MediaEmbedder.processPost);
    },

    async processPost(args: PostEventArgs) {
        const { post } = args || {};
        // don't do processing if we don't need to
        const is_enabled = await enabledContains(["media_loader", "social_loader", "getpost"]);
        const isNWS = post?.querySelector(".fullpost.fpmod_nws");
        const NWS_enabled = await enabledContains(["nws_incognito"]);
        if ((isNWS && NWS_enabled) || !is_enabled) return;

        // render inside a hidden container in each fullpost
        const postbody = post?.querySelector(".sel > .fullpost > .postbody");
        const links = postbody && ([...postbody.querySelectorAll("a")] as HTMLAnchorElement[]);
        const embedded = postbody && ([...postbody.querySelectorAll("div.medialink")] as HTMLElement[]);
        const openByDefault = await enabledContains(["auto_open_embeds"]);

        if (arrHas(links) && arrEmpty(embedded)) {
            if (!postbody?.querySelector("#react-media-manager")) {
                const container = document.createElement("div");
                container.setAttribute("id", "react-media-manager");
                postbody.appendChild(container);
            }
            const mount = postbody?.querySelector("#react-media-manager");
            if (mount) render(<MediaEmbedderWrapper links={links} item={post} openByDefault={openByDefault} />, mount);
        }
    },
};
