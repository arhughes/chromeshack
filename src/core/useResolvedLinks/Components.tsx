import React, { useEffect, useRef, useState } from "react";
import { classNames, isIframe } from "../common";
import type { MediaProps } from "./index.d";

export const Iframe = (props: MediaProps) => {
    const { src } = props || {};

    const iframeType = isIframe(src);
    const isTwitch = iframeType && iframeType === "twitch";
    const isYoutube = iframeType && iframeType === "youtube";
    const isGeneric = iframeType && !isTwitch && !isYoutube;
    const classes = classNames({
        "iframe-container": isGeneric,
        "twitch-container": isTwitch,
        "yt-container": isYoutube,
    });

    return (
        src && (
            <div className="iframe__boundary">
                <div className={classes}>
                    <iframe
                        title={src}
                        src={src}
                        frameBorder="0"
                        scrolling="no"
                        allowFullScreen
                        allow={isYoutube ? "autoplay; encrypted-media" : ""}
                    />
                </div>
            </div>
        )
    );
};

export const Image = (props: MediaProps) => {
    const { classes: _classes, src, options } = props || {};
    const [classes, setClasses] = useState("");
    const [isSlide, setIsSlide] = useState(false);
    const imageRef = useRef<HTMLImageElement>();
    // click-to-toggle enabled by default
    const { clickTogglesVisible = true } = options || {};

    useEffect(() => {
        const img = imageRef.current;
        const _isSlide = img?.closest(".embla__slide__inner");
        if (img && _isSlide) {
            setIsSlide(!!_isSlide);
            // disable click-to-toggle pointer if we're a child of a slide
            setClasses(classNames(_classes));
        } else if (img) setClasses(classNames(_classes, { canToggle: clickTogglesVisible }));
    }, [imageRef, isSlide, _classes, clickTogglesVisible]);

    return src && <img className={classes} src={src} alt="" ref={imageRef} />;
};