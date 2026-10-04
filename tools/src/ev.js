// A small DSL that emits RPG Maker MV event command lists (the JSON the editor writes).
// Nested blocks (choices, conditions, battle results) handle indentation automatically.
'use strict';

var FACE_COLS = 34, NOFACE_COLS = 48;

function wrap(text, cols) {
    var out = [];
    String(text).split('\n').forEach(function(para) {
        var line = '';
        para.split(' ').forEach(function(w) {
            var visible = (line + ' ' + w).replace(/\\[A-Za-z]+\[\d+\]/g, '').length;
            if (line && visible > cols) { out.push(line); line = w; }
            else { line = line ? line + ' ' + w : w; }
        });
        out.push(line);
    });
    return out;
}

function Builder(indent) {
    this.list = [];
    this.indent = indent || 0;
}

Builder.prototype.cmd = function(code, params) {
    this.list.push({ code: code, indent: this.indent, parameters: params || [] });
    return this;
};

// run fn on this builder one indent level deeper, closed with the editor's empty line
Builder.prototype.nest = function(fn) {
    this.indent++;
    if (fn) { fn(this); }
    this.cmd(0, []);
    this.indent--;
    return this;
};

// ---- messages ----------------------------------------------------------------------------------
// who: { face: 'Actor1', idx: 0, name: 'Iri' } or null for a narration box.
Builder.prototype.say = function(who, text, opts) {
    opts = opts || {};
    var face = who && who.face ? who.face : '', idx = who && who.idx || 0;
    var lines = wrap(text, face ? FACE_COLS : NOFACE_COLS);
    var perBox = who && who.name ? 3 : 4, i;
    for (i = 0; i < lines.length; i += perBox) {
        this.cmd(101, [face, idx, opts.bg || 0, opts.pos === undefined ? 2 : opts.pos]);
        if (who && who.name) { this.cmd(401, ['\\C[6]' + who.name + '\\C[0]']); }
        lines.slice(i, i + perBox).forEach(function(l) { this.cmd(401, [l]); }, this);
    }
    return this;
};
Builder.prototype.narrate = function(text, opts) { return this.say(null, text, opts); };

// choices: array of strings; handlers: array of fn(builder) (same length).
Builder.prototype.choice = function(choices, handlers, opts) {
    opts = opts || {};
    var cancel = opts.cancel === undefined ? -1 : opts.cancel;
    this.cmd(102, [choices, cancel, opts.def || 0, opts.pos || 2, opts.bg || 0]);
    choices.forEach(function(c, i) {
        this.cmd(402, [i, c]);
        this.nest(handlers[i]);
    }, this);
    if (cancel === -2) { this.cmd(403, [6, null]); this.nest(opts.onCancel); }
    return this.cmd(404, []);
};

// ---- flow --------------------------------------------------------------------------------------
var OPS = { '>=': 0, '<=': 1, '>': 2, '<': 3, '!=': 4, '=': 0 };
var VAROPS = { '=': 0, '>=': 1, '<=': 2, '>': 3, '<': 4, '!=': 5 };

Builder.prototype.cond = function(kind, args, thenFn, elseFn) {
    var p;
    switch (kind) {
    case 'switch': p = [0, args[0], args.length > 1 && args[1] === false ? 1 : 0]; break;
    case 'var': p = [1, args[0], 0, args[2], VAROPS[args[1]]]; break;
    case 'self': p = [2, args[0], args.length > 1 && args[1] === false ? 1 : 0]; break;
    case 'actor': p = [4, args[0], 0]; break;
    case 'gold': p = [7, args[1], { '>=': 0, '<=': 1, '<': 2 }[args[0]]]; break;
    case 'item': p = [8, args[0]]; break;
    case 'script': p = [12, args[0]]; break;
    default: throw new Error('unknown condition ' + kind);
    }
    this.cmd(111, p);
    this.nest(thenFn);
    if (elseFn) { this.cmd(411, []); this.nest(elseFn); }
    return this.cmd(412, []);
};
Builder.prototype.when = function(js, thenFn, elseFn) { return this.cond('script', [js], thenFn, elseFn); };

Builder.prototype.loop = function(fn) { this.cmd(112, []); this.nest(fn); return this.cmd(413, []); };
Builder.prototype.breakLoop = function() { return this.cmd(113, []); };
Builder.prototype.exit = function() { return this.cmd(115, []); };
Builder.prototype.label = function(n) { return this.cmd(118, [n]); };
Builder.prototype.jump = function(n) { return this.cmd(119, [n]); };
Builder.prototype.common = function(id) { return this.cmd(117, [id]); };
Builder.prototype.comment = function(t) { return this.cmd(108, [t]); };

