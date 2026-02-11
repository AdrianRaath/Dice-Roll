// ==========================================================================
//  build.js - Generate 71 dedicated roll pages + sitemap.xml
//  Run: node build.js
// ==========================================================================

const fs   = require('fs');
const path = require('path');

// --- Config ---
const MIN_DICE  = 1;
const MAX_DICE  = 6;
const SIDES     = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 20, 100];

// Home page config (skip generating a dedicated page for this combo)
const HOME_DICE  = 1;
const HOME_SIDES = 6;

// Your production domain (update when you have one)
const SITE_URL = 'https://quickdice.co';

const ROOT = __dirname;

// --- Helpers ---

function dieOrDice(n) {
  return n === 1 ? 'die' : 'dice';
}

function sideOrSides(s) {
  return s === 1 ? 'side' : 'sides';
}

function dieOrDiceCap(n) {
  return n === 1 ? 'Die' : 'Dice';
}

function pageTitle(dice, sides) {
  return `${dice}d${sides} Dice Roller | Roll ${dice} ${sides}-Sided ${dieOrDiceCap(dice)} Online`;
}

function metaDescription(dice, sides) {
  return `Roll ${dice}d${sides} online with QuickDice. Instant ${dice} ${dieOrDice(dice)} with ${sides} ${sideOrSides(sides)} roller - free, random, and fair. No app needed.`;
}

function pageH1(dice, sides) {
  return `Roll ${dice}d${sides} Online`;
}

function pageSubtitle(dice, sides) {
  return `Roll ${dice} ${dieOrDice(dice)} with ${sides} ${sideOrSides(sides)} (${dice}d${sides})`;
}

function pageUrl(dice, sides) {
  if (dice === HOME_DICE && sides === HOME_SIDES) return '/';
  return `/${dice}-dice/${sides}-sides/`;
}

// Build dropdown options with URLs as values
// contextDice/contextSides = this page's dice/sides (used to construct the paired URL)
function buildDiceOptions(contextDice, contextSides) {
  let html = '';
  for (let d = MIN_DICE; d <= MAX_DICE; d++) {
    const sel = d === contextDice ? ' selected' : '';
    const label = `${d} ${dieOrDice(d)}`;
    const url = pageUrl(d, contextSides);
    html += `            <option value="${url}"${sel}>${label}</option>\n`;
  }
  return html.trimEnd();
}

function buildSidesOptions(contextDice, contextSides) {
  let html = '';
  for (const s of SIDES) {
    const sel = s === contextSides ? ' selected' : '';
    const label = `${s} ${sideOrSides(s)}`;
    const url = pageUrl(contextDice, s);
    html += `            <option value="${url}"${sel}>${label}</option>\n`;
  }
  return html.trimEnd();
}

// Build "Other popular rolls" links for a given page
function buildPopularRolls(dice, sides) {
  const links = [];
  const seen = new Set();
  const key = (d, s) => `${d}-${s}`;

  // Current page -skip
  seen.add(key(dice, sides));

  // Same dice count, different sides
  for (const s of [6, 4, 8, 10, 12, 20, 2, 3, 5, 7, 9, 100]) {
    if (!seen.has(key(dice, s))) {
      links.push({ dice, sides: s });
      seen.add(key(dice, s));
    }
  }

  // Same sides, different dice count
  for (const d of [1, 2, 3, 4, 5, 6]) {
    if (!seen.has(key(d, sides))) {
      links.push({ dice: d, sides });
      seen.add(key(d, sides));
    }
  }

  // Popular combos
  const popular = [
    { dice: 1, sides: 6 },
    { dice: 2, sides: 6 },
    { dice: 1, sides: 4 },
    { dice: 1, sides: 8 },
    { dice: 1, sides: 10 },
    { dice: 2, sides: 10 },
    { dice: 3, sides: 6 },
    { dice: 4, sides: 6 },
  ];
  for (const p of popular) {
    if (!seen.has(key(p.dice, p.sides))) {
      links.push(p);
      seen.add(key(p.dice, p.sides));
    }
  }

  // Cap at 10 links
  const capped = links.slice(0, 10);

  return capped
    .map(l => {
      const url = pageUrl(l.dice, l.sides);
      const label = `${l.dice}d${l.sides}`;
      return `          <a href="${url}">${label} Dice Roller</a>`;
    })
    .join('\n');
}

