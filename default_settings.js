DefaultSettings = {

    enabled_scripts: [
        "lol",
        "comment_tags",
        "post_preview",
        "highlight_users",
        "image_loader",
        "video_loader",
        "collapse_threads",
        "dinogegtik",
        "sparkly_comic",
        "winchatty_comments_search",
        "expiration_watcher",
		  "extend_login"
    ],

    lol_tags: [
        {name: "lol", color: "#f80"},
        {name: "inf", color: "#09c"},
        {name: "unf", color: "#f00"},
        {name: "tag", color: "#7b2"},
        {name: "wtf", color: "#c000c0"},
        {name: "ugh", color: "#0b0"}
    ],

    lol_show_counts: 'limited',

    lol_ugh_threshold: '0',

    post_preview_location: "Left",

    mod_marker_css: "color: red !important",

    category_banners_visible: [
        "offtopic",
        "political",
        "stupid"
    ],

    collapsed_threads: [],

    original_poster_css: "font-weight: bold; color: #FFFFCC;",

    highlight_users: [
        { name: "Mods", enabled: true, built_in: true, css: "color: red !important" },
        { name: "Employees", enabled: true, built_in: true, css: "color: green !important" },
        { name: "Original Poster", enabled: true, built_in: true, css: "font-weight: bold; color: yellow !important" },
        { name: "Game Devs", enabled: true, built_in: true, css: "color: purple !important" },
        { name: "Friends", enabled: true, built_in: false, css: "border: 1px dotted white !important", users: [ 177008 ] }
    ],

    video_loader_hd: true,
    
    expiration_watcher_style: "Bar"

}
