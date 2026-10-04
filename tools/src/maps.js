// The six maps of the vertical slice. Maps are painted with the MapCanvas API, then events are placed.
'use strict';
var ev = require('./ev');
var ids = require('./ids');
var maplib = require('./maplib');
var heroesMod = require('./content_heroes');
var common = require('./story_common');
var MapCanvas = maplib.MapCanvas;
var S = ids.SWITCH, V = ids.VARIABLE, MAP = ids.MAP, AUDIO = ids.AUDIO;
var IRI = common.IRI, QUILL = common.QUILL, START = common.START;

function L(fn) { return ev.build(fn); }
function faceOf(h) { return { face: h.sprite[0], idx: h.sprite[1], name: h.name }; }

// ---- reusable event factories -----------------------------------------------------------------------
function tag(e, kind) { e.kind = kind; return e; }

// Quest/NPC that just talks.
function talk(m, x, y, name, img, who, lines) {
    return tag(m.event(x, y, name, { img: img, trigger: 0, list: L(function(e) { lines.forEach(function(t) { e.say(who, t); }); }) }), 'npc');
}

// A treasure chest. loot(e, ID) runs when opened; text describes it.
function chest(m, ID, x, y, name, lootFn) {
    return tag(m.event(x, y, name, [
        { img: { tile: 'chestClosed' }, trigger: 0, list: L(function(e) { e.se(AUDIO.seChest); lootFn(e, ID); e.selfsw('A'); }) },
        { cond: { self: 'A' }, img: { tile: 'chestOpen' }, trigger: 0, list: L(function(e) { e.narrate('The chest is empty.'); }) }
    ]), 'chest');
}
function shards(e, n) { e.script('Hall.addShards(' + n + ');'); e.narrate('Found \\C[3]' + n + ' Echo Shards\\C[0]!'); }
function pages(ID, e, n) { e.item(ID.item.inkPage, n); e.narrate('Found \\C[3]' + n + ' Ink Page' + (n > 1 ? 's' : '') + '\\C[0]!'); }
function goldMsg(e, n) { e.gold(n); e.narrate('Found \\C[3]' + n + '\\C[0]G!'); }

// A lore fragment lying on the floor.
function lore(m, ID, x, y, text) {
    return tag(m.event(x, y, 'Lore Fragment', [
        { img: { tile: 'lorePage' }, priority: 0, trigger: 0, list: L(function(e) {
            e.se(AUDIO.seCursor); e.item(ID.item.lorePage, 1);
            e.narrate('You pick up a torn page. \\C[3]Lore Fragment\\C[0] obtained.');
            e.narrate(text);
            e.selfsw('A');
        }) },
        { cond: { self: 'A' }, trigger: 0, priority: 0, list: L(function() {}) }
    ]), 'chest');
}

function stairs(m, x, y, tile, destFn) {
    return tag(m.event(x, y, tile === 'stairsDown' ? 'Stairs Down' : 'Stairs Up', { img: { tile: tile }, priority: 0, trigger: 1, list: L(destFn) }), 'transfer');
}

function candles(m, ID, x, y) {
    return tag(m.event(x, y, 'Candles of Rest', { img: { tile: 'candelabra' }, trigger: 0, list: L(function(e) { e.common(ID.ce.healCandles); }) }), 'object');
}
function crystal(m, ID, x, y) {
    return tag(m.event(x, y, 'Save Crystal', { img: { tile: 'crystal' }, trigger: 0, list: L(function(e) { e.common(ID.ce.saveCrystal); }) }), 'object');
}

// Lever + door pair. The door is passable once the switch is on.
function leverAndDoor(m, ID, lx, ly, doorCells, sw) {
    tag(m.event(lx, ly, 'Lever', [
        { img: { tile: 'lever' }, trigger: 0, list: L(function(e) {
            e.se(AUDIO.seDoor); e.sw(sw, true); e.shake(3, 5, 30);
            e.narrate('You pull the lever. Somewhere deeper in the walls, stone grinds against stone.');
        }) },
        { cond: { sw: sw }, img: { tile: 'lever' }, trigger: 0, list: L(function(e) { e.narrate('The lever is already pulled.'); }) }
    ]), 'object');
    doorCells.forEach(function(c) {
        tag(m.event(c[0], c[1], 'Gate Door', [
            { img: { tile: 'doorClosed' }, trigger: 0, list: L(function(e) { e.narrate('A heavy door, sealed shut. There must be a mechanism somewhere nearby.'); }) },
            { cond: { sw: sw }, img: { tile: 'doorOpen' }, priority: 0, trigger: 0, list: L(function() {}) }
        ]), 'object');
    });
}

