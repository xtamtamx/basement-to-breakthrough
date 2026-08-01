import { EventCard } from '@game/mechanics/EventCardSystem';

/**
 * Faction reckonings — the scene coming to collect.
 *
 * The rest of the event deck is drawn on a timer. These are not: each one fires
 * because a faction's standing with you crossed a line, so the scene reacts to
 * what you have actually been booking rather than to the calendar. Love or
 * loathing, they show up and ask you to prove it, and every answer costs you
 * standing somewhere else — that is the whole point of a faction axis. Nobody in
 * a scene gets to be everyone's friend.
 *
 * They are ordinary EventCards, so they ride the existing draw → modal → apply
 * pipeline (choice previews, DIY pills, persistence) rather than growing a second
 * one. The dead FactionSystem event cluster that used to shadow all of this —
 * generateFactionEvents / createConflictEvent / getPendingEvents, none of it ever
 * called — was deleted rather than wired up.
 *
 * Magnitudes: standing swings of ±14–20 (the axis is clamped ±100 and a maxed
 * faction is only worth ~8% attendance, so a reckoning should MOVE you), money in
 * the low hundreds, and diyDelta in the 8–15 band the minor forks use.
 */

/**
 * Standings that count as having picked a side.
 *
 * Measured, not guessed: over a full Classic run the sim's standings land in
 * roughly -25..+20, because a promoter books the same handful of signed acts and
 * only the factions those acts align with ever move. Thresholds of +-45 (the
 * first guess) fired in exactly zero runs out of fifteen. These sit just inside
 * the range a committed run actually reaches, so a promoter with a clear taste
 * gets a reckoning and a scattergun one does not.
 */
export const FACTION_DEVOTION_THRESHOLD = 15;
export const FACTION_GRUDGE_THRESHOLD = -15;

export interface FactionReckoning {
  /** Faction whose standing triggers this. */
  factionId: string;
  /** 'devotion' fires on high standing, 'grudge' on low. */
  mood: 'devotion' | 'grudge';
  card: EventCard;
}

