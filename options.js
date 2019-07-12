function loadOptions()
{
    showPostPreviewLocation(getOption("post_preview_location"));
    showHighlightUsers(getOption("highlight_users"));
    showVideoLoaderHD(getOption("video_loader_hd"));
    showImageLoaderNewTab(getOption("image_loader_newtab"));
    showNwsIncognito(getOption('nws_incognito'));
    showSwitchers(getOption("switchers"));
    showNotifications(getOption("notifications"));
    showUserFilters(getOption("user_filters"));
    showEmbedSocials(getOption("embed_socials"));
    showColorGauges(getOption("color_gauges"));
    showEnabledScripts();
    trackChanges();
}

function getOption(name)
{
    var value = localStorage[name];
    if (value)
        return JSON.parse(value);
    return DefaultSettings[name];
}

function saveOption(name, value)
{
    localStorage[name] = JSON.stringify(value);
}

function clearSettings()
{
    localStorage.clear();
    loadOptions();
    saveOptions();
}

function showEmbedSocials(enabled) {
    var embeds = document.getElementById("embed_socials");
    if (enabled)
        embeds.checked = enabled;
    return embeds.checked;
}

function showImageLoaderNewTab(enabled)
{
    var newtab = document.getElementById("image_loader_newtab");
    newtab.checked = enabled;
}

function getImageLoaderNewTab()
{
    var newtab = document.getElementById("image_loader_newtab");
    return newtab.checked;
}

function showVideoLoaderHD(enabled)
{
    var hd = document.getElementById("video_loader_hd");
    hd.checked = enabled;
}

function getVideoLoaderHD()
{
    var hd = document.getElementById("video_loader_hd");
    return hd.checked;
}

function getNwsIncognito()
{
	return document.getElementById("nws_incognito").checked;
}

function showNwsIncognito(enabled)
{
	document.getElementById("nws_incognito").checked = enabled;
}

function getSwitchers()
{
    return document.getElementById("switchers").checked;
}

function showSwitchers(enabled)
{
    document.getElementById("switchers").checked = enabled;
}

function getColorGauges()
{
    return document.getElementById("color_gauges").checked;
}

function showColorGauges(enabled)
{
    document.getElementById("color_gauges").checked = enabled;
}

function getNotifications()
{
    return document.getElementById("enable_notifications").checked;
}

function showNotifications(enabled)
{
    document.getElementById("enable_notifications").checked = enabled;
}

function showHighlightUsers(groups)
{
    var highlightGroups = document.getElementById("highlight_groups");
    removeChildren(highlightGroups);

    for (var i = 0; i < groups.length; i++)
    {
        var group = groups[i];
        addHighlightGroup(null, group);
    }
}

function addHighlightGroup(event, group)
{
    if(event)
      event.preventDefault();

    if (!group)
        group = {name: "", checked: true, css: "", users: [] };

    var settings = document.getElementById("highlight_groups");
    var div = document.createElement("div");
    div.className = "group";
    var check = document.createElement("input");
    check.type = "checkbox";
    check.className = "group_enabled";
    check.checked = group.enabled;
    div.appendChild(check);

    var name_box = document.createElement("input");
    name_box.type = "text";
    name_box.className = "group_name";
    name_box.value = group.name;
    div.appendChild(name_box);

    if (group.built_in)
    {
        name_box.className += " built_in";
        name_box.readOnly = true;
    }
    else
    {
        var users = document.createElement("input");
        users.className = "group_users";
        users.value = JSON.stringify(group.users);
        div.appendChild(users);

        var remove = document.createElement("a");
        remove.href = "#";
        remove.addEventListener('click', function (event) {
            event.preventDefault();
            settings.removeChild(div);
        });
        remove.appendChild(document.createTextNode("(remove)"));
        div.appendChild(remove);
    }

    div.appendChild(document.createElement("br"));

    css = document.createElement("textarea");
    css.className = "group_css";
    css.rows = "2";
    css.cols = "25";
    css.value = group.css;
    div.appendChild(css);

    settings.appendChild(div);

    trackChanges();
}