// ========================================================================
//  Per-page long-form content (only for high-value roll combinations)
// ========================================================================

const PAGE_CONTENT = {};

PAGE_CONTENT['2-6'] = `
    <main class="content">
      <section class="content-section">
        <h2 class="content-heading">2d6 Probability Breakdown</h2>
        <p>Rolling two six-sided dice produces a total between 2 and 12, but not all totals are equally likely. The results follow a bell curve, with 7 being the most common outcome and the extremes (2 and 12) being the rarest.</p>
        <table class="content-table">
          <thead>
            <tr>
              <th>Total</th>
              <th>Combinations</th>
              <th>Probability</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>2</td><td>1 (1+1)</td><td>2.78%</td></tr>
            <tr><td>3</td><td>2 (1+2, 2+1)</td><td>5.56%</td></tr>
            <tr><td>4</td><td>3 (1+3, 2+2, 3+1)</td><td>8.33%</td></tr>
            <tr><td>5</td><td>4 (1+4, 2+3, 3+2, 4+1)</td><td>11.11%</td></tr>
            <tr><td>6</td><td>5 (1+5, 2+4, 3+3, 4+2, 5+1)</td><td>13.89%</td></tr>
            <tr><td>7</td><td>6 (1+6, 2+5, 3+4, 4+3, 5+2, 6+1)</td><td>16.67%</td></tr>
            <tr><td>8</td><td>5 (2+6, 3+5, 4+4, 5+3, 6+2)</td><td>13.89%</td></tr>
            <tr><td>9</td><td>4 (3+6, 4+5, 5+4, 6+3)</td><td>11.11%</td></tr>
            <tr><td>10</td><td>3 (4+6, 5+5, 6+4)</td><td>8.33%</td></tr>
            <tr><td>11</td><td>2 (5+6, 6+5)</td><td>5.56%</td></tr>
            <tr><td>12</td><td>1 (6+6)</td><td>2.78%</td></tr>
          </tbody>
        </table>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Games That Use 2d6</h2>
        <p>Two six-sided dice are the most widely used dice combination in tabletop gaming. Here are some of the most popular games that rely on a 2d6 roll.</p>
        <ul class="content-list">
          <li><strong>Monopoly</strong> - Players roll 2d6 each turn to move around the board. Rolling doubles lets you take another turn, but three doubles in a row sends you straight to jail.</li>
          <li><strong>Catan</strong> - A 2d6 roll each turn determines which hexes produce resources. Since 7 is the most common result, it triggers the robber, making tiles numbered 6 and 8 the most valuable spots on the board.</li>
          <li><strong>Craps</strong> - The classic casino dice game is built entirely around 2d6 probability. Players bet on outcomes like 7 or 11 on the come-out roll, or try to avoid "crapping out" with a 2, 3, or 12.</li>
          <li><strong>Backgammon</strong> - Players roll 2d6 to determine how far their checkers move. Rolling doubles counts twice, giving you four moves instead of two.</li>
        </ul>
      </section>

      <section class="content-section">
        <h2 class="content-heading">2d6 vs 1d12: What's the Difference?</h2>
        <p>A single twelve-sided die (1d12) and two six-sided dice (2d6) both cover a similar range, but they behave very differently. With 1d12, every number from 1 to 12 has an equal 8.3% chance of appearing. With 2d6, the results range from 2 to 12 and follow a bell curve where middle values like 6, 7, and 8 come up far more often than the extremes.</p>
        <p>This is why game designers choose 2d6 when they want outcomes to cluster around an average, and 1d12 when they want a flat, unpredictable spread.</p>
      </section>
    </main>`;

