//=============================================================================
// GachaSystem.js
//=============================================================================

/*:
 * @plugindesc v1.0.0 Gacha / summon system: banners, N-R-SR-SSR-UR rarities, pity, rate-up and 10-pulls.
 * @author RPG Maker Gacha
 *
 * @param ---Currency---
 * @default
 *
 * @param Currency Type
 * @parent ---Currency---
 * @type select
 * @option gold
 * @option item
 * @option variable
 * @desc What players pay with. Banners can override this individually.
 * @default gold
 *
 * @param Currency ID
 * @parent ---Currency---
 * @type number
 * @min 1
 * @desc Item ID (type "item") or Variable ID (type "variable"). Ignored for gold.
 * @default 1
 *
 * @param Currency Name
 * @parent ---Currency---
 * @desc Display name for variable currencies (item currencies use the item name, gold uses the currency unit).
 * @default Gems
 *
 * @param Single Cost
 * @parent ---Currency---
 * @type number
 * @min 0
 * @desc Cost of one pull.
 * @default 300
 *
 * @param Multi Cost
 * @parent ---Currency---
 * @type number
 * @min 0
 * @desc Cost of a multi-pull (Multi Count pulls).
 * @default 3000
 *
 * @param Multi Count
 * @parent ---Currency---
 * @type number
 * @min 2
 * @desc Number of pulls in a multi-pull.
 * @default 10
 *
 * @param ---Rates---
 * @default
 *
 * @param Rate N
 * @parent ---Rates---
 * @type number
 * @decimals 3
 * @min 0
 * @desc Base drop rate in percent. All five rates are normalised to 100%.
 * @default 49.4
 *
 * @param Rate R
 * @parent ---Rates---
 * @type number
 * @decimals 3
 * @min 0
 * @desc Base drop rate in percent.
 * @default 30
 *
 * @param Rate SR
 * @parent ---Rates---
 * @type number
 * @decimals 3
 * @min 0
 * @desc Base drop rate in percent.
 * @default 14
 *
 * @param Rate SSR
 * @parent ---Rates---
 * @type number
 * @decimals 3
 * @min 0
 * @desc Base drop rate in percent.
 * @default 6
 *
 * @param Rate UR
 * @parent ---Rates---
 * @type number
 * @decimals 3
 * @min 0
 * @desc Base drop rate in percent.
 * @default 0.6
 *
 * @param ---Pity---
 * @default
 *
 * @param SSR Soft Pity
 * @parent ---Pity---
 * @type number
 * @min 0
 * @desc Pull number (since the last SSR or better) where the SSR rate starts rising. 0 = off.
 * @default 40
 *
 * @param SSR Hard Pity
 * @parent ---Pity---
 * @type number
 * @min 0
 * @desc An SSR or better is guaranteed on this pull number. 0 = off.
 * @default 50
 *
 * @param SSR Soft Step
 * @parent ---Pity---
 * @type number
 * @decimals 2
 * @min 0
 * @desc Percent added to the SSR rate for every pull past the soft pity start.
 * @default 10
 *
 * @param UR Soft Pity
 * @parent ---Pity---
 * @type number
 * @min 0
 * @desc Pull number (since the last UR) where the UR rate starts rising. 0 = off.
 * @default 70
 *
 * @param UR Hard Pity
 * @parent ---Pity---
 * @type number
 * @min 0
 * @desc A UR is guaranteed on this pull number. 0 = off.
 * @default 90
 *
 * @param UR Soft Step
 * @parent ---Pity---
 * @type number
 * @decimals 2
 * @min 0
 * @desc Percent added to the UR rate for every pull past the soft pity start.
 * @default 5
 *
 * @param Multi Guarantee
 * @parent ---Pity---
 * @type select
 * @option N
 * @option R
 * @option SR
 * @option SSR
 * @option UR
 * @desc A multi-pull always contains at least this rarity.
 * @default SR
 *
 * @param Featured Rate
 * @parent ---Pity---
 * @type number
 * @min 0
 * @max 100
 * @desc Chance (percent) that a rate-up rarity gives a featured entry. Only matters on banners with featured entries.
 * @default 50
 *
 * @param Guarantee After Loss
 * @parent ---Pity---
 * @type boolean
 * @on Yes
 * @off No
 * @desc If you lose the featured roll, the next pull of that rarity is guaranteed to be featured (50/50 system).
 * @default true
 *
 * @param ---Misc---
 * @default
 *
 * @param Duplicate Refund
 * @parent ---Misc---
 * @desc Gold given when you pull an actor you already own. Five numbers for N,R,SR,SSR,UR separated by commas.
 * @default 50,150,500,2000,10000
 *
 * @param Result Variable
 * @parent ---Misc---
 * @type variable
 * @desc Variable that receives the best rarity of the last pull (0=N ... 4=UR, -1=pull failed). 0 = unused.
 * @default 0
 *
 * @param Max History
 * @parent ---Misc---
 * @type number
 * @min 0
 * @desc How many past pulls are remembered for the History screen.
 * @default 60
 *
 * @param Add To Menu
 * @parent ---Misc---
 * @type boolean
 * @on Yes
 * @off No
 * @desc Add a summon command to the main menu.
 * @default true
 *
 * @param Menu Command Name
 * @parent ---Misc---
 * @desc Text of the main menu command.
 * @default Summon
 *
 * @param ---Colours---
 * @default
 *
 * @param Color N
 * @parent ---Colours---
 * @desc CSS colour used for N.
 * @default #a8a8a8
 *
 * @param Color R
 * @parent ---Colours---
 * @desc CSS colour used for R.
 * @default #6fd36f
 *
 * @param Color SR
 * @parent ---Colours---
 * @desc CSS colour used for SR.
 * @default #5aa9ff
 *
 * @param Color SSR
 * @parent ---Colours---
 * @desc CSS colour used for SSR.
 * @default #ffd54a
 *
 * @param Color UR
 * @parent ---Colours---
 * @desc CSS colour used for UR.
 * @default #ff5c8a
 *
 * @param ---Sound---
 * @default
 *
 * @param SE Reveal
 * @parent ---Sound---
 * @type file
 * @dir audio/se/
 * @desc Sound for N and R results.
 * @default Decision1
 *
 * @param SE SR
 * @parent ---Sound---
 * @type file
 * @dir audio/se/
 * @desc Sound for SR results.
 * @default Item3
 *
 * @param SE SSR
 * @parent ---Sound---
 * @type file
 * @dir audio/se/
 * @desc Sound for SSR results.
 * @default Powerup
 *
 * @param SE UR
 * @parent ---Sound---
 * @type file
 * @dir audio/se/
 * @desc Sound for UR results.
 * @default Applause1
 *
 * @help
 * ============================================================================
 * Gacha System for RPG Maker MV
 * ============================================================================
 *
 * Install GachaSystem.js and GachaBanners.js in js/plugins/ and enable both
 * in the Plugin Manager (the file names must stay exactly as they are).
 *
 * Rarities, from common to rare:  N  <  R  <  SR  <  SSR  <  UR
 *
 * Banners are defined in GachaBanners.js (edit the sample banners there, it
 * is plain JavaScript with comments explaining every field). Everything else
 * (costs, base rates, pity, colours, sounds) is set with the parameters here
 * and can be overridden per banner.
 *
 * --------------------------------- Pity -------------------------------------
 *  - "SSR pity" counts pulls since your last SSR *or better*.
 *  - "UR pity" counts pulls since your last UR.
 *  - Soft pity: from the soft pity pull onward the rate rises each pull.
 *  - Hard pity: on that pull the rarity is 100% guaranteed.
 *  - Pity is stored in the save file, per banner (or per "pityGroup" if
 *    several banners should share one counter).
 *  - Multi-pulls always contain at least a "Multi Guarantee" rarity (SR by
 *    default); the last pull is re-rolled if needed.
 *
 * ------------------------------ Rate-up -------------------------------------
 *  Mark pool entries with featured: true. When a rarity that has both featured
 *  and non-featured entries drops, the featured group is chosen with
 *  "Featured Rate" percent. If you lose that roll and "Guarantee After Loss"
 *  is on, the next drop of that rarity is guaranteed to be featured.
 *
 * ---------------------------- Plugin Commands -------------------------------
 *   Gacha open               Open the summon screen.
 *   Gacha open bannerId      Open it with that banner pre-selected.
 *   Gacha pull bannerId N    Pay for and make N pulls without showing the
 *                            screen. Rewards go straight to the party. The
 *                            best rarity is stored in "Result Variable"
 *                            (-1 if the player could not pay).
 *   Gacha free bannerId N    Same as pull, but costs nothing (tutorials,
 *                            login bonuses, quest rewards...).
 *   Gacha unlock bannerId    Make a banner available.
 *   Gacha lock bannerId      Hide a banner (e.g. when an event ends).
 *   Gacha resetpity bannerId Reset the pity counters of a banner.
 *
 * ------------------------------ Script Calls --------------------------------
 *   Gacha.pull("standard", 10)          returns an array of results or null
 *   Gacha.pull("standard", 1, true)     free pull
 *   Gacha.pullBlocked(banner, 10)       "" if possible, else "funds"/"limit"
 *   Gacha.availableBanners()            list of visible banners
 *
 *   Each result: { rarity, type, id, count, featured, isNew, dupe, refund }
 */

