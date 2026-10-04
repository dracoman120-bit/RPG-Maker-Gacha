# Game design: Echoes of the Sundered Archive

## Pitch

A party JRPG whose party is *summoned*, wrapped around a base-building layer. You rebuild the Archive Hall between
dungeon runs; the Hall's upgrades make summoning kinder and your echoes stronger. Everything is earned by playing;
there is no real-money store, and the design goal is **a gacha you can finish**: pity is generous, duplicates always
help, and every echo has a story.

## Story

**Setting.** Lantern Reach is a harbour town built around a lighthouse that is really the Great Archive of Names: a
library that records every life. Heroes persist inside it as *echoes*. The **Hollow** (also called the Unwritten) is
a spreading erasure that removes places, names and memories.

**Cast.**
- **Iri** - the protagonist, last apprentice archivist. Carries the *Index Key* and a refusal to believe anything is lost.
- **Quill** - a sarcastic living book, Iri's mentor. Narrates the Hall, explains systems in character.
- **Aurelian** (UR) - the First Archivist, who sealed himself in the Archive to keep it open. Central to the mystery.
- **Nyx** (UR) - the *first thing the Archive forgot*, the space between the lines. Appears at the end of the slice.
- Eleven other echoes (N to SSR), each with a two-part memory scene at the Echo Stand.

**Beats of the slice.**
1. *Prologue, the Waking Room.* Iri wakes as the Hollow reaches the Archive. Tutorial fight against faded wisps.
2. *Archive Hall.* Quill introduces the Shrine of Echoes and gifts 1000 shards for the first (Beginner) summon, which
   guarantees an SSR by the tenth pull.
3. *Whispering Stacks.* A drowned library. Levers, a Tome Mimic, lore fragments from Archivist Pell's diary.
   **Boss: the Curator Husk**, who dies mumbling about a name he was made to forget. It leaves the *Index Page*, which
   points to the Inkwell, and unlocks the **Aurelian's Dawn** banner.
4. *Inkwell Depths.* Hollow ink pools, hounds, drowned clerks. **Boss: the Unwritten Warden**, a soldier "of no name"
   chosen by the First Archivist to guard something. When he falls, **Nyx** steps out: "the Hollow is not hunting
   you, child. It is hunting *him*." The slice ends with Nyx's banner (**Hollow's Whisper**) unlocking and the line
   "the Hollow was her cage, which means we have just opened it."

**Themes.** Memory as care (every echo is a kind of attention), erasure as neglect, and what a founder chose to forget.

**Where it goes next (suggestions).** Chapter 2: Aurelian's hidden name and why he buried Nyx; the Hollow turns out
to be the sum of every forgotten echo, so *the player's own summoning feeds a question about who gets remembered*.
Chapter 3: reconcile the Archive with what it erased (recruit Hollow-aligned echoes without breaking the pity rules).

## Core loop

```
Explore dungeon -> win battles -> Echo Shards, Gold, Ink Pages, EXP
        -> Archive Hall: Shrine (summon), Desk (bounties, upgrades), Forge (gear), Echo Stand (stories)
        -> stronger party -> deeper dungeon / boss
```

## Battle

- Four-member side-view party: Iri (support, always present) plus up to three summoned echoes.
- **Elements:** Physical, Flame, Frost, Gale, Lumen, Hollow. Enemies have weaknesses/resistances (e.g. books burn,
  Hollow knights fear Lumen, Hollow enemies shrug off Hollow).
- **Arts** cost MP; **Bursts** cost TP (filled by acting and by taking damage) and are unlocked by limit break 3.
- **States:** Smudged (damage over time), Blank (no Arts), Hollowed (-25% DEF/M.DEF), Stunned, Shielded (-30% damage), Mended (regen).
- Reserve echoes receive half EXP, and new echoes join near the party's level, so a fresh pull is usable immediately.
- **Bosses** act up to twice per turn, resist instant KO and only take 40% of the normal chance to be Stunned or Blanked. The Curator calls back
  its wisps; the Warden calls a hound pack at low HP and drops a "no name" cutscene line at 20% HP.

## Summoning (the gacha)

Pull cost is 100 Echo Shards (a 10-pull costs 1000). Default rates before pity: N 49.4%, R 30%, SR 14%, SSR 6%, UR 0.6%.

| Rule | Default |
|------|---------|
| SSR soft pity | rate climbs by 10% per pull from pull 40 |
| SSR hard pity | SSR or better guaranteed on pull 50 |
| UR soft pity | rate climbs by 5% per pull from pull 70 |
| UR hard pity | UR guaranteed on pull 90 |
| Multi guarantee | a 10-pull always contains SR or better |
| Rate-up | featured entry is 50% of the rarity; losing it guarantees the next one (Aurelian's Dawn, Hollow's Whisper) |
| Counters | stored per banner in the save file (banners can share a pity group) |

