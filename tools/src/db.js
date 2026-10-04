// Assembles the RPG Maker MV database (Actors, Classes, Skills, ...) from the content modules.
'use strict';
var ids = require('./ids');
var ev = require('./ev');
var heroesMod = require('./content_heroes');
var world = require('./content_world');
var EL = ids.ELEMENT;

var PARAM = { mhp: 0, mmp: 1, atk: 2, def: 3, mat: 4, mdf: 5, agi: 6, luk: 7 };
var MAX_LEVEL = 99;
var EXP_PARAMS = [20, 25, 25, 30];

// ---- baseline stat curve (a rarity-1.0, multiplier-1.0 hero at level L) -----------------------------
var BASE = { hp: [120, 23.3], mp: [20, 4.4], atk: [9, 1.7], def: [6, 1.1], mat: [9, 1.7], mdf: [6, 1.1], agi: [10, 1.3], luk: [8, 0.8] };
var BASE_ORDER = ['hp', 'mp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'];
function base(stat, level) { return BASE[stat][0] + BASE[stat][1] * (level - 1); }

// MV's own experience formula (Game_Actor.expForLevel)
function expForLevel(level) {
    var b = EXP_PARAMS[0], ex = EXP_PARAMS[1], a = EXP_PARAMS[2], c = EXP_PARAMS[3];
    return Math.round(b * Math.pow(level - 1, 0.9 + a / 250) * level * (level + 1) / (6 + Math.pow(level, 2) / 50 / c) + (level - 1) * ex);
}

var FODDER = { hp: 1.7, atk: 1.2 };
var TIERS = ['N', 'R', 'SR', 'SSR', 'UR'];
var WTYPES = ['blade', 'spear', 'bow', 'staff', 'tome'];       // wtypeId = index + 1
var WNAMES = {
    blade: ['Rusty Letter-Opener', 'Steel Quill-Blade', 'Inkfire Rapier', 'Saber of Sundered Names', 'Dawnbreaker'],
    spear: ['Reed Spear', 'Halberd of Chapters', 'Bastion Pike', 'Hollowbane Lance', 'Spear of First Light'],
    bow: ['Hunter\'s Bow', 'Longbow of Margins', 'Starlight Bow', 'Windscribe Bow', 'Bow of Last Lines'],
    staff: ['Archivist\'s Staff', 'Ashwood Staff', 'Wintergale Staff', 'Cartographer\'s Compass', 'Staff of Ten Thousand Names'],
    tome: ['Worn Primer', 'Illuminated Tome', 'Codex of Cinders', 'Grimoire of Fading Ink', 'Aurelian\'s Index']
};
var WICON = { blade: [97, 98, 99, 100, 101], spear: [108, 109, 110, 111, 112], bow: [112, 113, 114, 115, 116],
              staff: [117, 118, 119, 120, 121], tome: [122, 123, 124, 125, 126] };
var W_BONUS = [5, 12, 20, 32, 48], W_PRICE = [50, 200, 600, 2000, 6000], A_PRICE = [40, 160, 480, 1600, 4800];