// ======================================================================================================
// Map 1: Archive Hall (hub)
// ======================================================================================================
function archiveHall(ID) {
    var m = new MapCanvas(MAP.HALL, 'Archive Hall', 28, 20, '#');
    m.meta = { bgm: AUDIO.bgmHall, encounters: [] };
    m.fill(1, 1, 26, 18, '.');
    m.fill(10, 1, 8, 5, 'L');          // altar alcove
    m.fill(11, 8, 6, 5, 'R');          // rune circle
    m.fill(13, 13, 2, 6, '=');         // aisle to the gate
    m.fill(2, 2, 7, 7, '-');           // scribe's wing
    m.fill(19, 2, 7, 7, ',');          // forge
    m.fill(2, 11, 7, 7, 'w');          // rest wing
    m.fill(19, 11, 7, 7, '=');         // echo stand
    m.autoWalls(['B', 'b', 'B', '#', 'b']);

    m.putAll([
        [13, 2, 'A'], [11, 2, 'q'], [16, 2, 'q'], [10, 1, 'z'], [17, 1, 'z'], [11, 0, 'y'], [16, 0, 'y'], [13, 0, 'h'],
        [3, 3, 'd'], [4, 3, 'k'], [2, 2, 'e'], [8, 2, 'e'], [6, 6, 'k'], [3, 7, 'k'], [5, 5, 'j'],
        [22, 3, 'P'], [20, 2, 'a'], [25, 2, 'a'], [25, 3, 'r'], [24, 2, 'r'], [20, 7, 'r'],
        [3, 12, 'N'], [5, 12, 'N'], [2, 17, 'e'], [8, 17, 'e'], [8, 14, 'k'],
        [22, 14, 'S'], [20, 13, 'k'], [24, 13, 'q'], [24, 16, 'k'], [20, 17, 'e'],
        [13, 18, 'G'], [17, 16, 'X'],
        [9, 7, 'o'], [18, 7, 'o'], [9, 14, 'o'], [18, 14, 'o'], [6, 10, 'n']
    ]);

    // functional events
    tag(m.event(13, 2, 'Shrine of Echoes', { trigger: 0, list: L(function(e) { e.common(ID.ce.altar); }) }), 'object');
    tag(m.event(3, 3, 'Scribe\'s Desk', { trigger: 0, list: L(function(e) { e.common(ID.ce.deskMenu); }) }), 'object');
    tag(m.event(22, 3, 'Binder\'s Forge', { trigger: 0, list: L(function(e) { e.common(ID.ce.forgeShop); }) }), 'object');
    tag(m.event(3, 12, 'Rest Wing Bed', { trigger: 0, list: L(function(e) { e.common(ID.ce.restWing); }) }), 'object');
    tag(m.event(5, 12, 'Rest Wing Bed', { trigger: 0, list: L(function(e) { e.common(ID.ce.restWing); }) }), 'object');
    tag(m.event(22, 14, 'Echo Stand', { trigger: 0, list: L(function(e) { e.common(ID.ce.memoryStand); }) }), 'object');
    tag(m.event(13, 18, 'Expedition Gate', { trigger: 0, list: L(function(e) { e.common(ID.ce.expeditionGate); }) }), 'transfer');
    tag(m.event(17, 16, 'Save Crystal', { trigger: 0, list: L(function(e) { e.common(ID.ce.saveCrystal); }) }), 'object');
    tag(m.event(11, 10, 'Quill', { img: { tile: 'quill' }, trigger: 0, list: L(function(e) { e.common(ID.ce.quillTalk); }) }), 'npc');

    // arrival scene after the prologue
    tag(m.event(13, 16, 'Arrival Scene', [
        { cond: { sw: S.PROLOGUE_DONE }, trigger: 3, list: L(function(e) {
            e.fadeIn();
            e.say(QUILL, 'This is the Archive Hall, the heart of the Archive. Yours now, I suppose. Every echo you call stays here with you between expeditions.');
            e.say(QUILL, 'That glowing altar to the north is the Shrine of Echoes. Place the key in it and the Archive answers. Go on. Walk up and press confirm.');
            e.selfsw('A');
        }) },
        { cond: { self: 'A' }, trigger: 0, list: L(function() {}) }
    ]), 'auto');

    // recruited echoes wander the hall
    var spots = { wick: [9, 10], pip: [18, 10], marla: [5, 9], doran: [10, 16], fenn: [7, 15], sera: [20, 9], tobias: [22, 10],
                  kael: [16, 15], isolde: [8, 5], brannock: [11, 17], aurelian: [15, 6], nyx: [20, 6] };
    var idle = {
        wick: 'Lamp\'s trimmed, hall\'s warm. Anything I can hold for you?',
        pip: 'Need anything delivered? Across the hall? Anywhere? Fast?',
        marla: 'Mind your ink, dear. A stain is only a lesson in disguise.',
        doran: 'Perimeter\'s clear. That bookshelf over there is judging me, though.',
        fenn: 'Quiet in here. I can hear dust land.',
        sera: 'Do not look at the scorch mark. It was already like that.',
        tobias: 'Faint, but I can hear the old bell. Can you?',
        kael: 'I keep to the edges. Come find me when there is a fight.',
        isolde: 'I redrew the Hall\'s map. Quill\'s room is bigger than the plans say.',
        brannock: 'I will hold this door. Any door. You pick.',
        aurelian: 'The Hall is as I remember it, only quieter. Far too quiet.',
        nyx: 'Pay me no mind. I am only the draft you feel when no window is open.'
    };
    heroesMod.heroes.forEach(function(h) {
        if (!spots[h.key]) { return; }
        tag(m.event(spots[h.key][0], spots[h.key][1], h.name, { cond: { actor: ID.actor[h.key] }, img: { char: [h.sprite[0], h.sprite[1], 2] },
            trigger: 0, move: { type: 1, speed: 2, freq: 2 }, list: L(function(e) { e.say(faceOf(h), idle[h.key]); }) }), 'npc');
    });
    return m;
}

