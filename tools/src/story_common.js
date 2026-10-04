// Common events that implement the Archive Hall: Quill's talk, the expedition gate, the Scribe's Desk,
// upgrades, the forge shop, Echo memories, the first summon and the retreat after a defeat.
// They call the Hall / Echoes plugin APIs (js/plugins/ArchiveHall.js, ArchiveEchoes.js).
'use strict';
var ids = require('./ids');
var S = ids.SWITCH, V = ids.VARIABLE, MAP = ids.MAP, AUDIO = ids.AUDIO;

var IRI = { face: 'Actor1', idx: 0, name: 'Iri' };
var QUILL = { face: '', idx: 0, name: 'Quill' };
var NARR = null;

var START = {      // where the expedition gate drops the party (x, y, direction)
    stacks: [14, 23, 8], ink: [14, 21, 8], hall: [13, 16, 8]
};

function say(e, who, text) { e.say(who, text); }

function specs() {
    var list = [];
    function ce(key, name, build) { list.push({ key: key, name: name, build: build }); }

    // ---- Quill ----------------------------------------------------------------------------------
    ce('quillTalk', 'Hall: Quill', function(e, ID) {
        say(e, QUILL, 'Need something, Archivist?');
        e.loop(function(l) {
            l.choice(['What should I do next?', 'How do summons work?', 'About my echoes and the Hall', 'Never mind'], [
                function(c) {
                    c.cond('switch', [S.FIRST_SUMMON_DONE], function(t) {
                        t.cond('switch', [S.STACKS_BOSS_DONE], function(u) {
                            u.cond('switch', [S.INK_BOSS_DONE], function(w) {
                                say(w, QUILL, 'That is all the Archive has to show you for now. Spend your shards, level your echoes, upgrade the Hall. The Hollow is not finished with us.');
                            }, function(w) {
                                say(w, QUILL, 'The Inkwell Depths lie behind the Expedition Gate. The wells are where the Hollow is thickest. Bring your best echoes, and fully upgrade the Forge if you can afford it.');
                            });
                        }, function(u) {
                            say(u, QUILL, 'The Whispering Stacks! Through the Expedition Gate to the south. Find the Curator at the bottom floor. Pull more echoes first if your party looks thin; the Shrine is right there.');
                        });
                    }, function(t) {
                        say(t, QUILL, 'The Shrine of Echoes, up north. Stand before the altar and press confirm. I put a little something aside for your first call.');
                    });
                    c.breakLoop();
                },
                function(c) {
                    say(c, QUILL, 'Five grades of echo: \\C[7]N\\C[0], \\C[3]R\\C[0], \\C[4]SR\\C[0], \\C[6]SSR\\C[0] and \\C[2]UR\\C[0]. The rarer the echo, the stronger it fights.');
                    say(c, QUILL, 'Pity: every pull brings you closer to a guaranteed SSR or better, and eventually a guaranteed UR. Soft pity raises your odds first. The counters are on the banner screen.');
                    say(c, QUILL, 'Rate-up banners feature a particular echo. Lose the feature roll once and the next UR of that banner is guaranteed to be the featured one.');
                    c.breakLoop();
                },
                function(c) {
                    say(c, QUILL, 'Pull the same echo twice? That is a limit break: +6% stats each, and at limit break 3 they learn their Burst skill. At limit break 5 further copies turn to gold.');
                    say(c, QUILL, 'Echoes you call will wander the Hall. Chat with them, and read their memories at the Echo Stand. The Forge, the Desk and the Shrine can all be upgraded with Ink Pages.');
                    c.breakLoop();
                },
                function(c) { c.breakLoop(); }
            ], { cancel: 3 });
        });
    });

    // ---- expedition gate --------------------------------------------------------------------------
    ce('expeditionGate', 'Hall: Expedition Gate', function(e, ID) {
        e.cond('switch', [S.FIRST_SUMMON_DONE], function(t) {
            t.narrate('The Expedition Gate hums. Beyond it lie the lower levels of the Archive.');
            t.script('Hall.partyReport(this);');
            t.choice(['Whispering Stacks', 'Inkwell Depths', 'Stay in the Hall'], [
                function(c) {
                    c.fadeOut(); c.bgmFade(1);
                    c.script('Hall.noteExpedition();');
                    c.transfer(MAP.STACKS1, START.stacks[0], START.stacks[1], START.stacks[2], 0);
                },
                function(c) {
                    c.cond('switch', [S.INK_OPEN], function(u) {
                        u.fadeOut(); u.bgmFade(1);
                        u.script('Hall.noteExpedition();');
                        u.transfer(MAP.INK1, START.ink[0], START.ink[1], START.ink[2], 0);
                    }, function(u) {
                        u.narrate('The gate to the Inkwell Depths is sealed. Perhaps the Stacks hold the key.');
                    });
                },
                function(c) {}
            ], { cancel: 2 });
        }, function(t) {
            say(t, QUILL, 'Not yet! You cannot walk down there alone. Summon some echoes at the Shrine first.');
        });
    });

    // ---- altar / first summon ---------------------------------------------------------------------
    ce('altar', 'Hall: Shrine of Echoes', function(e, ID) {
        e.cond('switch', [S.FIRST_SUMMON_DONE], function(t) {
            t.narrate('The altar glows. You have \\C[3]\\V[1]\\C[0] Echo Shards.');
            t.plugin('Gacha open');
        }, function(t) {
            t.common(ID.ce.firstSummon);
        });
    });

    ce('firstSummon', 'Story: First Summon', function(e, ID) {
        e.cond('switch', [S.PROLOGUE_DONE], function(t) {
            t.when('Hall.claimStarter()', function(g) {
                say(g, QUILL, 'There. Place the key in the altar and think of someone who needs finding. The Archive will do the rest.');
                g.se(AUDIO.sePower);
                g.narrate('Quill pours a handful of shimmering dust into the altar. \\C[3]+1000 Echo Shards.\\C[0]');
            }, function(g) {
                say(g, QUILL, 'Try again. The Beginner Summon is still waiting for you.');
            });
            t.plugin('Gacha open beginner');
            // the scene returns here
            t.when('Hall.partyCount() >= 2', function(u) {
                u.when('Hall.partyBest() >= 3', function(w) {
                    say(w, QUILL, 'An SSR echo on your very first call! The Archive likes you. Do not let it go to your head.');
                }, function(w) {
                    w.when('Hall.partyBest() >= 2', function(x) {
                        say(x, QUILL, 'A solid start. The Archive likes you, a little.');
                    }, function(x) {
                        say(x, QUILL, 'Humble echoes, but every legend starts humble.');
                    });
                });
                say(u, QUILL, 'They will gather here in the Hall between expeditions. Chat with them, and read their memories at the Echo Stand.');
                say(u, QUILL, 'Whatever you have left in shards can be spent on the Standard banner at any time. Now: the Expedition Gate, to the south. The Whispering Stacks are the quickest way down to where the Hollow comes from.');
                u.sw(S.FIRST_SUMMON_DONE, true);
                u.sw(S.STACKS_OPEN, true);
                u.v(V.CHAPTER, '=', 1);
            }, function(u) {
                say(u, QUILL, 'You did not summon anyone? Take your time. The altar will wait.');
            });
        });
    });

    // ---- rest / save ------------------------------------------------------------------------------
    ce('restWing', 'Hall: Rest Wing', function(e) {
        e.narrate('A bed made with clean linen. Rest here?');
        e.choice(['Rest', 'Not now'], [
            function(c) {
                c.fadeOut(); c.wait(20); c.recoverAll(); c.se(AUDIO.seHeal); c.wait(30); c.fadeIn();
                c.narrate('The party is fully rested.');
            },
            function(c) {}
        ], { cancel: 1 });
    });

    ce('saveCrystal', 'Hall: Save Crystal', function(e) {
        e.narrate('A crystal hums, holding the memory of everything that happened until now.');
        e.openSave();
    });

    ce('healCandles', 'Dungeon: Candles of Rest', function(e) {
        e.narrate('A cluster of candles burns with a steady, warm light. You rest a moment by it.');
        e.recoverAll(); e.se(AUDIO.seHeal);
        e.narrate('HP and MP restored.');
    });

    // ---- retreat after defeat ---------------------------------------------------------------------
    ce('retreat', 'Story: Retreat to the Hall', function(e) {
        e.fadeOut(); e.bgmFade(1); e.wait(30);
        e.recoverAll();
        e.transfer(MAP.HALL, START.hall[0], START.hall[1], START.hall[2], 0);
        e.bgm(AUDIO.bgmHall, 80);
        e.fadeIn();
        say(e, QUILL, 'Easy, easy. I dragged you out by the collar. Rest, pull some echoes, upgrade something, and try again. The Archive is patient. Mostly.');
    });

    // ---- Scribe's Desk ----------------------------------------------------------------------------
    ce('deskMenu', 'Hall: Scribe\'s Desk', function(e, ID) {
        e.v(V.SHOW_A, '=', { script: 'Hall.level("desk")' });
        e.v(V.SHOW_B, '=', { script: 'Hall.stock()' });
        e.narrate('The Scribe\'s Desk (Lv \\V[11]).');
        e.loop(function(l) {
            l.choice(['Bounty Board', 'Collect Dividend', 'Upgrade Facilities', 'Archive Lore', 'Leave'], [
                function(c) { c.common(ID.ce.bounty); },
                function(c) {
                    c.v(V.SHOW_B, '=', { script: 'Hall.stock()' });
                    c.cond('var', [V.SHOW_B, '>=', 1], function(t) { t.script('Hall.collect(this);'); },
                        function(t) { t.narrate('Nothing has accumulated yet. Win battles on expeditions to build up a dividend. Upgrade the Desk to earn more.'); });
                },
                function(c) { c.common(ID.ce.upgradeMenu); },
                function(c) { c.script('Hall.claimLore(this);'); },
                function(c) { c.breakLoop(); }
            ], { cancel: 4 });
        });
    });

    ce('bounty', 'Hall: Bounty Board', function(e, ID) {
        e.script('Hall.ensureBounty();');
        e.script('Hall.msg(this, Hall.bountyText());');
        e.when('Hall.bountyReady()', function(t) {
            t.choice(['Turn in', 'Later'], [function(c) { c.script('Hall.turnIn(this);'); }, function(c) {}], { cancel: 1 });
        }, function(t) {
            t.choice(['Keep it', 'Swap for a new bounty'], [function(c) {}, function(c) { c.script('Hall.abandonBounty(); Hall.ensureBounty();'); c.narrate('A new bounty has been posted.'); }], { cancel: 0 });
        });
    });

    ce('upgradeMenu', 'Hall: Upgrade Facilities', function(e, ID) {
        e.loop(function(l) {
            l.choice(['Shrine of Echoes', 'Scribe\'s Desk', 'Binder\'s Forge', 'Back'], [
                function(c) { c.v(V.TEMP, '=', 1); c.common(ID.ce.upgradeFacility); },
                function(c) { c.v(V.TEMP, '=', 2); c.common(ID.ce.upgradeFacility); },
                function(c) { c.v(V.TEMP, '=', 3); c.common(ID.ce.upgradeFacility); },
                function(c) { c.breakLoop(); }
            ], { cancel: 3 });
        });
    });

    ce('upgradeFacility', 'Hall: Upgrade (variable 3 = facility)', function(e) {
        e.script('Hall.msg(this, Hall.upgradeText($gameVariables.value(3)));');
        e.when('Hall.canUpgrade($gameVariables.value(3))', function(t) {
            t.choice(['Upgrade', 'Not now'], [
                function(c) {
                    c.script('Hall.upgrade($gameVariables.value(3));');
                    c.se(AUDIO.sePower);
                    c.script('Hall.msg(this, Hall.upgradedText($gameVariables.value(3)));');
                },
                function(c) {}
            ], { cancel: 1 });
        });
    });

    // ---- Forge shop -------------------------------------------------------------------------------
    ce('forgeShop', 'Hall: Binder\'s Forge', function(e, ID) {
        function gear(tiers) {
            var g = [];
            ['blade', 'spear', 'bow', 'staff', 'tome'].forEach(function(w) { tiers.forEach(function(t) { g.push({ type: 'weapon', id: ID.weapon[w + '_' + t] }); }); });
            ['body', 'robe', 'shield', 'helm', 'charm'].forEach(function(a) { tiers.forEach(function(t) { g.push({ type: 'armor', id: ID.armor[a + '_' + t] }); }); });
            return g;
        }
        var consumables = ['inkTonic', 'fineTonic', 'clarity', 'pressedLeaf', 'eraser'].map(function(k) { return { type: 'item', id: ID.item[k] }; });
        e.v(V.SHOW_C, '=', { script: 'Hall.level("forge")' });
        e.narrate('The Binder\'s Forge (Lv \\V[13]). Better stock arrives as you upgrade it.');
        e.choice(['Browse wares', 'Leave'], [
            function(c) {
                c.cond('var', [V.SHOW_C, '>=', 3], function(t) { t.shop(consumables.concat(gear(['N', 'R', 'SR', 'SSR']))); }, function(t) {
                    t.cond('var', [V.SHOW_C, '>=', 2], function(u) { u.shop(consumables.concat(gear(['N', 'R', 'SR']))); }, function(u) { u.shop(consumables.concat(gear(['N', 'R']))); });
                });
            },
            function(c) {}
        ], { cancel: 1 });
    });

    // ---- Echo Stand (memories) --------------------------------------------------------------------
    ce('memoryStand', 'Hall: Echo Memories', function(e, ID) {
        e.narrate('The Echo Stand. Place a hand on the book and an echo\'s memory opens.');
        e.script('Hall.pickHero(this);');
        e.cond('var', [V.TEMP2, '>=', 1], function(t) {
            t.script('Hall.pickPart(this, $gameVariables.value(4));');
            t.cond('var', [V.TEMP, '>=', 1], function(u) {
                u.script('Hall.playMemory(this, $gameVariables.value(4), $gameVariables.value(3));');
            });
        });
    });

    return list;
}

module.exports = { specs: specs, IRI: IRI, QUILL: QUILL, START: START };
