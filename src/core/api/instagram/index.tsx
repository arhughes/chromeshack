import React, { useEffect, useState } from "react";
import { fetchInstagramData, Instagram } from "./Components";

const InstagramWrapper = (props: { response: InstagramParsed }) => {
    const { response } = props || {};
    const [children, setChildren] = useState(null);
    useEffect(() => {
        if (!children) setChildren(<Instagram response={response} />);
    }, [children, response]);
    return children;
};

export const getInstagram = async (...args: string[]) => {
    const [shortcode] = args || [];
    const response = shortcode ? await fetchInstagramData(shortcode) : null;
    return response ? { component: <InstagramWrapper response={response} />, type: "instagram" } : null;
};

const parseLink = (href: string) => {
    const isInstagram = /https?:\/\/(?:www\.|)(?:instagr.am|instagram.com)(?:\/.*|)\/(?:p|tv)\/([\w-]+)\/?/i.exec(href);
    return isInstagram
        ? ({
              href,
              args: [isInstagram[1]],
              type: "instagram",
              cb: getInstagram,
          } as ParsedResponse)
        : null;
};

export const isInstagram = (href: string) => parseLink(href);

export { fetchInstagramData, InstagramWrapper as Instagram };
