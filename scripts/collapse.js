let Collapse = {
    toggle(item, id, is_root_post) {
        // only process for root posts
        if (is_root_post) {
            let root = document.getElementById("root_" + id);
            // root should never be null, but check anyway
            if (root) {
                let postmeta = item.querySelector("div.postmeta");
                let close = postmeta.querySelector("a.closepost");
                let show = postmeta.querySelector("a.showpost");
                close.addEventListener("click", () => {
                    Collapse.close(id);
                });
                show.addEventListener("click", () => {
                    Collapse.show(id);
                });

                // this thread should be collapsed
                getSetting("collapsed_threads").then(collapsed => {
                    if (objContains(id, collapsed)) {
                        root.className += " collapsed";
                        show.className = "showpost";
                        close.className = "closepost hidden";
                    }
                });
            }
        }
    },

    close(id) {
        browser.runtime.sendMessage({ name: "collapseThread", id: id });
    },

    show(id) {
        browser.runtime.sendMessage({ name: "unCollapseThread", id: id });
    }
};

processPostEvent.addHandler(Collapse.toggle)