export const FACTION_RECKONINGS: FactionReckoning[] = [
  // ── The DIY Purists Collective ────────────────────────────────────────────
  {
    factionId: 'diy-purists',
    mood: 'devotion',
    card: {
      id: 'faction_purists_devotion',
      name: 'They Want The Basement Back',
      description:
        "The Purists have decided you're one of the good ones, which means they now want something. There's a kid's basement in Massapequa with a PA held together by hope, and they'd like your next real booking to happen there instead. For the scene.",
      icon: 'fire',
      type: 'opportunity',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'play_the_basement',
          text: 'Book it. The room was never the point',
          diyDelta: 12,
          effects: [
            { type: 'resource_change', target: 'player', value: { money: -120, reputation: 8 }, description: '-$120, +8 rep' },
            { type: 'faction_change', target: 'player', value: { 'diy-purists': 18, 'indie-crowd': -12 }, description: 'The Purists are yours; the Indie Crowd finds it a bit much' },
          ],
        },
        {
          id: 'offer_the_opener',
          text: "Offer them an opening slot instead",
          diyDelta: -8,
          effects: [
            { type: 'resource_change', target: 'player', value: { money: 90 }, description: '+$90' },
            { type: 'faction_change', target: 'player', value: { 'diy-purists': -14, 'indie-crowd': 8 }, description: 'The Purists call it a consolation prize' },
          ],
        },
      ],
      flavorText: "\"It's not a smaller show. It's a smaller room.\"",
      artStyle: 'tour_flyer',
    },
  },

  // ── The Trve Kvlt Brotherhood ─────────────────────────────────────────────
  {
    factionId: 'metal-elite',
    mood: 'grudge',
    card: {
      id: 'faction_metal_grudge',
      name: 'The Spreadsheet Has Your Name On It',
      description:
        "Somebody in a battle vest has been keeping a list of promoters who've betrayed the scene, and you have been added with a footnote. They'd like a public apology. They have specified the wording.",
      icon: 'skull',
      type: 'crisis',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'apologise',
          text: 'Read their statement at the next show',
          diyDelta: 4,
          effects: [
            { type: 'resource_change', target: 'player', value: { reputation: -5, stress: 4 }, description: '-5 rep, +4 stress' },
            { type: 'faction_change', target: 'player', value: { 'metal-elite': 20 }, description: 'The Brotherhood strikes the footnote' },
          ],
        },
        {
          id: 'laugh',
          text: 'Put the list on the flyer',
          diyDelta: 8,
          effects: [
            { type: 'resource_change', target: 'player', value: { reputation: 8 }, description: '+8 rep' },
            { type: 'faction_change', target: 'player', value: { 'metal-elite': -16, 'new-wave': 14 }, description: 'The Brotherhood seethes; the kids think it rules' },
          ],
        },
      ],
      flavorText: 'Column C is "standard tuning incidents."',
      artStyle: 'press_release',
    },
  },

  // ── The 'Scene Was Better in the 90s' Association ──────────────────────────
  {
    factionId: 'old-guard',
    mood: 'devotion',
    card: {
      id: 'faction_oldguard_devotion',
      name: 'You Really Had To Be There',
      description:
        "The Association has adopted you, and adoption means an anniversary show. Same bill as '97, minus the two who moved away and the one nobody talks about. They have already told people it's happening.",
      icon: 'fame',
      type: 'opportunity',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'run_the_reunion',
          text: 'Run the reunion. Let them have the night',
          diyDelta: -4,
          effects: [
            { type: 'resource_change', target: 'player', value: { money: 240, reputation: 6 }, description: '+$240, +6 rep' },
            { type: 'faction_change', target: 'player', value: { 'old-guard': 18, 'new-wave': -16 }, description: 'The Association weeps; the kids stay home' },
          ],
        },
        {
          id: 'book_the_kids',
          text: 'Book the kids opening for them',
          diyDelta: 10,
          effects: [
            { type: 'resource_change', target: 'player', value: { money: 60, stress: 5 }, description: '+$60, +5 stress' },
            { type: 'faction_change', target: 'player', value: { 'new-wave': 16, 'old-guard': -10 }, description: 'The kids get a room; the Association grumbles through the openers' },
          ],
        },
      ],
      flavorText: 'The one nobody talks about is doing fine, actually.',
      artStyle: 'concert_poster',
    },
  },

  // ── The TikTok Generation ─────────────────────────────────────────────────
  {
    factionId: 'new-wave',
    mood: 'grudge',
    card: {
      id: 'faction_newwave_grudge',
      name: 'Someone Filmed The Door',
      description:
        "A forty-second clip of your door guy turning away a fifteen-year-old is doing numbers. The comments have opinions about gatekeeping, ticket prices, and you personally.",
      icon: 'fans',
      type: 'crisis',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'all_ages_pledge',
          text: 'Announce the next one is all-ages, no exceptions',
          diyDelta: 10,
          effects: [
            { type: 'resource_change', target: 'player', value: { money: -100 }, description: '-$100 (the bar will not be pleased)' },
            { type: 'faction_change', target: 'player', value: { 'new-wave': 20, 'old-guard': -12 }, description: 'The kids come back; the Association mutters about liability' },
          ],
        },
        {
          id: 'ride_it_out',
          text: "Say nothing. It'll scroll past by Thursday",
          diyDelta: -6,
          effects: [
            { type: 'resource_change', target: 'player', value: { stress: 8 }, description: '+8 stress' },
            { type: 'faction_change', target: 'player', value: { 'new-wave': -10 }, description: 'It does not, entirely, scroll past' },
          ],
        },
      ],
      flavorText: 'Duet stitched with a guy explaining what a VFW hall is.',
      artStyle: 'press_release',
    },
  },

  // ── The Tastefully Depressed Collective ───────────────────────────────────
  {
    factionId: 'indie-crowd',
    mood: 'devotion',
    card: {
      id: 'faction_indie_devotion',
      name: 'A Tasteful Amount Of Reverb',
      description:
        "The Collective would like to curate an evening. There will be a projector. There will be a zine. Somebody has already written the words 'liminal' and 'sonic' on a poster and they are extremely pleased with themselves.",
      icon: 'sparkle',
      type: 'opportunity',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'let_them_curate',
          text: 'Hand them the night',
          diyDelta: -6,
          effects: [
            { type: 'resource_change', target: 'player', value: { money: 180, stress: 7 }, description: '+$180, +7 stress' },
            { type: 'faction_change', target: 'player', value: { 'indie-crowd': 18, 'metal-elite': -14 }, description: 'The Collective is delighted; the Brotherhood is not' },
          ],
        },
        {
          id: 'keep_it_loud',
          text: 'Keep the bill loud and the projector off',
          diyDelta: 8,
          effects: [
            { type: 'resource_change', target: 'player', value: { money: -60, reputation: 5 }, description: '-$60, +5 rep' },
            { type: 'faction_change', target: 'player', value: { 'indie-crowd': -12, 'metal-elite': 14 }, description: 'The Collective is disappointed in you, gently' },
          ],
        },
      ],
      flavorText: 'The zine is beautiful. Nobody will read it.',
      artStyle: 'backstage_pass',
    },
  },
];

/**
 * The reckoning a standing has earned, or null. `fired` carries the ids already
 * spent this run so the scene doesn't ask twice.
 */
export function reckoningFor(
  standings: Record<string, number>,
  fired: string[],
): FactionReckoning | null {
  for (const reckoning of FACTION_RECKONINGS) {
    if (fired.includes(reckoning.card.id)) continue;
    const standing = standings[reckoning.factionId] ?? 0;
    const earned =
      reckoning.mood === 'devotion'
        ? standing >= FACTION_DEVOTION_THRESHOLD
        : standing <= FACTION_GRUDGE_THRESHOLD;
    if (earned) return reckoning;
  }
  return null;
}
