// States, items, enemies, enemy skills and troops.
'use strict';
var ids = require('./ids');
var EL = ids.ELEMENT;
var ev = require('./ev');

// ---- states ------------------------------------------------------------------------------------
// restriction: 0 none, 4 cannot move. timing: 0 none, 1 action end, 2 turn end.
var states = [
    { key: 'death', name: 'Knocked Out', icon: 1, restriction: 4, priority: 100, motion: 3, removeAtBattleEnd: false,
      m1: ' is knocked out!', m2: ' is knocked out!', m4: '' },
    { key: 'guard', name: 'Guard', icon: 81, restriction: 0, priority: 60, timing: 1, min: 1, max: 1, removeAtBattleEnd: true,
      traits: [{ code: 62, dataId: 0, value: 1 }], m1: '', m2: '', m4: '' },
    { key: 'smudged', name: 'Smudged', icon: 4, priority: 50, timing: 2, min: 3, max: 4, removeAtBattleEnd: true,
      traits: [{ code: 22, dataId: 7, value: -0.08 }], m1: ' is smudged!', m2: ' is smudged!', m3: ' bleeds ink.', m4: '\'s smudge fades.',
      desc: 'Loses HP each turn.' },
    { key: 'blank', name: 'Blank', icon: 6, priority: 70, timing: 2, min: 3, max: 4, removeAtBattleEnd: true,
      traits: [{ code: 42, dataId: 1, value: 0 }], m1: '\'s arts go blank!', m2: '\'s arts go blank!', m4: ' can write again.',
      desc: 'Cannot use Arts.' },
    { key: 'hollowed', name: 'Hollowed', icon: 14, priority: 55, timing: 2, min: 3, max: 3, removeAtBattleEnd: true,
      traits: [{ code: 21, dataId: 3, value: 0.75 }, { code: 21, dataId: 5, value: 0.75 }], m1: ' is hollowed out!', m2: ' is hollowed out!',
      m4: ' fills in again.', desc: 'DEF and M.DEF -25%.' },
    { key: 'stunned', name: 'Stunned', icon: 13, restriction: 4, priority: 80, timing: 1, min: 1, max: 1, removeAtBattleEnd: true,
      m1: ' is stunned!', m2: ' is stunned!', m4: '', desc: 'Cannot act.' },
    { key: 'shielded', name: 'Shielded', icon: 82, priority: 40, timing: 2, min: 3, max: 3, removeAtBattleEnd: true,
      traits: [{ code: 23, dataId: 6, value: 0.7 }, { code: 23, dataId: 7, value: 0.7 }], m1: ' is shielded!', m2: ' is shielded!', m4: '',
      desc: 'Damage taken -30%.' },
    { key: 'mended', name: 'Mended', icon: 72, priority: 30, timing: 2, min: 4, max: 4, removeAtBattleEnd: true,
      traits: [{ code: 22, dataId: 7, value: 0.1 }], m1: ' begins to mend.', m2: ' begins to mend.', m4: '', desc: 'Regains HP each turn.' }
];

