let DefaultSettings = {
    enabled_scripts: [
        "shrink_user_icons",
        "reduced_color_user_icons",
        "image_loader",
        "image_loader_newtab",
        "video_loader",
        "embed_socials",
        "getpost",
        "nws_incognito",
        "new_comment_highlighter",
        "highlight_users",
        "custom_user_filters",
        "post_preview"
    ],

    collapsed_threads: [],

    user_filters: [],

    highlight_groups: [
        { name: "Original Poster", enabled: true, built_in: true, css: "font-weight: bold; color: yellow;" },
        { name: "Mods", enabled: true, built_in: true, css: "color: red !important;" },
        { name: "Employees", enabled: true, built_in: true, css: "color: green !important;",
            users: [
                "Steve Gibson",
                "Maarten Goldstein",
                "Chris Faylor",
                "Nick Breckon",
                "Aaron Linde",
                "Alice O'Conner",
                "Jeff Mattas",
                "Garnett Lee",
                "Brian Leahy",
                "Ackbar2020",
                "greg-m",
                "XAVdeMATOS",
                "Shacknews",
                "sHugamom",
                "Chris Remo",
                "TylerJSmith",
                "OzzieMejia",
                "John Keefer",
                "Keefinator",
                "Andrew Yoon",
                "the man with the briefcase",
                "staymighty",
                "xosammyjoe",
                "hammersuit",
                "Steve Watts",
                "SporkyReeve",
                "Daniel Perez",
                "Daniel_Perez",
                "Greg Burke",
                "GBurke59",
                "joshua hawkins",
                "steven wong",
                "squid wizard",
                "beardedaxe",
                "Crabs Jarrard",
                "David Craddock",
                "Charles Singletary Jr"
            ]
        },
        { name: "Game Devs", enabled: true, built_in: true, css: "color: purple !important;",
            users: [
                "jason bergman",
                "dahanese", // 2K Games
                "OverloadUT", // 2K Sports
                "georgeb3dr",
                "Joe3DR",
                "Mr. 9000",
                "Scatti",
                "ScottMi11er", // 3D Realms
                "Dravalen", // Airtight Games
                "fredrik s", // Affectworks
                "derean", // Artificial Mind & Movement
                "YoYo", // Atari (Dallas)
                "lplasmatron",
                "speon", // Bethesda Softworks
                "Derek French", // Bioware
                "dmiller", // Bungie
                "Karnov", // Buzz Monkey
                "aavenr",
                "-efx-", // Digital Illusions CE (Sweden)
                "timmie", // EA Canada
                "CliffyB",
                "fufux", // Epic
                "jbury", // Free Radical Design
                "Ivan Sulic", // Flagship Studios
                "Torque X",
                "d3tached",
                "sullisnack", // Garage Games
                "timaste",
                "timmytaste", // Indie Contractor
                "hellchick", // Gas Powered Games
                "rickmus",
                "byorn",
                "DaMojo",
                "duvalmagic",
                "kungfusquirrel",
                "MADMikeDavis",
                "mikeyzilla",
                "wieder",
                "dopefish", // Gearbox
                "threeup", // hb-studios
                "lvlmaster",
                "zeroprey", // Human Head
                "patd",
                "toddh",
                "xian", // id Software
                "Avatar",
                "DKo5",
                "Inherent", // Infinity Ward
                "SilverSnake", // Massive
                "cannelbrae", // Monolith
                "cpnkegel",
                "Cowbs", // Naughty Dog
                "Zoid", // NCSoft
                "Normality", // Nerve
                "Jabby", // Obsidian
                "darweidu",
                "Freshview",
                "gndagger",
                "Rampancy",
                "sammyl",
                "tostador", // Pandemic
                "Buckyfg1", // Piranha
                "cheshirecat", // Planet Moon
                "PetriRMD", // Remedy
                "Andy Hanson", // Retro
                "Jack Mathews", // Retro
                "bozer", // Rockstar
                "s2jason", // S2 Games
                "bakanoodle", // Slant Six
                "mittense", // Stardock
                "AshenTemper", // Stray Bullet
                "dtabacco",
                "jake2000",
                "mikeycyb", // TellTale
                "brome", // ThreeWave
                "Krypt_", // Treyarch
                "Ease_One", // Trauma
                "mnok",
                "MrLobo", // Ubisoft
                "Doug_Support",
                "Erik Johnson",
                "garymct",
                "locash",
                "RobinWalker", // Valve
                "ColoradoCNC",
                "Pezman", // Vivendi
                "Knytehawkk", // Zemnott
                "deveus1", // Activision
                "lord cecil", // Uber
                "eonix", // Relic
                "whippedcracker", // Vigil
                "Fred Garvin", // former BioWare
                "Omning",
                "robinchyo",
                "Romsteady",
                "drhazard", // Volition
                "freakynipples69" // MindShaft
            ]
        },
        { name: "Friends", enabled: true, built_in: false, css: "border: 1px dotted white !important;", users: [] }
    ]
};

