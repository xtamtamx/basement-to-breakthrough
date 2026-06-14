import { Band, Genre, TraitType, EquipmentType } from "@game/types";

export const initialBands: Band[] = [
  // DIY Punk Bands
  {
    id: "basement-punks",
    name: "Basement Punks",
    genre: Genre.PUNK,
    subgenres: ["diy-punk", "garage"],
    traits: [
      {
        id: "authentic",
        name: "100% Authentic",
        description: "This band keeps it real",
        type: TraitType.PERSONALITY,
        modifier: { authenticity: 20 },
      },
    ],
    popularity: 15,
    authenticity: 95,
    energy: 80,
    technicalSkill: 30,
    technicalRequirements: [],
    isRealArtist: false,
  },
  {
    id: "angry-neighbors",
    name: "The Angry Neighbors",
    genre: Genre.PUNK,
    subgenres: ["hardcore", "political"],
    traits: [
      {
        id: "political",
        name: "Political Message",
        description: "Strong political lyrics",
        type: TraitType.PERSONALITY,
        modifier: { authenticity: 15 },
      },
    ],
    popularity: 20,
    authenticity: 85,
    energy: 90,
    technicalSkill: 40,
    technicalRequirements: [],
    isRealArtist: false,
  },
  // More punk bands
  {
    id: "broken-strings",
    name: "Broken Strings Theory",
    genre: Genre.PUNK,
    subgenres: ["art-punk", "experimental"],
    traits: [
      {
        id: "experimental",
        name: "Experimental Sound",
        description: "Pushes boundaries",
        type: TraitType.PERFORMANCE,
        modifier: { synergyTags: ["experimental"] },
      },
    ],
    popularity: 25,
    authenticity: 75,
    energy: 70,
    technicalSkill: 60,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Metal Bands
  {
    id: "doom-bringers",
    name: "Doom Bringers",
    genre: Genre.METAL,
    subgenres: ["doom", "stoner"],
    traits: [
      {
        id: "heavy",
        name: "Crushingly Heavy",
        description: "Brutally heavy sound",
        type: TraitType.PERFORMANCE,
        modifier: { energy: 10 },
      },
    ],
    popularity: 35,
    authenticity: 70,
    energy: 100,
    technicalSkill: 80,
    technicalRequirements: [
      { type: EquipmentType.PA_SYSTEM, minimumQuality: 3 },
    ],
    isRealArtist: false,
  },
  {
    id: "technical-death",
    name: "Technical Death Experience",
    genre: Genre.METAL,
    subgenres: ["death", "technical"],
    traits: [
      {
        id: "virtuoso",
        name: "Virtuoso Musicians",
        description: "Incredible technical skill",
        type: TraitType.TECHNICAL,
        modifier: { technicalSkill: 20 },
      },
    ],
    popularity: 40,
    authenticity: 60,
    energy: 85,
    technicalSkill: 95,
    technicalRequirements: [
      { type: EquipmentType.PA_SYSTEM, minimumQuality: 4 },
    ],
    isRealArtist: false,
  },

  // Hardcore Bands
  {
    id: "pit-warriors",
    name: "Pit Warriors",
    genre: Genre.HARDCORE,
    subgenres: ["beatdown", "tough-guy"],
    traits: [
      {
        id: "violent-pit",
        name: "Violent Pit",
        description: "Shows get rough",
        type: TraitType.PERFORMANCE,
        modifier: { energy: 15 },
      },
    ],
    popularity: 30,
    authenticity: 80,
    energy: 95,
    technicalSkill: 50,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Experimental/Noise
  {
    id: "noise-collective",
    name: "Noise Collective #47",
    genre: Genre.EXPERIMENTAL,
    subgenres: ["noise", "avant-garde"],
    traits: [
      {
        id: "avant-garde",
        name: "Avant-Garde",
        description: "Not for everyone",
        type: TraitType.PERSONALITY,
        modifier: { authenticity: 25, popularity: -10 },
      },
    ],
    popularity: 10,
    authenticity: 100,
    energy: 60,
    technicalSkill: 70,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Local favorites
  {
    id: "scene-veterans",
    name: "Scene Veterans",
    genre: Genre.PUNK,
    subgenres: ["punk-rock", "local-legends"],
    traits: [
      {
        id: "local-legends",
        name: "Local Legends",
        description: "Everyone knows them",
        type: TraitType.SOCIAL,
        modifier: { popularity: 20 },
      },
    ],
    popularity: 50,
    authenticity: 70,
    energy: 75,
    technicalSkill: 65,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Touring bands
  {
    id: "road-dogs",
    name: "Road Dogs",
    genre: Genre.HARDCORE,
    subgenres: ["melodic-hardcore", "touring"],
    traits: [
      {
        id: "touring-pros",
        name: "Touring Professionals",
        description: "Tight live show",
        type: TraitType.PERFORMANCE,
        modifier: { energy: 10, technicalSkill: 10 },
      },
    ],
    popularity: 45,
    authenticity: 65,
    energy: 85,
    technicalSkill: 75,
    technicalRequirements: [
      { type: EquipmentType.PA_SYSTEM, minimumQuality: 3 },
    ],
    isRealArtist: false,
  },

  // Grunge revival
  {
    id: "flannel-core",
    name: "Flannel Core",
    genre: Genre.GRUNGE,
    subgenres: ["grunge", "90s-revival"],
    traits: [
      {
        id: "nostalgic",
        name: "90s Nostalgia",
        description: "Brings back the 90s",
        type: TraitType.PERSONALITY,
        modifier: { popularity: 15 },
      },
    ],
    popularity: 40,
    authenticity: 60,
    energy: 70,
    technicalSkill: 55,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Sludge metal
  {
    id: "swamp-lords",
    name: "Swamp Lords",
    genre: Genre.SLUDGE,
    subgenres: ["sludge", "southern-metal"],
    traits: [
      {
        id: "slow-heavy",
        name: "Slow and Heavy",
        description: "Glacial pace, massive riffs",
        type: TraitType.PERFORMANCE,
        modifier: { energy: -10, authenticity: 15 },
      },
    ],
    popularity: 30,
    authenticity: 85,
    energy: 65,
    technicalSkill: 70,
    technicalRequirements: [
      { type: EquipmentType.PA_SYSTEM, minimumQuality: 3 },
    ],
    isRealArtist: false,
  },

  // Powerviolence
  {
    id: "30-second-songs",
    name: "30 Second Songs",
    genre: Genre.POWERVIOLENCE,
    subgenres: ["powerviolence", "fastcore"],
    traits: [
      {
        id: "blink-miss",
        name: "Blink and You Miss It",
        description: "Songs under 1 minute",
        type: TraitType.PERFORMANCE,
        modifier: { energy: 20, popularity: -5 },
      },
    ],
    popularity: 15,
    authenticity: 95,
    energy: 100,
    technicalSkill: 60,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Indie crossover
  {
    id: "indie-darlings",
    name: "Indie Darlings",
    genre: Genre.INDIE,
    subgenres: ["indie-rock", "college-rock"],
    traits: [
      {
        id: "crossover-appeal",
        name: "Crossover Appeal",
        description: "Appeals to wider audience",
        type: TraitType.SOCIAL,
        modifier: { popularity: 25, authenticity: -15 },
      },
    ],
    popularity: 55,
    authenticity: 45,
    energy: 60,
    technicalSkill: 65,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Crust punk with a Patreon
  {
    id: "landlord-deathwish",
    name: "Landlord Deathwish",
    genre: Genre.PUNK,
    subgenres: ["crust", "anarcho-punk"],
    traits: [
      {
        id: "rent-rage",
        name: "Rent Rage",
        description: "Every song is about the security deposit they never got back",
        type: TraitType.PERSONALITY,
        modifier: { authenticity: 18, energy: 8 },
      },
    ],
    popularity: 18,
    authenticity: 92,
    energy: 88,
    technicalSkill: 35,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Emo that workshops its feelings
  {
    id: "group-chat-silence",
    name: "Group Chat Silence",
    genre: Genre.EMO,
    subgenres: ["midwest-emo", "twinkle"],
    traits: [
      {
        id: "open-tuning-feelings",
        name: "Open Tuning, Open Wounds",
        description: "Three guitarists, all in different tunings, all crying",
        type: TraitType.PERFORMANCE,
        modifier: { authenticity: 12, popularity: 8 },
      },
    ],
    popularity: 38,
    authenticity: 68,
    energy: 55,
    technicalSkill: 72,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Black metal from the suburbs
  {
    id: "frostbitten-cul-de-sac",
    name: "Frostbitten Cul-De-Sac",
    genre: Genre.METAL,
    subgenres: ["black-metal", "atmospheric"],
    traits: [
      {
        id: "corpse-paint",
        name: "Corpse Paint",
        description: "Applied in mom's bathroom before every show",
        type: TraitType.PERFORMANCE,
        modifier: { authenticity: 20, popularity: -8 },
      },
    ],
    popularity: 22,
    authenticity: 88,
    energy: 78,
    technicalSkill: 70,
    technicalRequirements: [
      { type: EquipmentType.PA_SYSTEM, minimumQuality: 3 },
    ],
    isRealArtist: false,
  },

  // Noise act that insists it's a band
  {
    id: "tinnitus-as-intended",
    name: "Tinnitus, As Intended",
    genre: Genre.NOISE,
    subgenres: ["harsh-noise", "power-electronics"],
    traits: [
      {
        id: "anti-melody",
        name: "Anti-Melody",
        description: "If you can hum it, they've failed",
        type: TraitType.PERSONALITY,
        modifier: { authenticity: 25, popularity: -12 },
      },
    ],
    popularity: 8,
    authenticity: 98,
    energy: 65,
    technicalSkill: 55,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Doom for the deeply tired
  {
    id: "the-snooze-button",
    name: "The Snooze Button",
    genre: Genre.DOOM,
    subgenres: ["doom", "drone"],
    traits: [
      {
        id: "one-riff-set",
        name: "One Riff Per Set",
        description: "And they make it count for forty minutes",
        type: TraitType.PERFORMANCE,
        modifier: { authenticity: 16, energy: -8 },
      },
    ],
    popularity: 25,
    authenticity: 82,
    energy: 50,
    technicalSkill: 62,
    technicalRequirements: [
      { type: EquipmentType.PA_SYSTEM, minimumQuality: 3 },
    ],
    isRealArtist: false,
  },

  // Hardcore band with a strict color scheme
  {
    id: "x-disappointed-dad-x",
    name: "xDisappointed Dadx",
    genre: Genre.HARDCORE,
    subgenres: ["straight-edge", "youth-crew"],
    traits: [
      {
        id: "mic-grab-magnet",
        name: "Mic Grab Magnet",
        description: "Every kid in the room knows every word, somehow",
        type: TraitType.SOCIAL,
        modifier: { energy: 12, popularity: 10 },
      },
    ],
    popularity: 34,
    authenticity: 78,
    energy: 92,
    technicalSkill: 48,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Grunge that owns it ironically
  {
    id: "thrift-store-cobain",
    name: "Thrift Store Cobain",
    genre: Genre.GRUNGE,
    subgenres: ["grunge", "slacker-rock"],
    traits: [
      {
        id: "effortless-cool",
        name: "Effortless Cool",
        description: "Soundcheck is just shrugging at the monitors",
        type: TraitType.PERSONALITY,
        modifier: { popularity: 12, authenticity: 6 },
      },
    ],
    popularity: 42,
    authenticity: 58,
    energy: 64,
    technicalSkill: 52,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Powerviolence so fast it's a rumor
  {
    id: "blink-twice-fastcore",
    name: "Blink Twice",
    genre: Genre.POWERVIOLENCE,
    subgenres: ["powerviolence", "grindcore"],
    traits: [
      {
        id: "twelve-songs-six-minutes",
        name: "12 Songs, 6 Minutes",
        description: "The set ends before the openers finish loading out",
        type: TraitType.PERFORMANCE,
        modifier: { energy: 22, popularity: -6 },
      },
    ],
    popularity: 14,
    authenticity: 94,
    energy: 98,
    technicalSkill: 64,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Sludge band that smells like it sounds
  {
    id: "couch-fort-collapse",
    name: "Couch Fort Collapse",
    genre: Genre.SLUDGE,
    subgenres: ["sludge", "stoner"],
    traits: [
      {
        id: "low-and-slow",
        name: "Low and Slow",
        description: "Tuned to drop-whatever, played at half the BPM of a nap",
        type: TraitType.PERFORMANCE,
        modifier: { authenticity: 14, energy: -6 },
      },
    ],
    popularity: 28,
    authenticity: 80,
    energy: 60,
    technicalSkill: 66,
    technicalRequirements: [
      { type: EquipmentType.PA_SYSTEM, minimumQuality: 3 },
    ],
    isRealArtist: false,
  },

  // Experimental act that read one Deleuze quote
  {
    id: "no-wave-goodbye",
    name: "No Wave Goodbye",
    genre: Genre.EXPERIMENTAL,
    subgenres: ["no-wave", "art-punk"],
    traits: [
      {
        id: "deliberately-difficult",
        name: "Deliberately Difficult",
        description: "The merch table is also a performance piece you can't buy from",
        type: TraitType.PERSONALITY,
        modifier: { authenticity: 22, popularity: -10 },
      },
    ],
    popularity: 12,
    authenticity: 96,
    energy: 58,
    technicalSkill: 74,
    technicalRequirements: [],
    isRealArtist: false,
  },

  // Alternative band one sync deal from "selling out"
  {
    id: "almost-licensed",
    name: "Almost Licensed",
    genre: Genre.ALTERNATIVE,
    subgenres: ["alt-rock", "shoegaze"],
    traits: [
      {
        id: "sync-bait",
        name: "Sync Bait",
        description: "Every chorus engineered to soundtrack a sad car commercial",
        type: TraitType.SOCIAL,
        modifier: { popularity: 20, authenticity: -14 },
      },
    ],
    popularity: 52,
    authenticity: 48,
    energy: 62,
    technicalSkill: 68,
    technicalRequirements: [],
    isRealArtist: false,
  },
];