// ---- items -------------------------------------------------------------------------------------
// itype: 1 normal, 2 key. scope 7 = one ally, 0 none, 9 = one dead ally.
var items = [
    { key: 'inkTonic', name: 'Ink Tonic', icon: 176, price: 40, scope: 7, desc: 'Restores 150 HP.', fx: [['hp', 0, 150]] },
    { key: 'fineTonic', name: 'Fine Tonic', icon: 177, price: 160, scope: 7, desc: 'Restores 500 HP.', fx: [['hp', 0, 500]] },
    { key: 'clarity', name: 'Clarity Draught', icon: 179, price: 90, scope: 7, desc: 'Restores 40 MP.', fx: [['mp', 0, 40]] },
    { key: 'pressedLeaf', name: 'Pressed Leaf', icon: 184, price: 150, scope: 9, desc: 'Revives a fallen ally with 30% HP.',
      fx: [['unstate', 'death', 1], ['hp', 0.3, 0]] },
    { key: 'eraser', name: 'Eraser', icon: 183, price: 60, scope: 7, desc: 'Cures Smudged and Blank.',
      fx: [['unstate', 'smudged', 1], ['unstate', 'blank', 1]] },
    { key: 'inkPage', name: 'Ink Page', icon: 188, price: 0, scope: 0, occ: 3, desc: 'A blank page soaked in ink. Used to upgrade Archive Hall facilities.' },
    { key: 'lorePage', name: 'Lore Fragment', icon: 189, price: 0, scope: 0, occ: 3, itype: 2, desc: 'A torn page of Archive history. Read them at the Echo Stand.' },
    { key: 'indexPage', name: 'Index Page', icon: 190, price: 0, scope: 0, occ: 3, itype: 2, desc: 'The page the Curator guarded. It names the way to the Inkwell.' },
    { key: 'sigil', name: 'Warden\'s Sigil', icon: 191, price: 0, scope: 0, occ: 3, itype: 2, desc: 'A seal that glows faintly with a forgotten name.' },
    { key: 'echoCache', name: 'Echo Cache', icon: 192, price: 0, scope: 0, occ: 2, desc: 'A sealed cache of echo shards (+150). Use from the menu.',
      fx: [['ce', 'useCache']], consumable: true }
];

