// Run with: node tests/gacha.test.js
// Loads the plugins the way MV does (as global scripts) with minimal engine stubs.
'use strict';
var fs = require('fs');
var vm = require('vm');
var path = require('path');
var assert = require('assert');

// ---- minimal MV stubs -------------------------------------------------------
['Window_Base', 'Window_Selectable', 'Window_Command', 'Window_HorzCommand', 'Window_MenuCommand',
 'Scene_MenuBase', 'Scene_Menu', 'Game_System', 'Game_Interpreter', 'Sprite', 'Bitmap'].forEach(function(n) {
    global[n] = function() {};
});
Window_MenuCommand.prototype.addOriginalCommands = function() {};
Scene_Menu.prototype.createCommandWindow = function() {};
Game_Interpreter.prototype.pluginCommand = function() {};
global.PluginManager = { parameters: function() { return {}; } };
global.TextManager = { currencyUnit: 'G' };
global.SceneManager = { push: function() {} };
global.AudioManager = { playSe: function() {} };

function load(file) {
    var p = path.join(__dirname, '..', 'js', 'plugins', file);
    vm.runInThisContext(fs.readFileSync(p, 'utf8'), { filename: p });
}
load('GachaSystem.js');
load('GachaBanners.js');

// ---- tiny test runner -------------------------------------------------------
var failures = 0;
function test(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}

