import { useGameStore } from '@stores/gameStore';
import { Venue, District } from '@game/types';

export enum DayJobType {
  NONE = 'NONE',
  // Venue jobs
  VENUE_STAFF = 'VENUE_STAFF',
  SOUND_TECH = 'SOUND_TECH',
  DOOR_PERSON = 'DOOR_PERSON',
  // Corporate jobs
  RETAIL_CHAIN = 'RETAIL_CHAIN',
  OFFICE_DRONE = 'OFFICE_DRONE',
  GIG_ECONOMY = 'GIG_ECONOMY',
  // Community jobs
  NON_PROFIT = 'NON_PROFIT',
  VOLUNTEER = 'VOLUNTEER',
  COLLECTIVE = 'COLLECTIVE'
}

export enum JobCategory {
  VENUE = 'VENUE',
  CORPORATE = 'CORPORATE',
  COMMUNITY = 'COMMUNITY'
}

export interface DayJob {
  id: string;
  type: DayJobType;
  category: JobCategory;
  name: string;
  description: string;
  moneyPerTurn: number;
  reputationChange: number; // Can be positive or negative
  fanChange: number; // Can be positive or negative
  stressGain: number;
  connectionGain?: number;
  location?: {
    venueId?: string;
    districtId?: string;
  };
  requirements?: {
    minReputation?: number;
    minConnections?: number;
  };
  satiricalFlavor: string;
}

// Job templates for each category
const JOB_TEMPLATES = {
  // Venue jobs - low pay, no rep loss, venue connections
  [DayJobType.VENUE_STAFF]: {
    baseName: "Barback at {venue}",
    description: "Cleaning up after shows you wish you were playing",
    moneyPerTurn: 80,
    reputationChange: 0,
    fanChange: 0,
    stressGain: 8,
    connectionGain: 2,
    satiricalFlavor: "At least you get to watch soundcheck for free"
  },
  [DayJobType.SOUND_TECH]: {
    baseName: "Sound Tech at {venue}",
    description: "Making terrible bands sound slightly less terrible",
    moneyPerTurn: 120,
    reputationChange: 2,
    fanChange: 0,
    stressGain: 10,
    connectionGain: 3,
    requirements: { minConnections: 5 },
    satiricalFlavor: "The house engineer just told you 'it's supposed to feedback like that'"
  },
  [DayJobType.DOOR_PERSON]: {
    baseName: "Door Person at {venue}",
    description: "Checking IDs and pretending not to know underage scenesters",
    moneyPerTurn: 100,
    reputationChange: 1,
    fanChange: 0,
    stressGain: 6,
    connectionGain: 4,
    satiricalFlavor: "You've perfected the art of the intimidating nod"
  },
  
  // Corporate jobs - high pay, high rep/fan loss
  [DayJobType.RETAIL_CHAIN]: {
    baseName: "{corp} Sales Associate",
    description: "Selling your soul one customer at a time",
    moneyPerTurn: 180,
    reputationChange: -8,
    fanChange: -3,
    stressGain: 15,
    satiricalFlavor: "A fan saw you in uniform and unfollowed your band"
  },
  [DayJobType.OFFICE_DRONE]: {
    baseName: "Data Entry at {corp}",
    description: "Ctrl+C, Ctrl+V, repeat until dead inside",
    moneyPerTurn: 250,
    reputationChange: -12,
    fanChange: -5,
    stressGain: 20,
    satiricalFlavor: "Your boss scheduled a mandatory fun meeting during band practice"
  },
  [DayJobType.GIG_ECONOMY]: {
    baseName: "{corp} Delivery Driver",
    description: "Burning gas to make shareholders rich",
    moneyPerTurn: 160,
    reputationChange: -6,
    fanChange: -2,
    stressGain: 12,
    satiricalFlavor: "Your car smells permanently like french fries and broken dreams"
  },
  
  // Community jobs - no/low pay, rep boost
  [DayJobType.NON_PROFIT]: {
    baseName: "{org} Outreach",
    description: "Actually making a difference for once",
    moneyPerTurn: 50,
    reputationChange: 5,
    fanChange: 2,
    stressGain: 5,
    connectionGain: 3,
    satiricalFlavor: "The only job where 'exposure' actually means something"
  },
  [DayJobType.VOLUNTEER]: {
    baseName: "Volunteer at {org}",
    description: "Working for free but keeping your punk ethics intact",
    moneyPerTurn: 0,
    reputationChange: 8,
    fanChange: 3,
    stressGain: 3,
    connectionGain: 5,
    satiricalFlavor: "Your bank account is empty but your conscience is clear"
  },
  [DayJobType.COLLECTIVE]: {
    baseName: "{collective} Organizer",
    description: "Building the scene one consensus meeting at a time",
    moneyPerTurn: 30,
    reputationChange: 10,
    fanChange: 5,
    stressGain: 7,
    connectionGain: 6,
    requirements: { minReputation: 25 },
    satiricalFlavor: "Another 3-hour meeting about what color to paint the bathroom"
  }
};

