import type { FetchArgs, ParseType, ShackRSSItem } from "./index.d";
export type { FetchArgs, ParseType, ShackRSSItem };

import {
    arrEmpty,
    arrHas,
    classNames,
    getFileCount,
    getLinkType,
    isFileArr,
    isIframe,
    isImage,
    isJSON,
    isUrlArr,
    isVideo,
    objContainsProperty,
    objEmpty,
    objHas,
    packValidTypes,
} from "./common";
import {
    afterElem,
    appendLinksToField,
    convertUrlToLink,
    decodeHTML,
    elementFitsViewport,
    elementIsVisible,
    elemMatches,
    encodeHTML,
    FormDataToJSON,
    generatePreview,
    getCookieValue,
    insertStyle,
    JSONToFormData,
    locatePostRefs,
    matchFileFormat,
    removeChildren,
    scrollParentToChild,
    scrollToElement,
    stripHtml,
    superTrim,
    parseToFragment,
} from "./dom";
import {
    fetchBackground,
    fetchSafe,
    fetchSafeLegacy,
    parseFetchResponse,
    postBackground,
    safeJSON,
    waitToFetchSafe,
    waitToResolve,
    xhrRequestLegacy,
} from "./fetch";

export {
    stripHtml,
    superTrim,
    insertStyle,
    getCookieValue,
    convertUrlToLink,
    generatePreview,
    scrollToElement,
    scrollParentToChild,
    elementIsVisible,
    elementFitsViewport,
    removeChildren,
    FormDataToJSON,
    JSONToFormData,
    appendLinksToField,
    matchFileFormat,
    afterElem,
    elemMatches,
    locatePostRefs,
    decodeHTML,
    encodeHTML,
    parseToFragment,
};
export {
    xhrRequestLegacy,
    fetchSafeLegacy,
    fetchSafe,
    fetchBackground,
    postBackground,
    waitToFetchSafe,
    safeJSON,
    parseFetchResponse,
    waitToResolve,
};
export {
    arrHas,
    arrEmpty,
    objHas,
    objContainsProperty,
    objEmpty,
    isJSON,
    classNames,
    isVideo,
    isImage,
    isIframe,
    getLinkType,
    isUrlArr,
    isFileArr,
    getFileCount,
    packValidTypes,
};