PAGE_CONTENT['3-6'] = `
    <main class="content">
      <section class="content-section">
        <h2 class="content-heading">Rolling Ability Scores with 3d6</h2>
        <p>In the original editions of Dungeons &amp; Dragons, players created characters by rolling 3d6 for each of the six ability scores: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma. Each roll produces a result between 3 and 18, with 10-11 being the most common outcome.</p>
        <p>This method creates characters with a wide range of strengths and weaknesses. Rolling a 15 or higher is uncommon, and an 18 is genuinely rare (less than a 0.5% chance). That randomness is part of the appeal for players who enjoy working with whatever the dice give them rather than building an optimized character from the start.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">3d6 Distribution at a Glance</h2>
        <p>Three six-sided dice produce a bell curve across 3 to 18, with most rolls clustering around the middle. Here is how the results break down by range.</p>
        <table class="content-table">
          <thead>
            <tr>
              <th>Range</th>
              <th>Totals</th>
              <th>Probability</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Very low</td><td>3 - 5</td><td>4.6%</td></tr>
            <tr><td>Below average</td><td>6 - 8</td><td>20.4%</td></tr>
            <tr><td>Average</td><td>9 - 12</td><td>50.0%</td></tr>
            <tr><td>Above average</td><td>13 - 15</td><td>20.4%</td></tr>
            <tr><td>Exceptional</td><td>16 - 18</td><td>4.6%</td></tr>
          </tbody>
        </table>
        <p>Half of all 3d6 rolls land between 9 and 12, which is why D&amp;D treats 10 as the baseline for an ordinary person. Scores at either extreme are rare, making them feel meaningful when they do show up.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">3d6 vs 4d6 Drop Lowest</h2>
        <p>Modern D&amp;D (5th Edition) replaced the classic 3d6 method with "roll <a href="/4-dice/6-sides/">4d6</a> and drop the lowest die." This shifts the average from about 10.5 up to around 12.2 and makes very low scores much less likely. The result is a set of ability scores that skews higher, producing more capable, heroic characters out of the gate.</p>
        <p>The 3d6 method is still popular among players who prefer old-school play or want character creation to feel more unpredictable. Some groups even roll 3d6 in order (assigning each roll to abilities in sequence) to fully embrace the randomness.</p>
      </section>
    </main>`;

PAGE_CONTENT['4-6'] = `
    <main class="content">
      <section class="content-section">
        <h2 class="content-heading">The 4d6 Drop Lowest Method</h2>
        <p>The most popular way to generate D&amp;D ability scores is to roll four six-sided dice, remove the lowest die, and add the remaining three together. You repeat this process six times to get a full set of scores for Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma.</p>
        <p>For example, if you roll 4, 3, 5, and 1, you drop the 1 and your score is 4 + 3 + 5 = 12. This "drop lowest" mechanic nudges every roll upward compared to simply rolling <a href="/3-dice/6-sides/">3d6</a>, since the worst die is always discarded.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">What to Expect from 4d6 Drop Lowest</h2>
        <p>Dropping the lowest die shifts the entire distribution toward higher results. The average score lands around 12.2 instead of the 10.5 you get from a straight 3d6 roll. Here is how the results break down.</p>
        <table class="content-table">
          <thead>
            <tr>
              <th>Range</th>
              <th>Totals</th>
              <th>Probability</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Very low</td><td>3 - 5</td><td>~1%</td></tr>
            <tr><td>Below average</td><td>6 - 8</td><td>~9%</td></tr>
            <tr><td>Average</td><td>9 - 12</td><td>~41%</td></tr>
            <tr><td>Above average</td><td>13 - 15</td><td>~36%</td></tr>
            <tr><td>Exceptional</td><td>16 - 18</td><td>~13%</td></tr>
          </tbody>
        </table>
        <p>Compare this to straight <a href="/3-dice/6-sides/">3d6</a>, where "above average" and "exceptional" scores together account for about 25% of rolls. With 4d6 drop lowest, that jumps to nearly 49%. An 18 still only comes up about 1.6% of the time, so it remains a memorable result.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Why 4d6 Became the Standard</h2>
        <p>Early editions of D&amp;D used straight 3d6, which often produced characters with one or two painfully low scores. While some players enjoyed the challenge, many found it frustrating to start a campaign with a character that felt weak across the board.</p>
        <p>The 4d6 drop lowest method solved this by raising the floor without removing randomness entirely. Players still get varied, interesting ability scores, but are far less likely to end up with a score below 8. It strikes a balance between the unpredictability of dice rolling and the desire for characters that feel competent from the start, which is why it has been the default recommendation in D&amp;D for decades.</p>
      </section>
    </main>`;

