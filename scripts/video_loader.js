let VideoLoader = {
    loadVideos(item) {
        let links = item.querySelectorAll(".sel .postbody > a");
        for (let i = 0; i < links.length; i++) {
            let parsedVideo = VideoLoader.getVideoType(links[i].href);
            if (parsedVideo != null) {
                ((parsedVideo, i) => {
                    if (links[i].querySelector("div.expando")) {
                        return;
                    }
                    links[i].addEventListener("click", e => {
                        VideoLoader.toggleVideo(e, parsedVideo, i);
                    });

                    let _postBody = links[i].parentNode;
                    let _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                    insertExpandoButton(links[i], _postId, i);
                })(parsedVideo, i);
            }
        }
    },

    getVideoType(url) {
        let _isStreamable = /https?\:\/\/streamable\.com\/([\w]+)/i.exec(url);
        let _isXboxDVR = /https?\:\/\/(?:.*\.)?xboxdvr\.com\/gamer\/([\w\d\-]+)\/video\/([\w\-]+)/i.exec(url);
        // youtube videos and/or playlists (vid id: $1, playlist id: $2, offset: $3)
        let _isYoutube = /https?\:\/\/(?:.*\.)?youtu(?:(?:\.be|be\.[A-Za-z]{2,4})\/(?:watch.+?v?=([\w\-]+)(?:\&list=([\w\-]+))?(?:.*(\&t=[\w\-]+))?|playlist\?list=([\w\-]+))|\.be\/([\w\-]+)$)/i.exec(
            url
        );
        // twitch channels, videos, and clips (with time offset)
        let _isTwitch = /https?\:\/\/(?:clips\.twitch\.tv\/(\w+)|(?:.*\.)?twitch\.tv\/(?:.*?\/clip\/(\w+)|(?:videos\/([\w\-]+)(?:.*?t=(\w+))?|collections\/([\w\-]+))|([\w\-]+)))/i.exec(
            url
        );

        if (_isYoutube) {
            return {
                type: 1,
                video: _isYoutube[1] || _isYoutube[5],
                playlist: _isYoutube[2] || _isYoutube[4],
                offset: _isYoutube[3]
            };
        } else if (_isTwitch) {
            if (_isTwitch[6]) {
                // twitch channels
                return {
                    type: 2,
                    channel: _isTwitch[6]
                };
            } else if (_isTwitch[5]) {
                // twitch collections
                return {
                    type: 2,
                    collection: _isTwitch[5]
                };
            } else if (_isTwitch[3]) {
                // twitch videos
                return {
                    type: 2,
                    video: _isTwitch[3],
                    offset: _isTwitch[4]
                };
            } else if (_isTwitch[1] || _isTwitch[2]) {
                // twitch clip
                return {
                    type: 2,
                    clip: _isTwitch[1] || _isTwitch[2]
                };
            }
        } else if (_isStreamable) {
            return {
                type: 3,
                video: _isStreamable[1]
            };
        } else if (_isXboxDVR) {
            return {
                type: 4,
                user: _isXboxDVR[1],
                video: _isXboxDVR[2]
            };
        }

        return null;
    },

    toggleVideo(e, videoObj, index) {
        // left click only
        if (e.button == 0) {
            e.preventDefault();
            let _expandoClicked =
                e.target.classList !== undefined && objContains("expando", e.target.classList);
            let link = _expandoClicked ? e.target.parentNode : e.target;
            let _postBody = link.parentNode;
            let _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
            if (toggleMediaItem(link, _postId, index)) return;

            if (videoObj && videoObj.type === 1) VideoLoader.createYoutube(link, videoObj, _postId, index);
            else if (videoObj && videoObj.type === 2) VideoLoader.createTwitch(link, videoObj, _postId, index);
            else if ((videoObj && videoObj.type === 3) || videoObj.type === 4)
                VideoLoader.createIframePlayer(link, videoObj, _postId, index);
        }
    },

    async createIframePlayer(link, videoObj, postId, index) {
        let getStreamableLink = shortcode => {
            let __obf = "Basic aG9tdWhpY2xpckB3ZW1lbC50b3A=:JiMtMlQoOH1HSDxgJlhySg==";
            return new Promise((resolve, reject) => {
                fetchSafe(`https://api.streamable.com/videos/${shortcode}`, {
                    headers: { Authorization: __obf }
                })
                    .then(json => {
                        // sanitized in common.js!
                        if (json && json.files.mp4.url) resolve(json.files.mp4.url);
                        reject(false);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            });
        };

        // handle both Streamable and XboxDVR Iframe embed types
        let user = videoObj.type === 4 && videoObj.user;
        let video_id = videoObj.video;
        let video_src = "";

        if (videoObj.type === 3) {
            // Streamable.com iFrame
            video_src = await getStreamableLink(video_id);
        } else if (videoObj.type === 4) {
            // XboxDVR iFrame
            video_src = `https://xboxdvr.com/gamer/${user}/video/${video_id}/embed`;
        }

        if (video_src) {
            let iframe = VideoLoader.createIframe({
                src: video_src,
                type: videoObj.type
            }, postId, index);
            mediaContainerInsert(iframe, link, postId, index);
        }
    },

    async createYoutube(link, videoObj, postId, index) {
        let video_src;
        let video_id = videoObj.video;
        let video_playlist = videoObj.playlist;
        let timeOffset = videoObj.offset ? `&start=${videoObj.offset}` : "";

        if (video_id && video_playlist)
            video_src = `https://www.youtube.com/embed/videoseries?v=${video_id}&list=${video_playlist}&autoplay=1${timeOffset}`;
        else if (!video_id && video_playlist)
            video_src = `https://www.youtube.com/embed/videoseries?list=${video_playlist}&autoplay=1`;
        else if (video_id) video_src = `https://www.youtube.com/embed/${video_id}?autoplay=1${timeOffset}`;
        else if (video_playlist)
            video_src = `https://www.youtube.com/embed/videoseries?list=${video_playlist}&autoplay=1`;

        if (video_src) {
            let iframe = VideoLoader.createIframe({
                src: video_src,
                type: videoObj.type
            }, postId, index);
            mediaContainerInsert(iframe, link, postId, index);
        }
    },

    async createTwitch(link, videoObj, postId, index) {
        let video_id = videoObj.video;
        let video_channel = videoObj.channel;
        let video_collection = videoObj.collection;
        let video_clip = videoObj.clip;
        let timeOffset = videoObj.offset || 0;

        let video_src;
        if (video_id) {
            video_src = `https://player.twitch.tv/?video=v${video_id}&autoplay=true&muted=false&t=${timeOffset}`;
        } else if (video_channel) {
            video_src = `https://player.twitch.tv/?channel=${video_channel}&autoplay=true&muted=false`;
        } else if (video_collection) {
            video_src = `https://player.twitch.tv/?collection=${video_collection}&autoplay=true&muted=false`;
        } else if (video_clip) {
            video_src = `https://clips.twitch.tv/embed?clip=${video_clip}&autoplay=true&muted=false`;
        }

        if (video_src) {
            let iframe = VideoLoader.createIframe({
                src: video_src,
                type: videoObj.type
            }, postId, index);
            mediaContainerInsert(iframe, link, postId, index);
        }
    },

    createIframe(iframeObj, postId, index) {
        let { src, type } = iframeObj;
        if (src && src.length > 0) {
            let video = document.createElement("div");
            let spacer = document.createElement("div");
            let iframe = document.createElement("iframe");
            spacer.setAttribute("class", "iframe-spacer hidden");
            spacer.setAttribute("style", `min-width: ${854 * 0.33}px !important; max-height: ${480}px; max-width: ${854}px;`);

            if (type === 1) { // Youtube
                video.setAttribute("class", "yt-container");
                iframe.setAttribute("allow", "autoplay; encrypted-media");
            }
            else if (type === 2) // Twitch
                video.setAttribute("class", "twitch-container");
            else if (type === 3 || type === 4) { // Streamable / XboxDVR
                video.setAttribute("class", "iframe-container");
                iframe.setAttribute("scale", "tofit");
            }

            video.setAttribute("id", `loader_${postId}-${index}`);
            iframe.setAttribute("id", `iframe_${postId}-${index}`);
            iframe.setAttribute("src", src);
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("scrolling", "no");
            iframe.setAttribute("allowfullscreen", "");
            video.appendChild(iframe);
            spacer.appendChild(video);
            return spacer;
        }
        return null;
    }
};

addDeferredHandler(enabledContains("video_loader"), res => {
    if (res) processPostEvent.addHandler(VideoLoader.loadVideos);
});
