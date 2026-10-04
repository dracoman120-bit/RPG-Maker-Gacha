//=============================================================================
// ArchiveEchoes.js
//=============================================================================

/*:
 * @plugindesc v1.0.0 Echoes of the Sundered Archive: limit breaks from duplicates, level sync, shard drops, animation lookup.
 * @author RPG Maker Gacha
 *
 * @help
 * Requires GachaSystem.js and ArchiveData.js. Game-specific rules:
 *
 *  - Pulling an actor you already own raises its Limit Break (LB, max 5):
 *    +6% to every parameter per level, the actor's Burst skill is learned at
 *    LB 3. Duplicates beyond LB 5 refund gold instead.
 *  - Newly summoned actors join at roughly the party's level.
 *  - Actor notes:  <Rarity: SSR>   <Burst: skillId>
 *  - Enemy notes:  <Shards: 120>   Echo Shards dropped when defeated.
 *  - Skill/item/weapon notes:  <Anim: Fire 1|Fire 2>  The first animation whose
 *    name matches (ignoring case/spaces) is used, so the data works with
 *    whatever animation list your project has.
 */

var Echoes = Echoes || {};

(function() {
    'use strict';

    Echoes.MAX_LB = 5;
    Echoes.LB_BONUS = 0.06;
    Echoes.BURST_LB = 3;
    Echoes.RARITIES = ['N', 'R', 'SR', 'SSR', 'UR'];

    // ---- save data --------------------------------------------------------------------------------
    Game_System.prototype.echoData = function() {
        if (!this._echoData) { this._echoData = { lb: {} }; }
        return this._echoData;
    };

    Echoes.lb = function(actorId) {
        return $gameSystem ? ($gameSystem.echoData().lb[actorId] || 0) : 0;
    };

    Echoes.rarity = function(actorId) {
        var a = $dataActors[actorId];
        // note tags keep the space after the colon ("<Rarity: SSR>" gives " SSR"), so trim
        var r = a && a.meta && a.meta.Rarity ? String(a.meta.Rarity).trim().toUpperCase() : '';
        return Echoes.RARITIES.indexOf(r) >= 0 ? r : null;
    };

    Echoes.rank = function(actorId) {
        var r = Echoes.rarity(actorId);
        return r ? Echoes.RARITIES.indexOf(r) : -1;
    };

    // ---- limit break as a dynamic trait object ----------------------------------------------------
    var lbObjects = {};
    function lbObject(level) {
        if (!lbObjects[level]) {
            var traits = [], p;
            for (p = 0; p < 8; p++) { traits.push({ code: 21, dataId: p, value: 1 + Echoes.LB_BONUS * level }); }
            lbObjects[level] = { traits: traits };
        }
        return lbObjects[level];
    }

    var _traitObjects = Game_Actor.prototype.traitObjects;
    Game_Actor.prototype.traitObjects = function() {
        var objs = _traitObjects.call(this), lb = Echoes.lb(this.actorId());
        if (lb > 0) { objs.push(lbObject(lb)); }
        return objs;
    };

    Echoes.burstSkillId = function(actorId) {
        var a = $dataActors[actorId];
        return a && a.meta && a.meta.Burst ? Number(a.meta.Burst) : 0;
    };

    Echoes.refreshActor = function(actor) {
        var lb = Echoes.lb(actor.actorId()), r = Echoes.rarity(actor.actorId());
        var burst = Echoes.burstSkillId(actor.actorId());
        if (burst && lb >= Echoes.BURST_LB && !actor.isLearnedSkill(burst)) { actor.learnSkill(burst); }
        if (r) { actor.setNickname('[' + r + ']' + (lb > 0 ? ' LB' + lb : '')); }
        actor.refresh();
    };

    var _setup = Game_Actor.prototype.setup;
    Game_Actor.prototype.setup = function(actorId) {
        _setup.call(this, actorId);
        if ($gameSystem) { Echoes.refreshActor(this); }
    };

    // ---- hooks into the gacha ---------------------------------------------------------------------
    Echoes.partyLevel = function(exceptId) {
        var members = $gameParty.members().filter(function(a) { return a.actorId() !== exceptId; });
        if (members.length === 0) { return 1; }
        var sum = 0;
        members.forEach(function(a) { sum += a.level; });
        return Math.max(1, Math.round(sum / members.length) - 1);
    };

    Gacha.onNewActor = function(r) {
        var actor = $gameActors.actor(r.id);
        var level = Echoes.partyLevel(r.id);
        if (actor && level > actor.level) { actor.changeLevel(level, false); }
        if (actor) { actor.recoverAll(); Echoes.refreshActor(actor); }
    };

    Gacha.onDuplicateActor = function(r) {
        var lb = Echoes.lb(r.id);
        if (lb < Echoes.MAX_LB) {
            $gameSystem.echoData().lb[r.id] = lb + 1;
            r.limitBreak = lb + 1;
            r.note = 'Limit Break ' + (lb + 1) + (lb + 1 >= Echoes.BURST_LB && lb < Echoes.BURST_LB ? ' (Burst!)' : '');
            var actor = $gameActors.actor(r.id);
            if (actor) { Echoes.refreshActor(actor); }
        } else {
            r.refund = Gacha.Params.dupeRefund[Gacha.rank(r.rarity)] || 0;
            if (r.refund > 0) { $gameParty.gainGold(r.refund); }
        }
    };

    // ---- Echo Shard drops ---------------------------------------------------------------------------
    Game_Troop.prototype.shardsTotal = function() {
        return this.deadMembers().reduce(function(sum, enemy) {
            var s = enemy.enemy().meta.Shards;
            return sum + (s ? Number(s) : 0);
        }, 0);
    };

    var _makeRewards = BattleManager.makeRewards;
    BattleManager.makeRewards = function() {
        _makeRewards.call(this);
        this._rewards.shards = $gameTroop.shardsTotal();
    };

    var _displayRewards = BattleManager.displayRewards;
    BattleManager.displayRewards = function() {
        _displayRewards.call(this);
        if (this._rewards.shards > 0) {
            $gameMessage.add('\\.' + this._rewards.shards + ' Echo Shards found!');
        }
    };

    var _gainRewards = BattleManager.gainRewards;
    BattleManager.gainRewards = function() {
        _gainRewards.call(this);
        if (this._rewards.shards > 0) { Hall.addShards(this._rewards.shards); }
    };

    // ---- animation lookup by name -------------------------------------------------------------------
    function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); }

    Echoes.resolveAnimations = function() {
        if (Echoes._resolved) { return; }
        Echoes._resolved = true;
        var anims = [], names = [];
        $dataAnimations.forEach(function(a) { if (a && a.name) { anims.push(a); names.push(norm(a.name)); } });
        function find(spec) {
            var options = spec.split('|'), i, j;
            for (i = 0; i < options.length; i++) {
                var key = norm(options[i]);
                if (!key) { continue; }
                for (j = 0; j < names.length; j++) { if (names[j] === key) { return anims[j].id; } }
                for (j = 0; j < names.length; j++) { if (names[j].indexOf(key) === 0) { return anims[j].id; } }
                for (j = 0; j < names.length; j++) { if (names[j].indexOf(key) >= 0) { return anims[j].id; } }
            }
            return 0;
        }
        [$dataSkills, $dataItems, $dataWeapons].forEach(function(table) {
            table.forEach(function(o) {
                if (o && o.meta && o.meta.Anim) { var id = find(o.meta.Anim); if (id) { o.animationId = id; } }
            });
        });
    };

    var _isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        var loaded = _isDatabaseLoaded.call(this);
        if (loaded) { Echoes.resolveAnimations(); }
        return loaded;
    };

    // banner modifiers (Hall upgrades) depend on save data, so rebuild them for every new game
    var _setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _setupNewGame.call(this);
        Gacha.revision++;
    };

    // keep nicknames fresh when a save is loaded
    var _extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _extractSaveContents.call(this, contents);
        Gacha.revision++;
        $gameParty.members().forEach(function(a) { Echoes.refreshActor(a); });
    };
})();
