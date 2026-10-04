// Battle balance simulator. Re-implements the parts of MV's battle rules that matter for tuning
// (turn order, damage formula, element rates, buffs, a few states, TP) and plays the generated
// database against itself with a simple AI. Usage: node tools/balance.js [runs]
'use strict';
var dbMod = require('./src/db');
var content = require('./src/content_heroes');
var world = require('./src/content_world');
var ids = require('./src/ids');

var db = dbMod.build(null);
var ID = db.ID;
var PN = ['mhp', 'mmp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'];
var SEED = 12345;
function rnd() { SEED = (SEED * 1664525 + 1013904223) % 4294967296; return SEED / 4294967296; }

var formulas = {};
function evalFormula(f, a, b) {
    if (!formulas[f]) { formulas[f] = new Function('a', 'b', 'v', 'return ' + f + ';'); }
    return formulas[f](a, b, []);
}

// ---- battlers ---------------------------------------------------------------------------------
function paramOf(bt, name) {
    var v = bt.base[name];
    var stage = bt.buffs[name] || 0;
    v *= 1 + 0.25 * stage;
    if (bt.states.hollowed && (name === 'def' || name === 'mdf')) { v *= 0.75; }
    return v;
}
function view(bt) {   // object exposing atk/def/... for formulas
    var o = {};
    PN.forEach(function(n) { o[n.replace('mhp', 'mhp')] = paramOf(bt, n); });
    o.mhp = bt.mhp; o.hp = bt.hp; o.mmp = bt.mmp; o.mp = bt.mp; o.level = bt.level || 1;
    return o;
}

function makeActor(key, level, lb, gearTier) {
    var h = content.heroes.filter(function(x) { return x.key === key; })[0];
    var actor = db.Actors[ID.actor[key]], cls = db.Classes[actor.classId];
    var rm = h.rarity ? content.RARITY_MUL[h.rarity] : 1;
    var lbm = 1 + 0.06 * (lb || 0);
    var base = {};
    PN.forEach(function(n, i) { base[n] = cls.params[i][level] * rm * lbm; });
    // gear: a weapon + body armour of the given tier
    if (gearTier !== undefined) {
        var wt = h.weapon, w = db.Weapons[ID.weapon[wt + '_' + dbMod.TIERS[gearTier]]];
        PN.forEach(function(n, i) { base[n] += w.params[i]; });
        var slot = ['staff', 'tome'].indexOf(wt) >= 0 ? 'robe' : 'body', a = db.Armors[ID.armor[slot + '_' + dbMod.TIERS[gearTier]]];
        PN.forEach(function(n, i) { base[n] += a.params[i]; });
    }
    var skillIds = cls.learnings.filter(function(l) { return l.level <= level; }).map(function(l) { return l.skillId; });
    var burstMatch = /<Burst: (\d+)>/.exec(actor.note);
    if (burstMatch && (lb || 0) >= 3 || key === 'iri' && burstMatch && level >= 8) { skillIds.push(Number(burstMatch[1])); }
    var elem = {};
    cls.traits.forEach(function(t) { if (t.code === 11) { elem[t.dataId] = t.value; } });
    return { name: h.name, key: key, side: 'a', base: base, mhp: Math.round(base.mhp), hp: Math.round(base.mhp), mmp: Math.round(base.mmp), mp: Math.round(base.mmp),
             tp: Math.floor(rnd() * 25), buffs: {}, states: {}, elem: elem, skills: skillIds, level: level, cri: 0.04 + (cls.traits.filter(function(t) { return t.code === 22 && t.dataId === 2; })[0].value - 0.04) };
}

function makeEnemy(enemyId) {
    var e = db.Enemies[enemyId], base = {};
    PN.forEach(function(n, i) { base[n] = e.params[i]; });
    var elem = {}, stateRate = {}, extra = 0;
    e.traits.forEach(function(t) { if (t.code === 11) { elem[t.dataId] = t.value; } if (t.code === 13) { stateRate[t.dataId] = t.value; } if (t.code === 61) { extra = t.value; } });
    return { name: e.name, side: 'e', base: base, mhp: e.params[0], hp: e.params[0], mmp: e.params[1], mp: e.params[1], tp: 0, buffs: {}, states: {}, elem: elem, stateRate: stateRate,
             actions: e.actions, extra: extra, isBoss: extra > 0, level: 1 };
}