var Imported = Imported || {};
Imported.GachaSystem = true;

var Gacha = Gacha || {};
Gacha.Banners = Gacha.Banners || [];

//=============================================================================
// Parameters, constants
//=============================================================================

(function() {
    'use strict';

    var parameters = PluginManager.parameters('GachaSystem');

    function num(key, def) {
        var v = parameters[key];
        if (v === undefined || v === '') { return def; }
        var n = Number(v);
        return isNaN(n) ? def : n;
    }
    function str(key, def) {
        var v = parameters[key];
        return (v === undefined || v === '') ? def : String(v);
    }
    function bool(key, def) {
        var v = parameters[key];
        if (v === undefined || v === '') { return def; }
        return String(v).toLowerCase() === 'true';
    }

    Gacha.RARITIES = ['N', 'R', 'SR', 'SSR', 'UR'];

    var refund = str('Duplicate Refund', '50,150,500,2000,10000').split(',').map(function(s) {
        var n = Number(s);
        return isNaN(n) ? 0 : n;
    });
    while (refund.length < 5) { refund.push(0); }

    Gacha.Params = {
        currencyType: str('Currency Type', 'gold').toLowerCase(),
        currencyId: num('Currency ID', 1),
        currencyName: str('Currency Name', 'Gems'),
        costSingle: num('Single Cost', 300),
        costMulti: num('Multi Cost', 3000),
        multiCount: Math.max(2, Math.floor(num('Multi Count', 10))),
        rates: {
            N: num('Rate N', 49.4), R: num('Rate R', 30), SR: num('Rate SR', 14),
            SSR: num('Rate SSR', 6), UR: num('Rate UR', 0.6)
        },
        pity: {
            SSR: { soft: num('SSR Soft Pity', 40), hard: num('SSR Hard Pity', 50), step: num('SSR Soft Step', 10) },
            UR:  { soft: num('UR Soft Pity', 70),  hard: num('UR Hard Pity', 90),  step: num('UR Soft Step', 5) }
        },
        multiGuarantee: str('Multi Guarantee', 'SR').toUpperCase(),
        featuredRate: num('Featured Rate', 50),
        guarantee: bool('Guarantee After Loss', true),
        dupeRefund: refund,
        resultVariable: num('Result Variable', 0),
        maxHistory: num('Max History', 60),
        addToMenu: bool('Add To Menu', true),
        menuName: str('Menu Command Name', 'Summon'),
        colors: {
            N: str('Color N', '#a8a8a8'), R: str('Color R', '#6fd36f'), SR: str('Color SR', '#5aa9ff'),
            SSR: str('Color SSR', '#ffd54a'), UR: str('Color UR', '#ff5c8a')
        },
        se: {
            N: str('SE Reveal', 'Decision1'), R: str('SE Reveal', 'Decision1'), SR: str('SE SR', 'Item3'),
            SSR: str('SE SSR', 'Powerup'), UR: str('SE UR', 'Applause1')
        }
    };
})();