// ======================================================================================================
// Map 2: Prologue, The Waking Room
// ======================================================================================================
function wakingRoom(ID) {
    var m = new MapCanvas(MAP.PROLOGUE, 'The Waking Room', 16, 12, '#');
    m.meta = { bgm: AUDIO.bgmPrologue, bb1: 'StacksFloor', bb2: 'StacksWall', encounters: [] };
    m.fill(1, 1, 14, 9, ',');
    m.fill(6, 3, 4, 5, '-');
    m.fill(7, 10, 1, 1, ',');                // exit corridor
    m.autoWalls(['B', 'b', 'B', '#']);
    m.putAll([[2, 3, 'S'], [12, 2, 'r'], [13, 2, 'r'], [13, 3, 'a'], [2, 8, 'k'], [12, 8, 'n'], [4, 2, 'o'], [11, 2, 'o'], [3, 6, 'v'], [10, 8, 'k']]);

    tag(m.event(3, 7, 'Intro', [
        { trigger: 3, list: L(function(e) {
            e.menuAccess(false); e.saveAccess(false);
            e.tint([-120, -120, -90, 60], 1, false);
            e.fadeIn();
            e.narrate('Lantern Reach, the last night of the old year. Or what remains of it.');
            e.narrate('Dust sifts from the ceiling of the Great Archive\'s lowest reading room. Somewhere above, a bell is still ringing. It has been ringing for a very long time.');
            e.tint([0, 0, 0, 0], 90, true);
            e.say(IRI, '...Ow. My head. The ceiling is on the floor. Why is the ceiling on the floor?');
            e.say(QUILL, 'Up, up, UP, Archivist! The bell has been ringing for an hour and you have been drooling on chapter nine.');
            e.say(IRI, 'Quill? What happened? Where is everyone?');
            e.say(QUILL, 'Gone. The Hollow is eating the Reach, house by house, name by name. It reached the Archive gate twenty minutes ago.');
            e.say(IRI, 'The Hollow? That is a story for children!');
            e.say(QUILL, 'Every story is for children, until the Hollow gets to the end of it. Look.');
            e.flash([160, 140, 255, 200], 20, true); e.se(AUDIO.seFlash); e.shake(5, 5, 40);
            e.say(QUILL, 'Ink Wisps. Scraps of things that were forgotten. They will erase you if you let them. Take them on; I will tell you what to press.');
            e.selfsw('A');
            e.menuAccess(true);
        }) },
        { cond: { self: 'A' }, trigger: 0, list: L(function() {}) }
    ]), 'auto');

    tag(m.event(4, 6, 'Quill', { img: { tile: 'quill' }, trigger: 0, list: L(function(e) {
        e.cond('switch', [S.PROLOGUE_DONE], function(t) {
            t.say(QUILL, 'To the Hall, quickly. The exit is south.');
        }, function(t) {
            t.say(QUILL, 'In battle: Attack to strike, Guard to brace, Skill for Arts that cost MP. Your TP fills as you fight and powers Burst skills later on. Walk up to the wisp to begin.');
        });
    }) }), 'npc');

    tag(m.event(9, 5, 'Faded Wisps', [
        { img: { tile: 'wisp' }, trigger: 1, list: L(function(e) {
            e.narrate('Faded wisps drift toward you, trailing smears of ink.');
            e.battleBgm(AUDIO.bgmBattle);
            e.battle(ID.troop.tutorial, { escape: false, lose: true }, {
                win: function(w) {
                    w.erase();
                    w.sw(S.PROLOGUE_DONE, true);
                    w.say(QUILL, 'Not bad for a sleepyhead! But you cannot hold the Archive alone. It remembers everyone who ever lived, and its Echoes will answer you, if you ask properly.');
                    w.say(IRI, 'Echoes?');
                    w.say(QUILL, 'Heroes. Scraps of whole lives written into these walls. Come. To the Hall.');
                    w.fadeOut(); w.bgmFade(1);
                    w.transfer(MAP.HALL, 13, 16, 8, 0);
                },
                lose: function(l) {
                    l.recoverAll();
                    l.say(QUILL, 'Again! Strike first, and when a wisp lands a hit, use Guard. You can try as many times as you like.');
                }
            });
        }) },
        { cond: { sw: S.PROLOGUE_DONE }, trigger: 0, priority: 0, list: L(function() {}) }
    ]), 'battle');

    tag(m.event(7, 10, 'South Exit', { trigger: 1, priority: 0, list: L(function(e) {
        e.cond('switch', [S.PROLOGUE_DONE], function(t) { t.transfer(MAP.HALL, 13, 16, 8, 0); },
            function(t) { t.say(QUILL, 'Not that way! Deal with the wisps first.'); t.move(-1, [[4]]); });
    }) }), 'transfer');
    return m;
}