PAGE_CONTENT['1-10'] = `
    <main class="content">
      <section class="content-section">
        <h2 class="content-heading">What Is a d10?</h2>
        <p>The ten-sided die (d10) is a staple of tabletop role-playing games. Shaped like a pentagonal trapezohedron, it is numbered 0 through 9, where the 0 typically counts as 10. In D&amp;D, the d10 is used for weapon damage (longswords with Versatile, pikes, heavy crossbows), certain class hit dice, and a variety of spell effects.</p>
        <p>Beyond D&amp;D, the d10 is the core die for the entire World of Darkness family of RPGs, including Vampire: The Masquerade, Werewolf: The Apocalypse, and Chronicles of Darkness. In these systems, players roll pools of d10s against a target number to determine success or failure.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Percentile Dice: Using Two d10s as a d100</h2>
        <p>One of the most common uses of the d10 is rolling percentile dice (d100). You roll <a href="/2-dice/10-sides/">two d10s</a> together: one represents the tens digit and the other the ones digit, giving a result from 1 to 100. For example, rolling a 4 and a 7 gives you 47, while a 0 and a 0 is read as 100.</p>
        <p>Percentile rolls appear throughout D&amp;D for things like wild magic surges, random encounter tables, and loot generation. They are also central to RPG systems like Call of Cthulhu and Warhammer Fantasy Roleplay, where most checks are resolved by rolling under a skill percentage.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Common d10 Rolls in D&amp;D</h2>
        <ul class="content-list">
          <li><strong>Weapon damage</strong> - Heavy crossbows, pikes, and longswords (two-handed) all deal 1d10 damage. The d10 sits between the more common d8 and the heavy-hitting d12 in terms of average output.</li>
          <li><strong>Hit dice</strong> - Fighters, paladins, and rangers use a d10 for their hit dice, gaining 1d10 hit points (plus Constitution modifier) each time they level up.</li>
          <li><strong>Eldritch Blast</strong> - The warlock's signature cantrip deals 1d10 force damage per beam, making it one of the most-rolled d10 results at any D&amp;D table.</li>
          <li><strong>Toll the Dead</strong> - This popular cleric cantrip deals 1d12 to injured targets but 1d8 against healthy ones, keeping the d10 in regular rotation for spellcasters.</li>
        </ul>
      </section>
    </main>`;

PAGE_CONTENT['1-8'] = `
    <main class="content">
      <section class="content-section">
        <h2 class="content-heading">What Is a d8?</h2>
        <p>The eight-sided die (d8) is one of the standard polyhedral dice used in tabletop RPGs. Shaped like a regular octahedron, it produces results from 1 to 8 with equal probability and an average roll of 4.5. In Dungeons &amp; Dragons, the d8 is one of the most frequently rolled dice after the d20 and d6.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Common d8 Rolls in D&amp;D</h2>
        <ul class="content-list">
          <li><strong>Longsword and rapier damage</strong> - The longsword (one-handed) and rapier both deal 1d8 damage, making the d8 the go-to damage die for most martial characters.</li>
          <li><strong>Hit dice</strong> - Clerics, druids, monks, rogues, and warlocks all use a d8 for their hit dice. This means they gain 1d8 hit points (plus Constitution modifier) at each level, and roll d8s when spending hit dice during a short rest.</li>
          <li><strong>Healing spells</strong> - Cure Wounds restores 1d8 per spell level, and Healing Word heals 1d4. The d8 is closely tied to healing in D&amp;D, appearing in many restorative spells and class features.</li>
          <li><strong>Divine Smite</strong> - When a paladin lands a hit, they can spend a spell slot to deal extra radiant damage in d8s. A 1st-level smite adds 2d8, scaling up with higher slots. This makes the d8 one of the most satisfying dice to roll in combat.</li>
        </ul>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Where the d8 Fits Among Damage Dice</h2>
        <p>D&amp;D weapon damage follows a clear progression: <a href="/1-dice/4-sides/">d4</a> for light weapons like daggers, d6 for short swords, d8 for longswords and rapiers, <a href="/1-dice/10-sides/">d10</a> for heavy weapons like pikes, and d12 for greataxes. The d8 occupies the middle ground, offering solid damage without requiring two hands or a special fighting style.</p>
        <p>This makes it the most common single-weapon damage die in the game. If you are building a sword-and-shield fighter, a finesse rogue, or any character with a one-handed weapon, you will be rolling a lot of d8s.</p>
      </section>
    </main>`;