// ---- state -------------------------------------------------------------------------------------
Builder.prototype.sw = function(id, on) { return this.cmd(121, [id, id, on === false ? 1 : 0]); };
Builder.prototype.selfsw = function(ch, on) { return this.cmd(123, [ch, on === false ? 1 : 0]); };
// value: number | { script: 'js' } | { random: [a, b] } | { v: id }
Builder.prototype.v = function(id, op, value) {
    var o = { '=': 0, '+': 1, '-': 2, '*': 3, '/': 4, '%': 5 }[op];
    if (typeof value === 'number') { return this.cmd(122, [id, id, o, 0, value]); }
    if (value.script !== undefined) { return this.cmd(122, [id, id, o, 4, value.script]); }
    if (value.random) { return this.cmd(122, [id, id, o, 2, value.random[0], value.random[1]]); }
    if (value.v) { return this.cmd(122, [id, id, o, 1, value.v]); }
    throw new Error('bad variable value');
};
Builder.prototype.gold = function(n) { return this.cmd(125, [n < 0 ? 1 : 0, 0, Math.abs(n)]); };
Builder.prototype.item = function(id, n) { return this.cmd(126, [id, n < 0 ? 1 : 0, 0, Math.abs(n)]); };
Builder.prototype.weapon = function(id, n) { return this.cmd(127, [id, n < 0 ? 1 : 0, 0, Math.abs(n), false]); };
Builder.prototype.armor = function(id, n) { return this.cmd(128, [id, n < 0 ? 1 : 0, 0, Math.abs(n), false]); };
Builder.prototype.party = function(actorId, add) { return this.cmd(129, [actorId, add === false ? 1 : 0, 0]); };
Builder.prototype.recoverAll = function() { return this.cmd(314, [0, 0]); };
Builder.prototype.script = function(js) {
    var lines = String(js).split('\n');
    this.cmd(355, [lines[0]]);
    lines.slice(1).forEach(function(l) { this.cmd(655, [l]); }, this);
    return this;
};
Builder.prototype.plugin = function(text) { return this.cmd(356, [text]); };
Builder.prototype.menuAccess = function(on) { return this.cmd(135, [on ? 1 : 0]); };
Builder.prototype.saveAccess = function(on) { return this.cmd(134, [on ? 1 : 0]); };
Builder.prototype.encounters = function(on) { return this.cmd(136, [on ? 1 : 0]); };
Builder.prototype.followers = function(on) { return this.cmd(216, [on ? 0 : 1]); };
Builder.prototype.openSave = function() { return this.cmd(352, []); };
Builder.prototype.gameOver = function() { return this.cmd(353, []); };
Builder.prototype.erase = function() { return this.cmd(214, []); };

// ---- presentation ------------------------------------------------------------------------------
Builder.prototype.transfer = function(map, x, y, dir, fade) {
    return this.cmd(201, [0, map, x, y, dir || 0, fade === undefined ? 0 : fade]);
};
Builder.prototype.wait = function(f) { return this.cmd(230, [f]); };
function audio(name, vol, pitch) { return { name: name, volume: vol === undefined ? 90 : vol, pitch: pitch || 100, pan: 0 }; }
Builder.prototype.bgm = function(name, vol) { return this.cmd(241, [audio(name, vol)]); };
Builder.prototype.bgmFade = function(sec) { return this.cmd(242, [sec || 1]); };
Builder.prototype.battleBgm = function(name, vol) { return this.cmd(132, [audio(name, vol)]); };
Builder.prototype.me = function(name, vol) { return this.cmd(249, [audio(name, vol)]); };
Builder.prototype.se = function(name, vol, pitch) { return this.cmd(250, [audio(name, vol, pitch)]); };
Builder.prototype.fadeOut = function() { return this.cmd(221, []); };
Builder.prototype.fadeIn = function() { return this.cmd(222, []); };
Builder.prototype.tint = function(tone, dur, wait) { return this.cmd(223, [tone, dur || 30, wait !== false]); };
Builder.prototype.flash = function(color, dur, wait) { return this.cmd(224, [color, dur || 20, wait !== false]); };
Builder.prototype.shake = function(power, speed, dur) { return this.cmd(225, [power || 5, speed || 5, dur || 40, true]); };
Builder.prototype.anim = function(charId, animId, wait) { return this.cmd(212, [charId, animId, wait !== false]); };

// route: array of [code, ...params] in MV movement-route codes (1 down,2 left,3 right,4 up, 16-19 turn D/L/R/U, 15 wait)
Builder.prototype.move = function(charId, route, wait) {
    var list = route.map(function(r) { return { code: r[0], parameters: r.slice(1) }; });
    list.push({ code: 0 });
    this.cmd(205, [charId, { list: list, repeat: false, skippable: false, wait: wait !== false }]);
    route.forEach(function(r) { this.cmd(505, [{ code: r[0], parameters: r.slice(1) }]); }, this);
    return this;
};

// ---- battle / shop -----------------------------------------------------------------------------
Builder.prototype.battle = function(troopId, opts, branches) {
    opts = opts || {};
    branches = branches || {};
    this.cmd(301, [0, troopId, !!opts.escape, !!opts.lose]);
    if (branches.win || opts.escape || opts.lose) {
        this.cmd(601, []); this.nest(branches.win);
        if (opts.escape) { this.cmd(602, []); this.nest(branches.escape); }
        if (opts.lose) { this.cmd(603, []); this.nest(branches.lose); }
        this.cmd(604, []);
    }
    return this;
};

var SHOP_TYPE = { item: 0, weapon: 1, armor: 2 };
Builder.prototype.shop = function(goods, purchaseOnly) {
    goods.forEach(function(g, i) {
        var p = [SHOP_TYPE[g.type], g.id, 0, 0];
        if (i === 0) { p.push(!!purchaseOnly); this.cmd(302, p); } else { this.cmd(605, p); }
    }, this);
    return this;
};

Builder.prototype.done = function() {
    if (this.indent !== 0) { throw new Error('unbalanced indent'); }
    this.cmd(0, []);
    return this.list;
};

function build(fn) { var b = new Builder(0); fn(b); return b.done(); }

module.exports = { build: build, Builder: Builder, wrap: wrap };
