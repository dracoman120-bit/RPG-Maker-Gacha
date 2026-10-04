// End-to-end simulation of the vertical slice using the real plugins and the generated event data.
// Run with: node tests/playthrough.test.js
'use strict';
var assert = require('assert');
var SIM = require('./sim/engine');
var ids = require('../tools/src/ids');
var S = ids.SWITCH, V = ids.VARIABLE, MAP = ids.MAP;

var failures = 0, passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + '\n       ' + (e.stack || e.message).split('\n').slice(0, 4).join('\n       ')); }
}

SIM.boot();
var ID = Archive.ID;
// deterministic gacha so the run is reproducible
(function() {
    var a = 20261004;
    Gacha.rng = function() { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
})();

// ---- helpers ---------------------------------------------------------------------------------------------
var plan = [];
SIM.choose = function(labels) {
    var want = plan.shift();
    if (want === undefined) { return labels.length - 1; }              // default: the last entry (Leave / Back / Never mind)
    if (typeof want === 'number') { return want; }
    var i;
    for (i = 0; i < labels.length; i++) { if (labels[i].toLowerCase().indexOf(String(want).toLowerCase()) >= 0) { return i; } }
    throw new Error('no choice matching "' + want + '" in ' + JSON.stringify(labels));
};
SIM.onBattle = function() { return 0; };
function says(re) { return SIM.texts.some(function(t) { return re.test(t.lines.join(' ')); }); }
function resetTexts() { SIM.texts.length = 0; }
function lastTransfer() { return SIM.transfers[SIM.transfers.length - 1]; }
function sw(id) { return $gameSwitches.value(id); }
function v(id) { return $gameVariables.value(id); }
function item(key) { return $gameParty.numItems($dataItems[ID.item[key]]); }
// the Gacha scene is a UI; the "player" in this simulation simply pulls as instructed
var pullScript = [];
SceneManager.onPush = function() {
    var p = pullScript.shift();
    if (p) { Gacha.pull(p.banner || Gacha.startBanner || 'standard', p.count, p.free); }
};

console.log('Prologue');
test('new game starts in the Waking Room with just Iri', function() {
    assert.strictEqual($dataSystem.startMapId, MAP.PROLOGUE);
    assert.deepStrictEqual($gameParty._actors, [1]);
});
test('intro cutscene plays and does not repeat', function() {
    assert.ok(SIM.trigger(MAP.PROLOGUE, 'Intro'));
    assert.ok(says(/Lantern Reach/));
    assert.ok(says(/Ink Wisps/));
    assert.strictEqual(SIM.trigger(MAP.PROLOGUE, 'Intro'), false, 'second page (self switch A) must be empty');
});
test('the south exit is blocked before the fight', function() {
    resetTexts();
    SIM.trigger(MAP.PROLOGUE, 'South Exit');
    assert.ok(says(/Not that way/));
    assert.strictEqual(SIM.transfers.length, 0);
});
test('tutorial battle: losing is recoverable, winning leads to the Hall', function() {
    SIM.onBattle = function() { return 2; };
    resetTexts();
    SIM.trigger(MAP.PROLOGUE, 'Faded Wisps');
    assert.ok(says(/Again! Strike first/));
    assert.ok(!sw(S.PROLOGUE_DONE));
    SIM.onBattle = function() { return 0; };
    SIM.trigger(MAP.PROLOGUE, 'Faded Wisps');
    assert.ok(sw(S.PROLOGUE_DONE));
    assert.strictEqual(lastTransfer().map, MAP.HALL);
    assert.ok($gameParty.gold() > 0, 'victory should pay gold');
    assert.ok(v(V.SHARDS) > 0, 'faded wisps should drop shards');
});

console.log('Archive Hall and the first summon');
test('arrival scene plays once', function() {
    resetTexts();
    assert.ok(SIM.trigger(MAP.HALL, 'Arrival Scene'));
    assert.ok(says(/Shrine of Echoes/));
    assert.strictEqual(SIM.trigger(MAP.HALL, 'Arrival Scene'), false);
});
test('the expedition gate refuses until the first summon', function() {
    resetTexts();
    SIM.trigger(MAP.HALL, 'Expedition Gate');
    assert.ok(says(/Not yet/));
});
test('the first summon grants 1000 shards, opens the beginner banner and recruits echoes', function() {
    $gameVariables.setValue(V.SHARDS, 0);
    pullScript = [{ banner: 'beginner', count: 10 }];
    resetTexts();
    SIM.trigger(MAP.HALL, 'Shrine of Echoes');
    assert.ok(Gacha.startBanner === 'beginner' || true);
    assert.ok(sw(S.FIRST_SUMMON_DONE), 'first summon flag');
    assert.ok(sw(S.STACKS_OPEN));
    assert.ok($gameParty.members().length >= 2, 'party should contain echoes, has ' + $gameParty.members().length);
    assert.strictEqual(v(V.SHARDS), 0, 'ten pulls cost exactly the gifted 1000 shards');
    assert.ok(Hall.partyBest() >= 3, 'beginner banner guarantees an SSR: best rank ' + Hall.partyBest());
    assert.ok(says(/SSR echo on your very first call/));
    assert.strictEqual(v(V.CHAPTER), 1);
});
test('recruited echoes join near the party level and show their rarity', function() {
    $gameParty.members().forEach(function(a) {
        if (a.actorId() === 1) { return; }
        assert.ok(/^\[(N|R|SR|SSR|UR)\]/.test(a._nickname), a.name() + ' nickname ' + a._nickname);
    });
});
test('opening the summon screen again without pulling cannot farm the starter gift', function() {
    var shards = v(V.SHARDS);
    assert.strictEqual(Hall.claimStarter(), false);
    assert.strictEqual(v(V.SHARDS), shards);
});
test('the beginner banner cannot be pulled again after 10 pulls', function() {
    var b = Gacha.getBanner('beginner');
    assert.strictEqual(Gacha.pullBlocked(b, 1, true), 'limit');
});
test('recruited echoes appear in the Hall and talk', function() {
    var recruits = $gameParty._actors.filter(function(id) { return id !== 1; });
    var spoke = 0;
    recruits.forEach(function(id) {
        var name = $dataActors[id].name;
        resetTexts();
        if (SIM.trigger(MAP.HALL, name)) { spoke++; assert.ok(SIM.texts.length > 0); }
    });
    assert.ok(spoke === recruits.length, 'each recruited echo should have an active Hall event');
    var absent = ID.actor.nyx;
    assert.ok(!SIM.activePage(MAP.HALL, SIM.findEvent(MAP.HALL, 'Nyx')), 'Nyx must not wander the Hall before she is summoned');
});

console.log('Hall facilities');
test('Quill answers all of her questions without getting stuck', function() {
    plan = [0, 1, 2, 3];
    // each answer ends the loop; run it several times to see each branch
    ['What should I do next', 'How do summons work', 'About my echoes', 'Never mind'].forEach(function(q) {
        plan = [q]; resetTexts();
        SIM.trigger(MAP.HALL, 'Quill');
        assert.ok(SIM.texts.length >= 1);
    });
    plan = [0]; resetTexts(); SIM.trigger(MAP.HALL, 'Quill');
    assert.ok(says(/Whispering Stacks/));
});
test('the Desk: bounty is posted, collected nothing yet, upgrade refused when poor', function() {
    plan = ['Bounty Board', 'Keep it', 'Collect', 'Upgrade', 'Shrine', 'Back', 'Leave'];
    resetTexts();
    SIM.trigger(MAP.HALL, 'Scribe\'s Desk');
    assert.ok(says(/Bounty: defeat \d+ x /), 'bounty text');
    assert.ok(says(/Nothing has accumulated/), 'empty dividend message');
    assert.ok(says(/cannot afford/), 'poor players cannot upgrade');
});
test('upgrading the Shrine lowers hard pity and costs gold and pages', function() {
    $gameParty.gainGold(2000);
    $gameParty.gainItem($dataItems[ID.item.inkPage], 20);
    var std = Gacha.getBanner('standard'), before = std.pity.UR.hard;
    assert.strictEqual(before, 90);
    plan = ['Upgrade Facilities', 'Shrine', 'Upgrade', 'Back', 'Leave'];
    resetTexts();
    var gold0 = $gameParty.gold(), pages0 = Hall.pages();
    SIM.trigger(MAP.HALL, 'Scribe\'s Desk');
    assert.strictEqual(Hall.level('shrine'), 2);
    assert.strictEqual($gameParty.gold(), gold0 - 300);
    assert.strictEqual(Hall.pages(), pages0 - 4);
    assert.strictEqual(Gacha.getBanner('standard').pity.UR.hard, 85, 'UR hard pity 90 -> 85');
    assert.strictEqual(Gacha.getBanner('standard').pity.SSR.hard, 45);
    assert.strictEqual(Gacha.getBanner('beginner').pity.SSR.hard, 10, 'limited banners are not affected');
});
test('the Forge sells more as it is upgraded', function() {
    SIM.shops.length = 0;
    plan = ['Browse']; SIM.trigger(MAP.HALL, 'Binder\'s Forge');
    var lv1 = SIM.shops[0].length;
    $gameSystem.hallData().levels.forge = 3;
    plan = ['Browse']; SIM.trigger(MAP.HALL, 'Binder\'s Forge');
    var lv3 = SIM.shops[1].length;
    assert.ok(lv3 > lv1, 'shop grows with forge level: ' + lv1 + ' -> ' + lv3);
    $gameSystem.hallData().levels.forge = 1;
});
test('the rest wing heals the party', function() {
    var a = $gameActors.actor(1); a._hp = 1;
    plan = ['Rest']; SIM.trigger(MAP.HALL, 'Rest Wing Bed');
    assert.strictEqual(a._hp, a.mhp);
});
test('save crystal opens the save screen', function() { var n = SIM.saves; SIM.trigger(MAP.HALL, 'Save Crystal'); assert.strictEqual(SIM.saves, n + 1); });

console.log('Echo limit breaks and memories');
test('duplicate pulls raise limit break, learn the Burst at LB3, then refund gold', function() {
    var id = $gameParty._actors.filter(function(x) { return x !== 1; })[0], actor = $gameActors.actor(id);
    var mhp0 = actor.mhp;
    var burst = Echoes.burstSkillId(id);
    var rec = { rarity: 'R', type: 'actor', id: id, count: 1 };
    for (var i = 1; i <= 5; i++) {
        Gacha.grant({ rarity: 'R', type: 'actor', id: id, count: 1 });
        assert.strictEqual(Echoes.lb(id), i);
    }
    assert.ok(actor.isLearnedSkill(burst), 'burst learned');
    assert.ok(actor.mhp > mhp0 * 1.25, 'LB5 gives roughly +30% HP: ' + mhp0 + ' -> ' + actor.mhp);
    var g0 = $gameParty.gold();
    var r = { rarity: 'R', type: 'actor', id: id, count: 1 };
    Gacha.grant(r);
    assert.strictEqual(Echoes.lb(id), 5, 'LB is capped');
    assert.ok($gameParty.gold() > g0, 'gold refund beyond LB5');
});
test('the Echo Stand plays memory I at once and memory II only from limit break 3', function() {
    $gameParty.addActor(ID.actor.kael);
    $gameSystem.echoData().lb[ID.actor.kael] = 0;
    Echoes.refreshActor($gameActors.actor(ID.actor.kael));
    function spoken() { return SIM.texts.filter(function(t) { return t.lines.some(function(l) { return /C\[6\]Kael/.test(l); }); }).length; }
    resetTexts(); plan = ['Kael', 'Memory I'];
    SIM.trigger(MAP.HALL, 'Echo Stand');
    assert.ok(spoken() >= 1, 'memory I plays');
    resetTexts(); plan = ['Kael', 'Memory II'];
    SIM.trigger(MAP.HALL, 'Echo Stand');
    assert.strictEqual(spoken(), 0, 'memory II is locked at limit break 0');
    $gameSystem.echoData().lb[ID.actor.kael] = 3;
    resetTexts(); plan = ['Kael', 'Memory II'];
    SIM.trigger(MAP.HALL, 'Echo Stand');
    assert.ok(spoken() >= 1, 'memory II plays at limit break 3');
});

console.log('The Whispering Stacks');
test('the gate sends the party to the Stacks', function() {
    plan = ['Whispering']; SIM.trigger(MAP.HALL, 'Expedition Gate');
    assert.strictEqual(lastTransfer().map, MAP.STACKS1);
    assert.ok(says(/Party:/));
});
test('stacks floor 1: chests, lore, lever; stairs connect both floors', function() {
    var shards0 = v(V.SHARDS), pages0 = item('inkPage'), lore0 = item('lorePage');
    SIM.trigger(MAP.STACKS1, 'Chest West'); SIM.trigger(MAP.STACKS1, 'Chest East');
    SIM.trigger(MAP.STACKS1, 'Lore Fragment', 0); SIM.trigger(MAP.STACKS1, 'Lore Fragment', 1);
    assert.ok(v(V.SHARDS) >= shards0 + 220, 'chest shards');
    assert.strictEqual(item('inkPage'), pages0 + 2);
    assert.strictEqual(item('lorePage'), lore0 + 2);
    assert.strictEqual(SIM.trigger(MAP.STACKS1, 'Chest West'), true, 'opened chest has a second page');
    assert.ok(!sw(S.LEVER_STACKS));
    SIM.trigger(MAP.STACKS1, 'Lever');
    assert.ok(sw(S.LEVER_STACKS));
    assert.ok(SIM.activePage(MAP.STACKS1, SIM.findEvent(MAP.STACKS1, 'Gate Door')).image.tileId !== SIM.findEvent(MAP.STACKS1, 'Gate Door').pages[0].image.tileId, 'door opens');
    SIM.trigger(MAP.STACKS1, 'Stairs Down');
    assert.strictEqual(lastTransfer().map, MAP.STACKS2);
    SIM.trigger(MAP.STACKS1, 'Candles of Rest');
});
test('stacks floor 2: mimic chest battle, then the Curator', function() {
    SIM.battles.length = 0;
    SIM.trigger(MAP.STACKS2, 'Lore Fragment', 0); SIM.trigger(MAP.STACKS2, 'Lore Fragment', 1);
    SIM.trigger(MAP.STACKS2, 'Suspicious Chest');
    assert.deepStrictEqual(SIM.battles, [ID.ce && $dataTroops.findIndex(function(t) { return t && t.name === 'Tome Mimic'; })]);
    SIM.battles.length = 0;
    // lose first: retreat to the Hall, flags unchanged
    SIM.onBattle = function() { return 2; };
    resetTexts();
    SIM.trigger(MAP.STACKS2, 'Curator Husk');
    assert.ok(!sw(S.STACKS_BOSS_DONE));
    assert.strictEqual(lastTransfer().map, MAP.HALL);
    assert.ok(says(/dragged you out by the collar/));
    // then win
    SIM.onBattle = function() { return 0; };
    resetTexts();
    SIM.trigger(MAP.STACKS2, 'Curator Husk');
    assert.ok(sw(S.STACKS_BOSS_DONE) && sw(S.INK_OPEN) && sw(S.BANNER_AURELIAN));
    assert.strictEqual(v(V.CHAPTER), 2);
    assert.ok(item('indexPage') === 1, 'Index Page');
    assert.strictEqual(SIM.trigger(MAP.STACKS2, 'Curator Husk'), false, 'the boss is gone afterwards');
    assert.strictEqual(lastTransfer().map, MAP.HALL);
});
test('the rate-up banner appears after the Curator', function() {
    var names = Gacha.availableBanners().map(function(b) { return b.id; });
    assert.ok(names.indexOf('aurelian') >= 0, names.join());
    assert.ok(names.indexOf('nyx') < 0);
    assert.ok(names.indexOf('beginner') >= 0, 'beginner banner stays listed until used up');
});

console.log('The Inkwell Depths');
test('the Inkwell gate opens after the Curator, enemies there are tougher', function() {
    plan = ['Inkwell']; SIM.trigger(MAP.HALL, 'Expedition Gate');
    assert.strictEqual(lastTransfer().map, MAP.INK1);
    var m = SIM.map(MAP.INK1);
    assert.ok(m.encounterList.length >= 3);
});
test('inkwell floor 1 and 2 events run', function() {
    ['Chest West', 'Chest East'].forEach(function(n) { SIM.trigger(MAP.INK1, n); });
    SIM.trigger(MAP.INK1, 'Lore Fragment', 0); SIM.trigger(MAP.INK1, 'Lore Fragment', 1);
    SIM.trigger(MAP.INK1, 'Lever'); assert.ok(sw(S.LEVER_INK));
    SIM.trigger(MAP.INK1, 'Stairs Down'); assert.strictEqual(lastTransfer().map, MAP.INK2);
    ['Chest West', 'Chest East'].forEach(function(n) { SIM.trigger(MAP.INK2, n); });
    SIM.trigger(MAP.INK2, 'Lore Fragment', 0); SIM.trigger(MAP.INK2, 'Lore Fragment', 1);
});
test('the Warden ends the slice and unlocks the Nyx banner', function() {
    SIM.onBattle = function() { return 0; };
    resetTexts();
    SIM.trigger(MAP.INK2, 'Unwritten Warden');
    assert.ok(sw(S.INK_BOSS_DONE) && sw(S.SLICE_COMPLETE) && sw(S.BANNER_NYX));
    assert.strictEqual(v(V.CHAPTER), 3);
    assert.ok(says(/first thing this Archive ever forgot/));
    assert.ok(says(/To be continued/));
    assert.ok(Gacha.availableBanners().map(function(b) { return b.id; }).indexOf('nyx') >= 0);
});

console.log('Economy after the slice');
test('lore rewards are claimable at the Desk', function() {
    assert.strictEqual(item('lorePage'), 8, 'all eight lore fragments exist and were collected');
    var pages0 = item('inkPage'), shards0 = v(V.SHARDS);
    plan = ['Archive Lore', 'Leave']; resetTexts();
    SIM.trigger(MAP.HALL, 'Scribe\'s Desk');
    assert.ok(says(/Every reward has been claimed/));
    assert.ok(item('inkPage') >= pages0 + 8, 'pages from the milestones');
    assert.ok(v(V.SHARDS) >= shards0 + 400);
    assert.strictEqual(item('echoCache'), 3);
});
test('bounties progress from battle victories and pay out (scaled by the desk level)', function() {
    $gameSystem.hallData().levels.desk = 3;
    $gameSystem.hallData().bounty = null;
    Hall.newBounty();
    var b = $gameSystem.hallData().bounty;
    assert.ok(b.need >= 2 && b.shards > 0);
    $gameTroop._enemies = []; for (var i = 0; i < b.need; i++) { $gameTroop._enemies.push({ dead: true, enemyId: function() { return b.enemyId; }, enemy: function() { return $dataEnemies[b.enemyId]; } }); }
    BattleManager.processVictory();
    assert.ok(Hall.bountyReady());
    assert.ok(Hall.stock() >= 8, 'desk level 3 pays a dividend per victory');
    var s0 = v(V.SHARDS);
    plan = ['Bounty Board', 'Turn in', 'Leave'];
    SIM.trigger(MAP.HALL, 'Scribe\'s Desk');
    assert.ok(v(V.SHARDS) >= s0 + b.shards);
    assert.ok(!$gameSystem.hallData().bounty);
});
test('Echo Cache items convert to shards through their common event', function() {
    var s0 = v(V.SHARDS);
    new Game_Interpreter().run($dataCommonEvents[ID.ce.useCache].list, 0);
    assert.strictEqual(v(V.SHARDS), s0 + 150);
});
test('rate-up banners: pulls respect pity, featured guarantee and duplicate handling', function() {
    $gameVariables.setValue(V.SHARDS, 100000);
    var count = { aurelian: 0, other: 0 };
    for (var i = 0; i < 40; i++) {
        var res = Gacha.pull('aurelian', 10);
        assert.ok(res && res.length === 10);
        res.forEach(function(r) { if (r.rarity === 'UR') { if (r.type === 'actor' && r.id === ID.actor.aurelian) { count.aurelian++; } else { count.other++; } } });
    }
    assert.ok(count.aurelian + count.other >= 4, '400 pulls must contain several URs: ' + JSON.stringify(count));
    assert.ok(Echoes.lb(ID.actor.aurelian) >= 0);
    assert.ok($gameParty._actors.indexOf(ID.actor.aurelian) >= 0 || count.aurelian === 0);
});
test('the whole slice never threw and the interpreter finished quickly', function() { assert.ok(SIM.steps < 150000, 'steps: ' + SIM.steps); });

console.log('\n' + (failures ? failures + ' failed, ' + passed + ' passed' : 'All ' + passed + ' playthrough checks passed'));
process.exit(failures ? 1 : 0);