// ======================================================================================================
// Dungeon helpers
// ======================================================================================================
function dungeonFloor(id, name, w, h, bg) { var m = new MapCanvas(id, name, w, h, '#'); m.meta = bg; return m; }

// ======================================================================================================
// Map 3: Whispering Stacks F1
// ======================================================================================================
function stacks1(ID) {
    var m = dungeonFloor(MAP.STACKS1, 'Whispering Stacks 1F', 30, 26, { bgm: AUDIO.bgmStacks, bb1: 'StacksFloor', bb2: 'StacksWall', encounterStep: 28,
        encounters: [[ID.troop.wispPair, 4], [ID.troop.miteSwarm, 3], [ID.troop.wispMites, 3]] });
    m.fill(12, 21, 6, 4, 'w');            // entrance A
    m.fill(14, 17, 2, 4, ',');            // corridor to hub
    m.fill(7, 10, 16, 8, ',');            // hub B
    m.fill(13, 11, 4, 6, '=');
    m.fill(6, 13, 1, 2, ',');             // west passage
    m.fill(1, 10, 5, 8, 'w');             // west room C
    m.fill(23, 13, 1, 2, ',');            // east passage
    m.fill(24, 10, 5, 8, 'w');            // east room D
    m.fill(14, 6, 1, 4, ',');             // north corridor (door at 14,8)
    m.fill(9, 1, 12, 5, '.');             // stair room E
    m.autoWalls(['B', 'b', 'B', 'b', '#']);
    m.putAll([
        [9, 12, 'o'], [9, 15, 'o'], [20, 12, 'o'], [20, 15, 'o'], [12, 11, 'k'], [17, 16, 'k'], [22, 10, 'a'], [10, 13, 'n'], [18, 12, 'n'],
        [2, 16, 'k'], [4, 11, 'r'], [25, 17, 'r'], [28, 12, 'a'], [25, 11, 'k'], [10, 1, 'z'], [19, 1, 'z'], [13, 17, 'k'], [12, 22, 'a'], [17, 22, 'r']
    ]);

    stairs(m, 14, 24, 'stairsUp', function(e) {
        e.fadeOut(); e.bgmFade(1);
        e.transfer(MAP.HALL, 13, 16, 8, 0);
        e.fadeIn();
    });
    chest(m, ID, 2, 11, 'Chest West', function(e) { shards(e, 220); pages(ID, e, 2); });
    lore(m, ID, 3, 16, 'Entry 41, Archivist Pell: "The shelves are quieter this winter. Books fall in the night and nobody admits to shelving them back. I keep finding small blank spots where words used to be."');
    leverAndDoor(m, ID, 27, 10, [[14, 8]], S.LEVER_STACKS);
    chest(m, ID, 26, 16, 'Chest East', function(e) { e.item(ID.item.fineTonic, 2); e.narrate('Found \\C[3]2 Fine Tonics\\C[0]!'); goldMsg(e, 150); });
    lore(m, ID, 25, 13, 'Entry 58: "We catalogued the Hollow as \'natural wear\'. The First Archivist would have wept."');
    candles(m, ID, 8, 17);
    crystal(m, ID, 11, 2);
    stairs(m, 14, 2, 'stairsDown', function(e) {
        e.se(AUDIO.seDoor); e.fadeOut();
        e.transfer(MAP.STACKS2, 13, 22, 8, 0);
        e.fadeIn();
    });
    return m;
}