//=============================================================================
// Engine: banner normalisation and the pull algorithm (no MV dependencies)
//=============================================================================

Gacha.rng = Math.random;

Gacha.rank = function(rarity) {
    return Gacha.RARITIES.indexOf(String(rarity).toUpperCase());
};

Gacha.color = function(rarity) {
    return Gacha.Params.colors[rarity] || '#ffffff';
};

Gacha._merge = function(base, over) {
    var out = {}, k;
    for (k in base) { if (base.hasOwnProperty(k)) { out[k] = base[k]; } }
    if (over) { for (k in over) { if (over.hasOwnProperty(k)) { out[k] = over[k]; } } }
    return out;
};

Gacha.normalizeEntry = function(raw) {
    var type = String(raw.type || 'item').toLowerCase();
    return {
        type: type,
        id: Number(raw.id) || 0,
        count: Math.max(1, Math.floor(raw.count || 1)),
        weight: raw.weight > 0 ? Number(raw.weight) : 1,
        featured: !!raw.featured
    };
};

// Turns the author-facing banner definition into the structure the engine uses.
Gacha.normalizeBanner = function(raw) {
    var P = Gacha.Params, R = Gacha.RARITIES, b = {}, i, r;
    b.id = String(raw.id);
    b.name = raw.name || b.id;
    b.description = raw.description || '';
    b.pityGroup = raw.pityGroup ? String(raw.pityGroup) : b.id;
    b.switchId = raw.switchId || 0;
    b.defaultUnlocked = raw.unlocked !== false;
    b.maxPulls = raw.maxPulls || 0;
    b.multiCount = raw.multiCount ? Math.max(2, Math.floor(raw.multiCount)) : P.multiCount;
    b.costSingle = raw.costSingle != null ? raw.costSingle : P.costSingle;
    b.costMulti = raw.costMulti != null ? raw.costMulti : P.costMulti;
    b.currency = Gacha._merge({ type: P.currencyType, id: P.currencyId, name: P.currencyName }, raw.currency);
    b.currency.type = String(b.currency.type).toLowerCase();
    b.multiGuarantee = String(raw.multiGuarantee || P.multiGuarantee).toUpperCase();
    if (Gacha.rank(b.multiGuarantee) < 0) { b.multiGuarantee = 'N'; }
    b.featuredRate = raw.featuredRate != null ? raw.featuredRate : P.featuredRate;
    b.guarantee = raw.guarantee != null ? !!raw.guarantee : P.guarantee;

    b.pool = {};
    for (i = 0; i < R.length; i++) {
        b.pool[R[i]] = ((raw.pool && raw.pool[R[i]]) || []).map(Gacha.normalizeEntry);
    }

    // Rates: banner overrides, empty pools can never drop, then scale to 100.
    var rates = Gacha._merge(P.rates, raw.rates), total = 0;
    for (i = 0; i < R.length; i++) {
        r = R[i];
        rates[r] = (b.pool[r].length > 0 && rates[r] > 0) ? Number(rates[r]) : 0;
        total += rates[r];
    }
    b.valid = total > 0;
    for (i = 0; i < R.length; i++) {
        rates[R[i]] = total > 0 ? rates[R[i]] / total * 100 : 0;
    }
    b.rates = rates;

    var rp = raw.pity || {};
    b.pity = {
        SSR: Gacha._merge(P.pity.SSR, rp.SSR),
        UR: Gacha._merge(P.pity.UR, rp.UR)
    };
    ['SSR', 'UR'].forEach(function(k) {
        if (rates[k] <= 0) { b.pity[k].hard = 0; b.pity[k].soft = 0; }
    });
    return b;
};

Gacha.pityRate = function(base, n, p) {
    if (base <= 0 || !p) { return base; }
    if (p.hard > 0 && n >= p.hard) { return 100; }
    if (p.soft > 0 && n >= p.soft) { return Math.min(100, base + (n - p.soft + 1) * p.step); }
    return base;
};

// Drop rates (percent, sum 100) for the next pull given the pity state `st`.
// minRank > 0 removes every rarity below it (used for the multi-pull guarantee).
Gacha.effectiveRates = function(b, st, minRank) {
    var R = Gacha.RARITIES, base = b.rates, eff = {}, i;
    var ur = Gacha.pityRate(base.UR, st.ur + 1, b.pity.UR);
    var ssr = Gacha.pityRate(base.SSR, st.ssr + 1, b.pity.SSR);
    ssr = Math.min(ssr, 100 - ur);
    var lowBase = base.N + base.R + base.SR;
    var rest = Math.max(0, 100 - ur - ssr);
    eff.UR = ur;
    eff.SSR = ssr;
    ['N', 'R', 'SR'].forEach(function(r) {
        eff[r] = lowBase > 0 ? base[r] / lowBase * rest : 0;
    });
    var tot = 0;
    if (minRank > 0) {
        for (i = minRank; i < R.length; i++) { tot += eff[R[i]]; }
        if (tot > 0) {
            for (i = 0; i < minRank; i++) { eff[R[i]] = 0; }
        }
    }
    tot = 0;
    for (i = 0; i < R.length; i++) { tot += eff[R[i]]; }
    for (i = 0; i < R.length; i++) { eff[R[i]] = tot > 0 ? eff[R[i]] / tot * 100 : 0; }
    return eff;
};

Gacha.rollRarity = function(b, st, minRank, rng) {
    var R = Gacha.RARITIES, eff = Gacha.effectiveRates(b, st, minRank);
    var roll = rng() * 100, acc = 0, last = 'N', i;
    for (i = R.length - 1; i >= 0; i--) {
        if (eff[R[i]] <= 0) { continue; }
        last = R[i];
        acc += eff[R[i]];
        if (roll < acc) { return R[i]; }
    }
    return last;
};