// deterministic RNG so the run is reproducible
function mulberry32(a) {
    return function() {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function bannerWith(overrides) {
    var raw = {
        id: 't', name: 'T',
        pool: {
            N: [{ type: 'item', id: 1 }], R: [{ type: 'item', id: 2 }], SR: [{ type: 'item', id: 3 }],
            SSR: [{ type: 'weapon', id: 1 }], UR: [{ type: 'actor', id: 1 }]
        }
    };
    for (var k in overrides) { raw[k] = overrides[k]; }
    return Gacha.normalizeBanner(raw);
}

console.log('Engine');

test('rarities are N, R, SR, SSR, UR in that order', function() {
    assert.deepStrictEqual(Gacha.RARITIES, ['N', 'R', 'SR', 'SSR', 'UR']);
});

test('rates are normalised to 100 and empty pools never drop', function() {
    var b = bannerWith({ rates: { N: 10, R: 10, SR: 10, SSR: 10, UR: 10 }, pool: {
        N: [{ type: 'item', id: 1 }], SR: [{ type: 'item', id: 1 }] } });
    assert.strictEqual(b.rates.R, 0);
    assert.strictEqual(b.rates.SSR, 0);
    assert.strictEqual(b.rates.UR, 0);
    assert.ok(Math.abs(b.rates.N + b.rates.SR - 100) < 1e-9);
    assert.strictEqual(b.pity.UR.hard, 0, 'pity on a rarity with no pool must be disabled');
});

test('base rates match with pity disabled (2M pulls)', function() {
    var b = bannerWith({ pity: { SSR: { soft: 0, hard: 0 }, UR: { soft: 0, hard: 0 } } });
    var rng = mulberry32(1), st = Gacha.newState(), counts = { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 };
    var n = 2000000, i;
    for (i = 0; i < n; i++) {
        counts[Gacha.roll(b, st, 1, rng)[0].rarity]++;
        st.ssr = 0; st.ur = 0;
    }
    Gacha.RARITIES.forEach(function(r) {
        var got = counts[r] / n * 100;
        assert.ok(Math.abs(got - b.rates[r]) < 0.15, r + ': expected ' + b.rates[r] + ' got ' + got.toFixed(3));
    });
});

test('hard pity: never more than hard pulls between SSR+ / UR', function() {
    var b = bannerWith({ rates: { N: 90, R: 9, SR: 0.9, SSR: 0.09, UR: 0.01 } });
    var rng = mulberry32(2), st = Gacha.newState();
    var sinceSSR = 0, sinceUR = 0, maxSSR = 0, maxUR = 0, i;
    for (i = 0; i < 300000; i++) {
        var r = Gacha.roll(b, st, 1, rng)[0].rarity;
        sinceSSR++; sinceUR++;
        maxSSR = Math.max(maxSSR, sinceSSR); maxUR = Math.max(maxUR, sinceUR);
        if (Gacha.rank(r) >= 3) { sinceSSR = 0; }
        if (r === 'UR') { sinceUR = 0; }
    }
    assert.ok(maxSSR <= b.pity.SSR.hard, 'SSR gap ' + maxSSR + ' > ' + b.pity.SSR.hard);
    assert.ok(maxUR <= b.pity.UR.hard, 'UR gap ' + maxUR + ' > ' + b.pity.UR.hard);
});

test('hard pity triggers exactly on the configured pull', function() {
    var b = bannerWith({ rates: { N: 100, R: 0, SR: 0, SSR: 1, UR: 0 }, pity: { SSR: { soft: 0, hard: 5 } } });
    var st = Gacha.newState();
    var res = Gacha.roll(b, st, 5, function() { return 0.999999; });
    assert.deepStrictEqual(res.map(function(r) { return r.rarity; }), ['N', 'N', 'N', 'N', 'SSR']);
    assert.strictEqual(st.ssr, 0);
});

test('soft pity raises the rate', function() {
    var b = bannerWith({});
    var low = Gacha.effectiveRates(b, { ssr: 0, ur: 0, guar: {} }, 0);
    var soft = Gacha.effectiveRates(b, { ssr: 44, ur: 0, guar: {} }, 0);
    assert.ok(soft.SSR > low.SSR * 2, 'SSR rate ' + soft.SSR + ' vs ' + low.SSR);
    var sum = 0; Gacha.RARITIES.forEach(function(r) { sum += soft[r]; });
    assert.ok(Math.abs(sum - 100) < 1e-9);
});

test('every full multi-pull has at least SR', function() {
    var b = bannerWith({ pity: { SSR: { soft: 0, hard: 0 }, UR: { soft: 0, hard: 0 } } });
    var rng = mulberry32(3), i, j;
    for (i = 0; i < 20000; i++) {
        var st = Gacha.newState();
        var res = Gacha.roll(b, st, 10, rng), ok = false;
        for (j = 0; j < res.length; j++) { if (Gacha.rank(res[j].rarity) >= 2) { ok = true; } }
        assert.ok(ok, 'multi without SR');
    }
});

test('rate-up: losing the featured roll guarantees the next one', function() {
    var b = bannerWith({ rates: { N: 0, R: 0, SR: 0, SSR: 0, UR: 100 }, pool: {
        UR: [{ type: 'actor', id: 1, featured: true }, { type: 'actor', id: 2 }] } });
    var rng = mulberry32(4), st = Gacha.newState(), prevLost = false, i, feat = 0, n = 100000;
    for (i = 0; i < n; i++) {
        var r = Gacha.roll(b, st, 1, rng)[0];
        if (prevLost) { assert.ok(r.featured, 'guarantee did not fire'); }
        prevLost = !r.featured;
        if (r.featured) { feat++; }
    }
    // 50% roll + guarantee => 2/3 featured overall
    assert.ok(Math.abs(feat / n - 2 / 3) < 0.01, 'featured share ' + feat / n);
});

test('rate-up without guarantee stays at the featured rate', function() {
    var b = bannerWith({ guarantee: false, rates: { N: 0, R: 0, SR: 0, SSR: 0, UR: 100 }, pool: {
        UR: [{ type: 'actor', id: 1, featured: true }, { type: 'actor', id: 2 }] } });
    var rng = mulberry32(5), st = Gacha.newState(), feat = 0, n = 100000, i;
    for (i = 0; i < n; i++) { if (Gacha.roll(b, st, 1, rng)[0].featured) { feat++; } }
    assert.ok(Math.abs(feat / n - 0.5) < 0.01, 'featured share ' + feat / n);
});

test('weights bias entries inside a rarity', function() {
    var b = bannerWith({ rates: { N: 100, R: 0, SR: 0, SSR: 0, UR: 0 }, pool: {
        N: [{ type: 'item', id: 1, weight: 3 }, { type: 'item', id: 2, weight: 1 }] } });
    var rng = mulberry32(6), st = Gacha.newState(), a = 0, n = 100000, i;
    for (i = 0; i < n; i++) { if (Gacha.roll(b, st, 1, rng)[0].id === 1) { a++; } }
    assert.ok(Math.abs(a / n - 0.75) < 0.01);
});

console.log('Game integration');

function freshGame() {
    global.$dataItems = [null, { name: 'Potion', iconIndex: 176 }, { name: 'Ether', iconIndex: 177 },
        { name: 'Elixir', iconIndex: 178 }];
    global.$dataWeapons = [null, { name: 'Sword', iconIndex: 97 }];
    global.$dataArmors = [null, { name: 'Shield', iconIndex: 128 }];
    global.$dataActors = [null, { name: 'Hero' }, { name: 'Mage' }];
    var gold = 5000, inv = {}, actors = [1], vars = {};
    global.$gameParty = {
        _actors: actors,
        gold: function() { return gold; },
        gainGold: function(n) { gold += n; },
        loseGold: function(n) { gold -= n; },
        numItems: function(it) { return inv[it.name] || 0; },
        gainItem: function(it, n) { inv[it.name] = (inv[it.name] || 0) + n; },
        loseItem: function(it, n) { inv[it.name] = (inv[it.name] || 0) - n; },
        addActor: function(id) { if (actors.indexOf(id) < 0) { actors.push(id); } }
    };
    global.$gameVariables = { value: function(i) { return vars[i] || 0; }, setValue: function(i, v) { vars[i] = v; } };
    global.$gameSwitches = { value: function() { return true; } };
    global.$gameSystem = new Game_System();
    return { gold: function() { return gold; }, inv: inv, actors: actors, vars: vars };
}

test('banners from GachaBanners.js normalise and are listed', function() {
    freshGame();
    var list = Gacha.availableBanners().map(function(b) { return b.id; });
    assert.deepStrictEqual(list, ['standard', 'hero', 'beginner']);
    Gacha.banners().forEach(function(b) {
        var s = 0; Gacha.RARITIES.forEach(function(r) { s += b.rates[r]; });
        assert.ok(Math.abs(s - 100) < 1e-9, b.id);
    });
});

test('pulling pays, grants and logs history', function() {
    var g = freshGame();
    var res = Gacha.pull('standard', 10);
    assert.strictEqual(res.length, 10);
    assert.strictEqual(g.gold() <= 5000 - 3000 + res.reduce(function(a, r) {
        return a + (r.type === 'gold' ? r.count : 0) + r.refund; }, 0), true);
    assert.strictEqual($gameSystem.gachaData().history.length, 10);
    assert.strictEqual(Gacha.state(Gacha.getBanner('standard')).total, 10);
});

test('cannot pull without enough currency', function() {
    var g = freshGame();
    global.$gameParty.loseGold(4900);
    assert.strictEqual(Gacha.pull('standard', 1), null);
    assert.strictEqual(Gacha.lastError, 'funds');
    assert.strictEqual(g.gold(), 100);
});

test('item currency and the pull limit work (beginner banner)', function() {
    var g = freshGame();
    g.inv['(none)'] = 0;
    var b = Gacha.getBanner('beginner');
    assert.strictEqual(Gacha.pullBlocked(b, 10), 'funds');
    $gameParty.gainItem($dataItems[3], 0);
    // currency is item 8, which does not exist in the stub DB -> balance 0
    assert.strictEqual(Gacha.balance(b), 0);
    var res = Gacha.pull(b, 10, true);   // free pull bypasses payment
    assert.ok(res.some(function(r) { return Gacha.rank(r.rarity) >= 3; }), 'SSR guaranteed within 10');
    assert.strictEqual(Gacha.pullBlocked(b, 1, true), 'limit');
});

test('duplicate actors are refunded instead of re-added', function() {
    var g = freshGame();
    var r = { rarity: 'UR', type: 'actor', id: 1, count: 1 };   // actor 1 starts in the party
    Gacha.grant(r);
    assert.ok(r.dupe);
    assert.strictEqual(r.refund, 10000);
    assert.strictEqual(g.gold(), 15000);
    var r2 = { rarity: 'SSR', type: 'actor', id: 2, count: 1 };
    Gacha.grant(r2);
    assert.ok(r2.isNew && !r2.dupe);
    assert.deepStrictEqual(g.actors, [1, 2]);
    var r3 = { rarity: 'SSR', type: 'actor', id: 2, count: 1 };
    Gacha.grant(r3);
    assert.ok(r3.dupe);
});

test('result variable gets best rarity rank, -1 on failure', function() {
    var g = freshGame();
    Gacha.Params.resultVariable = 7;
    var res = Gacha.pull('standard', 10);
    var best = 0; res.forEach(function(r) { best = Math.max(best, Gacha.rank(r.rarity)); });
    assert.strictEqual(g.vars[7], best);
    global.$gameParty.loseGold(1e9);
    assert.strictEqual(Gacha.pull('standard', 1), null);
    assert.strictEqual(g.vars[7], -1);
    Gacha.Params.resultVariable = 0;
});

test('pity is shared by pityGroup and survives in save data', function() {
    freshGame();
    var b = Gacha.getBanner('standard');
    Gacha.pull(b, 3, true);
    var json = JSON.stringify($gameSystem.gachaData());
    assert.strictEqual(JSON.parse(json).banners.standard.total, 3);
    Gacha.resetPity('standard');
    assert.strictEqual(Gacha.state(b).total, 0);
});

test('text builders run for every banner', function() {
    freshGame();
    Gacha.banners().forEach(function(b) {
        assert.ok(Gacha.ratesLines(b).length > 3);
        var res = Gacha.pull(b, 10, true);
        assert.strictEqual(Gacha.resultLines(res).length, 11);
    });
    assert.ok(Gacha.historyLines().length > 1);
});

console.log(failures ? '\n' + failures + ' test(s) failed' : '\nAll tests passed');
process.exit(failures ? 1 : 0);