// ---- skills -----------------------------------------------------------------------------------
function skillOf(id) { return db.Skills[id]; }

function isAlive(b) { return b.hp > 0 && !b.hidden; }

function targetsFor(user, skill, allies, foes, pick) {
    var alive = function(l) { return l.filter(isAlive); };
    switch (skill.scope) {
    case 1: case 3: { var f = alive(foes); return f.length ? [f[Math.floor(rnd() * f.length)]] : []; }
    case 2: return alive(foes);
    case 4: case 5: case 6: { var n = skill.scope - 2, f2 = alive(foes), out = [], i; for (i = 0; i < n && f2.length; i++) { out.push(f2[Math.floor(rnd() * f2.length)]); } return out; }
    case 7: return pick ? [pick] : [user];
    case 8: return alive(allies);
    case 9: { var d = allies.filter(function(x) { return x.hp <= 0; }); return d.length ? [d[0]] : []; }
    case 11: return [user];
    }
    return [];
}

var STATE_BY_ID = {};
world.states.forEach(function(s, i) { STATE_BY_ID[i + 1] = s.key; });

function applyState(t, key, chance) {
    if (t.hp <= 0 && key !== 'death') { return; }
    var rate = (t.stateRate && t.stateRate[ID.state[key]] !== undefined) ? t.stateRate[ID.state[key]] : 1;
    if (rnd() < chance * rate) {
        var st = db.States[ID.state[key]];
        t.states[key] = st.minTurns + Math.floor(rnd() * (st.maxTurns - st.minTurns + 1));
    }
}

function useSkill(user, skill, allies, foes, log, pick) {
    var targets = targetsFor(user, skill, allies, foes, pick);
    user.mp -= skill.mpCost; user.tp -= skill.tpCost;
    user.tp = Math.min(100, user.tp + skill.tpGain);
    var reps = skill.repeats || 1, r;
    targets.forEach(function(t) {
        for (r = 0; r < reps; r++) {
            var d = skill.damage, val = 0;
            if (d.type > 0 && skill.hitType === 1) {
                if (rnd() > 0.95 * (1 - 0.03)) { continue; }
            }
            if (d.type === 1 || d.type === 5) {
                val = evalFormula(d.formula, view(user), view(t));
                var el = d.elementId;
                if (el < 0) { el = 1; }
                var er = t.elem[el] !== undefined ? t.elem[el] : 1;
                val = val * er;
                if (isNaN(val) || val < 0) { val = 0; }
                val *= 1 + (rnd() - 0.5) * 0.4;
                if (d.critical || skill.hitType === 1) { if (rnd() < (user.cri || 0.04)) { val *= 3; } }
                if (t.states.shielded) { val *= 0.7; }
                if (t.guarding) { val *= 0.5; }
                val = Math.round(val);
                t.hp = Math.max(0, t.hp - val);
                if (d.type === 5) { user.hp = Math.min(user.mhp, user.hp + Math.round(val / 2)); }
                if (t.side === 'a') { t.tp = Math.min(100, t.tp + Math.floor(50 * val / t.mhp)); }
                if (t.hp <= 0) { t.states = {}; }
            } else if (d.type === 3) {
                val = Math.max(0, Math.round(evalFormula(d.formula, view(user), view(t))));
                if (t.hp > 0) { t.hp = Math.min(t.mhp, t.hp + val); }
            }
            skill.effects.forEach(function(fx) {
                switch (fx.code) {
                case 11: if (t.hp > 0 || skill.effects.some(function(x) { return x.code === 22 && x.dataId === 1; })) { t.hp = Math.min(t.mhp, Math.max(t.hp, 0) + Math.round(t.mhp * fx.value1 + fx.value2)); } break;
                case 12: t.mp = Math.min(t.mmp, t.mp + Math.round(t.mmp * fx.value1 + fx.value2)); break;
                case 21: if (STATE_BY_ID[fx.dataId] && t.hp > 0) { applyState(t, STATE_BY_ID[fx.dataId], fx.value1); } break;
                case 22: delete t.states[STATE_BY_ID[fx.dataId]]; break;
                case 31: t.buffs[PN[fx.dataId]] = Math.min(2, (t.buffs[PN[fx.dataId]] || 0) + 1); break;
                case 32: if (rnd() < 0.8) { t.buffs[PN[fx.dataId]] = Math.max(-2, (t.buffs[PN[fx.dataId]] || 0) - 1); } break;
                case 34: if ((t.buffs[PN[fx.dataId]] || 0) < 0) { t.buffs[PN[fx.dataId]] = 0; } break;
                case 44: foes === undefined || summon(user, allies); break;
                }
            });
        }
    });
}