Gacha.weightedPick = function(list, rng) {
    var sum = 0, i;
    for (i = 0; i < list.length; i++) { sum += list[i].weight; }
    var roll = rng() * sum;
    for (i = 0; i < list.length; i++) {
        roll -= list[i].weight;
        if (roll < 0) { return list[i]; }
    }
    return list[list.length - 1];
};

// Picks an entry of the rarity, applying rate-up and the lose-then-guaranteed rule.
Gacha.pickEntry = function(b, st, rarity, rng) {
    var pool = b.pool[rarity];
    var feat = pool.filter(function(e) { return e.featured; });
    var other = pool.filter(function(e) { return !e.featured; });
    if (feat.length > 0 && other.length > 0) {
        var useFeat = !!st.guar[rarity] || rng() * 100 < b.featuredRate;
        st.guar[rarity] = !useFeat && b.guarantee;
        return Gacha.weightedPick(useFeat ? feat : other, rng);
    }
    return Gacha.weightedPick(pool, rng);
};

Gacha.newState = function() {
    return { ssr: 0, ur: 0, total: 0, guar: {} };
};

// Rolls `count` pulls, advancing the pity state `st`. Does not touch the party.
Gacha.roll = function(b, st, count, rng) {
    rng = rng || Gacha.rng;
    var gRank = Gacha.rank(b.multiGuarantee), results = [], got = false, i;
    for (i = 0; i < count; i++) {
        var useGuarantee = count >= b.multiCount && i === count - 1 && !got;
        var rarity = Gacha.rollRarity(b, st, useGuarantee ? gRank : 0, rng);
        var entry = Gacha.pickEntry(b, st, rarity, rng);
        var rank = Gacha.rank(rarity);
        results.push({
            rarity: rarity, type: entry.type, id: entry.id, count: entry.count, featured: entry.featured,
            pityAt: st.ur + 1
        });
        st.total++; st.ssr++; st.ur++;
        if (rank >= 3) { st.ssr = 0; }
        if (rank >= 4) { st.ur = 0; }
        if (rank >= gRank) { got = true; }
    }
    return results;
};

//=============================================================================
// Game integration: save data, currency, granting rewards
//=============================================================================

Game_System.prototype.gachaData = function() {
    if (!this._gachaData) {
        this._gachaData = { banners: {}, history: [], owned: {}, unlocked: {} };
    }
    return this._gachaData;
};

// Other plugins can register functions here to tweak every normalised banner
// (e.g. facility upgrades that lower pity). Bump Gacha.revision after the
// inputs of a hook change so the banners are rebuilt.
Gacha.bannerHooks = [];
Gacha.revision = 0;

Gacha.banners = function() {
    var raws = Gacha.Banners;
    if (!Gacha._cache || Gacha._cacheSource !== raws || Gacha._cacheLength !== raws.length ||
        Gacha._cacheRevision !== Gacha.revision) {
        Gacha._cache = raws.map(function(raw) {
            var b = Gacha.normalizeBanner(raw);
            Gacha.bannerHooks.forEach(function(hook) { hook(b); });
            return b;
        });
        Gacha._cacheSource = raws;
        Gacha._cacheLength = raws.length;
        Gacha._cacheRevision = Gacha.revision;
    }
    return Gacha._cache;
};

Gacha.getBanner = function(id) {
    var list = Gacha.banners(), i;
    for (i = 0; i < list.length; i++) {
        if (list[i].id === String(id)) { return list[i]; }
    }
    return null;
};

Gacha.isUnlocked = function(b) {
    var u = $gameSystem.gachaData().unlocked[b.id];
    var on = u !== undefined ? u : b.defaultUnlocked;
    return on && (!b.switchId || $gameSwitches.value(b.switchId));
};

Gacha.availableBanners = function() {
    return Gacha.banners().filter(function(b) { return b.valid && Gacha.isUnlocked(b); });
};

Gacha.setUnlocked = function(id, value) {
    $gameSystem.gachaData().unlocked[String(id)] = value;
};

Gacha.state = function(b) {
    var all = $gameSystem.gachaData().banners;
    if (!all[b.pityGroup]) { all[b.pityGroup] = Gacha.newState(); }
    return all[b.pityGroup];
};

Gacha.resetPity = function(id) {
    var b = Gacha.getBanner(id);
    if (b) { $gameSystem.gachaData().banners[b.pityGroup] = Gacha.newState(); }
};

// ---- currency ---------------------------------------------------------------

Gacha.currencyName = function(b) {
    var c = b.currency;
    if (c.type === 'gold') { return TextManager.currencyUnit; }
    if (c.type === 'item') {
        var item = $dataItems[c.id];
        return item ? item.name : '?';
    }
    return c.name;
};

Gacha.balance = function(b) {
    var c = b.currency;
    if (c.type === 'gold') { return $gameParty.gold(); }
    if (c.type === 'item') {
        var item = $dataItems[c.id];
        return item ? $gameParty.numItems(item) : 0;
    }
    return $gameVariables.value(c.id);
};

Gacha.spend = function(b, amount) {
    var c = b.currency;
    if (amount <= 0) { return; }
    if (c.type === 'gold') { $gameParty.loseGold(amount); }
    else if (c.type === 'item') { $gameParty.loseItem($dataItems[c.id], amount); }
    else { $gameVariables.setValue(c.id, $gameVariables.value(c.id) - amount); }
};

Gacha.cost = function(b, count) {
    return count === b.multiCount ? b.costMulti : b.costSingle * count;
};

// "" when the pull is possible, otherwise "nobanner", "limit" or "funds".
Gacha.pullBlocked = function(b, count, free) {
    if (!b) { return 'nobanner'; }
    if (b.maxPulls > 0 && Gacha.state(b).total + count > b.maxPulls) { return 'limit'; }
    if (!free && Gacha.balance(b) < Gacha.cost(b, count)) { return 'funds'; }
    return '';
};

// ---- rewards ----------------------------------------------------------------

Gacha.database = function(type) {
    switch (type) {
    case 'item': return $dataItems;
    case 'weapon': return $dataWeapons;
    case 'armor': return $dataArmors;
    case 'actor': return $dataActors;
    }
    return null;
};

