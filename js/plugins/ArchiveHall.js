//=============================================================================
// ArchiveHall.js
//=============================================================================

/*:
 * @plugindesc v1.0.0 Archive Hall: facility upgrades, Echo Shards, bounties, dividends, lore rewards and Echo memories.
 * @author RPG Maker Gacha
 *
 * @help
 * Requires GachaSystem.js, ArchiveData.js and ArchiveEchoes.js. The events and
 * common events of the game call this API from Script commands:
 *
 *   Hall.addShards(n) / Hall.shards()   Echo Shards live in game variable 1.
 *   Hall.level("shrine"|"desk"|"forge") facility level (1-3)
 *   Hall.upgrade(1|2|3)                 pays Gold + Ink Pages and upgrades
 *   Hall.stock() / Hall.collect(this)   dividend earned from battles
 *   Hall.ensureBounty() / Hall.turnIn(this) / Hall.bountyText()
 *   Hall.pickHero(this) / Hall.pickPart(this, id) / Hall.playMemory(this, id, part)
 *
 * Facilities:
 *   Shrine of Echoes  Lv2: hard pity -5, Lv3: hard pity -10 (standard and rate-up banners)
 *   Scribe's Desk     Lv2: bounties x1.5 and +4 shards per victory, Lv3: x2 and +8
 *   Binder's Forge    Lv2: SR gear in the shop, Lv3: SSR gear
 */

var Hall = Hall || {};