// ---- enemy skills ------------------------------------------------------------------------------
// Same spec format as hero skills (see content_heroes.js). Targeting: scope 1 one enemy of the user = one actor.
function E(key, name, o) { o.key = key; o.name = name; o.stype = 0; o.enemy = true; return o; }
var enemySkills = [
    E('inkSpit', 'Ink Spit', { scope: 1, kind: 'magic', type: 'dmg', elem: EL.hollow, f: 'a.mat * 3.6 - b.mdf * 2', m1: ' spits ink!', anim: 'Darkness 1|Hit Effect|Hit Physical' }),
    E('enemyPaperCut', 'Paper Cut', { scope: 1, kind: 'phys', type: 'dmg', f: 'a.atk * 3.4 - b.def * 2', m1: ' slices with a paper edge!', anim: 'Slash|Hit Physical' }),
    E('quillStab', 'Quill Stab', { scope: 1, kind: 'phys', type: 'dmg', f: 'a.atk * 4 - b.def * 2', m1: ' stabs with a quill!', anim: 'Slash|Hit Physical' }),
    E('scribbleOver', 'Scribble Over', { scope: 1, kind: 'magic', type: 'dmg', f: 'a.mat * 2 - b.mdf * 2', fx: [['state', 'smudged', 0.8]], m1: ' scribbles furiously!', anim: 'Darkness 1|Status' }),
    E('chomp', 'Chomp', { scope: 1, kind: 'phys', type: 'dmg', f: 'a.atk * 5 - b.def * 2', m1: ' chomps down!', anim: 'Slash|Hit Physical' }),
    E('pageGust', 'Page Gust', { scope: 2, kind: 'magic', type: 'dmg', elem: EL.gale, f: 'a.mat * 2.4 - b.mdf * 2', m1: ' whips up a storm of pages!', anim: 'Wind 1|Hit Effect' }),
    E('engulf', 'Engulf', { scope: 1, kind: 'phys', type: 'dmg', f: 'a.atk * 3.6 - b.def * 2', fx: [['state', 'smudged', 0.5]], m1: ' engulfs its target!', anim: 'Darkness 1|Hit Physical' }),
    E('overdue', 'Overdue Notice', { scope: 1, kind: 'magic', type: 'dmg', f: 'a.mat * 2.2 - b.mdf * 2', fx: [['state', 'blank', 0.7]], m1: ' stamps an OVERDUE notice!', anim: 'Status|Hit Effect' }),
    E('coldStamp', 'Cold Stamp', { scope: 1, kind: 'magic', type: 'dmg', elem: EL.frost, f: 'a.mat * 3.2 - b.mdf * 2', fx: [['debuff', 'agi', 3]], m1: ' stamps with icy water!', anim: 'Ice 1|Hit Effect' }),
    E('lunge', 'Lunge', { scope: 1, kind: 'phys', type: 'dmg', f: 'a.atk * 4.4 - b.def * 2', m1: ' lunges!', anim: 'Slash|Hit Physical' }),
    E('voidSlash', 'Void Slash', { scope: 1, kind: 'phys', type: 'dmg', elem: EL.hollow, f: 'a.atk * 4.6 - b.def * 2', fx: [['state', 'hollowed', 0.4]], m1: ' cuts through nothing and everything!', anim: 'Darkness 2|Slash' }),
    E('hollowGuard', 'Hollow Guard', { scope: 11, kind: 'cert', fx: [['state', 'shielded', 1]], m1: ' hollows out its armor.', anim: 'Status' }),
    E('bookBarrage', 'Book Barrage', { scope: 2, kind: 'phys', type: 'dmg', f: 'a.atk * 2.8 - b.def * 2', m1: ' hurls a barrage of heavy books!', anim: 'Hit Physical|Slash' }),
    E('summonWisps', 'Summon Wisps', { scope: 11, kind: 'cert', fx: [['ce', 'summonWisps']], m1: ' calls the wisps back!', anim: 'Darkness 1|Status' }),
    E('erasePage', 'Erase Page', { scope: 1, kind: 'magic', type: 'dmg', elem: EL.hollow, f: 'a.mat * 4.2 - b.mdf * 2', fx: [['state', 'blank', 0.6]], m1: ' erases a page!', anim: 'Darkness 2|Darkness 1' }),
    E('blankOut', 'Blank Out', { scope: 2, kind: 'magic', type: 'dmg', elem: EL.hollow, f: 'a.mat * 2.8 - b.mdf * 2', m1: ' lets the page go blank!', anim: 'Darkness 3|Darkness 2' }),
    E('chainSwing', 'Chain Swing', { scope: 2, kind: 'phys', type: 'dmg', f: 'a.atk * 3 - b.def * 2', fx: [['state', 'stunned', 0.2]], m1: ' swings the broken chain!', anim: 'Slash|Hit Physical' }),
    E('summonHounds', 'Call the Pack', { scope: 11, kind: 'cert', fx: [['ce', 'summonHounds']], m1: ' calls the pack from the margins!', anim: 'Darkness 1|Status' })
];

