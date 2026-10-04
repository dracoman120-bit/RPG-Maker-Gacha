// Heroes ("echoes"), their classes and skills, plus the Echo Memory scenes.
'use strict';
var ids = require('./ids');
var EL = ids.ELEMENT;

// Icon indexes refer to the stock IconSet.png. Tweak freely.
var ICON = { attack: 76, guard: 81, fire: 64, ice: 65, wind: 69, holy: 70, dark: 71, heal: 72, buff: 33, debuff: 49,
             burst: 79, support: 73, blade: 77, bow: 85, spell: 78 };

// ---- skills ---------------------------------------------------------------------------------------
// kind: phys | magic | cert. type: dmg | heal | drain | none.
// fx: ['buff'|'debuff', param, turns] ['state', key, chance] ['unstate', key, chance]
//     ['hp', rate, flat] ['mp', rate, flat] ['tp', n] ['ce', key] ['clearDebuffs']
function S(key, name, o) { o.key = key; o.name = name; return o; }

var skills = [
    // ----- Iri (Archivist)
    S('annotate', 'Annotate', { icon: ICON.buff, desc: 'Raises an ally\'s ATK and M.ATK.', stype: 1, mp: 6, scope: 7, kind: 'cert',
        fx: [['buff', 'atk', 4], ['buff', 'mat', 4]], anim: 'Power Up|Status|Heal 1' }),
    S('index', 'Index', { icon: ICON.debuff, desc: 'Marks an enemy, lowering its DEF and M.DEF.', stype: 1, mp: 8, scope: 1, kind: 'cert',
        fx: [['debuff', 'def', 4], ['debuff', 'mdf', 4]], anim: 'Darkness 1|Debuff|Status' }),
    S('revise', 'Revise', { icon: ICON.heal, desc: 'Rewrites an ally\'s wounds, restoring HP.', stype: 1, mp: 10, scope: 7, kind: 'cert',
        type: 'heal', f: 'a.mat * 2.4 + 40', occ: 0, anim: 'Heal 1|Heal 2' }),
    S('crossReference', 'Cross-Reference', { icon: ICON.burst, desc: 'Burst: a wave of lumen hits every enemy.', stype: 2, tp: 50, scope: 2,
        kind: 'magic', type: 'dmg', elem: EL.lumen, f: 'a.mat * 4 - b.mdf * 2', anim: 'Light 1|Holy 1|Light 2' }),

    // ----- Wick (N, Lampbearer)
    S('lanternSwing', 'Lantern Swing', { icon: ICON.fire, desc: 'Swings the harbor lamp. Flame damage.', stype: 1, mp: 4, scope: 1, kind: 'phys',
        type: 'dmg', elem: EL.flame, f: 'a.atk * 4.6 - b.def * 2', anim: 'Fire 1|Slash' }),
    S('holdTheLight', 'Hold the Light', { icon: ICON.guard, desc: 'Shields an ally, reducing damage taken.', stype: 1, mp: 6, scope: 7, kind: 'cert',
        fx: [['state', 'shielded', 1]], anim: 'Light 1|Status' }),
    S('lastLamp', 'Last Lamp', { icon: ICON.burst, desc: 'Burst: restores the whole party and clears smudges.', stype: 2, tp: 50, scope: 8, kind: 'cert',
        type: 'heal', f: 'a.def * 2 + 60', fx: [['unstate', 'smudged', 1]], anim: 'Heal 2|Light 1' }),

    // ----- Pip (N, Page Runner)
    S('pageDash', 'Page Dash', { icon: ICON.wind, desc: 'A blindingly quick strike. Gale damage.', stype: 1, mp: 3, scope: 1, kind: 'phys',
        type: 'dmg', elem: EL.gale, f: 'a.atk * 4.4 - b.def * 2', speed: 20, anim: 'Wind 1|Slash' }),
    S('paperCut', 'Paper Cut', { icon: ICON.blade, desc: 'Two quick slashes that may smudge.', stype: 1, mp: 5, scope: 1, kind: 'phys',
        type: 'dmg', f: 'a.atk * 2.8 - b.def * 2', repeats: 2, fx: [['state', 'smudged', 0.4]], anim: 'Slash' }),
    S('specialDelivery', 'Special Delivery', { icon: ICON.burst, desc: 'Burst: dashes through every enemy.', stype: 2, tp: 50, scope: 2, kind: 'phys',
        type: 'dmg', elem: EL.gale, f: 'a.atk * 3.4 - b.def * 2', anim: 'Wind 2|Slash' }),

    // ----- Marla (R, Scrivener)
    S('mendScript', 'Mend Script', { icon: ICON.heal, desc: 'Restores an ally\'s HP.', stype: 1, mp: 8, scope: 7, kind: 'cert',
        type: 'heal', f: 'a.mat * 2.4 + 40', occ: 0, anim: 'Heal 1' }),
    S('blessedMargin', 'Blessed Margin', { icon: ICON.heal, desc: 'Restores HP to the whole party.', stype: 1, mp: 14, scope: 8, kind: 'cert',
        type: 'heal', f: 'a.mat * 1.3 + 24', occ: 0, anim: 'Heal 2|Heal 1' }),
    S('fairCopy', 'Fair Copy', { icon: ICON.burst, desc: 'Burst: revives a fallen ally with 60% HP.', stype: 2, tp: 50, scope: 9, kind: 'cert',
        fx: [['unstate', 'death', 1], ['hp', 0.6, 0]], occ: 1, anim: 'Heal 2|Light 1' }),

    // ----- Doran (R, Ledger Guard)
    S('shieldAudit', 'Shield Audit', { icon: ICON.guard, desc: 'Braces: shields himself and raises DEF.', stype: 1, mp: 5, scope: 11, kind: 'cert',
        fx: [['state', 'shielded', 1], ['buff', 'def', 4]], anim: 'Status' }),
    S('ledgerSlam', 'Ledger Slam', { icon: ICON.blade, desc: 'Heavy blow that may stun.', stype: 1, mp: 6, scope: 1, kind: 'phys',
        type: 'dmg', f: 'a.atk * 4.8 - b.def * 2', fx: [['state', 'stunned', 0.3]], anim: 'Slash|Hit Physical' }),
    S('balancedBooks', 'Balanced Books', { icon: ICON.burst, desc: 'Burst: a crushing sweep across all enemies.', stype: 2, tp: 50, scope: 2, kind: 'phys',
        type: 'dmg', f: 'a.atk * 3.4 - b.def * 2', anim: 'Slash|Hit Physical' }),

    // ----- Fenn (R, Quillshot)
    S('quickQuill', 'Quick Quill', { icon: ICON.bow, desc: 'Fires at two random enemies.', stype: 1, mp: 5, scope: 4, kind: 'phys',
        type: 'dmg', f: 'a.atk * 3.4 - b.def * 2', anim: 'Slash|Hit Physical' }),
    S('pinningShot', 'Pinning Shot', { icon: ICON.bow, desc: 'A shot that slows its target.', stype: 1, mp: 7, scope: 1, kind: 'phys',
        type: 'dmg', f: 'a.atk * 4.4 - b.def * 2', fx: [['debuff', 'agi', 4]], anim: 'Slash|Hit Physical' }),
    S('volleyOfFootnotes', 'Volley of Footnotes', { icon: ICON.burst, desc: 'Burst: arrows rain on every enemy.', stype: 2, tp: 50, scope: 2, kind: 'phys',
        type: 'dmg', f: 'a.atk * 3.6 - b.def * 2', anim: 'Slash|Hit Physical' }),

    // ----- Sera (SR, Ink Mage)
    S('inkBolt', 'Ink Bolt', { icon: ICON.fire, desc: 'A bolt of burning ink. Flame damage.', stype: 1, mp: 8, scope: 1, kind: 'magic',
        type: 'dmg', elem: EL.flame, f: 'a.mat * 5.2 - b.mdf * 2', anim: 'Fire 1|Fire 2' }),
    S('blotStorm', 'Blot Storm', { icon: ICON.fire, desc: 'Flame rain on all enemies; may smudge.', stype: 1, mp: 16, scope: 2, kind: 'magic',
        type: 'dmg', elem: EL.flame, f: 'a.mat * 3.5 - b.mdf * 2', fx: [['state', 'smudged', 0.35]], anim: 'Fire 2|Fire 1' }),
    S('inkfall', 'Inkfall', { icon: ICON.burst, desc: 'Burst: a firestorm of ink on all enemies.', stype: 2, tp: 60, scope: 2, kind: 'magic',
        type: 'dmg', elem: EL.flame, f: 'a.mat * 6 - b.mdf * 2', anim: 'Fire 3|Fire 2' }),

    // ----- Tobias (SR, Bellringer)
    S('tollOfCourage', 'Toll of Courage', { icon: ICON.buff, desc: 'Raises the party\'s ATK and M.ATK.', stype: 1, mp: 12, scope: 8, kind: 'cert',
        fx: [['buff', 'atk', 4], ['buff', 'mat', 4]], anim: 'Power Up|Status' }),
    S('silencingChime', 'Silencing Chime', { icon: ICON.support, desc: 'A chime that blanks an enemy\'s arts.', stype: 1, mp: 9, scope: 1, kind: 'magic',
        type: 'dmg', f: 'a.mat * 2 - b.mdf * 2', fx: [['state', 'blank', 0.8], ['debuff', 'mdf', 3]], anim: 'Light 1|Status' }),
    S('grandPeal', 'Grand Peal', { icon: ICON.burst, desc: 'Burst: heals and empowers the whole party.', stype: 2, tp: 60, scope: 8, kind: 'cert',
        type: 'heal', f: 'a.mat * 1.2 + 40', fx: [['buff', 'atk', 4], ['buff', 'def', 4], ['buff', 'mat', 4], ['buff', 'mdf', 4], ['buff', 'agi', 4]],
        anim: 'Heal 2|Power Up' }),

    // ----- Kael (SR, Duelist of the Margins)
    S('marginalia', 'Marginalia', { icon: ICON.blade, desc: 'A precise strike that can crit.', stype: 1, mp: 6, scope: 1, kind: 'phys',
        type: 'dmg', f: 'a.atk * 5.4 - b.def * 2', crit: true, anim: 'Slash|Hit Physical' }),
    S('flurryOfNotes', 'Flurry of Notes', { icon: ICON.blade, desc: 'Three slashes at random enemies.', stype: 1, mp: 10, scope: 5, kind: 'phys',
        type: 'dmg', f: 'a.atk * 2.6 - b.def * 2', anim: 'Slash|Hit Physical' }),
    S('redline', 'Redline', { icon: ICON.burst, desc: 'Burst: one devastating strike.', stype: 2, tp: 60, scope: 1, kind: 'phys',
        type: 'dmg', f: 'a.atk * 11 - b.def * 2', crit: true, anim: 'Slash|Hit Physical' }),

    // ----- Isolde (SSR, Last Cartographer)
    S('chartedGale', 'Charted Gale', { icon: ICON.wind, desc: 'A mapped gale scours all enemies.', stype: 1, mp: 18, scope: 2, kind: 'magic',
        type: 'dmg', elem: EL.gale, f: 'a.mat * 4 - b.mdf * 2', anim: 'Wind 2|Wind 1' }),
    S('markTheRoute', 'Mark the Route', { icon: ICON.buff, desc: 'Raises the party\'s AGI and DEF.', stype: 1, mp: 10, scope: 8, kind: 'cert',
        fx: [['buff', 'agi', 4], ['buff', 'def', 4]], anim: 'Power Up|Status' }),
    S('cartographersFolio', 'Cartographer\'s Folio', { icon: ICON.burst, desc: 'Burst: a storm that also lowers enemy DEF.', stype: 2, tp: 70, scope: 2,
        kind: 'magic', type: 'dmg', elem: EL.gale, f: 'a.mat * 6.5 - b.mdf * 2', fx: [['debuff', 'def', 4]], anim: 'Wind 3|Wind 2' }),

    // ----- Brannock (SSR, Wall of Chapters)
    S('chapterWall', 'Chapter Wall', { icon: ICON.guard, desc: 'Shields the whole party.', stype: 1, mp: 14, scope: 8, kind: 'cert',
        fx: [['state', 'shielded', 1]], anim: 'Light 1|Status' }),
    S('dogEar', 'Dog-Ear', { icon: ICON.blade, desc: 'A crushing blow that may stun.', stype: 1, mp: 8, scope: 1, kind: 'phys',
        type: 'dmg', f: 'a.atk * 5 - b.def * 2', fx: [['state', 'stunned', 0.4]], anim: 'Slash|Hit Physical' }),
    S('finalChapter', 'Final Chapter', { icon: ICON.burst, desc: 'Burst: shatters every enemy, may stun.', stype: 2, tp: 70, scope: 2, kind: 'phys',
        type: 'dmg', f: 'a.atk * 5.5 - b.def * 2', fx: [['state', 'stunned', 0.5]], anim: 'Slash|Hit Physical' }),

    // ----- Aurelian (UR, First Archivist)
    S('firstLight', 'First Light', { icon: ICON.holy, desc: 'The first word ever written. Heavy lumen damage.', stype: 1, mp: 14, scope: 1, kind: 'magic',
        type: 'dmg', elem: EL.lumen, f: 'a.mat * 7 - b.mdf * 2', anim: 'Light 2|Holy 1|Light 1' }),
    S('indexOfAges', 'Index of Ages', { icon: ICON.heal, desc: 'Heals the party and clears ailments.', stype: 1, mp: 20, scope: 8, kind: 'cert',
        type: 'heal', f: 'a.mat * 2 + 60', fx: [['unstate', 'smudged', 1], ['unstate', 'blank', 1], ['unstate', 'hollowed', 1], ['clearDebuffs']],
        occ: 0, anim: 'Heal 2|Light 2' }),
    S('illuminatedEdition', 'Illuminated Edition', { icon: ICON.burst, desc: 'Burst: dawn breaks over every enemy.', stype: 2, tp: 80, scope: 2,
        kind: 'magic', type: 'dmg', elem: EL.lumen, f: 'a.mat * 8 - b.mdf * 2', anim: 'Light 3|Holy 2|Light 2' }),

    // ----- Nyx (UR, Echo of the Unwritten)
    S('unwritePage', 'Unwrite', { icon: ICON.dark, desc: 'Erases a piece of the enemy and drains its HP.', stype: 1, mp: 14, scope: 1, kind: 'magic',
        type: 'drain', elem: EL.hollow, f: 'a.mat * 6 - b.mdf * 2', anim: 'Darkness 1|Darkness 2' }),
    S('erasure', 'Erasure', { icon: ICON.dark, desc: 'Blanks out all enemies; may silence.', stype: 1, mp: 20, scope: 2, kind: 'magic',
        type: 'dmg', elem: EL.hollow, f: 'a.mat * 4 - b.mdf * 2', fx: [['state', 'blank', 0.6]], anim: 'Darkness 2|Darkness 1' }),
    S('blankVerse', 'Blank Verse', { icon: ICON.burst, desc: 'Burst: the space between lines swallows one foe.', stype: 2, tp: 80, scope: 1,
        kind: 'magic', type: 'dmg', elem: EL.hollow, f: 'a.mat * 12 - b.mdf * 2', anim: 'Darkness 3|Darkness 2' })
];

