//=============================================================================
// GachaBanners.js
//=============================================================================

/*:
 * @plugindesc v1.0.0 Banner definitions for GachaSystem. Edit this file to make your own banners.
 * @author RPG Maker Gacha
 *
 * @help
 * Requires GachaSystem.js. Plugin order does not matter.
 *
 * Open this file in a text editor and change the banners below. The IDs used
 * in the sample banners (items, weapons, armors, actors) refer to your own
 * database, so change them to match your project.
 *
 * Banner fields (only id, name and pool are required):
 *
 *   id            Unique text id, no spaces. Used by plugin commands.
 *   name          Shown in the banner list.
 *   description   Shown on the banner screen. Use \n for a line break.
 *   switchId      If set, the banner is only visible while that switch is ON.
 *   unlocked      false = hidden until "Gacha unlock id" is used.
 *   maxPulls      Total pulls allowed on the banner (0 = unlimited).
 *   pityGroup     Banners with the same group share one pity counter.
 *   costSingle    Cost of one pull (default: plugin parameter).
 *   costMulti     Cost of a multi-pull.
 *   multiCount    Pulls in a multi-pull.
 *   multiGuarantee  "N", "R", "SR", "SSR" or "UR".
 *   currency      { type: "gold" | "item" | "variable", id: 3, name: "Tickets" }
 *   rates         Override base rates in percent, e.g. { UR: 1.5, SSR: 8 }
 *                 (everything is normalised to 100%).
 *   pity          { SSR: { soft: 30, hard: 40, step: 10 }, UR: { hard: 60 } }
 *   featuredRate  Percent chance that a rate-up drop is a featured entry.
 *   guarantee     true/false: guaranteed featured after losing the roll.
 *   pool          Entries for each rarity: N, R, SR, SSR, UR.
 *
 * Pool entry:  { type: "item" | "weapon" | "armor" | "actor" | "gold",
 *                id: 1, count: 1, weight: 1, featured: false }
 *
 *   weight    Relative chance inside its rarity (default 1).
 *   featured  true = rate-up entry.
 *   A rarity with an empty pool never drops.
 */

var Gacha = Gacha || {};
Gacha.Banners = Gacha.Banners || [];

Gacha.Banners = Gacha.Banners.concat([

    //-------------------------------------------------------------------------
    // Always-available banner with every rarity.
    //-------------------------------------------------------------------------
    {
        id: 'standard',
        name: 'Standard Summon',
        description: 'The everyday banner.\nSSR guaranteed within 50 pulls, UR within 90.',
        pool: {
            N: [
                { type: 'item', id: 1, count: 3 },
                { type: 'item', id: 2, count: 2 },
                { type: 'gold', id: 0, count: 200 }
            ],
            R: [
                { type: 'item', id: 3, count: 2 },
                { type: 'weapon', id: 1 },
                { type: 'armor', id: 1 }
            ],
            SR: [
                { type: 'weapon', id: 2 },
                { type: 'armor', id: 2 },
                { type: 'item', id: 5, count: 3 }
            ],
            SSR: [
                { type: 'weapon', id: 3 },
                { type: 'armor', id: 3 },
                { type: 'actor', id: 2 }
            ],
            UR: [
                { type: 'actor', id: 1 },
                { type: 'actor', id: 3 },
                { type: 'weapon', id: 4 }
            ]
        }
    },

    //-------------------------------------------------------------------------
    // Limited rate-up banner: shows only while switch 10 is ON.
    // Featured UR has a 50% chance; losing it guarantees the next UR.
    //-------------------------------------------------------------------------
    {
        id: 'hero',
        name: "Hero's Rate-Up",
        description: 'Limited time! Actor 4 is the featured UR.\nBetter UR odds than the standard banner.',
        switchId: 10,
        pityGroup: 'hero',
        rates: { UR: 1.2 },
        pool: {
            N: [{ type: 'item', id: 1, count: 3 }],
            R: [{ type: 'item', id: 3, count: 2 }, { type: 'armor', id: 1 }],
            SR: [{ type: 'weapon', id: 2 }, { type: 'armor', id: 2 }],
            SSR: [
                { type: 'weapon', id: 3, featured: true },
                { type: 'armor', id: 3 },
                { type: 'actor', id: 2 }
            ],
            UR: [
                { type: 'actor', id: 4, featured: true },
                { type: 'actor', id: 1 },
                { type: 'actor', id: 3 }
            ]
        }
    },

    //-------------------------------------------------------------------------
    // Beginner banner: 10 pulls total, SSR guaranteed inside the first 10.
    // Not tied to the plugin currency: costs 1 of item #8.
    //-------------------------------------------------------------------------
    {
        id: 'beginner',
        name: 'Beginner Summon',
        description: 'One-time offer: 10 pulls with an SSR or better guaranteed!',
        maxPulls: 10,
        currency: { type: 'item', id: 8 },
        costSingle: 1,
        costMulti: 10,
        pity: { SSR: { soft: 0, hard: 10 }, UR: { soft: 0, hard: 0 } },
        pool: {
            R: [{ type: 'item', id: 3, count: 2 }, { type: 'armor', id: 1 }],
            SR: [{ type: 'weapon', id: 2 }, { type: 'armor', id: 2 }],
            SSR: [{ type: 'weapon', id: 3 }, { type: 'actor', id: 2 }],
            UR: [{ type: 'actor', id: 3 }]
        }
    }

]);