function summon(user, allies) {
    allies.forEach(function(x) { if (x.hidden) { x.hidden = false; x.hp = x.mhp; } else if (x.hp <= 0 && !x.isBoss) { x.hp = x.mhp; } });
}

// ---- AI ---------------------------------------------------------------------------------------
function chooseHeroAction(a, party, foes, turn) {
    var skills = a.skills.map(skillOf).filter(function(s) { return s.stypeId === 1 ? (a.mp >= s.mpCost && !a.states.blank) : a.tp >= s.tpCost; });
    var aliveFoes = foes.filter(isAlive).length;
    // heal when someone is low
    var hurt = party.filter(function(x) { return x.hp > 0 && x.hp / x.mhp < 0.45; }).sort(function(x, y) { return x.hp / x.mhp - y.hp / y.mhp; })[0];
    var dead = party.filter(function(x) { return x.hp <= 0; })[0];
    var heal = skills.filter(function(s) { return s.damage.type === 3 && (s.scope === 7 || s.scope === 8); })[0];
    if (hurt && heal) { return { skill: heal, pick: hurt }; }
    var revive = skills.filter(function(s) { return s.scope === 9; })[0];
    if (dead && revive) { return { skill: revive }; }
    // buffs on turn 1 and every 4 turns
    var buff = skills.filter(function(s) { return s.damage.type === 0 && s.effects.some(function(e) { return e.code === 31 || (e.code === 21 && STATE_BY_ID[e.dataId] === 'shielded'); }); })[0];
    if (buff && turn % 4 === 1 && a.key !== 'iri') { return { skill: buff, pick: buff.scope === 7 ? party.filter(isAlive)[1] || a : undefined }; }
    if (a.key === 'iri' && turn === 1) { var an = skills.filter(function(s) { return s.name === 'Annotate'; })[0]; if (an) { return { skill: an, pick: party.filter(isAlive)[1] || a }; } }
    // burst
    var burst = skills.filter(function(s) { return s.stypeId === 2 && s.damage.type === 1; })[0];
    if (burst) { return { skill: burst }; }
    var bursts = skills.filter(function(s) { return s.stypeId === 2; })[0];
    if (bursts && (bursts.damage.type === 3 && party.some(function(x) { return x.hp / x.mhp < 0.7; }))) { return { skill: bursts }; }
    // best damage skill
    var best = null, bestVal = 0;
    skills.filter(function(s) { return s.damage.type === 1 || s.damage.type === 5; }).forEach(function(s) {
        var t = foes.filter(isAlive); if (!t.length) { return; }
        var tgt = t[0], n = s.scope === 2 ? t.length : (s.scope >= 4 && s.scope <= 6 ? Math.min(t.length, s.scope - 2) : 1);
        var v = evalFormula(s.damage.formula, view(a), view(tgt)) * n * (s.repeats || 1) * (s.damage.elementId > 0 && tgt.elem[s.damage.elementId] ? tgt.elem[s.damage.elementId] : 1);
        v /= 1 + s.mpCost / 20;
        if (v > bestVal) { bestVal = v; best = s; }
    });
    if (best && a.key !== 'iri') { return { skill: best }; }
    if (a.key === 'iri') {
        var cr = skills.filter(function(s) { return s.name === 'Index'; })[0];
        if (cr && turn === 2 && aliveFoes) { return { skill: cr }; }
    }
    return { skill: skillOf(1) };
}

