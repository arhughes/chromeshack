settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("lol"))
    {
        LOL =
        {
            URL: "http://www.lmnopc.com/greasemonkey/shacklol/",
            COUNT_URL: "http://www.lmnopc.com/greasemonkey/shacklol/api.php?special=getcounts",
            VERSION: "20121024",

            tags: getSetting("lol_tags"),
            showCounts: getSetting("lol_show_counts"),
            ughThreshold: parseInt(getSetting('lol_ugh_threshold')),

            counts: null,
            processed_posts: false,

            posts: Array(),

            installLink: function()
            {
                var comments_tools = getDescendentByTagAndClassName(document, "div", "commentstools");
                if (comments_tools)
                {
                    var link = document.createElement("a");
                    link.id = "lollink";
                    link.href = LOL.URL + "?user=" + encodeURIComponent(LOL.getUsername());
                    link.title = "Check out what got the [lol]s";
                    link.style.backgroundImage = "url(" + chrome.extension.getURL("../images/lol.png") + ")";
                    link.appendChild(document.createTextNode("[ L O L ` d ]"));
                    comments_tools.appendChild(link);
                }

                if (LOL.showCounts != 'none')
                {
                    LOL.counts = getSetting("lol-counts");

                    var last_lol_count_time = getSetting("lol-counts-time");
                    if (!last_lol_count_time || (new Date().getTime() - last_lol_count_time) > 120000)
                    {
                        LOL.getCounts();
                    }
                }
            },

            installCSS: function()
            {
                var css = '';
                for (var i = 0; i < LOL.tags.length; i++)
                {
                    css += '.oneline_tags .oneline_' + LOL.tags[i].name + ' { background-color: ' + LOL.tags[i].color + '; }\n';
                }

                var styleBlock = document.createElement('style');
                styleBlock.type = 'text/css';
                styleBlock.appendChild(document.createTextNode(css));

                document.getElementsByTagName('body')[0].appendChild(styleBlock);
            },

            installButtons: function(item, id)
            {
                var lol_div_id = 'lol_' + id;
                
                // buttons already installed here
                if (document.getElementById(lol_div_id) != null)
                    return;

                var author = getDescendentByTagAndClassName(item, "span", "author");
                if (!author)
                {
                    console.error("getDescendentByTagAndClassName could not locate span.author");
                    return;
                }

                var lol_div = document.createElement("div");
                lol_div.id = lol_div_id;
                lol_div.className = "lol";
                
                // generate all the buttons from settings
                for (var i = 0; i < LOL.tags.length; i++)
                {
                    lol_div.appendChild(LOL.createButton(LOL.tags[i].name, id, LOL.tags[i].color));
                }

                // add them in
                author.appendChild(lol_div);

                if (LOL.counts)
                    LOL.showThreadCounts(id);

                LOL.posts.push(id);
            },

            createButton: function(tag, id, color)
            {
                var button = document.createElement("a");
                button.id = tag + id;
                button.href = "#";
                button.className = "lol_button";
                button.style.color = color;
                button.innerText = tag;

                // store this stuff in data items instead of an anonymous handler function
                button.dataset.loltag = tag;
                button.dataset.threadid = id;

                button.addEventListener("click", LOL.lolThread);

                var span = document.createElement("span");
                span.appendChild(document.createTextNode("["));
                span.appendChild(button);
                span.appendChild(document.createTextNode("]"));

                return span;
            },

            lolThread: function(e)
            {
                var user = LOL.getUsername();
                if (!user)
                {
                    alert("You must be logged in to lol!");
                    return;
                }

                var element = e.target;
                var tag = element.dataset.loltag;
                var id = element.dataset.threadid;
                var isloled = element.dataset.isloled == 'true';
                
                var url = LOL.URL + "report.php";

                var data = 'who=' + user + '&what=' + id + '&tag=' + tag + '&version=' + LOL.VERSION;

                if (isloled) {
                    data += '&action=untag';
                } else {
                    var moderation = LOL.getModeration(id);
                    if (moderation.length)
                        data += '&moderation=' + moderation;
                }

                postFormUrl(url, data, function(response)
                {
                    if (response.status == 200 && (response.responseText.indexOf("ok") == 0 || response.responseText.indexOf("You have already") == 0))
                    {
                        // looks like it worked
                        var new_tag;
                        if (isloled) {
                           new_tag = tag; 
                        } else {
                            new_tag = "*";
                            for (var i = 0; i < tag.length; i++)
                                new_tag += " " + tag[i].toUpperCase() + " ";
                            new_tag += " ' D *";
                        }

                        element.innerHTML = new_tag;
                        element.dataset.isloled = !isloled;
                    }
                    else
                    {
                        alert(response.responseText);
                    }
                });

                e.preventDefault();
            },

            getUsername: function()
            {
                var username = document.getElementById("user_posts");
                if (username == null) {
                    return '';
                } else {
                    var m = username.href.match("/user/(.+)/posts");
                    if (m == null) return '';
                    return m[1];
                }
            },

            getModeration: function(id)
            {
                console.log("getting moderation for id: " + id);
                var tags = ["fpmod_offtopic", "fpmod_nws", "fpmod_stupid", "fpmod_informative", "fpmod_political"];
                var item = document.getElementById("item_" + id);
                var fullpost = getDescendentByTagAndClassName(item, "div", "fullpost");
                for (var i = 0; i < tags.length; i++)
                {
                    if (fullpost.className.indexOf(tags[i]) >= 0)
                    {
                        return tags[i];
                    }
                }

                return "";
            },

            finishPosts: function()
            {
                // mark the posts as finished
                LOL.processed_posts = true;
            },

            showThreadCounts: function(threadId)
            {
                var rootId = -1; 
            
                // Make sure this is a rootId 
                if (document.getElementById('root_' + threadId))
                {
                    rootId = threadId;
                }
                else
                {
                    // If this is a subthread, the root needs to be found
                    var liItem = document.getElementById('item_' + threadId); 
                    if (liItem)
                    {
                        do 
                        {
                            liItem = liItem.parentNode; 
                            
                            if (liItem.className == 'root')
                            {
                                rootId = liItem.id.split('_')[1];
                                break;
                            }
                        }
                        while (liItem.parentNode != null)
                    }
                }
                
                if (rootId == -1)
                {
                    console.log('Could not find root for ' + threadId); 
                    return; 
                }
            
                // If there aren't any tagged threads in this root there's no need to proceed 
                if (!LOL.counts[rootId])
                {
                    console.log('No lols for ' + rootId);
                    return; 
                }

                // Store the tag names in an array for easy comparisons in the loop
                var tag_names = [];
                for (var i = 0; i < LOL.tags.length; i++)
                    tag_names.push(LOL.tags[i].name);

                // Update all the ids under the rootId we're in 
                for (id in LOL.counts[rootId])
                {	
                    for (tag in LOL.counts[rootId][id])
                    {
                        // Evaluate [ugh]s
                        // Must be root post, ughThreshold must be enabled, tag must be ugh, and counts have to be gte the ughThreshold
                        if ((id == rootId) && (threadId == rootId) && (LOL.ughThreshold > 0) && (tag == 'ugh') && (LOL.counts[rootId][id][tag] >= LOL.ughThreshold)) {
                            var root = document.getElementById('root_' + id);
                            if (root.className.indexOf('collapsed') == -1)
                            {
                                var close = getDescendentByTagAndClassName(root, "a", "closepost");
                                var show = getDescendentByTagAndClassName(root, "a", "showpost");
                                close.addEventListener("click", function() { Collapse.close(id); });
                                show.addEventListener("click", function() { Collapse.show(id); });
                                root.className += " collapsed";
                                show.className = "showpost";
                                close.className = "closepost hidden";
                            }
                        }

                        // If showCounts is configured as limited and this tag isn't in the user's list of tags, skip it
                        if (((LOL.showCounts == 'limited') || (LOL.showCounts == 'short')) && (tag_names.indexOf(tag) == -1))
                            continue;

                        // Add * x indicators in the fullpost 
                        var tgt = document.getElementById(tag + id); 
                        if (!tgt && id == rootId)
                        {
                            // create the button if it doesn't exist
                            var lol_button = LOL.createButton(tag, id, '#ddd');
                            var lol_div = document.getElementById('lol_' + id);
                            lol_div.appendChild(lol_button);

                            // get the link
                            tgt = document.getElementById(tag + id); 
                        }

                        if (tgt)
                        {
                            if (LOL.showCounts == 'short')
                            {
                                tgt.innerHTML = LOL.counts[rootId][id][tag];
                            }
                            else
                            {
                                tgt.innerHTML = tag + ' &times; ' + LOL.counts[rootId][id][tag];
                            }
                        }
                    
                        // Add (lol * 3) indicators to the onelines
                        if (!document.getElementById('oneline_' + tag + 's_' + id))
                        {
                            tgt = document.getElementById('item_' + id);
                            if (tgt)
                            {
                                tgt = getDescendentByTagAndClassName(tgt, 'div', 'oneline');
                                if (tgt) 
                                {
                                    divOnelineTags = document.createElement('div'); 
                                    divOnelineTags.id = 'oneline_' + tag + 's_' + id;
                                    divOnelineTags.className = 'oneline_tags'; 
                                    tgt.appendChild(divOnelineTags);
                                    
                                     // add the button 
                                    spanOnelineTag = document.createElement('span'); 
                                    spanOnelineTag.id = 'oneline_' + tag + '_' + id;
                                    spanOnelineTag.className = 'oneline_' + tag;  
                                    if (LOL.showCounts == 'short')
                                    {
                                        spanOnelineTag.appendChild(document.createTextNode(LOL.counts[rootId][id][tag]));
                                    }
                                    else
                                    {
                                        spanOnelineTag.appendChild(document.createTextNode(tag + ' × ' + LOL.counts[rootId][id][tag]));
                                    }
                                    divOnelineTags.appendChild(spanOnelineTag); 
                                }
                            }
                        }
                        else
                        {
                            var span = document.getElementById('oneline_' + tag + '_' + id);
                            if (typeof(span) != 'undefined')
                            {
                                if (LOL.showCounts == 'short')
                                {
                                    span.innerText = LOL.counts[rootId][id][tag];
                                }
                                else
                                {
                                    span.innerText = tag + ' × ' + LOL.counts[rootId][id][tag];
                                }
                            }
                        }
                    }
                }
            },

            getCounts: function()
            {
                getUrl(LOL.COUNT_URL, function(response)
                {
                    if (response.status == 200)
                    {
                        // Store original LOL.counts
                        var oldLolCounts = LOL.counts;

                        LOL.counts = JSON.parse(response.responseText);

                        setSetting("lol-counts", LOL.counts);
                        setSetting("lol-counts-time", new Date().getTime());

                        // Call displayCounts again only if the counts have actually changed
                        if (LOL.counts != oldLolCounts)
                        {
                            LOL.displayCounts();
                        }
                    }
                });
            },

            displayCounts: function(counts)
            {
                // only do this if the posts have already been processed, otherwise
                // each post will handle displaying its own counts
                if (LOL.processed_posts)
                {
                    // Loop through all the processed posts and update lol counts
                    for (var i = 0; i < LOL.posts.length; i++)
                    {
                        LOL.showThreadCounts(LOL.posts[i]);
                    }
                }
            }

        }

        LOL.installLink();
        LOL.installCSS();
        processPostEvent.addHandler(LOL.installButtons);
        fullPostsCompletedEvent.addHandler(LOL.finishPosts);
    }
});