Gacha.entryName = function(e) {
    if (e.type === 'gold') { return e.count + TextManager.currencyUnit; }
    var db = Gacha.database(e.type), o = db && db[e.id];
    var name = o ? o.name : '(missing ' + e.type + ' ' + e.id + ')';
    return e.count > 1 ? name + ' x' + e.count : name;
};

Gacha.entryIcon = function(e) {
    var db = Gacha.database(e.type), o = db && db[e.id];
    return o && o.iconIndex ? o.iconIndex : 0;
};

// Gives one result to the party and fills in isNew / dupe / refund.
Gacha.grant = function(r) {
    var data = $gameSystem.gachaData(), key = r.type + ':' + r.id;
    var seen = !!data.owned[key];
    data.owned[key] = true;
    r.isNew = !seen;
    r.dupe = false;
    r.refund = 0;
    if (r.type === 'gold') {
        $gameParty.gainGold(r.count);
        r.isNew = false;
    } else if (r.type === 'actor') {
        var inParty = $gameParty._actors.indexOf(r.id) >= 0;
        if (inParty || seen) {
            r.dupe = true;
            r.isNew = false;
            Gacha.onDuplicateActor(r);
        } else if ($dataActors[r.id]) {
            $gameParty.addActor(r.id);
            Gacha.onNewActor(r);
        }
    } else {
        var db = Gacha.database(r.type);
        if (db && db[r.id]) { $gameParty.gainItem(db[r.id], r.count); }
    }
};

// Hooks so a game can change what a duplicate actor does (default: gold refund)
// and react to a brand new actor joining. Set r.note to show text in the results.
Gacha.onDuplicateActor = function(r) {
    r.refund = Gacha.Params.dupeRefund[Gacha.rank(r.rarity)] || 0;
    if (r.refund > 0) { $gameParty.gainGold(r.refund); }
};

Gacha.onNewActor = function(r) {};

Gacha.logHistory = function(b, results) {
    var data = $gameSystem.gachaData(), max = Gacha.Params.maxHistory;
    if (max <= 0) { return; }
    results.forEach(function(r) {
        data.history.unshift({ banner: b.name, rarity: r.rarity, type: r.type, id: r.id, count: r.count });
    });
    if (data.history.length > max) { data.history.length = max; }
};

// Pays, rolls and grants. Returns the results or null when the pull is not possible.
Gacha.pull = function(bannerId, count, free) {
    var b = typeof bannerId === 'object' ? bannerId : Gacha.getBanner(bannerId);
    count = Math.max(1, Math.floor(count || 1));
    var v = Gacha.Params.resultVariable;
    Gacha.lastError = Gacha.pullBlocked(b, count, free);
    if (Gacha.lastError || !b.valid) {
        if (v > 0) { $gameVariables.setValue(v, -1); }
        return null;
    }
    if (!free) { Gacha.spend(b, Gacha.cost(b, count)); }
    var results = Gacha.roll(b, Gacha.state(b), count);
    results.forEach(Gacha.grant);
    Gacha.logHistory(b, results);
    if (v > 0) {
        var best = 0;
        results.forEach(function(r) { best = Math.max(best, Gacha.rank(r.rarity)); });
        $gameVariables.setValue(v, best);
    }
    Gacha.lastResults = results;
    return results;
};

Gacha.playSe = function(rarity) {
    var name = Gacha.Params.se[rarity];
    if (name) { AudioManager.playSe({ name: name, volume: 90, pitch: 100, pan: 0 }); }
};

//=============================================================================
// Plugin commands and main menu
//=============================================================================

Gacha.pluginCommand = function(args) {
    var sub = String(args[0] || '').toLowerCase(), id = args[1], count = Number(args[2]) || 1;
    switch (sub) {
    case 'open':
        Gacha.startBanner = id || null;
        SceneManager.push(Scene_Gacha);
        break;
    case 'pull': Gacha.pull(id, count, false); break;
    case 'free': Gacha.pull(id, count, true); break;
    case 'unlock': Gacha.setUnlocked(id, true); break;
    case 'lock': Gacha.setUnlocked(id, false); break;
    case 'resetpity': Gacha.resetPity(id); break;
    }
};

(function() {
    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (String(command).toLowerCase() === 'gacha') { Gacha.pluginCommand(args); }
    };

    var _addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _addOriginalCommands.call(this);
        if (Gacha.Params.addToMenu) {
            this.addCommand(Gacha.Params.menuName, 'gacha', Gacha.availableBanners().length > 0);
        }
    };

    var _createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _createCommandWindow.call(this);
        this._commandWindow.setHandler('gacha', this.commandGacha.bind(this));
    };

    Scene_Menu.prototype.commandGacha = function() {
        Gacha.startBanner = null;
        SceneManager.push(Scene_Gacha);
    };
})();

//=============================================================================
// Window_GachaBanners : list of banners
//=============================================================================

function Window_GachaBanners() {
    this.initialize.apply(this, arguments);
}

Window_GachaBanners.prototype = Object.create(Window_Selectable.prototype);
Window_GachaBanners.prototype.constructor = Window_GachaBanners;

Window_GachaBanners.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this._list = Gacha.availableBanners();
    this._infoWindow = null;
    this.refresh();
    this.select(this._list.length > 0 ? 0 : -1);
    this.activate();
};

Window_GachaBanners.prototype.maxItems = function() {
    return this._list ? this._list.length : 0;
};

Window_GachaBanners.prototype.banner = function() {
    return this._list ? this._list[this.index()] || null : null;
};

Window_GachaBanners.prototype.selectById = function(id) {
    var i;
    for (i = 0; i < this._list.length; i++) {
        if (this._list[i].id === String(id)) { this.select(i); return; }
    }
};

Window_GachaBanners.prototype.setInfoWindow = function(win) {
    this._infoWindow = win;
    win.setBanner(this.banner());
};

Window_GachaBanners.prototype.select = function(index) {
    Window_Selectable.prototype.select.call(this, index);
    if (this._infoWindow) { this._infoWindow.setBanner(this.banner()); }
};