var ARMOR_SLOTS = {   // etypeId: 2 shield, 3 head, 4 body, 5 accessory.  atypeId: 1 Armor 2 Robe 3 Shield 4 Headgear 5 Charm
    body: { etype: 4, atype: 1, names: ['Cloth Tunic', 'Reinforced Vest', 'Guild Coat', 'Warden\'s Mail', 'Vestments of the First Archive'], icon: 135 },
    robe: { etype: 4, atype: 2, names: ['Scribe\'s Smock', 'Ink-Stained Robe', 'Runed Vestment', 'Cartographer\'s Mantle', 'Mantle of Unfading Ink'], icon: 137 },
    shield: { etype: 2, atype: 3, names: ['Bookboard Shield', 'Oak Cover', 'Iron Binding', 'Bulwark of Chapters', 'Aegis of the Index'], icon: 129 },
    helm: { etype: 3, atype: 4, names: ['Paper Cap', 'Page Helm', 'Binder\'s Hood', 'Crown of Margins', 'Halo of Names'], icon: 142 },
    charm: { etype: 5, atype: 5, names: ['Bookmark Charm', 'Ribbon Mark', 'Silver Quill Pin', 'Echo Locket', 'Heart of the Archive'], icon: 152 }
};
var A_PARAMS = {
    body: function(t) { return p({ def: [3, 7, 12, 19, 30][t], mdf: [1, 3, 5, 8, 12][t] }); },
    robe: function(t) { return p({ mdf: [3, 7, 12, 19, 30][t], def: [1, 3, 5, 8, 12][t], mmp: [5, 10, 20, 30, 45][t] }); },
    shield: function(t) { return p({ def: [2, 5, 9, 14, 22][t], mdf: [1, 2, 4, 6, 10][t] }); },
    helm: function(t) { return p({ def: [2, 4, 7, 11, 17][t], mdf: [1, 2, 4, 6, 9][t] }); },
    charm: function(t) { return p({ mhp: [20, 45, 80, 130, 200][t], luk: [1, 2, 4, 6, 9][t] }); }
};
function p(o) { var a = [0, 0, 0, 0, 0, 0, 0, 0]; Object.keys(o).forEach(function(k) { a[PARAM[k]] = o[k]; }); return a; }