// ======================================================================================================
// Map 4: Whispering Stacks F2 (boss)
// ======================================================================================================
function stacks2(ID) {
    var m = dungeonFloor(MAP.STACKS2, 'Whispering Stacks 2F', 28, 26, { bgm: AUDIO.bgmStacks, bb1: 'StacksFloor', bb2: 'StacksWall', encounterStep: 24,
        encounters: [[ID.troop.scribeWisp, 4], [ID.troop.scribePair, 3], [ID.troop.miteSwarm, 2], [ID.troop.wispMites, 2]] });
    m.fill(11, 21, 6, 4, 'w');            // arrival A
    m.fill(13, 16, 2, 5, ',');            // corridor
    m.fill(6, 9, 16, 7, ',');             // hub B
    m.fill(12, 10, 4, 5, '=');
    m.fill(5, 12, 1, 2, ',');             // west passage
    m.fill(1, 9, 4, 7, 'w');              // west room C (mimic)
    m.fill(22, 12, 1, 2, ',');            // east passage
    m.fill(23, 9, 4, 7, 'w');             // east room D
    m.fill(13, 5, 2, 4, ',');             // north corridor
    m.fill(8, 1, 12, 4, 'L');             // boss room
    m.autoWalls(['B', 'b', 'B', 'b', '#']);
    m.putAll([
        [8, 10, 'o'], [8, 14, 'o'], [19, 10, 'o'], [19, 14, 'o'], [7, 12, 'k'], [20, 12, 'n'], [2, 15, 'k'], [25, 15, 'k'], [24, 10, 'a'],
        [9, 1, 'z'], [18, 1, 'z'], [8, 4, 'k'], [19, 4, 'k'], [11, 22, 'a'], [16, 22, 'r']
    ]);

    stairs(m, 13, 24, 'stairsUp', function(e) {
        e.fadeOut();
        e.transfer(MAP.STACKS1, 14, 3, 2, 0);
        e.fadeIn();
    });
    // mimic chest
    tag(m.event(2, 10, 'Suspicious Chest', [
        { img: { tile: 'chestClosed' }, trigger: 0, list: L(function(e) {
            e.se(AUDIO.seChest);
            e.narrate('The lid creaks open... and bares its teeth! It is a Tome Mimic!');
            e.battleBgm(AUDIO.bgmBattle);
            e.battle(ID.troop.mimic, { escape: true, lose: false }, {
                win: function(w) { shards(w, 300); pages(ID, w, 3); w.selfsw('A'); },
                escape: function(x) { x.narrate('You slam the lid shut and back away.'); }
            });
        }) },
        { cond: { self: 'A' }, img: { tile: 'chestOpen' }, trigger: 0, list: L(function(e) { e.narrate('Only splinters and drool remain.'); }) }
    ]), 'battle');
    lore(m, ID, 3, 14, 'Entry 63: "The Curator would not leave his shelves after the first erasures. He said someone had to keep the lamps lit. We found his lantern burning; we did not find him."');
    chest(m, ID, 26, 10, 'Chest East', function(e) { shards(e, 260); e.item(ID.item.clarity, 2); e.narrate('Found \\C[3]2 Clarity Draughts\\C[0]!'); });
    candles(m, ID, 24, 14);
    crystal(m, ID, 9, 10);
    lore(m, ID, 13, 6, 'Entry 71: "Whatever the Curator is now, it still reshelves. It still stamps the due dates. Please. Do not make it angry about overdue books."');

    // the Curator
    tag(m.event(13, 2, 'Curator Husk', [
        { img: { tile: 'husk' }, trigger: 0, list: L(function(e) {
            e.narrate('A hooded figure hangs among drifting books. Once, someone loved these shelves.');
            e.say(IRI, 'Curator? Sir? We need to pass. Please.');
            e.narrate('The Husk turns its blank mask toward you. Pages begin to circle.');
            e.battleBgm(AUDIO.bgmBoss);
            e.battle(ID.troop.curator, { escape: false, lose: true }, {
                win: function(w) {
                    w.battleBgm(AUDIO.bgmBattle);
                    w.fadeOut(); w.wait(20); w.fadeIn();
                    w.say({ face: '', name: 'Curator Husk' }, '...Overdue... I shelved them... all. Every one. Except... the name... they made me... forget...');
                    w.say(QUILL, 'It was the Archive\'s last Curator. The Hollow wears the oldest ones first.');
                    w.item(ID.item.indexPage, 1);
                    w.narrate('You take the \\C[3]Index Page\\C[0] from the Husk\'s fading hand. It is warm.');
                    w.narrate('On it, in a hand that fades as you read: "The wells below the Archive hold the First Name. Go down before the ink runs dry."');
                    w.say(QUILL, 'The Inkwell Depths. Sealed since before I was a book. Back to the Hall. You have earned a rest, and something tells me a new banner has appeared at the Shrine.');
                    pages(ID, w, 3);
                    w.sw(S.STACKS_BOSS_DONE, true); w.sw(S.INK_OPEN, true); w.sw(S.BANNER_AURELIAN, true);
                    w.v(V.CHAPTER, '=', 2);
                    w.fadeOut(); w.bgmFade(1);
                    w.transfer(MAP.HALL, 13, 16, 8, 0);
                    w.fadeIn();
                },
                lose: function(l) { l.common(ID.ce.retreat); }
            });
        }) },
        { cond: { sw: S.STACKS_BOSS_DONE }, trigger: 0, list: L(function() {}) }
    ]), 'battle');
    return m;
}