function getHighlightGroups()
{
    var groups = [];

    var settings = document.getElementById("highlight_groups");
    var group_divs = settings.getElementsByTagName("div");
    for (var i = 0; i < group_divs.length; i++)
    {
        var group = {};
        var input_name = getDescendentByTagAndClassName(group_divs[i], "input", "group_name");
        group.name = input_name.value;
        group.built_in = input_name.readOnly;
        group.enabled = getDescendentByTagAndClassName(group_divs[i], "input", "group_enabled").checked;
        group.css = getDescendentByTagAndClassName(group_divs[i], "textarea", "group_css").value;
        if (!group.built_in)
        {
            group.users = JSON.parse(getDescendentByTagAndClassName(group_divs[i], "input", "group_users").value);
        }
        groups.push(group);
    }

    return groups
}

function showPostPreviewLocation(position)
{
    var left = document.getElementById("post_preview_left");
    var right = document.getElementById("post_preview_right");
    left.checked = (position == "Left");
    right.checked = (position == "Right");
}

function getPostPreviewLocation()
{
    var left = document.getElementById("post_preview_left");
    if (left.checked)
        return "Left";
    return "Right";
}

function showPostPreviewLive(enabled)
{
    var live = document.getElementById("post_preview_live");
    live.checked = enabled;
}

function showEnabledScripts()
{
    var enabled = getOption("enabled_scripts");

    var inputs = document.getElementsByTagName("input");

    for (var i = 0; i < inputs.length; i++)
    {
        if (inputs[i].type == "checkbox" && inputs[i].className == "script_check")
        {
            inputs[i].onclick = toggleSettingsVisible;
            var found = false;
            for (var j = 0; j < enabled.length; j++)
            {
                if (enabled[j] == inputs[i].id)
                {
                    found = true;
                    break;
                }
            }

            inputs[i].checked = found;
            var settings_div = document.getElementById(inputs[i].id + "_settings");
            if (settings_div)
            {
                settings_div.style.display = found ? "block" : "none";
            }
        }
    }
}

function getEnabledScripts()
{
    var enabled = [];
    var inputs = document.getElementsByTagName("input");

    for (var i = 0; i < inputs.length; i++)
    {
        if (inputs[i].type == "checkbox" && inputs[i].className == "script_check")
        {
            if (inputs[i].checked)
            {
                enabled.push(inputs[i].id);
            }
        }
    }

    return enabled;
}

function toggleSettingsVisible()
{
    var settings_div = document.getElementById(this.id + "_settings");
    if (settings_div)
    {
        settings_div.style.display = this.checked ? "block" : "none";
    }
}

function logInForNotifications(notificationuid)
{
    var _dataBody = encodeURI(`id=${notificationuid}&name=Chrome Shack (${new Date()})`);
    postXHR({
        url: "https://winchatty.com/v2/notifications/registerNotifierClient",
        header: { "Content-type": "application/x-www-form-urlencoded" },
        data: _dataBody
    }).then(() => {
        //console.log("Response from register client " + res.responseText);
        browser.tabs.query({url: 'https://winchatty.com/v2/notifications/ui/login*'})
            .then(tabs => {
                if(tabs.length === 0) {
                    browser.tabs.create({url: `https://winchatty.com/v2/notifications/ui/login?clientId=${notificationuid}`});
                } else {
                    //Since they requested, we'll open the tab and make sure they're at the correct url.
                    browser.tabs.update(
                        tabs[0].tabId,
                        {
                            active: true,
                            highlighted: true,
                            url: `https://winchatty.com/v2/notifications/ui/login?clientId=${notificationuid}`
                        }
                    );
                }
            });
    }).catch(err => { console.log(err); });
}

function updateNotificationOptions() {
    //Log the user in for notifications.
    if (getNotifications()) {
        var uid = getOption("notificationuid");
        if (uid === "" || uid === undefined) {
            fetchSafe("https://winchatty.com/v2/notifications/generateId")
                .then(json => {
                    // sanitized in common.js!
                    var notificationUID = json.id;
                    //console.log("Got notification id of " + notificationUID);
                    saveOption("notificationuid", notificationUID);
                    logInForNotifications(notificationUID);
                });
        }
        else {
            //console.log("Notifications already set up using an id of " + notificationUID);
        }
    }
    else {
        saveOption("notificationuid", "");
        //TODO: Log them out because they're disabling it. This requires a username and password.  For now we'll just kill the UID and they can remove it manually because... meh whatever.
    }
}

