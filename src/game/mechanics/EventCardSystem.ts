interface EventGameState {
  turn?: number;
  reputation?: number;
  sceneState?: string;
  activeSynergies?: number;
  totalCards?: number;
}

interface EventApplyResult {
  appliedEffects: EventEffect[];
  modifiedCards: Array<{ target: EventTarget; modifications: StatModification }>;
  resourceChanges: ResourceModification;
  /** Combo-synergy ids a choice grants (consumed by the store -> discoverSynergy). */
  triggeredSynergies: string[];
  /** Scene-state nudges (consumed by the store -> diyPoints via makePathChoice). */
  sceneChanges: SceneModification[];
  /** Faction standing deltas (consumed by the store -> factionStandings). */
  factionChanges: Record<string, number>;
  spawnedCards: unknown[];
}

export interface EventCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'opportunity' | 'crisis' | 'wildcard' | 'legendary';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  duration: 'instant' | 'turn' | 'persistent';
  effects: EventEffect[];
  requirements?: EventRequirement[];
  choices?: EventChoice[];
  flavorText?: string;
  artStyle?: 'concert_poster' | 'backstage_pass' | 'tour_flyer' | 'press_release';
}

export type EventTarget =
  | 'all_bands'
  | 'all_venues'
  | 'random_band'
  | 'random_venue'
  | 'player'
  | 'specific';

/** Stat deltas applied to bands or venues by a modify_stat effect. */
export interface StatModification {
  popularity?: number;
  authenticity?: number;
  energy?: number;
  technicalSkill?: number;
  stress?: number;
  capacity?: number;
}

/** Resource deltas applied to the player by a resource_change effect. */
export interface ResourceModification {
  money?: number;
  reputation?: number;
  fans?: number;
  stress?: number;
  connections?: number;
  legacy?: number;
}

/** Payload describing a card spawned or transformed by an effect. */
export interface CardModification {
  type?: string;
  cardType?: string;
  cardData?: unknown;
  closed?: boolean;
}

/** Payload describing a change to the broader scene state. */
export interface SceneModification {
  exposure?: string;
  [key: string]: unknown;
}

export type EventEffect =
  | {
      type: 'modify_stat';
      target: EventTarget;
      value: StatModification;
      duration?: number;
      description: string;
    }
  | {
      type: 'spawn_card' | 'transform_card';
      target: EventTarget;
      value: CardModification;
      duration?: number;
      description: string;
    }
  | {
      type: 'trigger_synergy';
      target: EventTarget;
      value: string;
      duration?: number;
      description: string;
    }
  | {
      type: 'scene_change';
      target: EventTarget;
      value: SceneModification;
      duration?: number;
      description: string;
    }
  | {
      type: 'resource_change';
      target: 'player';
      value: ResourceModification;
      duration?: number;
      description: string;
    }
  | {
      type: 'faction_change';
      target: 'player';
      /** faction id -> standing delta (applied to the persisted factionStandings). */
      value: Record<string, number>;
      duration?: number;
      description: string;
    };

export interface EventRequirement {
  type: 'turn_number' | 'reputation' | 'scene_state' | 'active_synergies' | 'card_count';
  value: unknown;
  operator: 'greater_than' | 'less_than' | 'equals';
}

export interface EventChoice {
  id: string;
  text: string;
  effects: EventEffect[];
  cost?: { type: 'money' | 'reputation' | 'stress'; amount: number };
}

export interface ActiveEvent {
  card: EventCard;
  turnsRemaining: number;
  appliedEffects: EventEffect[];
}

export interface EventHistoryEntry {
  cardId: string;
  turn: number;
  choice?: string;
}

class EventCardSystem {
  private eventCards: Map<string, EventCard> = new Map();
  private activeEvents: ActiveEvent[] = [];
  private eventHistory: EventHistoryEntry[] = [];
  
  constructor() {
    this.initializeEventCards();
  }
  