PAGE_CONTENT['1-4'] = `
    <main class="content">
      <section class="content-section">
        <h2 class="content-heading">What Is a d4?</h2>
        <p>The four-sided die (d4) is the smallest of the standard polyhedral dice used in tabletop RPGs. Shaped like a tetrahedron, it is the only common die that does not roll in the traditional sense. Instead it tumbles and lands on a flat face, with the result read from the top point or the numbers along the base, depending on the design.</p>
        <p>With only four outcomes (1 through 4) and an average of 2.5, the d4 produces the lowest damage and smallest ranges of any standard die. But that small range makes it ideal for minor effects, light weapons, and low-level abilities where big swings would feel out of place.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Common d4 Rolls in D&amp;D</h2>
        <ul class="content-list">
          <li><strong>Dagger damage</strong> - The dagger deals 1d4 piercing damage and is one of the most iconic weapons in the game. As a finesse weapon with the thrown property, it is a favourite of rogues, wizards, and anyone who needs a reliable backup weapon.</li>
          <li><strong>Healing Potion</strong> - A basic Potion of Healing restores 2d4 + 2 hit points. The d4 keeps the healing modest at low levels while still giving a meaningful boost when it counts.</li>
          <li><strong>Magic Missile</strong> - Each dart of the classic spell deals 1d4 + 1 force damage and hits automatically with no attack roll. At higher spell levels, extra darts are added, so a handful of d4s can add up quickly.</li>
          <li><strong>Guidance and Bless</strong> - The Guidance cantrip adds 1d4 to a single ability check, while the Bless spell adds 1d4 to attack rolls and saving throws for up to three creatures. These small bonuses are some of the most impactful buffs in the game.</li>
        </ul>
      </section>

      <section class="content-section">
        <h2 class="content-heading">The d4 in the Damage Dice Lineup</h2>
        <p>In D&amp;D, weapon and spell damage scales through a progression of dice: d4 for light and simple weapons, d6 for short swords and handaxes, <a href="/1-dice/8-sides/">d8</a> for longswords and rapiers, <a href="/1-dice/10-sides/">d10</a> for heavy weapons, and d12 for greataxes. The d4 sits at the bottom of this ladder, but that does not make it unimportant.</p>
        <p>Many of the game's most reliable effects use d4s precisely because the range is tight. A bonus of 1 to 4 is always noticeable without being game-breaking, which is why spells like Bless and Guidance remain useful at every level of play.</p>
      </section>
    </main>`;