With default pity the simulated averages are about **one SSR or better per 16 pulls** and **one UR per 60 pulls**.
Hall upgrades shorten the hard-pity thresholds (Shrine Lv2: 5 pulls sooner, Lv3: 10 sooner) on every banner without a
pull cap.

**Banners.** *Beginner* (10 pulls, SSR guaranteed on the 10th, heroes only), *Echo Summon* (permanent, heroes,
consumables, gear), *Aurelian's Dawn* (unlocks after the Curator), *Hollow's Whisper* (unlocks after the Warden; losing
the 50/50 gives Aurelian). The engine behind it is documented in [`GachaSystem.md`](GachaSystem.md).

**Duplicates / limit break.** The first duplicate of an echo sets limit break (LB) 1, then LB 2 .. 5: +6% to every
stat per level; LB 3 teaches the Burst. A duplicate beyond LB 5 refunds gold by rarity.

## Archive Hall (the builder layer)

| Facility | Lv1 | Lv2 | Lv3 |
|----------|-----|-----|-----|
| **Shrine of Echoes** | base pity | hard pity -5 (300 G + 4 Ink Pages) | hard pity -10 (800 G + 10 Pages) |
| **Scribe's Desk** | bounties x1.0 | x1.5 and +4 shards per victory (200 G + 3 Pages) | x2.0 and +8 shards per victory (600 G + 8 Pages) |
| **Binder's Forge** | N and R gear | + SR gear (250 G + 4 Pages) | + SSR gear (700 G + 10 Pages) |

Maxing every facility costs 39 Ink Pages. The fixed sources in the slice give 25 (17 from chests and boss rewards,
8 from lore milestones); the rest come from random drops (Scribes, Mimics, Hounds, Knights) and bounties, so the player
has to choose what to upgrade first. The Desk also posts **bounties** (defeat N of
an enemy; scales with progress), pays out an accrued **dividend**, and trades **Lore Fragments** (eight exist) for
milestone rewards at 2, 4, 6 and 8.

## Economy (from the generated data)

| Encounter | Shards | EXP | Gold |
|-----------|-------:|----:|-----:|
| Wisp Pair (Stacks 1F) | 56 | 20 | 28 |
| Mite Swarm / Wisp and Mites | 84 | 30 | 42 |
| Scribe Pair (Stacks 2F) | 122 | 64 | 58 |
| **Curator Husk (boss)** | 616 | 158 | 180 |
| Slime Trio (Inkwell 1F) | 132 | 159 | 90 |
| Knight Pair (Inkwell 2F) | 246 | 216 | 84 |
| **Unwritten Warden (boss)** | 1232 | 325 | 252 |

Roughly one to two pulls per battle in the dungeons. On top of that: 1,580 shards in dungeon chests, 850 from the lore
milestones (400 shards plus three Echo Caches worth 150 each), and the bounty and dividend payouts. Levels come at
roughly 3 battles each; by this estimate the party is around level 9 at the Warden.

## Balance targets

Computed by `tools/balance.js` (see `balance-report.txt`):
- The prologue is winnable by Iri alone (100%).
- Ordinary fights are comfortable for good parties and risky for the weakest (N/R-only) party, which should use the
  Forge, level up, or summon more.
- The Curator is a gear check: about 19% for a weak party with only N gear, 92-100% for decent parties, near-certain once
  everyone has R gear.
- The Warden is the slice's wall: at level 9 with R gear a weak party has about 17%, a mid party 60%, a strong party
  84-100%; SR gear and one limit break raise the weak party to about 81%. The intended answer is "pull, upgrade the
  Forge, limit break, level".

## Level and content map

| Map | Purpose | Notes |
|-----|---------|-------|
| 1 Archive Hall | hub | Shrine, Desk, Forge, rest wing, Echo Stand, gate, save crystal, wandering echoes |
| 2 The Waking Room | prologue | scripted intro and tutorial fight |
| 3 Whispering Stacks 1F | dungeon | lever opens the north gate; 2 chests, 2 lore, candles, crystal |
| 4 Whispering Stacks 2F | dungeon + boss | mimic chest, 2 lore, crystal, **Curator Husk** |
| 5 Inkwell Depths 1F | dungeon | ink hazard tiles, lever and gate, 2 chests, 2 lore |
| 6 Inkwell Depths 2F | dungeon + boss | 2 chests, 2 lore, crystal, **Unwritten Warden** |

Previews of each map are in [`maps/`](maps). Switches and variables are listed in [`roster.md`](roster.md).