// ---- classes ---------------------------------------------------------------------------------------
// mul: [hp, mp, atk, def, mat, mdf, agi, luk] applied to the baseline growth curve.
// wtypes: 1 Blade, 2 Spear, 3 Bow, 4 Staff, 5 Tome.  atypes: 1 Armor, 2 Robe, 3 Shield, 4 Headgear, 5 Charm.
var classes = [
    { key: 'archivist', name: 'Archivist', mul: [0.9, 1.2, 0.8, 0.9, 1.0, 1.1, 1.0, 1.2], wtypes: [4, 5], atypes: [2, 4, 5],
      learn: [[1, 'annotate'], [3, 'index'], [5, 'revise'], [8, 'crossReference']] },
    { key: 'lampbearer', name: 'Lampbearer', mul: [1.1, 0.7, 1.0, 1.1, 0.6, 0.8, 0.9, 1.0], wtypes: [1, 2], atypes: [1, 3, 4, 5],
      learn: [[1, 'lanternSwing'], [3, 'holdTheLight']], burst: 'lastLamp' },
    { key: 'pagerunner', name: 'Page Runner', mul: [0.85, 0.8, 0.9, 0.7, 0.6, 0.7, 1.4, 1.1], wtypes: [1, 3], atypes: [1, 4, 5],
      learn: [[1, 'pageDash'], [3, 'paperCut']], burst: 'specialDelivery' },
    { key: 'scrivener', name: 'Scrivener', mul: [0.9, 1.4, 0.6, 0.8, 1.0, 1.2, 0.9, 1.0], wtypes: [4], atypes: [2, 4, 5],
      learn: [[1, 'mendScript'], [3, 'blessedMargin']], burst: 'fairCopy' },
    { key: 'ledgerguard', name: 'Ledger Guard', mul: [1.3, 0.6, 1.0, 1.4, 0.5, 0.8, 0.7, 0.9], wtypes: [1, 2], atypes: [1, 3, 4, 5],
      learn: [[1, 'shieldAudit'], [3, 'ledgerSlam']], burst: 'balancedBooks', resist: [[EL.physical, 0.85]] },
    { key: 'quillshot', name: 'Quillshot', mul: [0.85, 0.9, 1.15, 0.75, 0.7, 0.8, 1.2, 1.1], wtypes: [3], atypes: [1, 4, 5],
      learn: [[1, 'quickQuill'], [3, 'pinningShot']], burst: 'volleyOfFootnotes' },
    { key: 'inkmage', name: 'Ink Mage', mul: [0.8, 1.5, 0.5, 0.6, 1.4, 1.1, 1.0, 1.0], wtypes: [4, 5], atypes: [2, 4, 5],
      learn: [[1, 'inkBolt'], [3, 'blotStorm']], burst: 'inkfall' },
    { key: 'bellringer', name: 'Bellringer', mul: [1.0, 1.3, 0.7, 0.9, 0.9, 1.2, 0.95, 1.0], wtypes: [4, 2], atypes: [1, 2, 4, 5],
      learn: [[1, 'tollOfCourage'], [3, 'silencingChime']], burst: 'grandPeal' },
    { key: 'marginduelist', name: 'Margin Duelist', mul: [0.95, 0.7, 1.35, 0.8, 0.6, 0.7, 1.3, 1.2], wtypes: [1], atypes: [1, 4, 5],
      learn: [[1, 'marginalia'], [3, 'flurryOfNotes']], burst: 'redline', crit: 0.08 },
    { key: 'cartographer', name: 'Cartographer', mul: [0.9, 1.4, 0.6, 0.8, 1.3, 1.1, 1.1, 1.0], wtypes: [4, 5], atypes: [2, 4, 5],
      learn: [[1, 'chartedGale'], [3, 'markTheRoute']], burst: 'cartographersFolio' },
    { key: 'chapterwall', name: 'Chapter Wall', mul: [1.5, 0.6, 1.1, 1.6, 0.4, 0.9, 0.6, 0.9], wtypes: [1, 2], atypes: [1, 3, 4, 5],
      learn: [[1, 'chapterWall'], [3, 'dogEar']], burst: 'finalChapter', resist: [[EL.physical, 0.8]] },
    { key: 'firstarchivist', name: 'First Archivist', mul: [1.1, 1.5, 0.9, 1.0, 1.4, 1.3, 1.0, 1.1], wtypes: [1, 4, 5], atypes: [2, 3, 4, 5],
      learn: [[1, 'firstLight'], [3, 'indexOfAges']], burst: 'illuminatedEdition', resist: [[EL.hollow, 0.75]] },
    { key: 'unwritten', name: 'Echo of the Unwritten', mul: [1.0, 1.3, 1.2, 0.9, 1.3, 1.0, 1.2, 1.1], wtypes: [1, 5], atypes: [1, 2, 4, 5],
      learn: [[1, 'unwritePage'], [3, 'erasure']], burst: 'blankVerse', resist: [[EL.hollow, 0.5]] }
];