const getSetting = async (key, defaultVal) => {
    let settings = await getSettings();
    if (!settingsContains(key)) setSetting(key, defaultVal);
    return settings[key];
};

const getEnabled = async (key) => {
    let enabled = (await getSetting("enabled_scripts")) || [];
    if (!key) return enabled;
    return enabled && enabled.find((v) => v === key);
};

const setEnabled = async (key) => {
    let scripts = (await getEnabled()) || [];
    if (!scripts.includes(key) && key.length > 0) scripts.push(key);
    return await setSetting("enabled_scripts", scripts);
};

const removeEnabled = async (key) => {
    let scripts = (await getEnabled()) || [];
    scripts = scripts.filter((x) => x !== key);
    return await setSetting("enabled_scripts", scripts);
};

const getSettings = async () => {
    let settings = await browser.storage.local.get();
    if (isEmpty(settings))
        return await browser.storage.local.set(DefaultSettings)
            .then(browser.storage.local.get);
    return settings;
};

const getSettingsLegacy = () => {
    let settings = {...localStorage};
    for (let key of Object.keys(settings) || []) {
        if (/[A-F0-9]{8}-(?:[A-F0-9]{4}-){3}[A-F0-9]{12}/.test(settings[key]))
            settings[key] = JSON.parse(settings[key]);
        else if (!isNaN(parseFloat(JSON.parse(settings[key]))))
            settings[key] = parseFloat(JSON.parse(settings[key]));
        else settings[key] = JSON.parse(settings[key]);
    }
    return settings;
};

const setSetting = async (key, val) => await browser.storage.local.set({[key]: val});

const removeSetting = (key) => browser.storage.local.remove(key);

const resetSettings = () => browser.storage.local.clear();

const settingsContains = async (key) => objContains(key, await getSettings());

const enabledContains = async (key) => {
    return await getEnabled().then((enabled) => (enabled && enabled.includes(key)) || false);
};

const setHighlightGroup = async (groupName, obj) => {
    // for overwriting a specific highlight group by name
    let records = await getSetting("highlight_groups");
    let indexMatch = records.findIndex((x) => x.name.toLowerCase() === groupName.toLowerCase());
    // overwrite at index if applicable (append otherwise)
    if (indexMatch > -1) records[indexMatch] = obj;
    else records.push(obj);
    return setSetting("highlight_groups", records);
};

const removeHighlightGroup = async (groupName) => {
    // for removing a highlight group while preserving record order
    let records = await getSetting("highlight_groups");
    let result = records.filter((x) => x.name !== groupName);
    // return the new records Promise from the store
    return setSetting("highlight_groups", result).then(getSetting("highlight_groups"));
};

const highlightsContains = async (username) => {
    let groups = await getSetting("highlight_groups");
    let contains = groups.filter(
        (x) => !x.built_in && x.users &&
            x.users.find((y) => y.toLowerCase() === superTrim(username.toLowerCase()))
    );
    // only return the first match
    return contains.length > 0 ? contains[0] : false;
};

const removeHighlightUser = async (username) => {
    let groupContains = await highlightsContains(username);
    if (groupContains) {
        // mutually exclusive mutation (due to CSS rule priority)
        let mutated = groupContains.users
            .filter((x) => x && x.toLowerCase() !== superTrim(username.toLowerCase()));
        groupContains.users = mutated;
        return await setHighlightGroup(groupContains.name, groupContains);
    }
};

const addHighlightUser = async (groupName, username) => {
    let groups = await getSetting("highlight_groups");
    let groupContains = await highlightsContains(username);
    let group = groups.filter((x) => x.name === groupName)[0];
    if (group && !groupContains) {
        let mutated = [...group.users, username];
        group.users = mutated;
        return await setHighlightGroup(group.name, group);
    }
};

const filtersContains = async (username) => {
    let filters = await getSetting("user_filters");
    return filters.find((x) => x && x.toLowerCase() === superTrim(username.toLowerCase())) || false;
};

const removeFilter = async (username) => {
    let filters = await getSetting("user_filters");
    let mutated = filters.filter((y) => y.toLowerCase() !== username.toLowerCase());
    await setSetting("user_filters", mutated);
};

const addFilter = async (username) => {
    if (!(await filtersContains(username))) {
        let filters = await getSetting("user_filters");
        let mutated = [...filters, username];
        await setSetting("user_filters", mutated);
    }
};