// ---- enemies -----------------------------------------------------------------------------------
// lvl: equivalent hero level. m: multipliers on the baseline stats (see db.js). actions: [skill, rating, condType, p1, p2]
var enemies = [
    { key: 'fadedWisp', name: 'Faded Wisp', battler: 'InkWisp', lvl: 1, m: { hp: 0.3, atk: 0.45, def: 0.6, mat: 0.45, mdf: 0.7, agi: 0.9 }, noScale: true,
      weak: [[EL.gale, 1.5]], actions: [[1, 5], ['inkSpit', 3]], shards: 0.5, drop: ['inkTonic', 3] },
    { key: 'inkWisp', name: 'Ink Wisp', battler: 'InkWisp', lvl: 2, m: { hp: 0.6, atk: 0.9, def: 0.8, mat: 1.1, mdf: 0.9, agi: 1.2 },
      weak: [[EL.gale, 1.5]], resist: [[EL.hollow, 0.5]], actions: [[1, 4], ['inkSpit', 6]], shards: 1, drop: ['inkTonic', 8] },
    { key: 'pageMite', name: 'Page Mite', battler: 'PageMite', lvl: 2, m: { hp: 0.55, atk: 1.0, def: 0.8, mat: 0.6, mdf: 0.7, agi: 1.1 },
      weak: [[EL.flame, 1.5]], actions: [[1, 5], ['enemyPaperCut', 6]], shards: 1, drop: ['inkTonic', 8] },
    { key: 'huskScribe', name: 'Husk Scribe', battler: 'HuskScribe', lvl: 4, m: { hp: 1.0, atk: 1.05, def: 1.0, mat: 1.0, mdf: 1.0, agi: 0.9 },
      weak: [[EL.flame, 1.5], [EL.lumen, 1.25]], resist: [[EL.hollow, 0.5]], actions: [[1, 4], ['quillStab', 6], ['scribbleOver', 4]], shards: 1.3, drop: ['inkPage', 5] },
    { key: 'tomeMimic', name: 'Tome Mimic', battler: 'TomeMimic', lvl: 5, m: { hp: 1.5, atk: 1.2, def: 1.1, mat: 0.9, mdf: 0.9, agi: 0.8 },
      weak: [[EL.flame, 1.5]], actions: [[1, 3], ['chomp', 7], ['pageGust', 4]], shards: 2, drop: ['inkPage', 3] },
    { key: 'inkSlime', name: 'Ink Slime', battler: 'InkSlime', lvl: 6, m: { hp: 1.1, atk: 1.0, def: 1.1, mat: 0.8, mdf: 0.9, agi: 0.8 },
      weak: [[EL.lumen, 1.5], [EL.gale, 1.25]], resist: [[EL.hollow, 0.25], [EL.physical, 0.85]], actions: [[1, 4], ['engulf', 6]], shards: 1, drop: ['inkTonic', 7] },
    { key: 'drownedClerk', name: 'Drowned Clerk', battler: 'DrownedClerk', lvl: 7, m: { hp: 0.95, atk: 0.8, def: 0.8, mat: 1.15, mdf: 1.1, agi: 1.0 },
      weak: [[EL.flame, 1.5]], resist: [[EL.frost, 0.5], [EL.physical, 0.8]], actions: [[1, 3], ['overdue', 6], ['coldStamp', 5]], shards: 1.2, drop: ['clarity', 7] },
    { key: 'blotHound', name: 'Blot Hound', battler: 'BlotHound', lvl: 8, m: { hp: 1.2, atk: 1.2, def: 0.9, mat: 0.6, mdf: 0.8, agi: 1.35 },
      weak: [[EL.lumen, 1.5]], resist: [[EL.hollow, 0.5]], actions: [[1, 3], ['lunge', 7]], shards: 1.3, drop: ['inkPage', 4] },
    { key: 'hollowKnight', name: 'Hollow Knight', battler: 'HollowKnight', lvl: 9, m: { hp: 1.9, atk: 1.2, def: 1.35, mat: 0.8, mdf: 1.0, agi: 0.9 },
      weak: [[EL.lumen, 1.5]], resist: [[EL.hollow, 0.25], [EL.physical, 0.85]], actions: [[1, 3], ['voidSlash', 7], ['hollowGuard', 3, 2, 0, 0.5]], shards: 2.2, drop: ['inkPage', 3] },
    { key: 'curatorHusk', name: 'Curator Husk', battler: 'CuratorHusk', lvl: 6, boss: true, extra: 0.5,
      m: { hp: 9, atk: 1.15, def: 1.05, mat: 1.05, mdf: 1.0, agi: 0.9 }, weak: [[EL.flame, 1.5], [EL.lumen, 1.25]], resist: [[EL.hollow, 0.5]],
      actions: [[1, 3], ['quillStab', 4], ['scribbleOver', 5], ['bookBarrage', 6, 1, 2, 2], ['summonWisps', 8, 2, 0, 0.6]], shards: 14, drop: ['indexPage', 1] },
    { key: 'unwrittenWarden', name: 'Unwritten Warden', battler: 'UnwrittenWarden', lvl: 9, boss: true, extra: 0.7,
      m: { hp: 9, atk: 1.15, def: 1.1, mat: 1.15, mdf: 1.05, agi: 1.0 }, weak: [[EL.lumen, 1.5]], resist: [[EL.hollow, 0.1], [EL.physical, 0.9]],
      actions: [[1, 2], ['voidSlash', 4], ['erasePage', 5], ['chainSwing', 6, 1, 1, 2], ['blankOut', 6, 1, 3, 3], ['summonHounds', 8, 2, 0, 0.55]], shards: 22, drop: ['sigil', 1] }
];