Window_GachaBanners.prototype.drawItem = function(index) {
    var rect = this.itemRectForText(index);
    this.resetTextColor();
    this.drawText(this._list[index].name, rect.x, rect.y, rect.width);
};

//=============================================================================
// Window_GachaInfo : details of the selected banner
//=============================================================================

function Window_GachaInfo() {
    this.initialize.apply(this, arguments);
}

Window_GachaInfo.prototype = Object.create(Window_Base.prototype);
Window_GachaInfo.prototype.constructor = Window_GachaInfo;

Window_GachaInfo.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this._banner = null;
    this.refresh();
};

Window_GachaInfo.prototype.setBanner = function(banner) {
    this._banner = banner;
    this.refresh();
};

Window_GachaInfo.prototype.wrap = function(text, width) {
    var out = [];
    String(text).split('\n').forEach(function(para) {
        var words = para.split(' '), line = '';
        words.forEach(function(word) {
            var test = line ? line + ' ' + word : word;
            if (line && this.textWidth(test) > width) { out.push(line); line = word; }
            else { line = test; }
        }, this);
        out.push(line);
    }, this);
    return out;
};

Window_GachaInfo.prototype.refresh = function() {
    if (!this.contents) { return; }
    this.contents.clear();
    this.resetFontSettings();
    var b = this._banner, w = this.contentsWidth(), y = 0, i;
    if (!b) {
        this.drawText('No banners available.', 0, 0, w, 'center');
        return;
    }
    var R = Gacha.RARITIES, st = Gacha.state(b);

    this.contents.fontSize = 32;
    this.drawText(b.name, 0, y, w, 'center');
    y += 44;

    this.contents.fontSize = 22;
    var desc = this.wrap(b.description, w);
    for (i = 0; i < desc.length && i < 3; i++) {
        this.drawText(desc[i], 0, y, w);
        y += 26;
    }
    y += 8;

    // base rates, rarest first
    var cw = w / R.length;
    for (i = R.length - 1; i >= 0; i--) {
        var col = R.length - 1 - i;
        this.contents.fontSize = 26;
        this.changeTextColor(Gacha.color(R[i]));
        this.drawText(R[i], col * cw, y, cw, 'center');
        this.contents.fontSize = 22;
        this.resetTextColor();
        this.drawText(b.rates[R[i]].toFixed(2) + '%', col * cw, y + 28, cw, 'center');
    }
    y += 70;

    // pity
    [['SSR', 'ssr', 'SSR+'], ['UR', 'ur', 'UR']].forEach(function(p) {
        var cfg = b.pity[p[0]];
        if (cfg.hard <= 0) { return; }
        var text = p[2] + ' pity: ' + st[p[1]] + ' / ' + cfg.hard;
        if (st.guar[p[0]]) { text += '   (next is featured!)'; }
        this.changeTextColor(Gacha.color(p[0]));
        this.drawText(text, 0, y, w);
        y += 26;
    }, this);
    this.resetTextColor();
    y += 6;

    // featured entries
    var featured = [];
    for (i = R.length - 1; i >= 0; i--) {
        b.pool[R[i]].forEach(function(e) { if (e.featured) { featured.push(Gacha.entryName(e)); } });
    }
    if (featured.length > 0) {
        this.changeTextColor(this.systemColor());
        this.drawText('Rate-up:', 0, y, w);
        this.resetTextColor();
        var fl = this.wrap(featured.join(', '), w - 90);
        for (i = 0; i < fl.length && i < 2; i++) {
            this.drawText(fl[i], 90, y, w - 90);
            y += 26;
        }
        y += 6;
    }

    // cost and balance
    var unit = Gacha.currencyName(b);
    this.drawText('x1: ' + Gacha.cost(b, 1) + ' ' + unit + '    x' + b.multiCount + ': ' +
        b.costMulti + ' ' + unit, 0, y, w);
    y += 26;
    this.drawText('You have: ' + Gacha.balance(b) + ' ' + unit, 0, y, w);
    y += 26;
    if (b.maxPulls > 0) {
        this.drawText('Pulls left on this banner: ' + Math.max(0, b.maxPulls - st.total), 0, y, w);
    }
};

//=============================================================================
// Window_GachaCommand : pull / rates / history / back
//=============================================================================

function Window_GachaCommand() {
    this.initialize.apply(this, arguments);
}

Window_GachaCommand.prototype = Object.create(Window_HorzCommand.prototype);
Window_GachaCommand.prototype.constructor = Window_GachaCommand;

Window_GachaCommand.prototype.initialize = function(x, y) {
    this._banner = null;
    Window_HorzCommand.prototype.initialize.call(this, x, y);
    this.deactivate();
};

Window_GachaCommand.prototype.maxCols = function() {
    return 5;
};

Window_GachaCommand.prototype.setBanner = function(banner) {
    this._banner = banner;
    this.refresh();
};

Window_GachaCommand.prototype.makeCommandList = function() {
    var b = this._banner, n = b ? b.multiCount : Gacha.Params.multiCount;
    this.addCommand('Pull x1', 'pull1', !!b && Gacha.pullBlocked(b, 1) === '');
    this.addCommand('Pull x' + n, 'pullN', !!b && Gacha.pullBlocked(b, n) === '');
    this.addCommand('Rates', 'rates', !!b);
    this.addCommand('History', 'history', true);
    this.addCommand('Back', 'cancel', true);
};

//=============================================================================
// Window_GachaPopup : results / rates / history (scrollable list of lines)
//=============================================================================

function Window_GachaPopup() {
    this.initialize.apply(this, arguments);
}

Window_GachaPopup.prototype = Object.create(Window_Selectable.prototype);
Window_GachaPopup.prototype.constructor = Window_GachaPopup;

Window_GachaPopup.WIDTH = 660;
Window_GachaPopup.REVEAL_FRAMES = 12;

Window_GachaPopup.prototype.initialize = function() {
    var w = Window_GachaPopup.WIDTH;
    Window_Selectable.prototype.initialize.call(this, (Graphics.boxWidth - w) / 2, 0, w, 120);
    this._lines = [];
    this._revealing = false;
    this._revealed = 0;
    this._timer = 0;
    this._revealHandler = null;
    this._closeHandler = null;
    this.hide();
    this.deactivate();
};