// ---- heroes ----------------------------------------------------------------------------------------
// sprite: [sheet name, index] — characters, faces and SV battlers all use the same sheet + index.
var RARITY_MUL = { N: 0.85, R: 1.0, SR: 1.12, SSR: 1.25, UR: 1.4 };

var heroes = [
    { key: 'iri', name: 'Iri', cls: 'archivist', rarity: null, sprite: ['Actor1', 0], weapon: 'staff', title: 'Archivist',
      profile: 'The last apprentice of the Great Archive. Carries the Index Key and a stubborn belief that nothing is truly lost.' },
    { key: 'wick', name: 'Wick', cls: 'lampbearer', rarity: 'N', sprite: ['Actor1', 4], weapon: 'blade', title: 'Lamp-Bearer',
      profile: 'A night-watch boy who kept the harbor lamp burning through the first Hollow night.',
      memory: [
        [['wick', 'The harbor lamp never went out on my watch. Not even when the Hollow came up the stairs one step at a time.'],
         ['iri', 'You stayed?'], ['wick', 'Somebody had to hold the light. That\'s the whole job.']],
        [['wick', 'I think the lamp was the one thing it couldn\'t erase. Funny. It\'s only a lamp.'],
         ['quill', 'Funny how often "only a lamp" is the thing that matters.']]] },
    { key: 'pip', name: 'Pip', cls: 'pagerunner', rarity: 'N', sprite: ['Actor1', 5], weapon: 'blade', title: 'Page Runner',
      profile: 'The courier who carried the Reach\'s last warning up the tower.',
      memory: [
        [['pip', 'Last message of the Reach: "Seal the doors." I ran it up the whole tower. Doors were sealed before I finished!'],
         ['iri', 'And the message?'], ['pip', '...Delivered. Always delivered.']],
        [['pip', 'I never opened the letters I carried. But the last one had my name on it. It only said "Thank you."']]] },
    { key: 'marla', name: 'Marla', cls: 'scrivener', rarity: 'R', sprite: ['Actor1', 1], weapon: 'staff', title: 'Scrivener',
      profile: 'Copied prayers for the sick of Lantern Reach. Believes care, not words, heals.',
      memory: [
        [['marla', 'I copied prayers for the sick. Cramped hands, ink everywhere. They said the words don\'t heal; the care does.'],
         ['iri', 'Then why write the prayers?'], ['marla', 'Because someone has to write the care down, dear.']],
        [['marla', 'I always left one margin blank. For the person who\'d need it later. Looks like that\'s you.']]] },
    { key: 'doran', name: 'Doran', cls: 'ledgerguard', rarity: 'R', sprite: ['Actor1', 2], weapon: 'blade', title: 'Ledger Guard',
      profile: 'Sergeant of the Ledger Guard. Grumbles that books are people.',
      memory: [
        [['doran', 'Sergeant Doran, Ledger Guard. My captain said I guard the books, not the people. Wrong. Books ARE people.']],
        [['doran', 'Every name in that ledger had a face I walked past once. This time I intend to walk with them.']]] },
    { key: 'fenn', name: 'Fenn', cls: 'quillshot', rarity: 'R', sprite: ['Actor1', 3], weapon: 'bow', title: 'Quillshot',
      profile: 'Never missed a mark. Now cannot remember what she was aiming at.',
      memory: [
        [['fenn', 'They called me Quillshot. Never missed a line, never missed a mark. Now I can\'t recall who I was aiming at.']],
        [['fenn', 'I remember now. Not a target. A boy on the stairs holding a lamp. I was aiming past him, at what was behind.'],
         ['iri', 'Wick...'], ['fenn', 'I hit what was behind. He kept his light.']]] },
    { key: 'sera', name: 'Sera', cls: 'inkmage', rarity: 'SR', sprite: ['Actor2', 0], weapon: 'tome', title: 'Ink Mage',
      profile: 'Banned for burning down a reading room. Insists the result was very clean.',
      memory: [
        [['sera', 'They banned ink-fire in the Archive. "Too volatile." So I lit the whole reading room. Learned a lot.'],
         ['iri', 'That\'s... concerning.'], ['sera', 'Result: a very clean reading room.']],
        [['sera', 'The Hollow hates fire. Not because it burns. Because fire makes light, and light makes shadows with edges. It can\'t erase what has an edge.']]] },
    { key: 'tobias', name: 'Tobias', cls: 'bellringer', rarity: 'SR', sprite: ['Actor2', 1], weapon: 'staff', title: 'Bellringer',
      profile: 'Rang the Reach\'s bells: wake, work, sleep, danger.',
      memory: [
        [['tobias', 'I rang the bells for the Reach. Wake, work, sleep, danger. The last I rang was danger, and I kept ringing until my hands bled.']],
        [['tobias', 'That bell is still ringing, Archivist. Faint, under everything. That\'s what the Archive is: a bell nobody finished ringing.']]] },
    { key: 'kael', name: 'Kael', cls: 'marginduelist', rarity: 'SR', sprite: ['Actor2', 2], weapon: 'blade', title: 'Duelist of the Margins',
      profile: 'Fights where the story does not look: the edge of the page.',
      memory: [
        [['kael', 'I fight in the margins. The edge of the page. Nobody writes the margins. Nobody erases them, either.']],
        [['kael', 'I never won the duel that mattered. But I\'m still in the margins. That counts for something.']]] },
    { key: 'isolde', name: 'Isolde', cls: 'cartographer', rarity: 'SSR', sprite: ['Actor2', 3], weapon: 'staff', title: 'The Last Cartographer',
      profile: 'Mapped every cove of the Reach. Her maps all have a blank in the middle.',
      memory: [
        [['isolde', 'I mapped every cove and reef of the Reach. Then the Hollow came and my map had holes. You can\'t fill a hole by drawing it, Archivist. You fill it by going there.']],
        [['isolde', 'Every map I drew had a blank in the middle. I always blamed missing data. It wasn\'t. It was a door.'],
         ['quill', 'A door to where?'], ['isolde', 'The Inkwell. It was always the Inkwell.']]] },
    { key: 'brannock', name: 'Brannock', cls: 'chapterwall', rarity: 'SSR', sprite: ['Actor2', 4], weapon: 'spear', title: 'Wall of Chapters',
      profile: 'Held the door of the Great Library for nine days.',
      memory: [
        [['brannock', 'I stood in the door of the Great Library for nine days. I only left when the last page was out.']],
        [['brannock', 'They tell me the door never fell. I would like that to be true.'], ['iri', 'It is. I walked through it.']]] },
    { key: 'aurelian', name: 'Aurelian', cls: 'firstarchivist', rarity: 'UR', sprite: ['Actor3', 0], weapon: 'tome', title: 'First Archivist',
      profile: 'Wrote the first name in the first book. Sealed himself inside the Archive to keep it open.',
      memory: [
        [['aurelian', 'I am Aurelian. I wrote the first name in the first book, the day I understood names were all we\'d ever leave behind.'],
         ['aurelian', 'You hold my key, child. Treat it as a pen, not a sword.']],
        [['aurelian', 'I sealed myself in the Archive to keep it open. The Hollow is no invader. It is what we chose to forget. And it is hungry.'],
         ['iri', 'What did we forget?'], ['aurelian', 'Ask me again when you can bear the answer.']]] },
    { key: 'nyx', name: 'Nyx', cls: 'unwritten', rarity: 'UR', sprite: ['Actor3', 1], weapon: 'tome', title: 'Echo of the Unwritten',
      profile: 'The space between the lines. Remembers being a name once.',
      memory: [
        [['nyx', 'You can hear me? How rare. I am no one, Archivist. I am the space between the lines.'],
         ['nyx', 'Don\'t flinch. I only erase what you\'ve already stopped reading.']],
        [['nyx', 'The Archive did not forget me by accident. Someone decided. Ask your First Archivist why his was the one name he never wrote.'],
         ['aurelian', '...']]] }
];

module.exports = { skills: skills, classes: classes, heroes: heroes, RARITY_MUL: RARITY_MUL, ICON: ICON };