(function() {
    'use strict';

    var SHARDS_VARIABLE = 1, TEMP_VARIABLE = 3, TEMP2_VARIABLE = 4;
    var STOCK_CAP = 800;

    var FACILITIES = [
        { key: 'shrine', name: 'Shrine of Echoes',
          costs: [null, { gold: 300, pages: 4 }, { gold: 800, pages: 10 }],
          effects: ['Standard pity.', 'Hard pity 5 pulls sooner.', 'Hard pity 10 pulls sooner.'] },
        { key: 'desk', name: 'Scribe\'s Desk',
          costs: [null, { gold: 200, pages: 3 }, { gold: 600, pages: 8 }],
          effects: ['Bounty rewards x1.0.', 'Bounty rewards x1.5 and +4 shards per victory.', 'Bounty rewards x2.0 and +8 shards per victory.'] },
        { key: 'forge', name: 'Binder\'s Forge',
          costs: [null, { gold: 250, pages: 4 }, { gold: 700, pages: 10 }],
          effects: ['Sells N and R gear.', 'Also sells SR gear.', 'Also sells SSR gear.'] }
    ];
    var PITY_BONUS = [0, 5, 10], DESK_MULT = [1, 1.5, 2], DIVIDEND = [0, 4, 8];

    // ---- save data --------------------------------------------------------------------------------
    Game_System.prototype.hallData = function() {
        if (!this._hallData) {
            this._hallData = { levels: { shrine: 1, desk: 1, forge: 1 }, stock: 0, battles: 0, bounty: null, bountiesDone: 0, loreClaimed: 0, expeditions: 0, starterClaimed: false };
        }
        return this._hallData;
    };

    function facility(k) {
        if (typeof k === 'number') { return FACILITIES[k - 1]; }
        var i;
        for (i = 0; i < FACILITIES.length; i++) { if (FACILITIES[i].key === k) { return FACILITIES[i]; } }
        return null;
    }

    // ---- shards, pages -----------------------------------------------------------------------------
    Hall.shards = function() { return $gameVariables.value(SHARDS_VARIABLE); };
    Hall.addShards = function(n) { $gameVariables.setValue(SHARDS_VARIABLE, Math.max(0, Hall.shards() + Math.floor(n))); };
    Hall.pages = function() { return $gameParty.numItems($dataItems[Archive.ID.item.inkPage]); };

    // ---- messages ----------------------------------------------------------------------------------
    function wrap(text, cols) {
        var out = [];
        String(text).split('\n').forEach(function(para) {
            var line = '';
            para.split(' ').forEach(function(w) {
                var test = line ? line + ' ' + w : w;
                if (line && test.replace(/\\[A-Za-z]+\[\d+\]/g, '').length > cols) { out.push(line); line = w; } else { line = test; }
            });
            out.push(line);
        });
        return out;
    }
    Hall.msg = function(interp, text) {
        $gameMessage.setFaceImage('', 0);
        $gameMessage.setBackground(0);
        $gameMessage.setPositionType(2);
        wrap(text, 46).forEach(function(l) { $gameMessage.add(l); });
        interp.setWaitMode('message');
    };

    // The Archive's starter gift of shards (the first summon). Only ever paid once.
    Hall.claimStarter = function() {
        var d = $gameSystem.hallData();
        if (d.starterClaimed) { return false; }
        d.starterClaimed = true;
        Hall.addShards(1000);
        return true;
    };

    // ---- facilities --------------------------------------------------------------------------------
    Hall.level = function(k) {
        var f = facility(k);
        return f ? $gameSystem.hallData().levels[f.key] : 1;
    };

    Hall.nextCost = function(k) {
        var f = facility(k), lv = Hall.level(k);
        return lv < f.costs.length ? f.costs[lv] : null;
    };

    Hall.canUpgrade = function(k) {
        var c = Hall.nextCost(k);
        return !!c && $gameParty.gold() >= c.gold && Hall.pages() >= c.pages;
    };

    Hall.upgradeText = function(k) {
        var f = facility(k), lv = Hall.level(k), c = Hall.nextCost(k);
        var t = f.name + ' Lv ' + lv + ': ' + f.effects[lv - 1];
        if (!c) { return t + '\nFully upgraded.'; }
        t += '\nLv ' + (lv + 1) + ': ' + f.effects[lv] + '\nCost: ' + c.gold + TextManager.currencyUnit + ' and ' + c.pages + ' Ink Pages';
        t += '  (you have ' + $gameParty.gold() + TextManager.currencyUnit + ', ' + Hall.pages() + ' pages)';
        if (!Hall.canUpgrade(k)) { t += '\nYou cannot afford this yet.'; }
        return t;
    };

    Hall.upgrade = function(k) {
        var f = facility(k), c = Hall.nextCost(k);
        if (!c || !Hall.canUpgrade(k)) { return false; }
        $gameParty.loseGold(c.gold);
        $gameParty.loseItem($dataItems[Archive.ID.item.inkPage], c.pages);
        $gameSystem.hallData().levels[f.key]++;
        Gacha.revision++;
        return true;
    };

    Hall.upgradedText = function(k) {
        var f = facility(k);
        return f.name + ' is now Lv ' + Hall.level(k) + '!\n' + f.effects[Hall.level(k) - 1];
    };

    // Shrine upgrades lower the hard pity of every banner that has no pull limit.
    Gacha.bannerHooks.push(function(b) {
        if (!$gameSystem || b.maxPulls > 0) { return; }
        var bonus = PITY_BONUS[Hall.level('shrine') - 1] || 0;
        if (bonus <= 0) { return; }
        ['SSR', 'UR'].forEach(function(k) {
            var p = b.pity[k];
            if (p.hard > 0) { p.hard = Math.max(p.soft > 0 ? p.soft + 1 : 1, p.hard - bonus); }
        });
    });

    // ---- dividend & bounties -----------------------------------------------------------------------
    Hall.stock = function() { return $gameSystem.hallData().stock; };
    Hall.collect = function(interp) {
        var d = $gameSystem.hallData(), n = d.stock;
        d.stock = 0;
        Hall.addShards(n);
        Hall.msg(interp, 'You collect \\C[3]' + n + ' Echo Shards\\C[0] from the Archive\'s dividend.');
    };

    // chapter: 0 prologue, 1 after the first summon, 2 after the Curator, 3 after the Warden
    var BOUNTY_POOL = [
        { min: 0, max: 1, enemies: ['inkWisp', 'pageMite'], need: [3, 5] },
        { min: 1, max: 1, enemies: ['huskScribe'], need: [2, 3] },
        { min: 2, max: 3, enemies: ['inkSlime', 'drownedClerk', 'blotHound'], need: [3, 5] },
        { min: 3, max: 3, enemies: ['hollowKnight'], need: [2, 3] }
    ];

    Hall.chapter = function() { return $gameVariables.value(2); };

    Hall.newBounty = function() {
        var ch = Hall.chapter(), pool = [];
        BOUNTY_POOL.forEach(function(p) {
            if (ch >= p.min && ch <= p.max) { p.enemies.forEach(function(e) { pool.push({ key: e, need: p.need }); }); }
        });
        var pick = pool[Math.floor(Math.random() * pool.length)];
        var need = pick.need[0] + Math.floor(Math.random() * (pick.need[1] - pick.need[0] + 1));
        var mult = DESK_MULT[Hall.level('desk') - 1];
        $gameSystem.hallData().bounty = {
            enemyId: Archive.ID.enemy[pick.key], need: need, have: 0,
            shards: Math.floor(need * (50 + 12 * ch) * mult), gold: Math.floor(need * 25 * mult), pages: need >= 4 ? 1 : 0
        };
    };

    Hall.ensureBounty = function() { if (!$gameSystem.hallData().bounty) { Hall.newBounty(); } };
    Hall.abandonBounty = function() { $gameSystem.hallData().bounty = null; };
    Hall.bountyReady = function() { var b = $gameSystem.hallData().bounty; return !!b && b.have >= b.need; };

    Hall.bountyText = function() {
        var b = $gameSystem.hallData().bounty;
        if (!b) { return 'No bounty posted.'; }
        var name = $dataEnemies[b.enemyId].name;
        var t = 'Bounty: defeat ' + b.need + ' x ' + name + '.\nProgress: ' + Math.min(b.have, b.need) + ' / ' + b.need;
        t += '\nReward: \\C[3]' + b.shards + '\\C[0] Echo Shards, ' + b.gold + TextManager.currencyUnit + (b.pages ? ', ' + b.pages + ' Ink Page' : '') + '.';
        return t;
    };

    Hall.turnIn = function(interp) {
        var d = $gameSystem.hallData(), b = d.bounty;
        if (!b || b.have < b.need) { return; }
        Hall.addShards(b.shards);
        $gameParty.gainGold(b.gold);
        if (b.pages) { $gameParty.gainItem($dataItems[Archive.ID.item.inkPage], b.pages); }
        d.bountiesDone++;
        d.bounty = null;
        Hall.msg(interp, 'Bounty complete! \\C[3]+' + b.shards + '\\C[0] Echo Shards, +' + b.gold + TextManager.currencyUnit + (b.pages ? ', +' + b.pages + ' Ink Page' : '') + '.');
    };

    Hall.onVictory = function(deadEnemies) {
        var d = $gameSystem.hallData();
        d.battles++;
        var div = DIVIDEND[Hall.level('desk') - 1] || 0;
        if (div > 0) { d.stock = Math.min(STOCK_CAP, d.stock + div); }
        if (d.bounty && d.bounty.have < d.bounty.need) {
            deadEnemies.forEach(function(e) { if (e.enemyId() === d.bounty.enemyId) { d.bounty.have++; } });
        }
    };

    var _processVictory = BattleManager.processVictory;
    BattleManager.processVictory = function() {
        Hall.onVictory($gameTroop.deadMembers());
        _processVictory.call(this);
    };

    // ---- lore --------------------------------------------------------------------------------------
    var LORE_REWARDS = [
        { count: 2, text: '3 Ink Pages', give: function() { $gameParty.gainItem($dataItems[Archive.ID.item.inkPage], 3); } },
        { count: 4, text: '400 Echo Shards', give: function() { Hall.addShards(400); } },
        { count: 6, text: '5 Ink Pages', give: function() { $gameParty.gainItem($dataItems[Archive.ID.item.inkPage], 5); } },
        { count: 8, text: '3 Echo Caches', give: function() { $gameParty.gainItem($dataItems[Archive.ID.item.echoCache], 3); } }
    ];
    Hall.loreCount = function() { return $gameParty.numItems($dataItems[Archive.ID.item.lorePage]); };

    Hall.claimLore = function(interp) {
        var d = $gameSystem.hallData(), n = Hall.loreCount(), text = 'Lore Fragments found: ' + n + '.', got = [];
        while (d.loreClaimed < LORE_REWARDS.length && n >= LORE_REWARDS[d.loreClaimed].count) {
            LORE_REWARDS[d.loreClaimed].give();
            got.push(LORE_REWARDS[d.loreClaimed].text);
            d.loreClaimed++;
        }
        if (got.length) { text += '\nThe Archive rewards you: \\C[3]' + got.join(', ') + '\\C[0].'; }
        if (d.loreClaimed < LORE_REWARDS.length) {
            text += '\nNext reward at ' + LORE_REWARDS[d.loreClaimed].count + ' fragments: ' + LORE_REWARDS[d.loreClaimed].text + '.';
        } else {
            text += '\nEvery reward has been claimed.';
        }
        Hall.msg(interp, text);
    };

    // ---- party helpers -----------------------------------------------------------------------------
    Hall.partyCount = function() { return $gameParty.members().length; };
    Hall.partyBest = function() {
        var best = -1;
        $gameParty.members().forEach(function(a) { best = Math.max(best, Echoes.rank(a.actorId())); });
        return best;
    };
    Hall.noteExpedition = function() { $gameSystem.hallData().expeditions++; };

    Hall.partyReport = function(interp) {
        var members = $gameParty.battleMembers();
        var t = 'Party: ' + members.map(function(a) { return a.name() + ' Lv' + a.level; }).join(', ') + '.';
        if ($gameParty.members().length < 2) { t += '\nYou are going in alone. Summon some echoes first!'; }
        Hall.msg(interp, t);
    };

    // ---- Echo memories -----------------------------------------------------------------------------
    function ownedEchoes() {
        var data = $gameSystem.gachaData(), out = [];
        Archive.heroOrder.forEach(function(h) {
            if (h.key === 'iri') { return; }
            var has = $gameParty.members().some(function(a) { return a.actorId() === h.id; }) || !!data.owned['actor:' + h.id];
            if (has) { out.push(h); }
        });
        return out;
    }

    function choose(interp, labels, onChoose) {
        $gameMessage.setChoices(labels, 0, labels.length - 1);
        $gameMessage.setChoiceBackground(0);
        $gameMessage.setChoicePositionType(1);
        $gameMessage.setChoiceCallback(onChoose);
        interp.setWaitMode('message');
    }

    Hall.pickHero = function(interp) {
        var list = ownedEchoes();
        $gameVariables.setValue(TEMP2_VARIABLE, 0);
        if (list.length === 0) {
            Hall.msg(interp, 'The book stays closed. No echo has joined you yet.');
            return;
        }
        var labels = list.map(function(h) {
            var r = Echoes.rarity(h.id);
            return h.name + (r ? ' [' + r + ']' : '');
        });
        labels.push('Close');
        choose(interp, labels, function(n) {
            $gameVariables.setValue(TEMP2_VARIABLE, n < list.length ? list[n].id : 0);
        });
    };

    Hall.pickPart = function(interp, actorId) {
        var lb = Echoes.lb(actorId);
        $gameVariables.setValue(TEMP_VARIABLE, 0);
        var unlocked2 = lb >= Echoes.BURST_LB;
        var labels = ['Memory I', unlocked2 ? 'Memory II' : 'Memory II (needs Limit Break ' + Echoes.BURST_LB + ')', 'Back'];
        choose(interp, labels, function(n) {
            if (n === 0) { $gameVariables.setValue(TEMP_VARIABLE, 1); }
            else if (n === 1 && unlocked2) { $gameVariables.setValue(TEMP_VARIABLE, 2); }
        });
    };

    Hall.playMemory = function(interp, actorId, part) {
        var ce = Archive.memoryCE[actorId] && Archive.memoryCE[actorId][part - 1];
        if (ce && $dataCommonEvents[ce]) { interp.setupChild($dataCommonEvents[ce].list, interp.eventId()); }
    };
})();