// ---- registry --------------------------------------------------------------------------------------
function build(story) {
    var ID = { skill: {}, state: {}, item: {}, weapon: {}, armor: {}, enemy: {}, troop: {}, class: {}, actor: {}, ce: {} };
    function assign(table, keys, start) { keys.forEach(function(k, i) { ID[table][k] = (start || 1) + i; }); }

    var skillSpecs = [{ key: 'attack', name: 'Attack', base: true }, { key: 'guard', name: 'Guard', base: true }]
        .concat(heroesMod.skills, world.enemySkills);
    assign('skill', skillSpecs.map(function(s) { return s.key; }));
    assign('state', world.states.map(function(s) { return s.key; }));
    assign('item', world.items.map(function(s) { return s.key; }));
    var wKeys = [], aKeys = [];
    TIERS.forEach(function(t) { WTYPES.forEach(function(w) { wKeys.push(w + '_' + t); }); });
    TIERS.forEach(function(t) { Object.keys(ARMOR_SLOTS).forEach(function(s) { aKeys.push(s + '_' + t); }); });
    assign('weapon', wKeys); assign('armor', aKeys);
    assign('enemy', world.enemies.map(function(s) { return s.key; }));
    assign('troop', world.troops.map(function(s) { return s.key; }));
    assign('class', heroesMod.classes.map(function(s) { return s.key; }));
    assign('actor', heroesMod.heroes.map(function(s) { return s.key; }));
    var ceSpecs = commonEventSpecs().concat((story && story.commonEvents) || []);
    assign('ce', ceSpecs.map(function(s) { return s.key; }));

    // ---- effects & skills ----
    function id(table, key) {
        if (typeof key === 'number') { return key; }
        if (ID[table][key] === undefined) { throw new Error('unknown ' + table + ' key: ' + key); }
        return ID[table][key];
    }
    function effect(f) {
        switch (f[0]) {
        case 'buff': return [{ code: 31, dataId: PARAM[f[1]], value1: f[2], value2: 0 }];
        case 'debuff': return [{ code: 32, dataId: PARAM[f[1]], value1: f[2], value2: 0 }];
        case 'state': return [{ code: 21, dataId: id('state', f[1]), value1: f[2], value2: 0 }];
        case 'unstate': return [{ code: 22, dataId: id('state', f[1]), value1: f[2], value2: 0 }];
        case 'hp': return [{ code: 11, dataId: 0, value1: f[1], value2: f[2] }];
        case 'mp': return [{ code: 12, dataId: 0, value1: f[1], value2: f[2] }];
        case 'tp': return [{ code: 13, dataId: 0, value1: f[1], value2: 0 }];
        case 'ce': return [{ code: 44, dataId: id('ce', f[1]), value1: 0, value2: 0 }];
        case 'clearDebuffs': return [2, 3, 4, 5, 6, 7].map(function(d) { return { code: 34, dataId: d, value1: 0, value2: 0 }; });
        }
        throw new Error('unknown effect ' + f[0]);
    }
    var DMG = { none: 0, dmg: 1, heal: 3, drain: 5 }, HIT = { cert: 0, phys: 1, magic: 2 };

    var skills = [null];
    skillSpecs.forEach(function(s, i) {
        var o;
        if (s.base && s.key === 'attack') {
            o = { animationId: -1, damage: { critical: true, elementId: -1, formula: 'a.atk * 4 - b.def * 2', type: 1, variance: 20 }, description: '',
                  effects: [], hitType: 1, iconIndex: heroesMod.ICON.attack, message1: ' attacks!', message2: '', mpCost: 0, name: 'Attack',
                  note: '', occasion: 1, repeats: 1, requiredWtypeId1: 0, requiredWtypeId2: 0, scope: 1, speed: 0, stypeId: 0, successRate: 100, tpCost: 0, tpGain: 5 };
        } else if (s.base) {
            o = { animationId: 0, damage: { critical: false, elementId: 0, formula: '0', type: 0, variance: 20 }, description: 'Reduces damage for one turn.',
                  effects: [{ code: 21, dataId: ID.state.guard, value1: 1, value2: 0 }], hitType: 0, iconIndex: heroesMod.ICON.guard, message1: ' guards.',
                  message2: '', mpCost: 0, name: 'Guard', note: '', occasion: 1, repeats: 1, requiredWtypeId1: 0, requiredWtypeId2: 0, scope: 11, speed: 2000,
                  stypeId: 0, successRate: 100, tpCost: 0, tpGain: 10 };
        } else {
            var type = s.type || 'none';
            var elem = s.elem !== undefined ? s.elem : (s.kind === 'phys' && type === 'dmg' ? -1 : 0);
            var effects = [];
            (s.fx || []).forEach(function(f) { effects = effects.concat(effect(f)); });
            if (type === 'heal' && s.scope !== 9 && !s.fx) { /* pure heal: formula does the work */ }
            o = {
                animationId: 0,
                damage: { critical: !!s.crit, elementId: elem, formula: s.f || '0', type: DMG[type], variance: 20 },
                description: s.desc || '', effects: effects, hitType: HIT[s.kind || 'cert'], iconIndex: s.icon || 0,
                message1: s.m1 || (s.enemy ? ' uses ' + s.name + '!' : ' uses %1!'), message2: '', mpCost: s.mp || 0, name: s.name,
                note: s.anim ? '<Anim: ' + s.anim + '>' : '',
                occasion: s.occ !== undefined ? s.occ : 1, repeats: s.repeats || 1, requiredWtypeId1: 0, requiredWtypeId2: 0,
                scope: s.scope, speed: s.speed || 0, stypeId: s.stype || 0, successRate: 100, tpCost: s.tp || 0, tpGain: s.stype === 1 ? 6 : 0
            };
        }
        o.id = i + 1;
        skills.push(o);
    });

    // ---- states ----
    var states = [null];
    world.states.forEach(function(s, i) {
        states.push({
            id: i + 1, autoRemovalTiming: s.timing || 0, chanceByDamage: 100, description: s.desc || '', iconIndex: s.icon, maxTurns: s.max || 1,
            message1: s.m1 || '', message2: s.m2 || '', message3: s.m3 || '', message4: s.m4 || '', minTurns: s.min || 1, motion: s.motion || 0,
            name: s.name, note: '', overlay: 0, priority: s.priority, releaseByDamage: false, removeAtBattleEnd: !!s.removeAtBattleEnd,
            removeByDamage: false, removeByRestriction: false, removeByWalking: false, restriction: s.restriction || 0, stepsToRemove: 100,
            traits: s.traits || []
        });
    });

    // ---- items ----
    var items = [null];
    world.items.forEach(function(s, i) {
        var effects = [];
        (s.fx || []).forEach(function(f) { effects = effects.concat(effect(f)); });
        items.push({
            id: i + 1, animationId: 0, consumable: s.consumable !== undefined ? s.consumable : !!s.scope,
            damage: { critical: false, elementId: 0, formula: '0', type: 0, variance: 20 }, description: s.desc, effects: effects, hitType: 0,
            iconIndex: s.icon, itypeId: s.itype || 1, name: s.name, note: s.scope ? '<Anim: Heal 1>' : '', occasion: s.occ !== undefined ? s.occ : 0,
            price: s.price, repeats: 1, scope: s.scope, speed: 0, successRate: 100, tpGain: 0
        });
    });

    // ---- weapons / armors ----
    var weapons = [null], armors = [null];
    TIERS.forEach(function(t, ti) {
        WTYPES.forEach(function(w, wi) {
            var main = (w === 'staff' || w === 'tome') ? 'mat' : 'atk';
            var params = p((function() { var o = {}; o[main] = W_BONUS[ti]; if (main === 'mat') { o.mdf = Math.round(W_BONUS[ti] / 4); } else if (w === 'spear') { o.def = Math.round(W_BONUS[ti] / 4); } return o; })());
            var traits = [{ code: 31, dataId: EL.physical, value: 0 }, { code: 22, dataId: 0, value: 0 }];
            if (ti >= 2 && w === 'blade') { traits[0].dataId = EL.flame; }
            if (ti >= 2 && w === 'staff') { traits[0].dataId = EL.gale; }
            if (ti >= 3 && w === 'blade') { traits.push({ code: 22, dataId: 2, value: 0.05 }); }
            if (ti >= 3 && w === 'bow') { traits.push({ code: 22, dataId: 2, value: 0.06 }); }
            if (ti === 4) { traits.push({ code: 21, dataId: 0, value: 1.1 }); }
            weapons.push({
                id: weapons.length, animationId: 0, description: t + ' ' + w + '.', etypeId: 1, traits: traits, iconIndex: WICON[w][ti], name: WNAMES[w][ti],
                note: '<Anim: ' + (w === 'bow' ? 'Hit Physical|Slash' : 'Slash|Hit Physical') + '>', params: params, price: W_PRICE[ti], wtypeId: wi + 1
            });
        });
    });
    TIERS.forEach(function(t, ti) {
        Object.keys(ARMOR_SLOTS).forEach(function(slot) {
            var sd = ARMOR_SLOTS[slot];
            armors.push({
                id: armors.length, atypeId: sd.atype, description: t + ' ' + slot + '.', etypeId: sd.etype, traits: [], iconIndex: sd.icon + ti,
                name: sd.names[ti], note: '', params: A_PARAMS[slot](ti), price: A_PRICE[ti]
            });
        });
    });

    // ---- classes ----
    var classes = [null];
    heroesMod.classes.forEach(function(c, i) {
        var params = BASE_ORDER.map(function(stat, pi) {
            var arr = [], lv;
            for (lv = 0; lv <= MAX_LEVEL; lv++) { arr.push(Math.round(base(stat, Math.max(1, lv)) * c.mul[pi])); }
            return arr;
        });
        var traits = [{ code: 22, dataId: 0, value: 0.95 }, { code: 22, dataId: 1, value: 0.05 }, { code: 22, dataId: 2, value: 0.04 + (c.crit || 0) },
                      { code: 41, dataId: 1, value: 1 }];   // the Burst skill type is added by ArchiveEchoes once a Burst is learned
        c.wtypes.forEach(function(w) { traits.push({ code: 51, dataId: w, value: 1 }); });
        c.atypes.forEach(function(a) { traits.push({ code: 52, dataId: a, value: 1 }); });
        (c.resist || []).forEach(function(r) { traits.push({ code: 11, dataId: r[0], value: r[1] }); });
        classes.push({
            id: i + 1, expParams: EXP_PARAMS.slice(), traits: traits,
            learnings: c.learn.map(function(l) { return { level: l[0], note: '', skillId: id('skill', l[1]) }; }),
            name: c.name, note: c.burst ? '<Burst: ' + id('skill', c.burst) + '>' : '', params: params
        });
    });

    // ---- actors ----
    var actors = [null];
    heroesMod.heroes.forEach(function(h, i) {
        var cls = classes[id('class', h.cls)];
        var rm = h.rarity ? heroesMod.RARITY_MUL[h.rarity] : 1;
        var traits = h.rarity ? [0, 1, 2, 3, 4, 5, 6, 7].map(function(pi) { return { code: 21, dataId: pi, value: rm }; }) : [];
        var burst = heroesMod.classes.filter(function(c) { return c.key === h.cls; })[0].burst;
        var note = '<Rarity: ' + (h.rarity || '-') + '>\n<Title: ' + h.title + '>' + (burst ? '\n<Burst: ' + id('skill', burst) + '>' : '');
        actors.push({
            id: i + 1, battlerName: h.sprite[0] + '_' + (h.sprite[1] + 1), characterIndex: h.sprite[1], characterName: h.sprite[0], classId: cls.id,
            equips: [ID.weapon[h.weapon + '_N'], 0, 0, 0, 0], faceIndex: h.sprite[1], faceName: h.sprite[0], traits: traits, initialLevel: 1,
            maxLevel: 50, name: h.name, nickname: '', note: note, profile: h.profile
        });
    });

    // ---- enemies ----
    var enemies = [null];
    world.enemies.forEach(function(e, i) {
        var L = e.lvl, mm = e.m;
        // regular enemies are scaled up so fights last a few turns; bosses and the tutorial wisps are tuned by hand
        var hs = e.boss || e.noScale ? 1 : FODDER.hp, as = e.boss || e.noScale ? 1 : FODDER.atk;
        var params = [Math.round(base('hp', L) * mm.hp * hs), Math.round(base('mp', L) * 2), Math.round(base('atk', L) * mm.atk * as), Math.round(base('def', L) * mm.def),
                      Math.round(base('mat', L) * mm.mat * as), Math.round(base('mdf', L) * mm.mdf), Math.round(base('agi', L) * mm.agi), 10];
        var traits = [{ code: 22, dataId: 0, value: 0.95 }, { code: 22, dataId: 1, value: 0.03 }, { code: 31, dataId: 1, value: 0 }];
        (e.weak || []).concat(e.resist || []).forEach(function(r) { traits.push({ code: 11, dataId: r[0], value: r[1] }); });
        if (e.boss) {
            traits.push({ code: 61, dataId: 0, value: e.extra });                       // chance of an extra action each turn
            traits.push({ code: 14, dataId: ID.state.death, value: 0 });                // cannot be instantly KO'd
            [ID.state.stunned, ID.state.blank].forEach(function(s) { traits.push({ code: 13, dataId: s, value: 0.4 }); });  // resists status
        }
        var need = (expForLevel(L + 1) - expForLevel(L)) / (3 * 2.8);   // ~3 battles of ~3 enemies per level
        var shards = Math.round((20 + 4 * L) * e.shards);
        var drops = [{ kind: 1, dataId: id('item', e.drop[0]), denominator: e.drop[1] }, { kind: 0, dataId: 1, denominator: 1 }, { kind: 0, dataId: 1, denominator: 1 }];
        enemies.push({
            id: i + 1, actions: e.actions.map(function(a) {
                return { conditionParam1: a[3] || 0, conditionParam2: a[4] || 0, conditionType: a[2] || 0, rating: a[1], skillId: id('skill', a[0]) };
            }),
            battlerHue: 0, battlerName: e.battler, dropItems: drops, exp: Math.round(need * (e.boss ? 3 : 1)), traits: traits,
            gold: Math.round((6 + 4 * L) * (e.boss ? 6 : 1)), name: e.name, note: '<Shards: ' + shards + '>', params: params
        });
    });

    // ---- troops ----
    var POS = { 1: [[300, 330]], 2: [[220, 310], [390, 340]], 3: [[160, 300], [300, 350], [440, 300]], 4: [[140, 290], [260, 350], [380, 290], [500, 350]] };
    var troops = [null];
    world.troops.forEach(function(t, i) {
        var visible = t.members.filter(function(m) { return typeof m === 'string'; }), vi = 0;
        var hiddenPos = [[130, 320], [480, 320]], hi = 0;
        var members = t.members.map(function(m) {
            if (typeof m === 'string') {
                var pos = t.boss ? [300, 400] : POS[visible.length][vi++];
                return { enemyId: id('enemy', m), x: pos[0], y: pos[1], hidden: false };
            }
            var hp = hiddenPos[hi++];
            return { enemyId: id('enemy', m[0]), x: hp[0], y: hp[1], hidden: true };
        });
        var pages = [];
        function cond(o) {
            return { actorHp: 50, actorId: 1, actorValid: false, enemyHp: o.hp || 50, enemyIndex: 0, enemyValid: !!o.hp, switchId: 1, switchValid: false,
                     turnA: 0, turnB: 0, turnEnding: false, turnValid: !!o.turn0 };
        }
        (world.bossPages[t.boss] || []).forEach(function(pg) {
            pages.push({ conditions: cond(pg.cond), list: ev.build(pg.list), span: 0 });
        });
        if (!pages.length) { pages.push({ conditions: cond({}), list: [{ code: 0, indent: 0, parameters: [] }], span: 0 }); }
        troops.push({ id: i + 1, members: members, name: t.name, pages: pages });
    });

    // ---- common events ----
    var commonEvents = [null];
    ceSpecs.forEach(function(c, i) {
        commonEvents.push({ id: i + 1, list: ev.build(function(e) { c.build(e, ID); }), name: c.name, switchId: 1, trigger: 0 });
    });

    return {
        ID: ID, Skills: skills, States: states, Items: items, Weapons: weapons, Armors: armors, Classes: classes, Actors: actors,
        Enemies: enemies, Troops: troops, CommonEvents: commonEvents
    };
}