  private initializeEventCards() {
    // Opportunity Events
    this.addEventCard({
      id: 'music_festival_announced',
      name: 'Coachella Accidentally Books Local Doom Band After Intern Mishears "Dune"',
      description: 'Festival organizers reportedly spent three hours debating whether "Sludgelord" was a typo before deciding to "lean into the underground vibe." The $150,000 performance fee remains unchanged despite the band\'s usual draw of 12 people.',
      icon: '🎪',
      type: 'opportunity',
      rarity: 'uncommon',
      duration: 'turn',
      effects: [{
        type: 'modify_stat',
        target: 'all_bands',
        value: { popularity: 10, energy: 5 },
        description: 'All bands gain popularity and energy'
      }],
      choices: [
        {
          id: 'apply_all',
          text: 'Submit every band with a pulse and a Bandcamp page',
          effects: [{
            type: 'resource_change',
            target: 'player',
            value: { connections: -2 },
            description: 'Costs connections to submit'
          }]
        },
        {
          id: 'select_best',
          text: 'Only submit the band that showers most frequently',
          effects: [{
            type: 'modify_stat',
            target: 'random_band',
            value: { popularity: 25 },
            description: 'One band gets major boost'
          }]
        }
      ],
      flavorText: "Sources close to the festival confirm they still don't know what shoegaze is.",
      artStyle: 'tour_flyer'
    });
    
    this.addEventCard({
      id: 'record_label_scout',
      name: 'Atlantic Records A&R Rep Googles "What Is Hardcore" During Show',
      description: 'Witnesses report seeing a confused man in a $3,000 suit frantically texting "These guys are just yelling?" while standing directly in the pit. His assistant was later hospitalized after attempting to crowdsurf in loafers.',
      icon: '👔',
      type: 'opportunity',
      rarity: 'rare',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'sell_out',
          text: 'Sign that 360 deal and start practicing your radio voice',
          effects: [
            {
              type: 'modify_stat',
              target: 'all_bands',
              value: { popularity: 30, authenticity: -40 },
              description: 'Fame at the cost of credibility'
            },
            {
              type: 'resource_change',
              target: 'player',
              value: { money: 500 },
              description: 'Big payday!'
            }
          ]
        },
        {
          id: 'stay_true',
          text: 'Tell him the bathroom is actually the merch table',
          effects: [
            {
              type: 'modify_stat',
              target: 'all_bands',
              value: { authenticity: 20 },
              description: 'Scene respect increased'
            },
            {
              type: 'trigger_synergy',
              target: 'all_bands',
              value: 'diy-authentic',
              description: 'Triggers DIY synergies'
            }
          ]
        }
      ],
      artStyle: 'backstage_pass'
    });
    
    // Crisis Events
    this.addEventCard({
      id: 'police_crackdown',
      name: 'Police Mistake House Show for "Satanic Ritual" Due to Corpse Paint',
      description: 'Local PD\'s "Gang Unit" spent six hours analyzing black metal logos before concluding they were "definitely summoning something." The lead officer\'s report noted suspicious "upside-down crosses" that were later identified as the letter T.',
      icon: '🚔',
      type: 'crisis',
      rarity: 'common',
      duration: 'turn',
      effects: [{
        type: 'modify_stat',
        target: 'all_venues',
        value: { capacity: -20 },
        description: 'All venues have reduced capacity'
      }],
      requirements: [{
        type: 'scene_state',
        value: 'underground',
        operator: 'equals'
      }],
      flavorText: "Department training video now includes a slide titled 'Mosh Pit vs. Demonic Possession: Know the Difference.'",
      artStyle: 'press_release'
    });
    
    this.addEventCard({
      id: 'venue_fire',
      name: 'DIY Venue\'s "Vintage" Wiring Finally Achieves Dream of Becoming Fire',
      description: 'After 40 years of code violations, the electrical system at The Rat\'s Nest has fulfilled its lifelong ambition. Fire marshal quoted as saying "I\'m honestly surprised it took this long" while standing in a puddle of what neighbors describe as "definitely not up to code."',
      icon: '🔥',
      type: 'crisis',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'fundraiser',
          text: 'Organize benefit show called "Burn This Mother Down" (too soon?)',
          effects: [{
            type: 'resource_change',
            target: 'player',
            value: { money: -100, reputation: 20 },
            description: 'Spend money to gain scene cred'
          }],
          cost: { type: 'money', amount: 100 }
        },
        {
          id: 'ignore',
          text: 'Post "thoughts and prayers" on Instagram and move on',
          effects: [{
            type: 'resource_change',
            target: 'player',
            value: { reputation: -10 },
            description: 'Lose respect for not helping'
          }]
        }
      ]
    });
    
    // Wildcard Events
    this.addEventCard({
      id: 'battle_of_bands',
      name: 'Guitar Center Hosts Battle of the Bands, Winner Gets $50 Gift Card',
      description: 'Local musicians reportedly spending upwards of $2,000 on new gear to compete for store credit that "technically expires in 90 days." Judge panel consists of three employees who "mostly work in the keyboard section."',
      icon: '⚔️',
      type: 'wildcard',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'compete',
          text: 'Dust off that Wonderwall cover for the finals',
          effects: [
            {
              type: 'modify_stat',
              target: 'all_bands',
              value: { energy: 20, stress: 15 },
              description: 'Bands get pumped but stressed'
            }
          ]
        },
        {
          id: 'boycott',
          text: 'Start rival event at the abandoned Arby\'s',
          effects: [{
            type: 'modify_stat',
            target: 'all_bands',
            value: { authenticity: 15 },
            description: 'Unity over competition'
          }]
        }
      ],
      artStyle: 'concert_poster'
    });
    
    this.addEventCard({
      id: 'documentary_crew',
      name: 'Vice Documentarian Can\'t Stop Asking "But Why Are You So Angry?"',
      description: 'Film student with wealthy parents spending $80,000 on thesis about "The Dark Underbelly of DIY." Has been spotted asking the sound guy if he "ever smiles" and whether the mosh pit represents "societal collapse or just bad parenting."',
      icon: '📹',
      type: 'wildcard',
      rarity: 'rare',
      duration: 'persistent',
      effects: [{
        type: 'modify_stat',
        target: 'all_bands',
        value: { popularity: 5 },
        duration: 3,
        description: 'Ongoing exposure boost'
      }],
      choices: [
        {
          id: 'full_access',
          text: 'Let them film everything, including the bathroom graffiti',
          effects: [{
            type: 'scene_change',
            target: 'player',
            value: { exposure: 'high' },
            description: 'Scene goes viral'
          }]
        },
        {
          id: 'controlled',
          text: 'Assign someone to explain that it\'s actually about community',
          effects: [{
            type: 'resource_change',
            target: 'player',
            value: { stress: 10 },
            description: 'Stressful to manage'
          }]
        }
      ]
    });
    
    // Legendary Events
    this.addEventCard({
      id: 'reunion_show',
      name: 'Band That "Broke Up Forever" in 2019 Announces Reunion Tour',
      description: 'Members of Throat Punch, who famously burned their instruments on stage and declared "rock is dead," seen at Guitar Center pricing flame-retardant guitars. Lead singer\'s statement that he "never said forever-forever" has already spawned 47 memes.',
      icon: '👑',
      type: 'legendary',
      rarity: 'legendary',
      duration: 'instant',
      requirements: [{
        type: 'turn_number',
        value: 10,
        operator: 'greater_than'
      }],
      effects: [
        {
          type: 'modify_stat',
          target: 'all_bands',
          value: { energy: 25, popularity: 15 },
          description: 'Everyone is inspired'
        },
        {
          type: 'trigger_synergy',
          target: 'all_bands',
          value: 'underground-network',
          description: 'Scene comes together'
        }
      ],
      flavorText: "Ticket prices start at $180 for 'authentic DIY experience.'",
      artStyle: 'concert_poster'
    });
    
    this.addEventCard({
      id: 'perfect_storm',
      name: 'Every Band\'s Van Breaks Down at Same Gas Station, Accidentally Creates Festival',
      description: 'What started as 17 separate radiator failures has transformed a Shell station into "GasStock 2024." Attendant quoted as saying he "just wanted to close at 10" while reluctantly becoming the event\'s de facto stage manager. Local news already calling it "Woodstock for people with AAA memberships."',
      icon: '⚡',
      type: 'legendary',
      rarity: 'legendary',
      duration: 'turn',
      requirements: [
        {
          type: 'active_synergies',
          value: 5,
          operator: 'greater_than'
        },
        {
          type: 'reputation',
          value: 80,
          operator: 'greater_than'
        }
      ],
      effects: [
        {
          type: 'modify_stat',
          target: 'all_bands',
          value: { 
            popularity: 50,
            energy: 100,
            authenticity: 100,
            technicalSkill: 30
          },
          description: 'All bands reach peak performance'
        },
        {
          type: 'resource_change',
          target: 'player',
          value: {
            money: 1000,
            reputation: 50
          },
          description: 'Massive rewards'
        }
      ],
      flavorText: "The bathroom key is now being treated as a holy relic."
    });

    // --- Added events (v2 content pass) --------------------------------------
    this.addEventCard({
      id: 'bandcamp_friday',
      name: "Bandcamp Waives Its Cut For 24 Hours; Scene Collectively Pretends It Doesn't Need The Money",
      description: "Every act in town simultaneously drops a 'surprise' live tape at 11:58pm. The servers buckle. The vibes are immaculate.",
      icon: '💸',
      type: 'opportunity',
      rarity: 'common',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'dump_everything',
          text: 'Dump every demo, name-your-price, beg politely',
          effects: [{ type: 'resource_change', target: 'player', value: { money: 150, fans: 20 }, description: '+$150, +20 fans' }],
        },
        {
          id: 'hold_out',
          text: 'Hold out for "the algorithm" (it is not coming)',
          effects: [{ type: 'resource_change', target: 'player', value: { connections: 1, reputation: 5 }, description: '+1 connection, +5 rep' }],
        },
      ],
      flavorText: 'Servers crashed; vibes immaculate.',
    });

    this.addEventCard({
      id: 'vegan_rider_standoff',
      name: 'Touring Band Refuses To Play Until Someone Finds Oat Milk At 11PM',
      description: 'The promoter is openly weeping in the dairy aisle of a 24-hour Whole Foods. The drummer "doesn\'t do almond."',
      icon: '🥬',
      type: 'crisis',
      rarity: 'common',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'cave',
          text: 'Cave, expense the artisanal water',
          effects: [{ type: 'resource_change', target: 'player', value: { money: -120, reputation: 10 }, description: '-$120, +10 rep' }],
        },
        {
          id: 'hose',
          text: 'Hand them a garden hose and a smile',
          effects: [{ type: 'resource_change', target: 'player', value: { reputation: -8, fans: 5 }, description: '-8 rep, +5 fans' }],
        },
      ],
      artStyle: 'press_release',
    });

    this.addEventCard({
      id: 'mandatory_fun_meeting',
      name: "Collective Schedules 'Mandatory Fun Meeting' During Everyone's Only Practice",
      description: 'A four-hour consensus circle on whether the zine should have staples. Tabled until next week.',
      icon: '📋',
      type: 'wildcard',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'consensus',
          text: 'Achieve consensus (lose the whole night)',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { energy: -10 }, description: 'Bands drained' },
            { type: 'resource_change', target: 'player', value: { connections: 2 }, description: '+2 connections' },
          ],
        },
        {
          id: 'walk_out',
          text: 'Walk out and just play the songs',
          effects: [{ type: 'modify_stat', target: 'all_bands', value: { energy: 10, authenticity: 10 }, description: 'Bands fired up' }],
        },
      ],
      flavorText: 'Motion to adjourn the motion failed 6-5.',
    });

    this.addEventCard({
      id: 'influencer_discovers_scene',
      name: "TikTok Influencer Discovers Hardcore, Calls It 'Spicy Meditation'",
      description: 'Two million views. Zero understanding. The comments are a war crime.',
      icon: '📱',
      type: 'wildcard',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'sell_out',
          text: 'Ride the clout wave, post the GRWM',
          effects: [{ type: 'modify_stat', target: 'all_bands', value: { popularity: 25 }, description: 'Bands go viral' }],
        },
        {
          id: 'stay_true',
          text: 'Gatekeep, aggressively',
          effects: [{ type: 'modify_stat', target: 'all_bands', value: { authenticity: 15 }, description: 'Cred up' }],
        },
      ],
      artStyle: 'backstage_pass',
    });

    this.addEventCard({
      id: 'merch_table_heist',
      name: "Someone Steals The Merch Cashbox; Suspect Described As 'Guy In A Band Shirt'",
      description: 'Witnesses have narrowed the suspect pool down to literally everyone in attendance.',
      icon: '🧦',
      type: 'crisis',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'eat_loss',
          text: 'Eat the loss, stay classy',
          effects: [{ type: 'resource_change', target: 'player', value: { money: -200, reputation: 15 }, description: '-$200, +15 rep' }],
        },
        {
          id: 'witch_hunt',
          text: 'Start a witch hunt in the group chat',
          effects: [{ type: 'resource_change', target: 'player', value: { money: -50, stress: 10, reputation: -5 }, description: '-$50, +10 stress, -5 rep' }],
        },
      ],
    });

    this.addEventCard({
      id: 'mutual_aid_benefit',
      name: 'Benefit Show Raises 43 Dollars And Immeasurable Cred',
      description: 'The cause is good. The turnout is "intimate." The cred is the point.',
      icon: '🤝',
      type: 'opportunity',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'donate_door',
          text: 'Donate the whole door',
          effects: [
            { type: 'resource_change', target: 'player', value: { money: -60, reputation: 25 }, description: '-$60, +25 rep' },
            { type: 'trigger_synergy', target: 'all_bands', value: 'underground-network', description: 'Scene unity' },
          ],
        },
        {
          id: 'keep_door',
          text: 'Quietly keep the door (rent is rent)',
          effects: [{ type: 'resource_change', target: 'player', value: { money: 60, reputation: -8 }, description: '+$60, -8 rep' }],
        },
      ],
      flavorText: 'The cred does not pay rent. The cred is the point.',
    });

    this.addEventCard({
      id: 'local_promoter_spotify',
      name: "Local Promoter Has Never Heard of Spotify (It's 2024)",
      description: 'An aging scenester insists all bookings go through a LiveJournal link he has not updated since 2009. Does not understand "streaming." Has a Rolodex.',
      icon: '📇',
      type: 'opportunity',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'indulge',
          text: 'Pretend you still use MySpace, get the booking',
          effects: [{ type: 'resource_change', target: 'player', value: { reputation: 12, connections: 1 }, description: '+12 rep, +1 connection' }],
        },
        {
          id: 'modernize',
          text: 'Send him a Spotify link anyway (efficient, condescending)',
          effects: [{ type: 'resource_change', target: 'player', value: { reputation: -5 }, description: 'He calls you "too online"' }],
        },
      ],
      flavorText: 'His filing cabinet has a USB slot taped to the side.',
      artStyle: 'backstage_pass',
    });

    this.addEventCard({
      id: 'drummer_tsa',
      name: "Drummer's Cymbals Confiscated by TSA, Replaced With 'Replicas'",
      description: 'Three 20-year-old Paiste cymbals are now government property. Replacements arrived via overnight shipping at 2:30 AM. They sound like trash can lids.',
      icon: '✈️',
      type: 'crisis',
      rarity: 'common',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'replace_quick',
          text: 'Buy emergency cymbals to save the show (oof)',
          effects: [{ type: 'resource_change', target: 'player', value: { money: -180, reputation: 8 }, description: '-$180, +8 rep for saving it' }],
        },
        {
          id: 'borrow_kit',
          text: 'Call a local drummer; borrow their kit',
          effects: [{ type: 'resource_change', target: 'player', value: { connections: -2, stress: 5 }, description: '-2 connections, +5 stress' }],
        },
      ],
    });

    this.addEventCard({
      id: 'three_band_wrong_venue',
      name: 'Three Bands Show Up to Wrong Venue, Accidentally Throw a Festival',
      description: 'A routing mishap deposits two openers and a headliner at a room expecting only one of them. The crowd is confused. The vibe is immaculate. Attendance doubled.',
      icon: '🗺️',
      type: 'wildcard',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'lean_in',
          text: 'Turn it into a surprise festival moment',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { popularity: 12, energy: 15 }, description: 'All bands ride the high' },
            { type: 'resource_change', target: 'player', value: { fans: 40, reputation: 15 }, description: '+40 fans, +15 rep' },
          ],
        },
        {
          id: 'apologize',
          text: 'Apologize, reschedule the extras',
          effects: [{ type: 'resource_change', target: 'player', value: { stress: 8, reputation: -5 }, description: '+8 stress, -5 rep' }],
        },
      ],
      artStyle: 'concert_poster',
    });

    this.addEventCard({
      id: 'vinyl_repress_shortage',
      name: 'Vinyl Sold Out Before Release; Scene Debates "Authenticity" of Digital Drop',
      description: 'The 300-copy hand-pressed run was gone in pre-orders within three hours. A 47-post thread erupts over whether a Bandcamp-only drop "defeats the purpose."',
      icon: '💿',
      type: 'opportunity',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'embrace_digital',
          text: 'Celebrate the digital drop; move copies, build buzz',
          effects: [
            { type: 'resource_change', target: 'player', value: { money: 200, fans: 30 }, description: '+$200, +30 fans' },
            { type: 'trigger_synergy', target: 'all_bands', value: 'underground-network', description: 'Scene unity over format wars' },
          ],
        },
        {
          id: 'rush_repress',
          text: 'Emergency repress; spend big to get vinyl in hand',
          effects: [{ type: 'resource_change', target: 'player', value: { money: -300, reputation: 20 }, description: '-$300 rush fee, +20 rep for commitment' }],
        },
      ],
      flavorText: 'The thread is cross-posted to Reddit, Threads, and three Discord servers.',
    });

    this.addEventCard({
      id: 'venue_brunch_rebrand',
      name: "Venue Owner Wants to 'Rebrand' as a Brunch Spot; Your Lease Is Up",
      description: 'The space that hosted 200 shows is now gentrification target #1. The landlord wants a pastry display, and live music "doesn\'t really fit the new vision."',
      icon: '🥐',
      type: 'crisis',
      rarity: 'rare',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'fight_it',
          text: 'Organize a scene defense; publicize the landlord greed',
          effects: [
            { type: 'resource_change', target: 'player', value: { money: -100, reputation: 35, connections: -1 }, description: '-$100, +35 rep, -1 connection (burned bridge)' },
            { type: 'trigger_synergy', target: 'all_bands', value: 'underground-network', description: 'The scene unifies' },
          ],
        },
        {
          id: 'negotiate',
          text: 'Pitch a 3x/month "heritage series" (compromise)',
          effects: [{ type: 'resource_change', target: 'player', value: { reputation: 10, connections: 1 }, description: '+10 rep, +1 connection' }],
        },
        {
          id: 'fold',
          text: 'Accept defeat; start scouting new rooms',
          effects: [{ type: 'resource_change', target: 'player', value: { reputation: -20, stress: 15 }, description: '-20 rep, +15 stress' }],
        },
      ],
      artStyle: 'press_release',
    });

    this.addEventCard({
      id: 'legendary_opener_slot',
      name: 'Major Festival Needs a Last-Minute Opener; Your Best Band Gets the Call',
      description: 'A mid-tier act dropped out of a 5,000-cap fest. The booker saw your scene energy and offers your hottest band the opening slot. Friday, one-hour set, no pay — but the exposure is real.',
      icon: '👑',
      type: 'legendary',
      rarity: 'rare',
      duration: 'instant',
      requirements: [{ type: 'turn_number', value: 15, operator: 'greater_than' }],
      effects: [],
      choices: [
        {
          id: 'say_yes',
          text: 'Say yes; brief the band and pray they kill it',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { popularity: 20, energy: 18, stress: 12 }, description: 'Fame + adrenaline + nerves' },
            { type: 'resource_change', target: 'player', value: { reputation: 25, fans: 60 }, description: '+25 rep, +60 fans' },
          ],
        },
        {
          id: 'decline',
          text: 'Decline (building your own festival sounds better)',
          effects: [{ type: 'resource_change', target: 'player', value: { reputation: 5 }, description: '+5 rep for staying true' }],
        },
      ],
      flavorText: 'The crowd will be 60% crew and VIPs. You have 59 minutes to prepare the band of their life.',
      artStyle: 'tour_flyer',
    });

    this.addEventCard({
      id: 'soundguy_power_trip',
      name: 'Sound Engineer Who Mixed One Tool Album in 1996 Refuses To Turn Up Vocals',
      description: 'He has folded his arms. He has said "trust me" four times. The monitors are feeding back in a key he describes as "intentional." He keeps calling the singer "chief."',
      icon: '🎛️',
      type: 'wildcard',
      rarity: 'common',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'let_him_cook',
          text: 'Nod gravely and let him cook',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { technicalSkill: 15, energy: -5 }, description: 'A genuinely great mix (he was right, annoyingly)' },
          ],
        },
        {
          id: 'seize_the_board',
          text: 'Gently seize the board and push the faders yourself',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { authenticity: 15, energy: 10 }, description: 'DIY to the bone' },
            { type: 'resource_change', target: 'player', value: { reputation: -3 }, description: 'He is telling everyone you "don\'t respect the craft"' },
          ],
        },
      ],
      flavorText: 'There is no in-ear monitor mix in punk. There is only faith.',
      artStyle: 'backstage_pass',
    });

    this.addEventCard({
      id: 'amp_dies_mid_set',
      name: 'Headlining Band\'s Only Amp Emits Smell, Then Light, Then Silence',
      description: 'The 1978 combo they bought "as a project" has chosen tonight to become a paperweight. The crowd, sensing weakness, has begun a slow clap. The merch person owns a bass amp and is making meaningful eye contact.',
      icon: '🔌',
      type: 'crisis',
      rarity: 'common',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'borrow_gear',
          text: 'Borrow the opener\'s rig (you owe them now)',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { energy: 10 }, description: 'Show goes on, louder than ever' },
            { type: 'resource_change', target: 'player', value: { connections: -1, reputation: 5 }, description: 'Scene solidarity (costs a favor)' },
          ],
        },
        {
          id: 'acoustic_pivot',
          text: 'Unplug everything and call it "an intimate set"',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { authenticity: 25, popularity: -10 }, description: 'Legendarily raw; not everyone stayed' },
          ],
        },
      ],
      flavorText: 'Every great band has one show where the gear died and it became the best one.',
      artStyle: 'concert_poster',
    });

    this.addEventCard({
      id: 'viral_clip_misfire',
      name: 'Band Goes Viral For 8 Seconds Of Bassist Eating It On Stage',
      description: 'The music is not in the clip. The clip is 11 million views of your bassist discovering a monitor wedge with their face. The comments are, somehow, mostly supportive. A brand wants to "collab."',
      icon: '📱',
      type: 'opportunity',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'lean_in',
          text: 'Lean all the way in (pin the clip, sell the shirt)',
          effects: [
            { type: 'resource_change', target: 'player', value: { fans: 200, money: 150 }, description: 'Numbers go up' },
            { type: 'modify_stat', target: 'all_bands', value: { popularity: 20, authenticity: -20 }, description: 'Famous for the wrong eight seconds' },
          ],
        },
        {
          id: 'log_off',
          text: 'Post "we are a band, please listen to the band" and log off',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { authenticity: 20 }, description: 'The real ones respected it' },
            { type: 'trigger_synergy', target: 'all_bands', value: 'diy-authentic', description: 'Triggers DIY synergies' },
          ],
        },
      ],
      flavorText: 'Going viral is just a noise complaint from the whole internet.',
      artStyle: 'press_release',
    });

    this.addEventCard({
      id: 'string_lights_inspector',
      name: 'Fire Marshal Counts The Venue\'s Festive String Lights, Has Concerns',
      description: 'He has a clipboard. He has counted forty-one bulbs across "clearly more than one daisy-chained power strip." He is not mad, he is just going to need you to either fix this or develop a sudden, convincing love of candlelight.',
      icon: '🚨',
      type: 'crisis',
      rarity: 'common',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'pay_electrician',
          text: 'Pay the one scene electrician to make it legit',
          effects: [
            { type: 'resource_change', target: 'player', value: { money: -120, reputation: 6 }, description: 'Up to code, and the room looks incredible' },
          ],
        },
        {
          id: 'unplug_half',
          text: 'Unplug half of them and call it "ambiance"',
          effects: [
            { type: 'modify_stat', target: 'all_venues', value: { capacity: -5 }, description: 'Dimmer, smaller, somehow cozier' },
            { type: 'modify_stat', target: 'all_bands', value: { authenticity: 10 }, description: 'The mood is immaculate' },
          ],
        },
      ],
      flavorText: 'A real DIY space is one bad extension cord away from legend or disaster.',
      artStyle: 'tour_flyer',
    });

    this.addEventCard({
      id: 'split_release_argument',
      name: 'Two Bands Agree To Split a 7-Inch, Immediately Disagree On Whose Logo Goes On Top',
      description: 'The split is recorded, mixed, and mastered. The only remaining obstacle to its release is a four-hour text thread about hierarchy, kerning, and whose cousin did the layout.',
      icon: '💽',
      type: 'wildcard',
      rarity: 'common',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'flip_a_coin',
          text: 'Flip a coin, press it tonight',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { energy: 8 }, description: 'Momentum restored' },
            { type: 'resource_change', target: 'player', value: { fans: 20 }, description: 'A record exists' },
          ],
        },
        {
          id: 'both_logos',
          text: 'Both logos, both upside down, very art',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { authenticity: 12 }, description: 'Annoyingly principled' },
          ],
        },
      ],
      flavorText: 'No money was made and no friendships survived, but the sleeve is gorgeous.',
      artStyle: 'concert_poster',
    });

    this.addEventCard({
      id: 'borrowed_van_returns_empty',
      name: 'Tour Van You Lent Out Comes Back With An Empty Tank And A New Dent',
      description: 'They returned it. That is the good news. The bad news is the check-engine light, the unfamiliar smell, and a single sock that belongs to no one you know.',
      icon: '🚐',
      type: 'crisis',
      rarity: 'common',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'eat_it',
          text: 'Eat it — scene karma is real',
          effects: [
            { type: 'resource_change', target: 'player', value: { money: -90, reputation: 10 }, description: 'You\'re a real one' },
          ],
        },
        {
          id: 'invoice_them',
          text: 'Invoice them in the group chat (passive-aggressively)',
          effects: [
            { type: 'resource_change', target: 'player', value: { money: 40, reputation: -8, stress: 5 }, description: 'Reimbursed, resented' },
          ],
        },
      ],
      flavorText: 'The van remembers everything you have done to it.',
      artStyle: 'tour_flyer',
    });

    this.addEventCard({
      id: 'community_radio_session',
      name: 'College Radio DJ At 2AM Offers Your Band A Live Session (Audience: Possibly Nobody)',
      description: 'The signal reaches roughly four counties and zero confirmed listeners. The DJ has a soul patch and absolute conviction. This is how careers do and do not start.',
      icon: '📻',
      type: 'opportunity',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'show_up',
          text: 'Show up exhausted, play your hearts out',
          effects: [
            { type: 'resource_change', target: 'player', value: { fans: 35, reputation: 10 }, description: 'Someone was listening' },
            { type: 'trigger_synergy', target: 'all_bands', value: 'underground-network', description: 'Scene ties deepen' },
          ],
        },
        {
          id: 'send_demo',
          text: 'Send a pre-recorded demo instead (efficient, soulless)',
          effects: [
            { type: 'resource_change', target: 'player', value: { fans: 12 }, description: 'Fine. It was fine.' },
          ],
        },
      ],
      flavorText: 'The best show you ever played might have been heard by a security guard and an owl.',
      artStyle: 'press_release',
    });

    this.addEventCard({
      id: 'all_ages_xed_hands',
      name: 'All-Ages Show Means The Whole Front Row Has Sharpie X\'s And Strong Opinions',
      description: 'They cannot buy a drink and they would not if they could. They have, however, read everything, formed positions, and brought a friend who is filming for "documentation."',
      icon: '❌',
      type: 'wildcard',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'lean_in',
          text: 'Lean into it: no bar, all heart',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { authenticity: 15 }, description: 'The kids are the scene' },
            { type: 'resource_change', target: 'player', value: { money: -40 }, description: 'No bar tab to lean on' },
          ],
        },
        {
          id: 'serve_the_back',
          text: 'Quietly serve the 21+ in the back (rent is rent)',
          effects: [
            { type: 'resource_change', target: 'player', value: { money: 70, reputation: -8 }, description: 'The front row noticed' },
          ],
        },
      ],
      flavorText: 'An all-ages show is a promise. The X is the receipt.',
      artStyle: 'concert_poster',
    });

    this.addEventCard({
      id: 'genre_purist_zine_review',
      name: 'Local Zine Gives You 2/5, Calls Your Sound "Posthumously Derivative"',
      description: 'The review is 600 words, cut-and-paste collaged, and printed on a copier that was clearly low on toner. It will be read by everyone you have ever met.',
      icon: '📰',
      type: 'crisis',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'frame_it',
          text: 'Frame the review, wear it as a badge',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { authenticity: 10, energy: 8 }, description: 'Spite is a renewable resource' },
          ],
        },
        {
          id: 'rebuttal',
          text: 'Write a 4-paragraph rebuttal nobody asked for',
          effects: [
            { type: 'resource_change', target: 'player', value: { stress: 10, reputation: -5 }, description: 'You did not have to do that' },
          ],
        },
      ],
      flavorText: 'A bad review in a zine that 40 people read is still a review in a zine that 40 people read.',
      artStyle: 'press_release',
    });

    this.addEventCard({
      id: 'reunion_basement_pilgrimage',
      name: 'Legendary Broken-Up Band Quietly Plays The Basement Where They Started, 40 People Know',
      description: 'No flyer, no announcement, one whispered location. The room that should hold sixty holds the entire weight of a scene\'s history and one fire hazard\'s worth of people.',
      icon: '🕯️',
      type: 'legendary',
      rarity: 'rare',
      duration: 'instant',
      requirements: [{ type: 'turn_number', value: 18, operator: 'greater_than' }],
      effects: [],
      choices: [
        {
          id: 'open_for_them',
          text: 'Open for them, soak up the history',
          effects: [
            { type: 'modify_stat', target: 'all_bands', value: { popularity: 18, energy: 15 }, description: 'You shared the riser with legends' },
            { type: 'resource_change', target: 'player', value: { reputation: 22, fans: 50 }, description: 'The story follows you forever' },
          ],
        },
        {
          id: 'keep_the_secret',
          text: 'Keep the secret, let the legend grow',
          effects: [
            { type: 'resource_change', target: 'player', value: { reputation: 10 }, description: 'You can keep a secret' },
            { type: 'trigger_synergy', target: 'all_bands', value: 'underground-network', description: 'The inner circle remembers' },
          ],
        },
      ],
      flavorText: 'Some shows you were at. This is a show you were AT.',
      artStyle: 'backstage_pass',
    });

    // --- Faction "pick a side" cards (the deferred faction-conflict events,
    // folded into this one modal instead of a second system). Each shifts where
    // you stand with two rival tribes — see FactionSystem's relationship web. ---
    this.addEventCard({
      id: 'faction_purity_test',
      name: 'A Sponsor Wants Their Logo On The Basement',
      description: 'An energy drink will fund the whole tour — they just need a banner, a hashtag, and your soul. The purists are watching. So is everyone with a marketing budget.',
      icon: '🥤',
      type: 'crisis',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'take_the_check',
          text: 'Take the check, hang the banner',
          effects: [
            { type: 'resource_change', target: 'player', value: { money: 160 }, description: '+$160' },
            { type: 'faction_change', target: 'player', value: { 'new-wave': 16, 'diy-purists': -18 }, description: 'New Wave nods, the Purists spit' },
          ],
        },
        {
          id: 'tear_it_down',
          text: 'Tear it down on principle',
          effects: [
            { type: 'resource_change', target: 'player', value: { money: -40, reputation: 6 }, description: '-$40, +6 rep' },
            { type: 'faction_change', target: 'player', value: { 'diy-purists': 18, 'new-wave': -10 }, description: 'The Purists salute, the New Wave shrugs' },
          ],
        },
      ],
      flavorText: 'The banner said "STAY WILD." It was for a bank.',
      artStyle: 'press_release',
    });

    this.addEventCard({
      id: 'faction_shred_wars',
      name: 'Two Bands, One Headline Slot, Zero Chill',
      description: 'The shredders say the art-rockers can\'t play. The art-rockers say the shredders can\'t feel. Both are kind of right. You hold the slot.',
      icon: '🎸',
      type: 'wildcard',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'give_it_to_metal',
          text: 'Give it to the shredders',
          effects: [
            { type: 'faction_change', target: 'player', value: { 'metal-elite': 16, 'indie-crowd': -12 }, description: 'Metal Elite up, Indie Crowd down' },
            { type: 'resource_change', target: 'player', value: { fans: 25 }, description: '+25 fans' },
          ],
        },
        {
          id: 'give_it_to_indie',
          text: 'Give it to the art kids',
          effects: [
            { type: 'faction_change', target: 'player', value: { 'indie-crowd': 16, 'metal-elite': -12 }, description: 'Indie Crowd up, Metal Elite down' },
            { type: 'resource_change', target: 'player', value: { reputation: 8 }, description: '+8 rep' },
          ],
        },
      ],
      flavorText: 'The compromise slot (a 4am ambient set) pleased no one.',
    });

    this.addEventCard({
      id: 'faction_generational_clash',
      name: 'The Old Heads Are Mad About The Merch Again',
      description: 'A scene elder corners you about "kids these days" and their QR codes. A teenager livestreams the lecture. The future and the past both want a word.',
      icon: '📼',
      type: 'wildcard',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'honor_elders',
          text: 'Honor the old heads',
          effects: [
            { type: 'faction_change', target: 'player', value: { 'old-guard': 16, 'new-wave': -14 }, description: 'Old Guard up, New Wave down' },
            { type: 'resource_change', target: 'player', value: { reputation: 8 }, description: '+8 rep' },
          ],
        },
        {
          id: 'platform_youth',
          text: 'Platform the new blood',
          effects: [
            { type: 'faction_change', target: 'player', value: { 'new-wave': 16, 'old-guard': -14 }, description: 'New Wave up, Old Guard down' },
            { type: 'resource_change', target: 'player', value: { fans: 30 }, description: '+30 fans' },
          ],
        },
      ],
      flavorText: 'Both sides agreed the sound guy was the real problem.',
    });
  }

  private addEventCard(card: EventCard) {
    this.eventCards.set(card.id, card);
  }

  /** Look up a card definition by id (for tooling/tests). */
  getCardById(id: string): EventCard | undefined {
    return this.eventCards.get(id);
  }

  // Draw a random event card based on current game state
  drawEventCard(gameState: EventGameState): EventCard | null {
    const availableCards = Array.from(this.eventCards.values()).filter(card => {
      // Check requirements
      if (card.requirements) {
        return card.requirements.every(req => {
          switch (req.type) {
            case 'turn_number':
              return this.compareValue(gameState.turn ?? 0, req.value, req.operator);
            case 'reputation':
              return this.compareValue(gameState.reputation ?? 0, req.value, req.operator);
            case 'scene_state':
              return gameState.sceneState === req.value;
            case 'active_synergies':
              return this.compareValue(gameState.activeSynergies ?? 0, req.value, req.operator);
            case 'card_count':
              return this.compareValue(gameState.totalCards ?? 0, req.value, req.operator);
            default:
              return true;
          }
        });
      }
      return true;
    });
    
    if (availableCards.length === 0) return null;
    
    // Weight by rarity
    const weights = {
      common: 4,
      uncommon: 3,
      rare: 2,
      legendary: 1
    };
    
    const weightedCards = availableCards.flatMap(card => 
      Array(weights[card.rarity]).fill(card)
    );
    
    const selected = weightedCards[Math.floor(Math.random() * weightedCards.length)];

    // Feedback is owned by EventCardModal's mount effect (type-tiered audio +
    // haptic) so the card "rings in" when the player actually sees it — firing
    // here too would double up a beat before the modal even shows.
    return selected;
  }
  
  // Apply event choice
  applyEventChoice(card: EventCard, choiceId: string | null, gameState: EventGameState): EventApplyResult {
    const choice = choiceId ? card.choices?.find(c => c.id === choiceId) : null;
    const effects = choice ? choice.effects : card.effects;
    
    const results: EventApplyResult = {
      appliedEffects: effects,
      modifiedCards: [],
      resourceChanges: {},
      triggeredSynergies: [],
      sceneChanges: [],
      factionChanges: {},
      spawnedCards: []
    };

    // Resolve each effect into store-applicable changes. The store action
    // (gameStore.applyEventCardChoice) consumes this result.
    effects.forEach(effect => {
      switch (effect.type) {
        case 'modify_stat':
          results.modifiedCards.push({
            target: effect.target,
            modifications: effect.value
          });
          break;

        case 'resource_change':
          // MERGE additively — a choice can carry multiple resource legs (e.g.
          // -$200 AND +15 rep); overwriting would silently drop all but the last.
          (Object.entries(effect.value) as [keyof ResourceModification, number][]).forEach(([k, v]) => {
            results.resourceChanges[k] = (results.resourceChanges[k] ?? 0) + v;
          });
          break;

        case 'spawn_card':
          results.spawnedCards.push(effect.value);
          break;

        case 'trigger_synergy':
          results.triggeredSynergies.push(effect.value);
          break;

        case 'scene_change':
          results.sceneChanges.push(effect.value);
          break;

        case 'faction_change':
          Object.entries(effect.value).forEach(([fid, v]) => {
            results.factionChanges[fid] = (results.factionChanges[fid] ?? 0) + v;
          });
          break;
      }
    });
    
    // Track active events if persistent
    if (card.duration === 'persistent' || card.duration === 'turn') {
      this.activeEvents.push({
        card,
        turnsRemaining: card.duration === 'turn' ? 1 : 3,
        appliedEffects: effects
      });
    }
    
    // Record history
    this.eventHistory.push({
      cardId: card.id,
      turn: gameState.turn ?? 0,
      choice: choiceId || undefined
    });
    
    return results;
  }
  
  // Process turn-based event effects
  processTurnEffects(): ActiveEvent[] {
    const expiredEffects: ActiveEvent[] = [];

    this.activeEvents = this.activeEvents.filter(event => {
      event.turnsRemaining--;
      
      if (event.turnsRemaining <= 0) {
        expiredEffects.push(event);
        return false;
      }
      return true;
    });
    
    return expiredEffects;
  }
  
  private compareValue(actual: number, expected: unknown, operator: string): boolean {
    const expectedNum = typeof expected === 'number' ? expected : Number(expected);
    switch (operator) {
      case 'greater_than':
        return actual > expectedNum;
      case 'less_than':
        return actual < expectedNum;
      case 'equals':
      default:
        return actual === expectedNum;
    }
  }
  
  // Get active events
  getActiveEvents(): ActiveEvent[] {
    return this.activeEvents;
  }
  
  // Get event history
  getEventHistory(): EventHistoryEntry[] {
    return this.eventHistory;
  }
}

export const eventCardSystem = new EventCardSystem();