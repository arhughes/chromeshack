// Twitter and Instagram embedding support (WombatFromHell)
settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("embed_socials")) {
        // dependency injection is required for twitter embedding
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0],
            t = window.twttr || {};
            if (d.getElementById(id)) return t;
            js = d.createElement(s);
            js.id = id;
            js.async = true;
            js.src = "https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js, fjs);
            t._e = [];
            t.ready = function(f) {
                t._e.push(f);
            };
            return t;
        }(document, "script", "twttr-wjs"));
        // end dependency injection

        EmbedSocials = {
            getLinks: function(item, id) {
                var links = document.querySelectorAll("div.postbody a");
                if (links.length > 0) {
                    for (var i = 0; i < links.length; i++) {
                        if (EmbedSocials.isSocialLink(links[i].href))
                            links[i].addEventListener("click", EmbedSocials.processPost);
                    }
                }
            },

            isSocialLink: function(href) {
                var _isTwitter = /https?\:\/\/twitter.com\/\w+\/status\/(\d+)/i;
                var _isInstagram = /https?\:\/\/(?:www\.|)(?:instagr.am|instagram.com)(?:\/.*|)\/p\/([\w\-]+)\//i;
                if (_isTwitter.test(href)) { return true; }
                else if (_isInstagram.test(href)) { return true; }
                return false;
            },

            insertCommand: function(elem, customCode) {
                // insert a one-way script that executes synchronously (caution!)
                var _script = document.createElement("script");
                _script.textContent = `${customCode}`;
                return elem.appendChild(_script);
            },

            createTwitter: function(postUrl, postId, parentElem) {
                var twttrContainer = document.createElement("div");
                twttrContainer.id = `tweet-container_${postId}`;
                twttrContainer.setAttribute("class", "tweet-container");
                parentElem.appendChild(twttrContainer);
                var _target = `tweet-container_${postId}`;

                // twttr-wjs can just inject a tweet straight into the DOM
                EmbedSocials.insertCommand(
                    parentElem, /*html*/`
                    window.twttr.widgets.createTweet(
                        "${postId}",
                        document.getElementById("${_target}"),
                        { theme: "dark", width: "500" }
                    );
                `);

                if (getSetting("enabled_scripts").contains("scroll_to_post")) {
                    const smooth = getSetting('scroll_to_post_smooth', true);
                    scrollToElement(document.getElementById(_target), smooth ? 200 : 0);
                }
            },

            getDate: function(timestamp) {
                var _date = new Date(0);
                _date.setUTCSeconds(timestamp);
                // we should have our relative local time now
                return `${_date.toLocaleString().split(',')[0]} ${_date.toLocaleTimeString('en-US')}`;
            },

            taggifyCaption: function(caption, elem) {
                var captionContainer = document.createElement("span");
                captionContainer.id = "instgrm_post_caption";
                var tagLink = "https://www.instagram.com/explore/tags/";
                var userLink = "https://www.instagram.com/";
                // trim some potentially troublesome characters
                var _trimmed = caption.replace(/\\u00a0|[\.]{2,}/gmui, "").trim();
                var _sanitized = _trimmed.replace(/[\s]{1,}|[\n]/gm, " ").split(" ");
                for (var i=0; i < _sanitized.length; i++) {
                    var span = document.createElement("span");
                    if (_sanitized[i].indexOf("#") == 0) {
                        // transform hash tags into tag links
                        var link = document.createElement("a");
                        var _tag = _sanitized[i].replace("#", "");
                        link.href = `${tagLink}${_tag}/`;
                        span.innerText += `${_sanitized[i]}`;
                        link.appendChild(span);
                        captionContainer.appendChild(link);
                    } else if (_sanitized[i].indexOf("@") == 0) {
                        // transform user tags into user links
                        var link = document.createElement("a");
                        var _tag = _sanitized[i].replace("@", "");
                        link.href = `${userLink}${_tag}/`;
                        span.innerText += `${_sanitized[i]}`;
                        link.appendChild(span);
                        captionContainer.appendChild(link);
                    } else {
                        span.innerText += `${_sanitized[i]}`;
                        captionContainer.appendChild(span);
                    }
                }
                return captionContainer;
            },

            insertInstagramTemplate: function(postId, parentElem) {
                var container = document.createElement("div");
                container.id = `instgrm-container_${postId}`;
                container.setAttribute("class", "instgrm-container hidden");
                // use a template for html injection
                var _template = /*html*/`
                    <div class="instgrm-header">
                        <a href="#" id="instgrm_profile_a">
                            <img id="instgrm_author_pic" class="circle">
                        </a>
                        <div class="instgrm-postpic-line">
                            <a href="#" id="instgrm_profile_b">
                                <span id="instgrm_author_nick"></span>
                            </a>
                            <a href="#" id="instgrm_post_link">
                                <span id="instgrm_post_details"></span>
                            </a>
                        </div>
                        <div class="instgrm-logo">
                            <a href="http://www.instagram.com/">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                        </div>
                    </div>
                    <div id="instgrm_media"></div>
                    <div id="instgrm-caption"></div>
                    <div class="hr2"></div>
                    <div class="instgrm-footer">
                        <span>A post shared by</span>
                        <a id="instgrm_post_url" href="#">
                            <span id="instgrm_postlink_name"></span>
                        </a>
                        <span id="instgrm_post_author"></span>
                        <span id="instgrm_post_timestamp"></span>
                    </div>
                `;
                container.innerHTML = _template;
                parentElem.appendChild(container);
            },

            parseInstagram: function(postId, parentElem) {
                var postUrl = `https://www.instagram.com/p/${postId}/`;
                // if we have an instagram postId use it to toggle our element rather than query
                var _target = document.querySelector(`#instgrm-container_${postId}`);
                if (_target)
                    return _target.classList.toggle("hidden");

                EmbedSocials.insertInstagramTemplate(postId, parentElem);
                _target = document.querySelector(`#instgrm-container_${postId}`);
                xhrRequest({ type: "GET", url: postUrl }) .then(resp => {
                    // save our likes from the header
                    var _likesMatch = /<meta content="(\d+ Likes, \d+ Comments|\d+ Likes,?|\d+ Comments)/i.exec(resp);
                    // save our video url and details if there is any
                    var _videoMatch = /<meta property="og:video" content="(.*)" \/>/i.exec(resp);
                    // var _videoWidth = /<meta property="og:video:width" content="(\d+)" \/>/i.exec(resp)[1];
                    // var _videoHeight = /<meta property="og:video:height" content="(\d+)" \/>/i.exec(resp)[1];
                    // parse post's graphql dump into a json object
                    var _configGQL = /\:\{"PostPage":\[\{"graphql":(.*)\}\]\}/gm.exec(resp);
                    var _matchGQL = _configGQL[1] && JSON.parse(_configGQL[1]).shortcode_media;
                    // var _isPrivate = _matchGQL && _matchGQL.owner.is_private;

                    if (_matchGQL) {
                        var _authorPic = _matchGQL.owner.profile_pic_url;
                        var _authorName = _matchGQL.owner.username;
                        var _authorFullName = _matchGQL.owner.full_name;
                        var _postTimestamp = EmbedSocials.getDate(_matchGQL.taken_at_timestamp);
                        var _postURL = `https://instagr.am/p/${_matchGQL.shortcode}/`;
                        var _postCaption = "", _postMediaUrl;
                        if (_matchGQL.edge_media_to_caption.edges[0]) {
                            _postCaption = _matchGQL.edge_media_to_caption.edges[0].node.text;
                            var caption = document.getElementById("instgrm-caption");
                            caption.appendChild(EmbedSocials.taggifyCaption(_postCaption));
                        }

                        // use the first video link otherwise use the first image in the list
                        if (_videoMatch)
                            _postMediaUrl = _videoMatch[1];
                        else
                            _postMediaUrl = _matchGQL.display_resources[0].src;

                        // populate our html elements
                        var postAuthorPic = document.getElementById("instgrm_author_pic");
                        var postAuthor = document.getElementById("instgrm_post_author");
                        var postPicAuthor = document.getElementById("instgrm_author_nick");
                        var postPicDetails = document.getElementById("instgrm_post_details");
                        var postLinkName = document.getElementById("instgrm_postlink_name");
                        var postTimestamp = document.getElementById("instgrm_post_timestamp");
                        var postParentUrl = document.getElementById("instgrm_post_url");

                        var embed;
                        // choose video over images
                        if (_postMediaUrl.match(/.mp4$/i)) {
                            embed = document.createElement("video");
                            embed.setAttribute("id", "instgrm_embed");
                            embed.setAttribute("src", _postMediaUrl);
                            embed.setAttribute("muted", "");
                            embed.setAttribute("controls", "");
                        } else {
                            embed = document.createElement("img");
                            embed.setAttribute("id", "instgrm_embed");
                            embed.setAttribute("src", _postMediaUrl);
                        }
                        // set some relevant shortcuts in the header
                        var _profileLinkA = document.getElementById("instgrm_profile_a");
                        var _profileLinkB = document.getElementById("instgrm_profile_b");
                        var _postLink = document.getElementById("instgrm_post_link");
                        _profileLinkA.setAttribute("href", `https://instagr.am/${_authorName}/`);
                        _profileLinkB.setAttribute("href", `https://instagr.am/${_authorName}/`);
                        _postLink.setAttribute("href", `https://instagr.am/p/${postId}/`);

                        // fill in our user details
                        postAuthorPic.src = _authorPic;
                        postLinkName.innerText = _authorFullName;
                        postAuthor.innerText = `(@${_authorName})`;
                        postPicAuthor.innerText = _authorName;
                        postPicDetails.innerText = _likesMatch ? _likesMatch[1] : "";
                        postTimestamp.innerText = `on ${_postTimestamp}`;
                        postParentUrl.href = _postURL;

                        // compile everything into our container and inject at once
                        var embedTarget = document.querySelector(`#instgrm-container_${postId} #instgrm_media`);
                        embedTarget.appendChild(embed);
                        _target.classList.remove("hidden");
                    }
                });
            },

            processPost: function(e) {
                if (e.button == 0) {
                    e.preventDefault();
                    if (!document.getElementById("twttr-wjs"))
                        return console.log("Embed Socials dependency injection failed!");

                    var link = this;
                    var _matchTwitter = /https?\:\/\/twitter.com\/\w+\/status\/(\d+)/i.exec(link.href);
                    // href = "https://www.instagram.com/p/BqO5F-gAyQw/";
                    href = "https://www.instagram.com/p/BqPHo-9FiyO/";
                    var _matchInstagram = /https?\:\/\/(?:www\.|)(?:instagr.am|instagram.com)(?:\/.*|)\/p\/([\w\-]+)\//i.exec(href);
                    var _twitterPostId = _matchTwitter && _matchTwitter[1];
                    var _instgrmPostId = _matchInstagram && _matchInstagram[1];

                    var _targetTweet = document.querySelector(`div[id='tweet-container_${_twitterPostId}']`);
                    var _targetInstgrm = document.querySelector(`div[id='instgrm-container_${_instgrmPostId}']`);

                    if (_twitterPostId) {
                        if (_targetTweet)
                            return _targetTweet.classList.toggle("hidden");

                        EmbedSocials.createTwitter(_matchTwitter[0], _twitterPostId, link.parentNode);
                    }
                    else if (_instgrmPostId) {
                        if (_targetInstgrm)
                            return _targetInstgrm.classList.toggle("hidden");

                        EmbedSocials.parseInstagram(_instgrmPostId, link.parentNode);
                    }
                }
            }
        }
        processPostEvent.addHandler(EmbedSocials.getLinks);
    }
});