// System.json for the game. A complete file is generated (so the repo works on its own), and
// tools/install.js can instead merge just PATCH_KEYS into an existing project's System.json.
'use strict';
var ids = require('./ids');

var PATCH_KEYS = ['gameTitle', 'startMapId', 'startX', 'startY', 'partyMembers', 'currencyUnit', 'elements', 'skillTypes', 'weaponTypes', 'armorTypes',
                  'equipTypes', 'attackMotions', 'switches', 'variables', 'title1Name', 'title2Name', 'optExtraExp', 'optDisplayTp', 'optFollowers',
                  'magicSkills', 'menuCommands', 'battleback1Name', 'battleback2Name'];

function audio(name, vol) { return { name: name, pan: 0, pitch: 100, volume: vol === undefined ? 90 : vol }; }

function names(map, count) {
    var out = [''], i;
    for (i = 1; i <= count; i++) { out.push(map[i] ? map[i].replace(/_/g, ' ').toLowerCase().replace(/(^| )(\w)/g, function(m, a, b) { return a + b.toUpperCase(); }) : ''); }
    return out;
}

function build() {
    var sounds = ['Cursor2', 'Decision1', 'Cancel2', 'Buzzer1', 'Equip1', 'Save', 'Load', 'Battle1', 'Run', 'Attack3', 'Damage4', 'Collapse1', 'Collapse2',
                  'Collapse3', 'Damage5', 'Collapse4', 'Recovery', 'Miss', 'Evasion1', 'Evasion2', 'Reflection', 'Shop1', 'Item3', 'Item3'].map(function(n) { return audio(n); });
    var motions = [{ type: 0, weaponImageId: 0 }, { type: 1, weaponImageId: 2 }, { type: 0, weaponImageId: 12 }, { type: 2, weaponImageId: 7 },
                   { type: 1, weaponImageId: 6 }, { type: 1, weaponImageId: 0 }];
    return {
        airship: { bgm: audio('Ship3'), characterIndex: 3, characterName: 'Vehicle', startMapId: 0, startX: 0, startY: 0 },
        armorTypes: ['', 'Armor', 'Robe', 'Shield', 'Headgear', 'Charm'],
        attackMotions: motions,
        battleBgm: audio(ids.AUDIO.bgmBattle), battleback1Name: 'StacksFloor', battleback2Name: 'StacksWall', battlerHue: 0, battlerName: '',
        boat: { bgm: audio('Ship1'), characterIndex: 0, characterName: 'Vehicle', startMapId: 0, startX: 0, startY: 0 },
        currencyUnit: 'G',
        defeatMe: audio('Defeat1'), editMapId: 1, elements: ids.ELEMENT_NAMES.slice(),
        equipTypes: ['', 'Weapon', 'Shield', 'Head', 'Body', 'Accessory'],
        gameTitle: 'Echoes of the Sundered Archive', gameoverMe: audio('Gameover1'), locale: 'en_US', magicSkills: [1],
        menuCommands: [true, true, true, true, true, true],
        optDisplayTp: true, optDrawTitle: true, optExtraExp: true, optFloorDamage: true, optFollowers: true, optSideView: true, optSlipDeath: false,
        optTransparent: false, partyMembers: [1],
        ship: { bgm: audio('Ship2'), characterIndex: 1, characterName: 'Vehicle', startMapId: 0, startX: 0, startY: 0 },
        skillTypes: ['', 'Arts', 'Burst'],
        sounds: sounds,
        startMapId: ids.MAP.PROLOGUE, startX: 3, startY: 7,
        switches: names(ids.SWITCH_NAMES, 40), terms: {
            basic: ['Level', 'Lv', 'HP', 'HP', 'MP', 'MP', 'TP', 'TP'],
            commands: ['Fight', 'Escape', 'Attack', 'Guard', 'Item', 'Skill', 'Equip', 'Status', 'Formation', 'Save', 'Game End', 'Options', 'Weapon', 'Armor',
                       'Key Item', 'Equip', 'Optimize', 'Clear', 'New Game', 'Continue', null, 'To Title', 'Cancel', null, 'Buy', 'Sell'],
            params: ['Max HP', 'Max MP', 'Attack', 'Defense', 'M.Attack', 'M.Defense', 'Agility', 'Luck', 'Hit', 'Evasion'],
            messages: {
                actionFailure: 'There was no effect on %1!', actorDamage: '%1 took %2 damage!', actorDrain: '%1 was drained of %2 %3!',
                actorGain: '%1 gained %2 %3!', actorLoss: '%1 lost %2 %3!', actorNoDamage: '%1 took no damage!', actorNoHit: 'Miss! %1 took no damage!',
                actorRecovery: '%1 recovered %2 %3!', alwaysDash: 'Always Dash', bgmVolume: 'BGM Volume', bgsVolume: 'BGS Volume',
                buffAdd: '%1\'s %2 went up!', buffRemove: '%1\'s %2 returned to normal!', commandRemember: 'Command Remember',
                counterAttack: '%1 counterattacked!', criticalToActor: 'A painful blow!!', criticalToEnemy: 'An excellent hit!!',
                debuffAdd: '%1\'s %2 went down!', defeat: '%1 was defeated.', emerge: '%1 emerged!', enemyDamage: '%1 took %2 damage!',
                enemyDrain: '%1 was drained of %2 %3!', enemyGain: '%1 gained %2 %3!', enemyLoss: '%1 lost %2 %3!', enemyNoDamage: '%1 took no damage!',
                enemyNoHit: 'Miss! %1 took no damage!', enemyRecovery: '%1 recovered %2 %3!', escapeFailure: 'However, it was unable to escape!',
                escapeStart: '%1 has started to escape!', evasion: '%1 evaded the attack!', expNext: 'To Next %1', expTotal: 'Current %1', file: 'File',
                levelUp: '%1 is now %2 %3!', loadMessage: 'Load which file?', magicEvasion: '%1 nullified the magic!', magicReflection: '%1 reflected the magic!',
                meVolume: 'ME Volume', obtainExp: '%1 %2 received!', obtainGold: '%1\\G found!', obtainItem: '%1 found!', obtainSkill: '%1 learned!',
                partyName: '%1\'s Party', possession: 'Possession', preemptive: '%1 got the upper hand!', saveMessage: 'Save to which file?',
                seVolume: 'SE Volume', substitute: '%1 protected %2!', surprise: '%1 was surprised!', useItem: '%1 uses %2!', victory: '%1 was victorious!'
            }
        },
        testBattlers: [{ actorId: 1, equips: [1, 0, 0, 0, 0], level: 1 }], testTroopId: 1, title1Name: 'EchoesTitle', title2Name: '',
        titleBgm: audio('Theme1'), variables: names(ids.VARIABLE_NAMES, 40), versionId: 20261004, victoryMe: audio('Victory1'), weaponTypes: ['', 'Blade', 'Spear', 'Bow', 'Staff', 'Tome'],
        windowTone: [0, 0, 0]
    };
}

module.exports = { build: build, PATCH_KEYS: PATCH_KEYS };