// Corporate names for job generation
const CORP_NAMES = [
  "MegaMart", "TechCorp", "GrubDash", "ValueMart", "DataSync",
  "CloudForce", "FastBurger", "CoffeeChain", "MegaRetail"
];

// Organization names for community jobs
const ORG_NAMES = [
  "Food Not Bombs", "Books to Prisoners", "Community Garden",
  "Youth Music Program", "Harm Reduction Center", "Free Store"
];

// Collective names
const COLLECTIVE_NAMES = [
  "DIY Booking Collective", "All Ages Coalition", "Scene Support Network",
  "Underground Archives", "Mutual Aid Network"
];

// Random events by job category
const JOB_EVENTS_BY_CATEGORY: Record<JobCategory, Array<{
  chance: number;
  message: string;
  effects?: {
    money?: number;
    reputation?: number;
    fans?: number;
    stress?: number;
    connections?: number;
  };
}>> = {
  [JobCategory.VENUE]: [
    {
      chance: 0.15,
      message: "Helped a touring band load in. They remember you!",
      effects: { connections: 3, reputation: 2 }
    },
    {
      chance: 0.1,
      message: "Venue owner noticed your hard work. Bonus!",
      effects: { money: 50 }
    },
    {
      chance: 0.08,
      message: "Equipment malfunction during your shift. Stressful night.",
      effects: { stress: 10 }
    }
  ],
  [JobCategory.CORPORATE]: [
    {
      chance: 0.1,
      message: "Customer recognized you from a show. Awkward...",
      effects: { reputation: -5, stress: 5 }
    },
    {
      chance: 0.08,
      message: "Mandatory overtime. Missing band practice again.",
      effects: { stress: 15, connections: -2 }
    },
    {
      chance: 0.05,
      message: "Corporate social media policy violation warning.",
      effects: { stress: 20, reputation: -10 }
    }
  ],
  [JobCategory.COMMUNITY]: [
    {
      chance: 0.15,
      message: "Met like-minded folks. The network grows!",
      effects: { connections: 5 }
    },
    {
      chance: 0.1,
      message: "Your work made the local zine. Street cred!",
      effects: { reputation: 5, fans: 3 }
    },
    {
      chance: 0.08,
      message: "Organized a benefit show through work connections.",
      effects: { connections: 3, reputation: 3 }
    }
  ]
};

export class DayJobSystem {
  private currentJob: DayJob | null = null;
  private turnsWorked: number = 0;
  private availableJobs: DayJob[] = [];
  
