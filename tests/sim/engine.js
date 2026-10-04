// A minimal re-creation of the parts of the RPG Maker MV runtime that the game's plugins and events use.
// The interpreter mirrors rpg_objects.js (Game_Interpreter) for the commands the game emits, including its
// branch / loop / choice skipping rules, so event data is exercised the same way the engine would run it.
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var root = path.join(__dirname, '..', '..');

var G = global;

function readData(name) { return JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8')); }
function extractMeta(o) {
    if (!o || typeof o.note !== 'string') { return; }
    o.meta = {};
    var re = /<([^<>:]+)(:?)([^>]*)>/g, m;
    while ((m = re.exec(o.note))) { o.meta[m[1]] = m[2] === ':' ? m[3] : true; }
}

// ---- stubs for classes the plugins subclass or alias -------------------------------------------------
['Window_Base', 'Window_Selectable', 'Window_Command', 'Window_HorzCommand', 'Window_MenuCommand', 'Scene_MenuBase', 'Scene_Menu', 'Sprite', 'Bitmap']
    .forEach(function(n) { G[n] = function() {}; });
Window_MenuCommand.prototype.addOriginalCommands = function() {};
Scene_Menu.prototype.createCommandWindow = function() {};

G.Game_System = function() {};
G.Game_Actor = function(id) { this.setup(id); };
Game_Actor.prototype.setup = function(id) {
    this._actorId = id; this._level = $dataActors[id].initialLevel; this._skills = []; this._nickname = '';
    var cls = $dataClasses[$dataActors[id].classId];
    cls.learnings.forEach(function(l) { if (l.level <= 1) { this.learnSkill(l.skillId); } }, this);
    this._hp = this.mhp;
};
Game_Actor.prototype.actorId = function() { return this._actorId; };
Game_Actor.prototype.name = function() { return $dataActors[this._actorId].name; };
Object.defineProperty(Game_Actor.prototype, 'level', { get: function() { return this._level; } });
Game_Actor.prototype.learnSkill = function(id) { if (this._skills.indexOf(id) < 0) { this._skills.push(id); } };
Game_Actor.prototype.isLearnedSkill = function(id) { return this._skills.indexOf(id) >= 0; };
Game_Actor.prototype.setNickname = function(n) { this._nickname = n; };
Game_Actor.prototype.refresh = function() {};
Game_Actor.prototype.skills = function() { return this._skills.map(function(id) { return $dataSkills[id]; }); };
Game_Actor.prototype.addedSkillTypes = function() { return [1]; };
Game_Actor.prototype.recoverAll = function() { this._hp = this.mhp; };
Game_Actor.prototype.changeLevel = function(level) {
    this._level = level;
    var cls = $dataClasses[$dataActors[this._actorId].classId];
    cls.learnings.forEach(function(l) { if (l.level <= level) { this.learnSkill(l.skillId); } }, this);
};
Game_Actor.prototype.traitObjects = function() { return [$dataActors[this._actorId], $dataClasses[$dataActors[this._actorId].classId]]; };
Game_Actor.prototype.param = function(p) {
    var cls = $dataClasses[$dataActors[this._actorId].classId], v = cls.params[p][this._level], rate = 1;
    this.traitObjects().forEach(function(o) { o.traits.forEach(function(t) { if (t.code === 21 && t.dataId === p) { rate *= t.value; } }); });
    return Math.floor(v * rate);
};
Object.defineProperty(Game_Actor.prototype, 'mhp', { get: function() { return this.param(0); } });

G.Game_Actors = function() { this._data = []; };
Game_Actors.prototype.actor = function(id) {
    if (!$dataActors[id]) { return null; }
    if (!this._data[id]) { this._data[id] = new Game_Actor(id); }
    return this._data[id];
};

G.Game_Troop = function() { this._enemies = []; };
Game_Troop.prototype.deadMembers = function() { return this._enemies.filter(function(e) { return e.dead; }); };

G.BattleManager = {
    makeRewards: function() { this._rewards = { gold: 0 }; $gameTroop.deadMembers().forEach(function(e) { this._rewards.gold += $dataEnemies[e.enemyId()].gold; }, this); },
    displayRewards: function() { $gameMessage.add('rewards displayed'); },
    gainRewards: function() { $gameParty.gainGold(this._rewards.gold); },
    processVictory: function() { this.makeRewards(); this.displayRewards(); this.gainRewards(); }
};
G.DataManager = { isDatabaseLoaded: function() { return true; }, extractSaveContents: function() {}, setupNewGame: function() {} };
G.TextManager = { currencyUnit: 'G' };
G.AudioManager = { playSe: function() {} };
G.SceneManager = { pushed: [], push: function(s) { this.pushed.push(s); if (this.onPush) { this.onPush(s); } } };
G.PluginManager = { parameters: function(name) { return (G.$pluginParams && G.$pluginParams[name]) || {}; } };

// ---- game objects ----------------------------------------------------------------------------------
function Store() { this._d = {}; }
Store.prototype.value = function(i) { return this._d[i] || (this._d === undefined ? 0 : (typeof this._d[i] === 'boolean' ? false : 0)); };
G.Game_Switches = function() { this._d = {}; };
Game_Switches.prototype.value = function(i) { return !!this._d[i]; };
Game_Switches.prototype.setValue = function(i, v) { this._d[i] = !!v; };
G.Game_Variables = function() { this._d = {}; };
Game_Variables.prototype.value = function(i) { return this._d[i] || 0; };
Game_Variables.prototype.setValue = function(i, v) { this._d[i] = v; };

G.Game_Party = function() { this._actors = []; this._gold = 0; this._items = {}; };
Game_Party.prototype.members = function() { return this._actors.map(function(id) { return $gameActors.actor(id); }); };
Game_Party.prototype.battleMembers = function() { return this.members().slice(0, 4); };
Game_Party.prototype.addActor = function(id) { if (this._actors.indexOf(id) < 0) { this._actors.push(id); } };
Game_Party.prototype.gold = function() { return this._gold; };
Game_Party.prototype.gainGold = function(n) { this._gold = Math.max(0, this._gold + n); };
Game_Party.prototype.loseGold = function(n) { this.gainGold(-n); };
function key(item) {
    if ($dataItems[item.id] === item) { return 'i' + item.id; }
    if ($dataWeapons[item.id] === item) { return 'w' + item.id; }
    if ($dataArmors[item.id] === item) { return 'a' + item.id; }
    throw new Error('unknown item object');
}
Game_Party.prototype.numItems = function(item) { return this._items[key(item)] || 0; };
Game_Party.prototype.gainItem = function(item, n) { this._items[key(item)] = Math.max(0, (this._items[key(item)] || 0) + n); };
Game_Party.prototype.loseItem = function(item, n) { this.gainItem(item, -n); };

G.Game_Message = function() { this.log = []; this._choices = null; };
Game_Message.prototype.setFaceImage = function() {};
Game_Message.prototype.setBackground = function() {};
Game_Message.prototype.setPositionType = function() {};
Game_Message.prototype.add = function(t) { this.log.push(t); SIM.texts.push({ face: '', lines: [t], dynamic: true, event: SIM.current.event, map: SIM.current.map }); };
Game_Message.prototype.setChoices = function(c) { this._choices = c; };
Game_Message.prototype.setChoiceBackground = function() {};
Game_Message.prototype.setChoicePositionType = function() {};
Game_Message.prototype.setChoiceCallback = function(cb) { this._cb = cb; };

// ---- interpreter -----------------------------------------------------------------------------------
G.Game_Interpreter = function(depth) { this._depth = depth || 0; this._list = null; this._index = 0; this._branch = {}; this._eventId = 0; this._indent = 0; this._steps = 0; };
Game_Interpreter.prototype.pluginCommand = function() {};
Game_Interpreter.prototype.eventId = function() { return this._eventId; };
Game_Interpreter.prototype.setWaitMode = function() {
    // a script-driven choice (Hall.pickHero etc.) resolves here, like the message window would
    if ($gameMessage._choices) {
        var labels = $gameMessage._choices, cb = $gameMessage._cb;
        $gameMessage._choices = null;
        var n = SIM.choose ? SIM.choose(labels, SIM.current) : labels.length - 1;
        if (cb) { cb(n); }
    }
};
Game_Interpreter.prototype.setupChild = function(list, eventId) { var c = new Game_Interpreter(this._depth + 1); c.run(list, eventId, this._sim); };

// harness hooks (set by the test): choose(labels, context) -> index, onBattle(troopId) -> 0 win /1 escape /2 lose, onTransfer(...)
var SIM = G.SIM = { texts: [], transfers: [], battles: [], shops: [], saves: 0, selfSwitches: {}, current: { map: 0, event: 0 }, choose: null, onBattle: null, steps: 0 };

Game_Interpreter.prototype.run = function(list, eventId) {
    this._list = list; this._index = 0; this._eventId = eventId || 0; this._branch = {}; this._indent = 0;
    while (this._index < this._list.length) {
        this._steps++;
        if (++SIM.steps > 200000) { throw new Error('event ran too long (infinite loop?)'); }
        var c = this._list[this._index];
        if (!c) { break; }
        this._indent = c.indent; this._params = c.parameters;
        var m = this['command' + c.code];
        if (typeof m === 'function') {
            if (m.call(this) === 'stop') { return; }
        } else if (!SIM.ignore[c.code]) {
            throw new Error('interpreter stub: unhandled command ' + c.code + ' at index ' + this._index);
        }
        this._index++;
    }
};
SIM.ignore = {};
[0, 401, 402, 404, 403, 411, 412, 413, 601, 602, 603, 604, 605, 108, 408, 505, 655, 205, 211, 212, 213, 214, 216, 221, 222, 223, 224, 225, 230, 241, 242, 245, 246, 249, 250, 132, 133, 134, 135, 136, 281, 282, 203, 314, 125, 126, 127, 128, 129, 121, 122, 123, 118, 115, 117, 112, 113, 301, 302, 352, 353, 355, 356, 101, 102, 111, 201, 119]
    .forEach(function(c) { SIM.ignore[c] = true; });

function skipBranch(it) { while (it._list[it._index + 1] && it._list[it._index + 1].indent > it._indent) { it._index++; } }
var P = Game_Interpreter.prototype;
P.command101 = function() {
    var lines = [], who = this._params[0] || '';
    var i = this._index + 1;
    while (this._list[i] && this._list[i].code === 401) { lines.push(this._list[i].parameters[0]); i++; }
    SIM.texts.push({ face: who, lines: lines, event: SIM.current.event, map: SIM.current.map });
    this._index = i - 1;
};
P.command102 = function() {
    var labels = this._params[0], n;
    n = SIM.choose ? SIM.choose(labels, SIM.current) : 0;
    if (typeof n !== 'number' || n < 0 || n >= labels.length) { throw new Error('bad choice ' + n + ' for ' + JSON.stringify(labels)); }
    this._branch[this._indent] = n;
};
P.command402 = function() { if (this._branch[this._indent] !== this._params[0]) { skipBranch(this); } };
P.command111 = function() {
    var p = this._params, r = false;
    switch (p[0]) {
    case 0: r = $gameSwitches.value(p[1]) === (p[2] === 0); break;
    case 1: {
        var a = $gameVariables.value(p[1]), b = p[2] === 0 ? p[3] : $gameVariables.value(p[3]);
        r = [a === b, a >= b, a <= b, a > b, a < b, a !== b][p[4]]; break;
    }
    case 2: r = !!SIM.selfSwitches[SIM.current.map + ',' + this._eventId + ',' + p[1]] === (p[2] === 0); break;
    case 4: r = $gameParty._actors.indexOf(p[1]) >= 0; break;
    case 7: r = [$gameParty.gold() >= p[1], $gameParty.gold() <= p[1], $gameParty.gold() < p[1]][p[2]]; break;
    case 8: r = $gameParty.numItems(withType($dataItems, p[1], 'i')) > 0; break;
    case 12: r = !!evalScript(this, p[1]); break;
    default: throw new Error('unhandled condition type ' + p[0]);
    }
    this._branch[this._indent] = r;
    if (!r) { skipBranch(this); }
};
P.command411 = function() { if (this._branch[this._indent] !== false) { skipBranch(this); } };
P.command112 = function() {};
P.command413 = function() { do { this._index--; } while (!(this._list[this._index].code === 112 && this._list[this._index].indent === this._indent)); };
P.command113 = function() {
    var depth = 0;
    while (this._index < this._list.length - 1) {
        this._index++;
        var c = this._list[this._index];
        if (c.code === 112) { depth++; }
        if (c.code === 413) { if (depth > 0) { depth--; } else { return; } }
    }
};
P.command115 = function() { this._index = this._list.length; };
P.command117 = function() { var ce = $dataCommonEvents[this._params[0]]; if (!ce) { throw new Error('no common event ' + this._params[0]); } new Game_Interpreter(this._depth + 1).run(ce.list, this._eventId); };
P.command121 = function() { for (var i = this._params[0]; i <= this._params[1]; i++) { $gameSwitches.setValue(i, this._params[2] === 0); } };
P.command122 = function() {
    var p = this._params, v, i;
    switch (p[3]) {
    case 0: v = p[4]; break;
    case 1: v = $gameVariables.value(p[4]); break;
    case 2: v = p[4] + Math.floor(Math.random() * (p[5] - p[4] + 1)); break;
    case 4: v = evalScript(this, p[4]); break;
    default: throw new Error('unhandled variable operand');
    }
    for (i = p[0]; i <= p[1]; i++) {
        var cur = $gameVariables.value(i);
        $gameVariables.setValue(i, [v, cur + v, cur - v, cur * v, Math.floor(cur / v), cur % v][p[2]]);
    }
};
P.command123 = function() { SIM.selfSwitches[SIM.current.map + ',' + this._eventId + ',' + this._params[0]] = this._params[1] === 0; };
P.command125 = function() { var n = this._params[2]; $gameParty.gainGold(this._params[0] === 0 ? n : -n); };
function withType(table, id) { return table[id]; }
P.command126 = function() { $gameParty.gainItem(withType($dataItems, this._params[0], 'i'), this._params[1] === 0 ? this._params[3] : -this._params[3]); };
P.command127 = function() { $gameParty.gainItem(withType($dataWeapons, this._params[0], 'w'), this._params[1] === 0 ? this._params[3] : -this._params[3]); };
P.command128 = function() { $gameParty.gainItem(withType($dataArmors, this._params[0], 'a'), this._params[1] === 0 ? this._params[3] : -this._params[3]); };
P.command129 = function() { if (this._params[1] === 0) { $gameParty.addActor(this._params[0]); } };
P.command201 = function() { SIM.transfers.push({ map: this._params[1], x: this._params[2], y: this._params[3] }); SIM.current = { map: this._params[1], event: 0 }; };
P.command301 = function() {
    var troop = this._params[1];
    SIM.battles.push(troop);
    var result = SIM.onBattle ? SIM.onBattle(troop, this._params) : 0;
    // simulate the victory flow of the real BattleManager when the party wins
    if (result === 0) {
        var t = $dataTroops[troop];
        $gameTroop._enemies = t.members.filter(function(m) { return !m.hidden; }).map(function(m) { return { dead: true, enemyId: function() { return m.enemyId; }, enemy: function() { return $dataEnemies[m.enemyId]; } }; });
        BattleManager.processVictory();
        BattleManager.makeRewards(); BattleManager.gainRewards();
    }
    this._branch[this._indent] = result;
};
P.command601 = function() { if (this._branch[this._indent] !== 0) { skipBranch(this); } };
P.command602 = function() { if (this._branch[this._indent] !== 1) { skipBranch(this); } };
P.command603 = function() { if (this._branch[this._indent] !== 2) { skipBranch(this); } };
P.command302 = function() { var goods = [this._params], i = this._index + 1; while (this._list[i] && this._list[i].code === 605) { goods.push(this._list[i].parameters); i++; } SIM.shops.push(goods); this._index = i - 1; };
P.command314 = function() { $gameParty.members().forEach(function(a) { a.recoverAll(); }); };
P.command352 = function() { SIM.saves++; };
P.command353 = function() { SIM.gameOver = true; };
P.command355 = function() {
    var js = this._params[0], i = this._index + 1;
    while (this._list[i] && this._list[i].code === 655) { js += '\n' + this._list[i].parameters[0]; i++; }
    this._index = i - 1;
    evalScript(this, js);
};
P.command356 = function() { var args = this._params[0].split(' '), cmd = args.shift(); this.pluginCommand(cmd, args); };
P.command205 = function() { var i = this._index + 1; while (this._list[i] && this._list[i].code === 505) { i++; } this._index = i - 1; };
P.command108 = function() { var i = this._index + 1; while (this._list[i] && this._list[i].code === 408) { i++; } this._index = i - 1; };

function evalScript(interp, js) {
    var fn = new Function('$gameVariables', '$gameSwitches', '$gameParty', '$gameSystem', '$gameMessage', '$dataItems', 'Hall', 'Echoes', 'Gacha', '$gameActors', 'return (function(){ ' + (/\breturn\b/.test(js) || /;\s*$|\n/.test(js) ? '' : 'return ') + js + '\n}).call(this);');
    return fn.call(interp, $gameVariables, $gameSwitches, $gameParty, $gameSystem, $gameMessage, $dataItems, G.Hall, G.Echoes, G.Gacha, $gameActors);
}

// ---- setup ------------------------------------------------------------------------------------------
function load(file) { var p = path.join(root, 'js', 'plugins', file); vm.runInThisContext(fs.readFileSync(p, 'utf8'), { filename: p }); }

function boot() {
    ['Actors', 'Classes', 'Skills', 'Items', 'Weapons', 'Armors', 'Enemies', 'Troops', 'States', 'CommonEvents'].forEach(function(n) { G['$data' + n] = readData(n); });
    ['Actors', 'Classes', 'Skills', 'Items', 'Weapons', 'Armors', 'Enemies', 'States'].forEach(function(n) { G['$data' + n].forEach(extractMeta); });
    G.$dataAnimations = [null, { id: 1, name: 'Hit Physical' }, { id: 2, name: 'Fire 1' }, { id: 3, name: 'Heal 1' }];
    G.$dataSystem = readData('System');
    // plugin parameters from plugins.js
    var src = fs.readFileSync(path.join(root, 'js', 'plugins.js'), 'utf8');
    var list = new Function(src + '; return $plugins;')();
    G.$pluginParams = {};
    list.forEach(function(p) { G.$pluginParams[p.name] = p.parameters; });
    list.forEach(function(p) { load(p.name + '.js'); });
    SIM.newGame();
}

SIM.newGame = function() {
    G.$gameSystem = new Game_System();
    G.$gameActors = new Game_Actors();
    G.$gameParty = new Game_Party();
    G.$gameSwitches = new Game_Switches();
    G.$gameVariables = new Game_Variables();
    G.$gameMessage = new Game_Message();
    G.$gameTroop = new Game_Troop();
    G.$dataSystem.partyMembers.forEach(function(id) { $gameParty.addActor(id); });
    // the Game_Actor.setup alias runs on creation; make sure party members exist
    $gameParty.members();
    SIM.texts.length = 0; SIM.transfers.length = 0; SIM.battles.length = 0; SIM.shops.length = 0; SIM.selfSwitches = {};
    SIM.gameOver = false; SIM.saves = 0; SIM.steps = 0;
    Gacha.revision++;
};

// run an event page chosen like the engine does (last page whose conditions are met)
var mapCache = {};
SIM.map = function(id) { return mapCache[id] || (mapCache[id] = readData('Map' + ('00' + id).slice(-3))); };
function pageMeets(page, mapId, eventId) {
    var c = page.conditions;
    if (c.switch1Valid && !$gameSwitches.value(c.switch1Id)) { return false; }
    if (c.switch2Valid && !$gameSwitches.value(c.switch2Id)) { return false; }
    if (c.variableValid && $gameVariables.value(c.variableId) < c.variableValue) { return false; }
    if (c.selfSwitchValid && !SIM.selfSwitches[mapId + ',' + eventId + ',' + c.selfSwitchCh]) { return false; }
    if (c.actorValid && $gameParty._actors.indexOf(c.actorId) < 0) { return false; }
    if (c.itemValid && !$gameParty.numItems(withType($dataItems, c.itemId, 'i'))) { return false; }
    return true;
}
SIM.activePage = function(mapId, ev) {
    var pages = ev.pages;
    for (var i = pages.length - 1; i >= 0; i--) { if (pageMeets(pages[i], mapId, ev.id)) { return pages[i]; } }
    return null;
};
SIM.findEvent = function(mapId, name, nth) {
    var m = SIM.map(mapId), n = 0, found = null;
    m.events.forEach(function(e) { if (e && e.name === name) { if (n++ === (nth || 0)) { found = e; } } });
    if (!found) { throw new Error('no event "' + name + '" on map ' + mapId); }
    return found;
};
// trigger an event the way the player would (action / touch / autorun all just run the active page)
SIM.trigger = function(mapId, name, nth) {
    var ev = SIM.findEvent(mapId, name, nth), page = SIM.activePage(mapId, ev);
    if (!page || !page.list || page.list.length <= 1) { return false; }
    SIM.current = { map: mapId, event: ev.id };
    new Game_Interpreter().run(page.list, ev.id);
    return true;
};

SIM.boot = boot;
module.exports = SIM;
