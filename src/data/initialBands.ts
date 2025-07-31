import { Band, Genre, TraitType } from "@game/types";

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
      { type: "SOUND_SYSTEM", minimumQuality: 3 },
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
      { type: "SOUND_SYSTEM", minimumQuality: 4 },
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
      { type: "SOUND_SYSTEM", minimumQuality: 3 },
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
      { type: "SOUND_SYSTEM", minimumQuality: 3 },
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
];