function chooseEnemyAction(e, turn) {
    var acts = e.actions.filter(function(a) {
        switch (a.conditionType) {
        case 0: return true;
        case 1: return turn >= a.conditionParam1 && (a.conditionParam2 === 0 ? turn === a.conditionParam1 : (turn - a.conditionParam1) % a.conditionParam2 === 0);
        case 2: return e.hp / e.mhp >= a.conditionParam1 && e.hp / e.mhp <= a.conditionParam2;
        }
        return true;
    });
    if (!acts.length) { return skillOf(1); }
    var max = Math.max.apply(null, acts.map(function(a) { return a.rating; })), zero = max - 3;
    var pool = acts.filter(function(a) { return a.rating > zero; }), sum = 0;
    pool.forEach(function(a) { sum += a.rating - zero; });
    var r = rnd() * sum;
    for (var i = 0; i < pool.length; i++) { r -= pool[i].rating - zero; if (r < 0) { return skillOf(pool[i].skillId); } }
    return skillOf(pool[0].skillId);
}

// ---- battle ------------------------------------------------------------------------------------
function fight(party, foes) {
    var turn = 0, startHp = party.reduce(function(s, x) { return s + x.hp; }, 0);
    var tpStart = party.map(function(x) { x.tp = Math.floor(rnd() * 25); });
    while (turn < 60) {
        turn++;
        var actors = [];
        party.concat(foes).forEach(function(b) {
            if (!isAlive(b) || b.states.stunned) { return; }
            var n = 1 + (b.extra && rnd() < b.extra ? 1 : 0);
            for (var i = 0; i < n; i++) { actors.push(b); }
        });
        actors.forEach(function(b) { b._order = b.base.agi * (0.9 + rnd() * 0.2); });
        actors.sort(function(x, y) { return y._order - x._order; });
        party.forEach(function(b) { b.guarding = false; });
        for (var k = 0; k < actors.length; k++) {
            var b = actors[k];
            if (!isAlive(b)) { continue; }
            if (!party.some(isAlive)) { return { win: false, turns: turn, hpLeft: 0, startHp: startHp }; }
            if (!foes.some(isAlive)) { return { win: true, turns: turn, hpLeft: sumHp(party), startHp: startHp }; }
            if (b.side === 'a') {
                var act = chooseHeroAction(b, party, foes, turn);
                useSkill(b, act.skill, party, foes, null, act.pick);
            } else {
                var sk = chooseEnemyAction(b, turn);
                useSkill(b, sk, foes, party);
            }
        }
        // end of turn: states
        party.concat(foes).forEach(function(b) {
            if (!isAlive(b)) { return; }
            if (b.states.smudged) { b.hp = Math.max(1, b.hp - Math.round(b.mhp * 0.08)); }
            if (b.states.mended) { b.hp = Math.min(b.mhp, b.hp + Math.round(b.mhp * 0.1)); }
            Object.keys(b.states).forEach(function(s) { b.states[s]--; if (b.states[s] <= 0) { delete b.states[s]; } });
        });
        if (!foes.some(isAlive)) { return { win: true, turns: turn, hpLeft: sumHp(party), startHp: startHp }; }
        if (!party.some(isAlive)) { return { win: false, turns: turn, hpLeft: 0, startHp: startHp }; }
    }
    return { win: false, turns: turn, hpLeft: sumHp(party), startHp: startHp, timeout: true };
}
function sumHp(p) { return p.reduce(function(s, x) { return s + Math.max(0, x.hp); }, 0); }