// ======================================================================================================
// Map 5: Inkwell Depths F1
// ======================================================================================================
function ink1(ID) {
    var m = dungeonFloor(MAP.INK1, 'Inkwell Depths 1F', 30, 24, { bgm: AUDIO.bgmInk, bb1: 'InkFloor', bb2: 'InkWall', encounterStep: 24,
        encounters: [[ID.troop.slimes, 4], [ID.troop.clerks, 3], [ID.troop.hounds, 3]] });
    m.fill(11, 19, 7, 4, 'm');            // arrival A
    m.fill(14, 15, 2, 4, 'c');            // corridor
    m.fill(6, 8, 18, 7, 'c');             // cavern B
    m.fill(5, 10, 1, 2, 'c');             // west passage
    m.fill(1, 8, 4, 7, 'm');              // west chamber C
    m.fill(24, 10, 1, 2, 'c');            // east passage
    m.fill(25, 6, 4, 9, 'm');             // east chamber D
    m.fill(14, 4, 1, 4, 'c');             // north corridor (door at 14,6)
    m.fill(9, 1, 12, 3, 'c');             // stair room E
    m.autoWalls(['D', 'D', 'D', 'b']);
    // ink pockets (damage floor) kept away from the main routes
    [[8, 9], [9, 9], [20, 13], [21, 13], [21, 12], [8, 13], [17, 9], [18, 9]].forEach(function(p) { m.fill(p[0], p[1], 1, 1, 'i'); });
    m.putAll([
        [10, 12, 'M'], [19, 10, 'M'], [12, 9, 'n'], [17, 13, 'n'], [2, 9, 'M'], [3, 13, 'v'], [26, 13, 'v'], [27, 8, 'M'], [12, 20, 'M'], [16, 21, 'n'],
        [9, 1, 'z'], [20, 1, 'z'], [11, 11, 'K'], [22, 9, 'K']
    ]);
    stairs(m, 14, 22, 'stairsUp', function(e) {
        e.fadeOut(); e.bgmFade(1);
        e.transfer(MAP.HALL, 13, 16, 8, 0);
        e.fadeIn();
    });
    chest(m, ID, 2, 14, 'Chest West', function(e) { shards(e, 380); pages(ID, e, 2); });
    lore(m, ID, 4, 9, 'Entry 77: "Tell no one: the Inkwell is not a well. It is a mouth, and it has been patient for a very long time."');
    leverAndDoor(m, ID, 27, 12, [[14, 6]], S.LEVER_INK);
    chest(m, ID, 26, 6, 'Chest East', function(e) { e.item(ID.item.pressedLeaf, 2); e.narrate('Found \\C[3]2 Pressed Leaves\\C[0]!'); goldMsg(e, 260); });
    lore(m, ID, 28, 14, 'Entry 82: "The ink here does not stain. It remembers. I watched it spell my daughter\'s name on the wall and then sink away before I could read the last letter."');
    candles(m, ID, 8, 11);
    crystal(m, ID, 10, 1);
    stairs(m, 14, 1, 'stairsDown', function(e) {
        e.se(AUDIO.seDoor); e.fadeOut();
        e.transfer(MAP.INK2, 13, 22, 8, 0);
        e.fadeIn();
    });
    return m;
}