PAGE_CONTENT['1-20'] = `
    <main class="content">
      <section class="content-section">
        <h2 class="content-heading">What Is a d20?</h2>
        <p>The twenty-sided die (d20) is the most iconic die in tabletop role-playing games. Shaped like a regular icosahedron, it produces results from 1 to 20 with equal probability, giving each face a 5% chance of appearing. In Dungeons &amp; Dragons, nearly every meaningful action a character takes comes down to a d20 roll.</p>
        <p>Attack rolls, ability checks, and saving throws all use the d20 as their core mechanic. You roll the die, add the relevant modifier, and compare the total to a target number (called a Difficulty Class, or DC). This simple framework drives the entire game, which is why the d20 has become synonymous with D&amp;D itself.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Natural 1s and Natural 20s</h2>
        <p>In D&amp;D, a "natural 20" (often called a "nat 20") on an attack roll is an automatic critical hit, regardless of the target's armor class. The attack deals double the normal damage dice and is one of the most celebrated moments at any table. The odds of rolling one are exactly 5%, or 1 in 20.</p>
        <p>A "natural 1" on an attack roll is an automatic miss, no matter how high the attacker's bonus. Many groups also play with house rules where a nat 1 results in a comedic fumble, though this is not part of the official rules. For ability checks and saving throws, a natural 1 or 20 does not automatically fail or succeed in standard 5th Edition rules, although some tables apply that as a house rule as well.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Why the d20 Works for RPGs</h2>
        <p>The flat 5% probability per face means that every result is equally likely, which keeps outcomes unpredictable. A character with a +10 modifier can still fail on a low roll, and a novice can occasionally succeed against the odds. This tension between skill and luck is central to what makes D&amp;D exciting.</p>
        <p>The d20 also provides enough granularity (20 distinct outcomes) to support a wide range of difficulty levels without the maths becoming complicated. A DC 10 check succeeds about 55% of the time with no modifier, while a DC 20 requires either a high bonus or a lucky roll. This clean scaling is why the d20 system has been adopted by many RPGs beyond D&amp;D, including Pathfinder, Star Wars d20, and the d20 Modern system.</p>
      </section>
    </main>`;

PAGE_CONTENT['1-12'] = `
    <main class="content">
      <section class="content-section">
        <h2 class="content-heading">What Is a d12?</h2>
        <p>The twelve-sided die (d12) is shaped like a regular dodecahedron and produces results from 1 to 12 with equal probability, giving an average roll of 6.5. It is part of the standard set of polyhedral dice used in D&amp;D and other tabletop RPGs, though it tends to see less action than the <a href="/1-dice/8-sides/">d8</a> or <a href="/1-dice/10-sides/">d10</a>.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Common d12 Rolls in D&amp;D</h2>
        <ul class="content-list">
          <li><strong>Greataxe damage</strong> - The greataxe deals 1d12 slashing damage, making it the signature weapon for characters who want to swing big. It is the only common weapon that uses a d12 for its base damage.</li>
          <li><strong>Barbarian hit dice</strong> - Barbarians use a d12 for their hit dice, the highest of any class. This gives them 1d12 hit points (plus Constitution modifier) per level, making them the toughest characters in the game by raw hit point totals.</li>
          <li><strong>Toll the Dead</strong> - This cleric cantrip deals 1d12 necrotic damage to targets that are already injured (1d8 against healthy ones), making it one of the few spells that regularly calls for a d12.</li>
        </ul>
      </section>

      <section class="content-section">
        <h2 class="content-heading">The "Underused" Die</h2>
        <p>Among D&amp;D players, the d12 has a reputation as the least-used die in the standard set. Only one common weapon (the greataxe) uses it for damage, and only one class (the Barbarian) uses it for hit dice. Compare this to the <a href="/1-dice/8-sides/">d8</a>, which covers five classes and dozens of weapons, or the <a href="/">d6</a>, which appears everywhere from fireball damage to sneak attack rolls.</p>
        <p>That said, when the d12 does come out, it tends to hit hard. A greataxe critical hit rolls 2d12, and a high-level Barbarian rolling hit dice during a short rest can recover large chunks of health in a single roll. The d12 may not see the table often, but it makes an impact when it does.</p>
      </section>
    </main>`;