Window_GachaPopup.prototype.setRevealHandler = function(fn) { this._revealHandler = fn; };
Window_GachaPopup.prototype.setCloseHandler = function(fn) { this._closeHandler = fn; };

Window_GachaPopup.prototype.maxItems = function() {
    return this._lines ? this._lines.length : 0;
};

Window_GachaPopup.prototype.open_ = function(lines, animate) {
    this._lines = lines;
    this._revealing = !!animate;
    this._revealed = 0;
    this._timer = Window_GachaPopup.REVEAL_FRAMES;
    this.height = Math.min(this.fittingHeight(lines.length), Graphics.boxHeight - 40);
    this.y = (Graphics.boxHeight - this.height) / 2;
    this.createContents();
    this.setTopRow(0);
    this.select(-1);
    this.refresh();
    this.show();
    this.activate();
};

Window_GachaPopup.prototype.showResults = function(lines) { this.open_(lines, true); };
Window_GachaPopup.prototype.showText = function(lines) { this.open_(lines, false); };

Window_GachaPopup.prototype.update = function() {
    Window_Selectable.prototype.update.call(this);
    if (this._revealing && --this._timer <= 0) {
        this._timer = Window_GachaPopup.REVEAL_FRAMES;
        this.revealNext();
    }
};

Window_GachaPopup.prototype.revealNext = function() {
    this._revealed++;
    if (this._revealed >= this._lines.length) {
        this._revealing = false;
        return;
    }
    this.redrawItem(this._revealed);
    var line = this._lines[this._revealed];
    if (this._revealHandler) { this._revealHandler(line); }
    if (this._revealed >= this._lines.length - 1) { this._revealing = false; }
};

// Shows everything that is still hidden and reacts only to the best of it.
Window_GachaPopup.prototype.finishReveal = function() {
    var best = null, i;
    for (i = this._revealed + 1; i < this._lines.length; i++) {
        var l = this._lines[i];
        if (l.rarity && (!best || Gacha.rank(l.rarity) > Gacha.rank(best.rarity))) { best = l; }
    }
    this._revealed = this._lines.length;
    this._revealing = false;
    this.refresh();
    if (best && this._revealHandler) { this._revealHandler(best); }
};

Window_GachaPopup.prototype.isOkEnabled = function() { return true; };
Window_GachaPopup.prototype.isCancelEnabled = function() { return true; };

Window_GachaPopup.prototype.advance = function() {
    this.updateInputData();
    if (this._revealing) {
        this.finishReveal();
    } else {
        this.hide();
        this.deactivate();
        if (this._closeHandler) { this._closeHandler(); }
    }
};

Window_GachaPopup.prototype.processOk = function() {
    SoundManager.playOk();
    this.advance();
};

Window_GachaPopup.prototype.processCancel = function() {
    SoundManager.playCancel();
    this.advance();
};

Window_GachaPopup.prototype.onTouch = function(triggered) {
    if (triggered) { this.processOk(); }
};

Window_GachaPopup.prototype.drawItem = function(index) {
    var l = this._lines[index];
    if (this._revealing && index > this._revealed) { return; }
    var rect = this.itemRectForText(index);
    if (l.header) {
        this.changeTextColor(this.systemColor());
        this.drawText(l.text, rect.x, rect.y, rect.width, 'center');
        this.resetTextColor();
        return;
    }
    var x = rect.x + (l.indent || 0);
    var right = rect.x + rect.width;
    if (l.tag) {
        this.changeTextColor(l.color || this.normalColor());
        this.drawText(l.tag, x, rect.y, 56);
    }
    x += 62;
    if (l.icon) {
        this.drawIcon(l.icon, x, rect.y + 2);
        x += 36;
    }
    var rw = 0;
    if (l.right) {
        this.changeTextColor(l.rightColor || this.normalColor());
        rw = this.textWidth(l.right) + 8;
        this.drawText(l.right, rect.x, rect.y, rect.width, 'right');
    }
    this.changeTextColor(l.rarity || l.tag ? (l.color || this.normalColor()) : this.normalColor());
    this.drawText(l.text, x, rect.y, right - x - rw);
    this.resetTextColor();
};

//=============================================================================
// Line builders for the popup
//=============================================================================

Gacha.resultLines = function(results) {
    var lines = [{ header: true, text: 'Summon Results' }];
    results.forEach(function(r) {
        var line = {
            rarity: r.rarity, tag: r.rarity, color: Gacha.color(r.rarity),
            icon: Gacha.entryIcon(r), text: Gacha.entryName(r), right: ''
        };
        if (r.note) {
            line.right = r.note;
        } else if (r.dupe) {
            line.right = 'Dupe' + (r.refund > 0 ? ' +' + r.refund + TextManager.currencyUnit : '');
        } else if (r.isNew) {
            line.right = 'NEW';
        }
        if (r.featured) { line.right = (line.right ? line.right + '  ' : '') + 'UP!'; }
        line.rightColor = Gacha.color(r.rarity);
        lines.push(line);
    });
    return lines;
};