// ======================================================================================================
// Map 6: Inkwell Depths F2 (final boss)
// ======================================================================================================
function ink2(ID) {
    var m = dungeonFloor(MAP.INK2, 'Inkwell Depths 2F', 28, 26, { bgm: AUDIO.bgmInk, bb1: 'InkFloor', bb2: 'InkWall', encounterStep: 22,
        encounters: [[ID.troop.clerkSlimes, 3], [ID.troop.houndsClerk, 3], [ID.troop.knightHound, 3], [ID.troop.knightPair, 2], [ID.troop.hounds, 2]] });
    m.fill(10, 21, 7, 4, 'm');            // arrival
    m.fill(13, 15, 2, 6, 'c');            // corridor
    m.fill(4, 10, 20, 5, 'c');            // wide cavern
    m.fill(3, 11, 1, 2, 'c');             // west passage
    m.fill(1, 8, 2, 8, 'm');              // west nook (too narrow: widen)
    m.fill(24, 11, 1, 2, 'c');            // east passage
    m.fill(25, 8, 2, 8, 'm');             // east nook
    m.fill(13, 8, 2, 2, 'c');             // to antechamber
    m.fill(9, 5, 10, 3, 'm');             // antechamber
    m.fill(13, 4, 2, 1, 'c');             // to boss
    m.fill(7, 1, 14, 3, 'c');             // boss chamber
    m.autoWalls(['D', 'D', 'D', 'b']);
    [[6, 11], [7, 11], [20, 13], [21, 13], [10, 13], [17, 11], [18, 11]].forEach(function(p) { m.fill(p[0], p[1], 1, 1, 'i'); });
    m.putAll([
        [5, 12, 'M'], [22, 12, 'M'], [9, 12, 'n'], [19, 13, 'n'], [1, 10, 'v'], [26, 14, 'v'], [10, 22, 'M'], [16, 22, 'M'], [11, 6, 'K'], [18, 7, 'K'],
        [8, 1, 'F'], [20, 1, 'F'], [9, 3, 'M'], [19, 3, 'M']
    ]);
    stairs(m, 13, 24, 'stairsUp', function(e) {
        e.fadeOut();
        e.transfer(MAP.INK1, 14, 2, 2, 0);
        e.fadeIn();
    });
    chest(m, ID, 1, 9, 'Chest West', function(e) { shards(e, 420); pages(ID, e, 3); });
    lore(m, ID, 2, 14, 'Entry 90: "The First Archivist chose the Warden himself. \'Stand here,\' he said. \'Guard what we must never read.\' It was an odd choice. The man was a soldier of no name."');
    chest(m, ID, 26, 9, 'Chest East', function(e) { e.item(ID.item.fineTonic, 3); e.narrate('Found \\C[3]3 Fine Tonics\\C[0]!'); goldMsg(e, 400); });
    lore(m, ID, 25, 14, 'Entry 97, last entry: "If you are reading this you have come too far to turn back. The name on the key is not the one he was born with. Ask him which one he gave up."');
    candles(m, ID, 17, 7);
    crystal(m, ID, 10, 7);

    tag(m.event(14, 2, 'Unwritten Warden', [
        { img: { tile: 'warden' }, trigger: 0, list: L(function(e) {
            e.narrate('The Inkwell stills. At its center, a hollow armor stands, bound by a chain made of unfinished sentences.');
            e.say(IRI, 'Quill, is it... guarding the well? Or guarding us from it?');
            e.say(QUILL, 'Does it matter? It is between us and the First Name.');
            e.battleBgm(AUDIO.bgmBoss);
            e.battle(ID.troop.warden, { escape: false, lose: true }, {
                win: function(w) {
                    w.battleBgm(AUDIO.bgmBattle);
                    w.flash([200, 180, 255, 220], 40, true); w.se(AUDIO.seTeleport);
                    w.say({ face: '', name: 'Warden' }, 'I remember... I was asked to stand here. I forgot why. Thank you.');
                    w.narrate('The armor dissolves into ink-light. In its place, a woman in a gown of fading sentences steps out of the dark.');
                    w.say({ face: 'Actor3', idx: 1, name: 'Nyx' }, 'Hello, little archivist. You broke my gatekeeper. How rude.');
                    w.say(IRI, 'Who are you?');
                    w.say({ face: 'Actor3', idx: 1, name: 'Nyx' }, 'No one. That is rather the point. I am the first thing this Archive ever forgot.');
                    w.say({ face: 'Actor3', idx: 1, name: 'Nyx' }, 'And before you ask: the Hollow is not hunting you, child. It is hunting him. The man whose name you carry on your key.');
                    w.say(QUILL, 'Aurelian? Why would the Hollow...');
                    w.say({ face: 'Actor3', idx: 1, name: 'Nyx' }, 'Ask your First Archivist why he buried me down here. Or do not. I shall be in your Archive soon enough. You will hear me in the margins.');
                    w.flash([255, 255, 255, 255], 30, true);
                    w.sw(S.INK_BOSS_DONE, true); w.sw(S.BANNER_NYX, true); w.sw(S.SLICE_COMPLETE, true);
                    w.v(V.CHAPTER, '=', 3);
                    w.item(ID.item.sigil, 1);
                    pages(ID, w, 4);
                    w.say(QUILL, '...That is the second time today something has made my pages itch.');
                    w.say(IRI, 'She was an echo, wasn\'t she? Like the others.');
                    w.say(QUILL, 'Yes. And the Hollow was her cage. Which means we have just opened it.');
                    w.fadeOut(); w.bgmFade(2);
                    w.transfer(MAP.HALL, 13, 16, 8, 0);
                    w.fadeIn();
                    w.narrate('\\C[6]To be continued...\\C[0]\nThe Archive has a new banner at the Shrine. Keep summoning, keep upgrading, and keep exploring: the Hall is yours.');
                },
                lose: function(l) { l.common(ID.ce.retreat); }
            });
        }) },
        { cond: { sw: S.INK_BOSS_DONE }, trigger: 0, list: L(function() {}) }
    ]), 'battle');
    return m;
}

function buildMaps(ID) {
    return [archiveHall(ID), wakingRoom(ID), stacks1(ID), stacks2(ID), ink1(ID), ink2(ID)];
}

module.exports = { buildMaps: buildMaps };