  // Generate jobs based on current game state
  generateAvailableJobs(): DayJob[] {
    const state = useGameStore.getState();
    const { venues, districts } = state;
    const jobs: DayJob[] = [];
    
    // Generate venue jobs
    venues.forEach(venue => {
      // Only established venues offer jobs
      if (venue.capacity >= 50) {
        // Venue staff job (always available)
        jobs.push(this.createJobFromTemplate(
          DayJobType.VENUE_STAFF,
          JobCategory.VENUE,
          { venue, district: venue.location }
        ));
        
        // Sound tech (requires connections)
        if (!JOB_TEMPLATES[DayJobType.SOUND_TECH].requirements || 
            state.connections >= JOB_TEMPLATES[DayJobType.SOUND_TECH].requirements.minConnections!) {
          jobs.push(this.createJobFromTemplate(
            DayJobType.SOUND_TECH,
            JobCategory.VENUE,
            { venue, district: venue.location }
          ));
        }
        
        // Door person
        if (venue.capacity >= 80) {
          jobs.push(this.createJobFromTemplate(
            DayJobType.DOOR_PERSON,
            JobCategory.VENUE,
            { venue, district: venue.location }
          ));
        }
      }
    });
    
    // Generate corporate jobs per district
    districts.forEach(district => {
      // More corporate jobs in gentrified areas
      const corpJobCount = Math.floor(1 + (district.gentrificationLevel / 30));
      
      for (let i = 0; i < corpJobCount; i++) {
        const corpName = CORP_NAMES[Math.floor(Math.random() * CORP_NAMES.length)];
        const jobType = [DayJobType.RETAIL_CHAIN, DayJobType.OFFICE_DRONE, DayJobType.GIG_ECONOMY][i % 3];
        
        jobs.push(this.createJobFromTemplate(
          jobType,
          JobCategory.CORPORATE,
          { district, corpName }
        ));
      }
    });
    
    // Generate community jobs
    const communityJobCount = Math.floor(2 + (state.reputation / 50));
    for (let i = 0; i < communityJobCount; i++) {
      const orgName = ORG_NAMES[Math.floor(Math.random() * ORG_NAMES.length)];
      const collectiveName = COLLECTIVE_NAMES[Math.floor(Math.random() * COLLECTIVE_NAMES.length)];
      
      // Non-profit
      jobs.push(this.createJobFromTemplate(
        DayJobType.NON_PROFIT,
        JobCategory.COMMUNITY,
        { orgName }
      ));
      
      // Volunteer (always available)
      if (i === 0) {
        jobs.push(this.createJobFromTemplate(
          DayJobType.VOLUNTEER,
          JobCategory.COMMUNITY,
          { orgName: ORG_NAMES[(i + 1) % ORG_NAMES.length] }
        ));
      }
      
      // Collective (requires reputation)
      if (state.reputation >= 25) {
        jobs.push(this.createJobFromTemplate(
          DayJobType.COLLECTIVE,
          JobCategory.COMMUNITY,
          { collectiveName }
        ));
        break; // Only one collective job
      }
    }
    
    this.availableJobs = jobs;
    return jobs;
  }
  
  private createJobFromTemplate(
    type: DayJobType,
    category: JobCategory,
    context: {
      venue?: Venue;
      district?: District;
      corpName?: string;
      orgName?: string;
      collectiveName?: string;
    }
  ): DayJob {
    const template = JOB_TEMPLATES[type];
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate name based on context
    let name = template.baseName;
    if (context.venue) {
      name = name.replace('{venue}', context.venue.name);
    }
    if (context.corpName) {
      name = name.replace('{corp}', context.corpName);
    }
    if (context.orgName) {
      name = name.replace('{org}', context.orgName);
    }
    if (context.collectiveName) {
      name = name.replace('{collective}', context.collectiveName);
    }
    
    return {
      id,
      type,
      category,
      name,
      description: template.description,
      moneyPerTurn: template.moneyPerTurn,
      reputationChange: template.reputationChange,
      fanChange: template.fanChange,
      stressGain: template.stressGain,
      connectionGain: template.connectionGain,
      location: {
        venueId: context.venue?.id,
        districtId: context.district?.id || context.venue?.location.id
      },
      requirements: template.requirements,
      satiricalFlavor: template.satiricalFlavor
    };
  }
  
  setJob(job: DayJob | null): boolean {
    if (!job) {
      this.currentJob = null;
      this.turnsWorked = 0;
      return true;
    }
    
    // Check requirements
    if (job.requirements) {
      const state = useGameStore.getState();
      if (job.requirements.minReputation && state.reputation < job.requirements.minReputation) {
        return false;
      }
      if (job.requirements.minConnections && state.connections < job.requirements.minConnections) {
        return false;
      }
    }
    
    this.currentJob = job;
    this.turnsWorked = 0;
    return true;
  }
  