Gacha.ratesLines = function(b) {
    var R = Gacha.RARITIES, lines = [{ header: true, text: b.name + ' - Drop Rates' }], i;
    for (i = R.length - 1; i >= 0; i--) {
        var r = R[i], pool = b.pool[r], rate = b.rates[r];
        if (pool.length === 0) { continue; }
        lines.push({ tag: r, color: Gacha.color(r), rarity: r, text: 'Total', right: rate.toFixed(3) + '%',
            rightColor: Gacha.color(r) });
        var sumAll = 0, sumFeat = 0, sumOther = 0;
        pool.forEach(function(e) {
            sumAll += e.weight;
            if (e.featured) { sumFeat += e.weight; } else { sumOther += e.weight; }
        });
        var split = sumFeat > 0 && sumOther > 0;
        pool.forEach(function(e) {
            var share;
            if (split) {
                var f = b.featuredRate / 100;
                share = e.featured ? f * e.weight / sumFeat : (1 - f) * e.weight / sumOther;
            } else {
                share = e.weight / sumAll;
            }
            lines.push({
                indent: 16, icon: Gacha.entryIcon(e), text: Gacha.entryName(e) + (e.featured ? '  UP!' : ''),
                right: (rate * share).toFixed(3) + '%'
            });
        });
    }
    [['SSR', 'SSR+'], ['UR', 'UR']].forEach(function(p) {
        var c = b.pity[p[0]];
        if (c.hard > 0) {
            var text = p[1] + ' guaranteed on pull ' + c.hard + (c.soft > 0 ? ' (rate rises from pull ' + c.soft + ')' : '');
            lines.push({ text: text, color: Gacha.color(p[0]), tag: '', rarity: p[0] });
        }
    });
    lines.push({ text: 'x' + b.multiCount + ' pulls always include ' + b.multiGuarantee + ' or better.' });
    return lines;
};

Gacha.historyLines = function() {
    var h = $gameSystem.gachaData().history;
    var lines = [{ header: true, text: 'Summon History' }];
    if (h.length === 0) { lines.push({ text: 'Nothing summoned yet.' }); }
    h.forEach(function(e) {
        lines.push({
            rarity: e.rarity, tag: e.rarity, color: Gacha.color(e.rarity),
            icon: Gacha.entryIcon(e), text: Gacha.entryName(e), right: e.banner
        });
    });
    return lines;
};

//=============================================================================
// Scene_Gacha
//=============================================================================

function Scene_Gacha() {
    this.initialize.apply(this, arguments);
}

Scene_Gacha.prototype = Object.create(Scene_MenuBase.prototype);
Scene_Gacha.prototype.constructor = Scene_Gacha;

Scene_Gacha.COMMAND_HEIGHT = 72;
Scene_Gacha.LIST_WIDTH = 260;

Scene_Gacha.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_Gacha.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createBannerWindow();
    this.createInfoWindow();
    this.createCommandWindow();
    this.createPopupWindow();
    this.createFlash();
};

Scene_Gacha.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
    if (Gacha.startBanner) {
        this._bannerWindow.selectById(Gacha.startBanner);
        Gacha.startBanner = null;
    }
};

Scene_Gacha.prototype.mainHeight = function() {
    return Graphics.boxHeight - Scene_Gacha.COMMAND_HEIGHT;
};

Scene_Gacha.prototype.createBannerWindow = function() {
    this._bannerWindow = new Window_GachaBanners(0, 0, Scene_Gacha.LIST_WIDTH, this.mainHeight());
    this._bannerWindow.setHandler('ok', this.onBannerOk.bind(this));
    this._bannerWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._bannerWindow);
};

Scene_Gacha.prototype.createInfoWindow = function() {
    var x = Scene_Gacha.LIST_WIDTH;
    this._infoWindow = new Window_GachaInfo(x, 0, Graphics.boxWidth - x, this.mainHeight());
    this.addWindow(this._infoWindow);
    this._bannerWindow.setInfoWindow(this._infoWindow);
};

Scene_Gacha.prototype.createCommandWindow = function() {
    this._commandWindow = new Window_GachaCommand(0, this.mainHeight());
    this._commandWindow.setHandler('pull1', this.onPull.bind(this, 1));
    this._commandWindow.setHandler('pullN', this.onPullMulti.bind(this));
    this._commandWindow.setHandler('rates', this.onRates.bind(this));
    this._commandWindow.setHandler('history', this.onHistory.bind(this));
    this._commandWindow.setHandler('cancel', this.onCommandCancel.bind(this));
    this.addWindow(this._commandWindow);
};

Scene_Gacha.prototype.createPopupWindow = function() {
    this._popup = new Window_GachaPopup();
    this._popup.setRevealHandler(this.onReveal.bind(this));
    this._popup.setCloseHandler(this.onPopupClose.bind(this));
    this.addWindow(this._popup);
};

Scene_Gacha.prototype.createFlash = function() {
    this._flash = new Sprite(new Bitmap(Graphics.width, Graphics.height));
    this._flash.opacity = 0;
    this.addChild(this._flash);
};

Scene_Gacha.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);
    if (this._flash.opacity > 0) { this._flash.opacity -= 8; }
};

Scene_Gacha.prototype.currentBanner = function() {
    return this._bannerWindow.banner();
};

Scene_Gacha.prototype.onBannerOk = function() {
    var b = this.currentBanner();
    if (!b) {
        SoundManager.playBuzzer();
        this._bannerWindow.activate();
        return;
    }
    this._commandWindow.setBanner(b);
    this._commandWindow.select(0);
    this._commandWindow.activate();
};

Scene_Gacha.prototype.onCommandCancel = function() {
    this._commandWindow.deactivate();
    this._bannerWindow.activate();
};

Scene_Gacha.prototype.onPullMulti = function() {
    this.onPull(this.currentBanner().multiCount);
};

Scene_Gacha.prototype.onPull = function(count) {
    var results = Gacha.pull(this.currentBanner(), count, false);
    if (!results) {
        SoundManager.playBuzzer();
        this._commandWindow.activate();
        return;
    }
    this._popup.showResults(Gacha.resultLines(results));
};

Scene_Gacha.prototype.onRates = function() {
    this._popup.showText(Gacha.ratesLines(this.currentBanner()));
};

Scene_Gacha.prototype.onHistory = function() {
    this._popup.showText(Gacha.historyLines());
};

// Called for every line the result popup reveals.
Scene_Gacha.prototype.onReveal = function(line) {
    if (!line.rarity) { return; }
    Gacha.playSe(line.rarity);
    var rank = Gacha.rank(line.rarity);
    if (rank >= 3) {
        this._flash.bitmap.fillAll(Gacha.color(line.rarity));
        this._flash.opacity = rank >= 4 ? 255 : 170;
    }
};

Scene_Gacha.prototype.onPopupClose = function() {
    this._infoWindow.refresh();
    this._commandWindow.refresh();
    this._commandWindow.activate();
};