function getDescendentByTagAndClassName(parent, tag, class_name)
{
    var descendents = parent.getElementsByTagName(tag);
    for (var i = 0; i < descendents.length; i++)
    {
        if (descendents[i].className.indexOf(class_name) == 0)
            return descendents[i];
    }
}

function showUserFilters(userFilters) {
    var usersLst = document.getElementById('filtered_users');
    for (var i = 0; i < usersLst.length; i++) {
        usersLst.remove(0);
    }
    if (userFilters) {
        for (var i = 0; i < userFilters.length; i++) {
            var newOption = document.createElement('option');
            newOption.textContent = userFilters[i];
            newOption.value = userFilters[i];
            usersLst.appendChild(newOption);
        }
    }
}

function getUserFilters() {
    var usersLst = document.getElementById('filtered_users');
    var users = [];
    var options = usersLst.getElementsByTagName('option');
    for (var i = 0; i < options.length; i++) {
        users.push(options[i].value);
    }
    return users;
}

function addUserFilter(event) {
    event.preventDefault();
    var usernameTxt = document.getElementById('new_user_filter_text');
    var usersLst = document.getElementById('filtered_users');
    var username = superTrim(usernameTxt.value).toLowerCase();
    if (username == '') {
        alert('Please enter a username to filter.');
        return;
    }
    var list = usersLst.getElementsByTagName('option');
    for (var i = 0; i < list.length; i++) {
        var existingUsername = list[i].value;
        if (username == existingUsername) {
            alert('That username is already filtered.');
            usernameTxt.value = '';
            return;
        }
    }
    var newOption = document.createElement('option');
    newOption.textContent = username;
    newOption.value = username;
    usersLst.appendChild(newOption);
    usernameTxt.value = '';
    saveOptions();
}

function removeUserFilter(event) {
    event.preventDefault();
    var usersLst = document.getElementById('filtered_users');
    var index = usersLst.selectedIndex;
    if (index >= 0) {
        usersLst.remove(index);
        saveOptions();
    } else {
        alert('Please select a username to remove.');
    }
}

function saveOptions()
{
    // Update status to let the user know options were saved
    var status = document.getElementById("status");

    try
    {
        saveOption("post_preview_location", getPostPreviewLocation());
        saveOption("enabled_scripts", getEnabledScripts());
        saveOption("highlight_users", getHighlightGroups());
        saveOption("video_loader_hd", getVideoLoaderHD());
        saveOption("image_loader_newtab", getImageLoaderNewTab());
        saveOption("nws_incognito", getNwsIncognito());
        saveOption("switchers", getSwitchers());
        updateNotificationOptions();
        saveOption("notifications", getNotifications());
        saveOption("user_filters", getUserFilters());
        saveOption("embed_socials", showEmbedSocials());
        saveOption("color_gauges", getColorGauges());
    }
    catch (err)
    {
        //alert("There was an error while saving your settings:\n" + err);
        status.textContent = `Error: ${err}`;
        return;
    }

    status.textContent = "Options Saved.";
    setTimeout(function() {
        status.textContent = "";
    }, 2000);
}

document.addEventListener('DOMContentLoaded', function() {
    loadOptions();
    document.getElementById('clear_settings').addEventListener('click', clearSettings);
    document.getElementById('add_highlight_group').addEventListener('click', addHighlightGroup);
    document.getElementById('add_user_filter_btn').addEventListener('click', addUserFilter);
    document.getElementById('remove_user_filter_btn').addEventListener('click', removeUserFilter);
});

function trackChanges() {
    var links = document.getElementById('content').getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', saveOptions);
    }

    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('change', saveOptions);
    }

    var selects = document.getElementsByTagName("select");
    for (var i = 0; i < selects.length; i++) {
        selects[i].addEventListener('change', saveOptions);
    }

    var textareas = document.getElementsByTagName("textarea");
    for (var i = 0; i < textareas.length; i++) {
        textareas[i].addEventListener('input', saveOptions);
    }
}
