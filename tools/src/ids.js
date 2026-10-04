// Shared constants: element ids, switch/variable ids, audio names. Everything the maps, events,
// plugins and the validator must agree on lives here.
'use strict';

var ELEMENT = { physical: 1, flame: 2, frost: 3, gale: 4, lumen: 5, hollow: 6 };
var ELEMENT_NAMES = ['', 'Physical', 'Flame', 'Frost', 'Gale', 'Lumen', 'Hollow'];

var SWITCH = {
    PROLOGUE_DONE: 1, FIRST_SUMMON_DONE: 2, STACKS_OPEN: 3, STACKS_BOSS_DONE: 4, INK_OPEN: 5,
    INK_BOSS_DONE: 6, SLICE_COMPLETE: 7, QUILL_INTRO: 8, BANNER_AURELIAN: 10, BANNER_NYX: 11,
    FORGE_UNLOCKED: 12, DESK_UNLOCKED: 13, SHRINE_UNLOCKED: 14, LEVER_STACKS: 20, LEVER_INK: 21
};
var SWITCH_NAMES = {};
Object.keys(SWITCH).forEach(function(k) { SWITCH_NAMES[SWITCH[k]] = k; });

var VARIABLE = {
    SHARDS: 1, CHAPTER: 2, TEMP: 3, TEMP2: 4, PULL_RESULT: 5,
    // display values for hall menus
    SHOW_A: 11, SHOW_B: 12, SHOW_C: 13, SHOW_D: 14, SHOW_E: 15
};
var VARIABLE_NAMES = {};
Object.keys(VARIABLE).forEach(function(k) { VARIABLE_NAMES[VARIABLE[k]] = k; });

// Audio: only file names that ship with the stock MV resource pack. Change here if one is missing.
var AUDIO = {
    bgmHall: 'Theme1', bgmStacks: 'Dungeon1', bgmInk: 'Dungeon3', bgmBattle: 'Battle1', bgmBoss: 'Battle3',
    bgmPrologue: 'Dungeon2', bgmQuiet: 'Theme3',
    seDoor: 'Open1', seChest: 'Chest1', seCursor: 'Cursor1', seHeal: 'Heal1', seSave: 'Save',
    seFlash: 'Thunder1', seTeleport: 'Teleport', sePower: 'Powerup', seBuzzer: 'Buzzer1'
};

var MAP = { HALL: 1, PROLOGUE: 2, STACKS1: 3, STACKS2: 4, INK1: 5, INK2: 6 };

// hero / actor ids
var ACTOR = {
    iri: 1, wick: 2, pip: 3, marla: 4, doran: 5, fenn: 6, sera: 7, tobias: 8, kael: 9,
    isolde: 10, brannock: 11, aurelian: 12, nyx: 13
};

module.exports = {
    ELEMENT: ELEMENT, ELEMENT_NAMES: ELEMENT_NAMES, SWITCH: SWITCH, SWITCH_NAMES: SWITCH_NAMES,
    VARIABLE: VARIABLE, VARIABLE_NAMES: VARIABLE_NAMES, AUDIO: AUDIO, MAP: MAP, ACTOR: ACTOR
};