  getCurrentJob(): DayJob | null {
    return this.currentJob;
  }
  
  processJobIncome(): {
    money: number;
    reputationLoss: number;
    fanLoss: number;
    stressGain: number;
    message: string;
    randomEvent?: {
      message: string;
      effects: any;
    };
  } | null {
    const job = this.getCurrentJob();
    if (!job) return null;
    
    const state = useGameStore.getState();
    this.turnsWorked++;
    
    // Check for stress-induced breakdown
    if (state.stress >= 100) {
      // Force quit job due to burnout
      this.quitJob();
      state.addStress(-30); // Some recovery
      return {
        money: 0,
        reputationLoss: 0,
        fanLoss: 0,
        stressGain: 0,
        message: "You had a complete breakdown and quit your job. Time to focus on the music... or therapy."
      };
    }
    
    // Base effects
    let money = job.moneyPerTurn;
    const reputationChange = job.reputationChange;
    const fanChange = job.fanChange;
    let stressGain = job.stressGain;
    const connectionGain = job.connectionGain || 0;
    
    // Stress multiplier - more stress makes job harder
    if (state.stress > 80) {
      stressGain *= 1.5;
      money *= 0.8; // Performance suffers
    }
    
    // Apply base effects
    state.addMoney(money);
    state.addReputation(reputationChange);
    state.addFans(fanChange);
    state.addStress(stressGain);
    if (connectionGain > 0) {
      state.addConnections(connectionGain);
    }
    
    // Check for random events
    let randomEvent = undefined;
    const events = JOB_EVENTS_BY_CATEGORY[job.category];
    for (const event of events) {
      if (Math.random() < event.chance) {
        randomEvent = {
          message: event.message,
          effects: event.effects || {}
        };
        
        // Apply random event effects
        if (event.effects) {
          if (event.effects.money) state.addMoney(event.effects.money);
          if (event.effects.reputation) state.addReputation(event.effects.reputation);
          if (event.effects.fans) state.addFans(event.effects.fans);
          if (event.effects.stress) state.addStress(event.effects.stress);
          if (event.effects.connections) state.addConnections(event.effects.connections);
        }
        break;
      }
    }
    
    // Get a message based on turns worked and job category
    const messages = [
      job.satiricalFlavor,
      job.category === JobCategory.VENUE ? 
        `Another night at ${job.name}. At least you're in the scene.` :
        job.category === JobCategory.CORPORATE ?
        `${this.turnsWorked} turns selling your soul. The money barely helps.` :
        `Building community, one unpaid hour at a time.`,
      `Day ${this.turnsWorked} at ${job.name}. Is this sustainable?`
    ];
    
    const message = randomEvent ? randomEvent.message : messages[Math.min(this.turnsWorked - 1, messages.length - 1)];
    
    return {
      money,
      reputationLoss: Math.max(0, -reputationChange), // Convert to positive loss value for compatibility
      fanLoss: Math.max(0, -fanChange),
      stressGain,
      message,
      randomEvent
    };
  }
  
  quitJob(): void {
    this.currentJob = null;
    this.turnsWorked = 0;
    
    // Small stress relief from quitting
    const state = useGameStore.getState();
    state.addStress(-5);
  }
  
  getAvailableJobs(): DayJob[] {
    // Generate fresh jobs if needed
    if (this.availableJobs.length === 0) {
      this.generateAvailableJobs();
    }
    
    // Filter based on requirements
    const state = useGameStore.getState();
    return this.availableJobs.filter(job => {
      if (job.requirements) {
        if (job.requirements.minReputation && state.reputation < job.requirements.minReputation) {
          return false;
        }
        if (job.requirements.minConnections && state.connections < job.requirements.minConnections) {
          return false;
        }
      }
      return true;
    });
  }
  
  // Refresh available jobs (call when venues/districts change)
  refreshJobs(): void {
    this.generateAvailableJobs();
  }
}

export const dayJobSystem = new DayJobSystem();