PAGE_CONTENT['1-100'] = `
    <main class="content">
      <section class="content-section">
        <h2 class="content-heading">What Is a d100?</h2>
        <p>The hundred-sided die (d100) generates a number from 1 to 100, giving every result an equal 1% chance of appearing. In tabletop RPGs, a d100 roll is most commonly made using two ten-sided dice (called percentile dice) - one for the tens digit and one for the ones digit. A physical 100-sided die does exist (called a Zocchihedron), but percentile dice are far more practical and widely used.</p>
        <p>The d100 is central to several major RPG systems and appears frequently in D&amp;D for random tables, special abilities, and any situation where the game needs a precise percentage chance.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">How Percentile Dice Work</h2>
        <p>To roll a d100 with physical dice, you roll <a href="/2-dice/10-sides/">two d10s</a> together. One die (often a different colour or marked with tens: 00, 10, 20, etc.) represents the tens digit, while the other represents the ones digit. A roll of 40 and 7 gives you 47. A roll of 00 and 0 is read as 100.</p>
        <p>This two-dice method is why percentile rolls are sometimes written as "d%" or "d100" interchangeably. QuickDice handles the maths for you - just select 100 sides and roll.</p>
      </section>

      <section class="content-section">
        <h2 class="content-heading">Where the d100 Appears in RPGs</h2>
        <ul class="content-list">
          <li><strong>Wild Magic Surge (D&amp;D)</strong> - When a Wild Magic sorcerer triggers a surge, the DM has them roll on a d100 table of 50 chaotic effects. Results range from harmless (you turn blue for 24 hours) to dramatic (you cast fireball centred on yourself). It is one of the most memorable d100 tables in the game.</li>
          <li><strong>Random encounter and loot tables</strong> - D&amp;D uses d100 rolls throughout the Dungeon Master's Guide and adventure modules to determine random encounters, treasure hoards, and trinkets. The 100-point scale allows designers to assign precise probabilities to rare and common outcomes.</li>
          <li><strong>Call of Cthulhu</strong> - The entire skill system in Call of Cthulhu runs on d100 rolls. Players roll under their skill percentage to succeed, making the d100 the most-rolled die in the game. A Spot Hidden skill of 55 means you need to roll 55 or lower.</li>
          <li><strong>Warhammer Fantasy Roleplay</strong> - Like Call of Cthulhu, WFRP uses a d100 "roll-under" system for skills and combat. The percentile scale makes it easy to understand your exact odds on any given check.</li>
        </ul>
      </section>

      <section class="content-section">
        <h2 class="content-heading">d100 vs d20: When to Use Each</h2>
        <p>The <a href="/1-dice/20-sides/">d20</a> divides outcomes into 5% increments, while the d100 works in 1% increments. This makes the d100 better suited for systems that want fine-grained probability control - a skill of 73% means exactly what it says. The d20, by contrast, works well for systems where modifiers and difficulty classes do the heavy lifting, with the die providing a broad random element.</p>
        <p>Most modern D&amp;D gameplay uses the d20 for core mechanics, reserving the d100 for tables and special effects where a wider range of outcomes is needed. Systems like Call of Cthulhu and Warhammer chose the d100 as their core mechanic specifically because players find percentage-based odds intuitive and easy to reason about.</p>
      </section>
    </main>`;

function getPageContent(dice, sides) {
  return PAGE_CONTENT[`${dice}-${sides}`] || '';
}

// --- HTML template for roll pages ---

function buildRollPageHtml(dice, sides) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pageTitle(dice, sides)}</title>
    <meta name="description" content="${metaDescription(dice, sides)}" />
    <link rel="icon" type="image/png" href="../../assets/favicon.png" />
    <link rel="apple-touch-icon" href="../../assets/webclip.png" />
    <meta property="og:title" content="${pageTitle(dice, sides)}" />
    <meta property="og:description" content="${metaDescription(dice, sides)}" />
    <meta property="og:image" content="${SITE_URL}/assets/og-image.png" />
    <meta property="og:url" content="${SITE_URL}${pageUrl(dice, sides)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="QuickDice" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${pageTitle(dice, sides)}" />
    <meta name="twitter:description" content="${metaDescription(dice, sides)}" />
    <meta name="twitter:image" content="${SITE_URL}/assets/og-image.png" />
    <link rel="canonical" href="${SITE_URL}${pageUrl(dice, sides)}" />
    <link rel="stylesheet" href="../../styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Figtree:wght@600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body data-page-dice="${dice}" data-page-sides="${sides}">
    <nav class="nav">
      <a href="/" class="nav-logo">
        <img src="../../assets/dice-logomark.svg" alt="" class="nav-logo-icon" width="48" height="48" />
        <span class="nav-logo-text">QuickDice</span>
      </a>
    </nav>

    <div class="app">
      <header class="header">
        <h1 class="title">${pageH1(dice, sides)}</h1>
        <p class="subtitle">
          ${pageSubtitle(dice, sides)}
        </p>
      </header>

      <div class="controls-card">
        <div class="control-group">
          <label for="num-dice" class="control-label">Number of dice</label>
          <select id="num-dice" class="control-select">