// common events that belong to the database itself (battle summons, item use)
function commonEventSpecs() {
    var memories = [];
    heroesMod.heroes.forEach(function(h) {
        (h.memory || []).forEach(function(part, pi) {
            memories.push({ key: 'memory_' + h.key + '_' + (pi + 1), name: 'Memory: ' + h.name + ' ' + (pi === 0 ? 'I' : 'II'), build: function(e) {
                part.forEach(function(line) {
                    var who = line[0], t = line[1], speaker;
                    if (who === 'quill') { speaker = { face: '', idx: 0, name: 'Quill' }; }
                    else if (who === 'iri') { speaker = { face: 'Actor1', idx: 0, name: 'Iri' }; }
                    else {
                        var sp = heroesMod.heroes.filter(function(x) { return x.key === who; })[0];
                        speaker = { face: sp.sprite[0], idx: sp.sprite[1], name: sp.name };
                    }
                    e.say(speaker, t);
                });
            } });
        });
    });
    return memories.concat([
        { key: 'summonWisps', name: 'Boss: Summon Wisps', build: function(e) { [1, 2].forEach(function(i) { e.cmd(334, [i]); e.cmd(335, [i]); }); } },
        { key: 'summonHounds', name: 'Boss: Summon Hounds', build: function(e) { [1, 2].forEach(function(i) { e.cmd(334, [i]); e.cmd(335, [i]); }); } },
        { key: 'useCache', name: 'Item: Echo Cache', build: function(e) {
            e.script('Hall.addShards(150);');
            e.narrate('You pry open the cache and gain \\C[3]150 Echo Shards\\C[0].');
        } }
    ]);
}

module.exports = { build: build, base: base, expForLevel: expForLevel, BASE_ORDER: BASE_ORDER, MAX_LEVEL: MAX_LEVEL, TIERS: TIERS, PARAM: PARAM };