// ---- scenarios ---------------------------------------------------------------------------------
function foesFor(troopKey) {
    var t = db.Troops[ID.troop[troopKey]];
    return t.members.map(function(m) { var e = makeEnemy(m.enemyId); e.hidden = m.hidden; return e; });
}

var PARTIES = {
    'Iri + Wick + Pip + Marla (N/N/R)':   ['iri', 'wick', 'pip', 'marla'],
    'Iri + Doran + Fenn + Sera (R/R/SR)': ['iri', 'doran', 'fenn', 'sera'],
    'Iri + Kael + Tobias + Isolde (SR/SR/SSR)': ['iri', 'kael', 'tobias', 'isolde'],
    'Iri + Brannock + Marla + Sera':      ['iri', 'brannock', 'marla', 'sera'],
    'Iri + Aurelian + Nyx + Brannock (UR)': ['iri', 'aurelian', 'nyx', 'brannock']
};

function run(label, troopKey, level, gearTier, lb, runs) {
    var out = [];
    Object.keys(PARTIES).forEach(function(pn) {
        var wins = 0, turns = 0, hp = 0, n = runs;
        for (var i = 0; i < n; i++) {
            var party = PARTIES[pn].map(function(k) { return makeActor(k, level, k === 'iri' ? 0 : lb, gearTier); });
            var r = fight(party, foesFor(troopKey));
            if (r.win) { wins++; hp += r.hpLeft / r.startHp; }
            turns += r.turns;
        }
        out.push({ party: pn, win: wins / n, turns: turns / n, hp: wins ? hp / wins : 0 });
    });
    return out;
}

if (require.main === module) {
    var runs = Number(process.argv[2]) || 200;
    var scenarios = [
        ['Prologue (Iri alone vs 2 faded wisps)', 'tutorial', 1, undefined, 0, ['iri']],
        ['Stacks fodder: wisp + mites (lvl 3)', 'wispMites', 3, undefined, 0],
        ['Stacks F2: scribe pair (lvl 5)', 'scribePair', 5, 0, 0],
        ['Stacks mimic (lvl 5)', 'mimic', 5, 0, 0],
        ['BOSS Curator Husk (lvl 5, N gear)', 'curator', 5, 0, 0],
        ['BOSS Curator Husk (lvl 5, R gear)', 'curator', 5, 1, 0],
        ['Inkwell: slimes (lvl 7, R gear)', 'slimes', 7, 1, 0],
        ['Inkwell: hound pack (lvl 8, R gear)', 'hounds', 8, 1, 0],
        ['Inkwell F2: knight pair (lvl 9, R gear)', 'knightPair', 9, 1, 0],
        ['BOSS Unwritten Warden (lvl 8, R gear, LB0)', 'warden', 8, 1, 0],
        ['BOSS Unwritten Warden (lvl 9, R gear, LB0)', 'warden', 9, 1, 0],
        ['BOSS Unwritten Warden (lvl 9, SR gear, LB1)', 'warden', 9, 2, 1],
        ['BOSS Unwritten Warden (lvl 10, R gear, LB0)', 'warden', 10, 1, 0]
    ];
    scenarios.forEach(function(s) {
        console.log('\n' + s[0]);
        if (s[5]) {
            var wins = 0, turns = 0, i;
            for (i = 0; i < runs; i++) { var r = fight([makeActor('iri', s[2], 0)], foesFor(s[1])); if (r.win) { wins++; } turns += r.turns; }
            console.log('  Iri alone: win ' + Math.round(wins / runs * 100) + '%  avg turns ' + (turns / runs).toFixed(1));
            return;
        }
        run(s[0], s[1], s[2], s[3], s[4], runs).forEach(function(o) {
            console.log('  ' + (o.party + '                                         ').slice(0, 44) + ' win ' + ('   ' + Math.round(o.win * 100)).slice(-3) + '%  turns ' + o.turns.toFixed(1) + '  hp left ' + Math.round(o.hp * 100) + '%');
        });
    });
}

module.exports = { fight: fight, makeActor: makeActor, foesFor: foesFor };