${buildDiceOptions(dice, sides)}
          </select>
        </div>
        <div class="control-divider"></div>
        <div class="control-group">
          <label for="num-sides" class="control-label">Number of sides</label>
          <select id="num-sides" class="control-select">
${buildSidesOptions(dice, sides)}
          </select>
        </div>
        <button class="modifier-btn" id="modifier-btn" type="button" aria-label="Set roll modifier">+/&minus;</button>
      </div>

      <div class="dice-area" id="dice-area"></div>

      <div class="result-container" id="result-container">
        <p class="roll-prompt" id="roll-prompt">
          Hit roll to test your luck! 👇️
        </p>
        <div class="result-display" id="result-display">
          <span class="result-label">Total</span>
          <span class="result-value" id="result-value">-</span>
        </div>
      </div>

      <button class="roll-btn" id="roll-btn">
        <span class="roll-btn-text">Roll</span>
        <svg
          class="roll-btn-icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="4" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <p class="roll-hint">or press spacebar</p>
    </div>

    <section class="roll-history-section" id="roll-history"></section>
${getPageContent(dice, sides)}
    <section class="popular-rolls">
      <h2 class="popular-rolls-heading">Other Popular Rolls</h2>
      <div class="popular-rolls-grid">
${buildPopularRolls(dice, sides)}
      </div>
    </section>

    <footer class="site-footer">
      <p>&copy; ${new Date().getFullYear()} QuickDice</p>
    </footer>

    <div class="modifier-overlay" id="modifier-overlay">
      <div class="modifier-modal">
        <p class="modifier-modal-title">Add modifier</p>
        <div class="modifier-stepper">
          <button class="modifier-stepper-btn" id="modifier-dec" type="button" aria-label="Decrease modifier">&minus;</button>
          <input class="modifier-stepper-input" id="modifier-input" type="number" value="0" aria-label="Modifier value" />
          <button class="modifier-stepper-btn" id="modifier-inc" type="button" aria-label="Increase modifier">+</button>
        </div>
        <button class="modifier-apply-btn" id="modifier-apply" type="button">Apply</button>
      </div>
    </div>

    <script src="../../script.js"></script>
  </body>
</html>
`;
}

// --- Sitemap ---

function buildSitemap() {
  const urls = [];

  // Home page
  urls.push(SITE_URL + '/');

  // All roll pages
  for (let dice = MIN_DICE; dice <= MAX_DICE; dice++) {
    for (const sides of SIDES) {
      if (dice === HOME_DICE && sides === HOME_SIDES) continue;
      urls.push(SITE_URL + pageUrl(dice, sides));
    }
  }

  const entries = urls
    .map(url => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

// --- Generate pages ---

let count = 0;

for (let dice = MIN_DICE; dice <= MAX_DICE; dice++) {
  for (const sides of SIDES) {
    // Skip home page combo
    if (dice === HOME_DICE && sides === HOME_SIDES) continue;

    const dir  = path.join(ROOT, `${dice}-dice`, `${sides}-sides`);
    const file = path.join(dir, 'index.html');

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, buildRollPageHtml(dice, sides), 'utf-8');
    count++;
  }
}

// Generate sitemap
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap(), 'utf-8');

console.log(`Done! Generated ${count} roll pages + sitemap.xml`);