// ---- troops ------------------------------------------------------------------------------------
var troops = [
    { key: 'tutorial', name: 'Prologue Wisps', members: ['fadedWisp', 'fadedWisp'] },
    { key: 'wispPair', name: 'Wisp Pair', members: ['inkWisp', 'inkWisp'] },
    { key: 'miteSwarm', name: 'Mite Swarm', members: ['pageMite', 'pageMite', 'pageMite'] },
    { key: 'wispMites', name: 'Wisp and Mites', members: ['inkWisp', 'pageMite', 'pageMite'] },
    { key: 'scribeWisp', name: 'Scribe and Wisp', members: ['huskScribe', 'inkWisp'] },
    { key: 'mimic', name: 'Tome Mimic', members: ['tomeMimic'] },
    { key: 'scribePair', name: 'Scribe Pair', members: ['huskScribe', 'huskScribe', 'pageMite'] },
    { key: 'curator', name: 'Curator Husk', members: ['curatorHusk', ['inkWisp', 'hidden'], ['inkWisp', 'hidden']], boss: 'curator' },
    { key: 'slimes', name: 'Slime Trio', members: ['inkSlime', 'inkSlime', 'inkSlime'] },
    { key: 'clerks', name: 'Clerk Pair', members: ['drownedClerk', 'drownedClerk'] },
    { key: 'hounds', name: 'Hound Pack', members: ['blotHound', 'blotHound'] },
    { key: 'clerkSlimes', name: 'Clerk and Slimes', members: ['drownedClerk', 'inkSlime', 'inkSlime'] },
    { key: 'knightHound', name: 'Knight and Hound', members: ['hollowKnight', 'blotHound'] },
    { key: 'knightPair', name: 'Knight Pair', members: ['hollowKnight', 'hollowKnight'] },
    { key: 'houndsClerk', name: 'Hounds and Clerk', members: ['blotHound', 'blotHound', 'drownedClerk'] },
    { key: 'warden', name: 'Unwritten Warden', members: ['unwrittenWarden', ['blotHound', 'hidden'], ['blotHound', 'hidden']], boss: 'warden' }
];

// Battle events (troop pages) for the two bosses. Conditions: turn 0 = battle start, hp = percent.
var bossPages = {
    curator: [
        { cond: { turn0: true }, list: function(e) {
            e.narrate('The Curator Husk rises, books circling its blank hood like moths.');
            e.narrate('"Overdue... all things... must be returned..."');
        } },
        { cond: { hp: 50 }, list: function(e) {
            e.narrate('The Curator Husk shudders. Pages tear loose from its robe and begin to burn with violet light.');
            e.narrate('"RETURN... RETURN..."');
        } }
    ],
    warden: [
        { cond: { turn0: true }, list: function(e) {
            e.narrate('The Unwritten Warden unfolds from the ink, its cloak made of sentences fading mid-word.');
            e.narrate('"No name... no name... you will be no name either."');
        } },
        { cond: { hp: 50 }, list: function(e) {
            e.narrate('The chains around the Warden snap, one link at a time. Something howls from the margins.');
        } },
        { cond: { hp: 20 }, list: function(e) {
            e.narrate('"I remember..." the Warden whispers, its voice suddenly young. "I remember being asked to stand here."');
        } }
    ]
};

module.exports = { states: states, items: items, enemySkills: enemySkills, enemies: enemies, troops: troops, bossPages: bossPages };
