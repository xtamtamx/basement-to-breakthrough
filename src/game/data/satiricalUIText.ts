/**
 * Satirical UI Text Updates for DIY Indie Empire
 * Updates all UI labels, buttons, and interface text with The Hard Times style
 */

export const SATIRICAL_UI_UPDATES = {
  // Main Navigation
  navigation: {
    CITY: "Survey Your Domain of Poor Decisions",
    BANDS: "Babysit Adults Who Play Instruments",
    SHOWS: "Schedule Everyone's Disappointment", 
    SYNERGIES: "Discover Why Nothing Works",
    NEXT_TURN: "Survive Another Day"
  },

  // City View Actions
  cityView: {
    BUILD_VENUE: "Create Future Parking Lot",
    UPGRADE_VENUE: "Spend Money You Don't Have",
    CLOSE_VENUE: "Admit Defeat Gracefully",
    VIEW_DETAILS: "See Exactly How Bad It Is",
    ZOOM_IN: "Get Closer to Your Mistakes",
    ZOOM_OUT: "Get Perspective on Your Failures"
  },

  // Show Booking
  showBooking: {
    BOOK_SHOW: "Ruin Everyone's Night",
    CANCEL_SHOW: "Disappoint Dozens",
    CONFIRM_BOOKING: "Lock In This Mistake",
    SELECT_BANDS: "Choose Your Chaos Agents",
    SELECT_VENUE: "Pick Tonight's Disaster Zone",
    FINALIZE: "No Turning Back Now"
  },

  // Band Management
  bandManagement: {
    HIRE_BAND: "Make Questionable Decision",
    FIRE_BAND: "Create Lifelong Enemy",
    VIEW_BIO: "Read Their Inflated Resume",
    MANAGE_ROSTER: "Organize Your Dysfunction",
    BAND_DETAILS: "How They'll Let You Down"
  },

  // Financial
  financial: {
    CHECK_FINANCES: "Witness the Damage",
    PAY_RENT: "Fund Someone Else's Dream",
    COLLECT_REVENUE: "Count Your Losses",
    VIEW_EXPENSES: "See Where It All Went Wrong",
    BUDGET_REPORT: "Documentation of Poor Choices"
  },

  // Turn Results
  turnResults: {
    CONTINUE: "Face Another Day of This",
    VIEW_DETAILS: "Autopsy of Tonight's Disaster",
    SKIP: "Deny, Deny, Deny",
    NEXT: "Onwards to More Failure"
  },

  // Status Messages
  status: {
    LOADING: "Calculating How Broke You Are...",
    SAVING: "Preserving Your Mistakes for Posterity...",
    PROCESSING: "Making Things Worse...",
    CALCULATING: "Determining Exact Level of Failure...",
    UPDATING: "Refreshing Your Regrets..."
  },

  // Tooltips
  tooltips: {
    MONEY: "How Deep in Debt You Are",
    REPUTATION: "People Who Pretend to Know You",
    FANS: "Instagram Followers Who Never Show Up",
    STRESS: "Proximity to Complete Breakdown",
    CONNECTIONS: "People You Can Still Ask for Favors"
  },

  // Confirmations
  confirmations: {
    BOOK_SHOW: "Are You Sure? (You're Not)",
    FIRE_BAND: "This Will End Badly. Proceed?",
    CLOSE_VENUE: "Give Up on This Particular Dream?",
    END_TURN: "Ready to See How This Goes Wrong?",
    QUIT_GAME: "Rage Quit Like a Real Promoter?"
  },

  // Success Messages
  success: {
    SHOW_BOOKED: "Disaster Successfully Scheduled",
    VENUE_BUILT: "Future Regret Constructed",
    BAND_HIRED: "Poor Decision Confirmed",
    UPGRADE_COMPLETE: "Money Successfully Wasted",
    TURN_COMPLETE: "Somehow Still Alive"
  },

  // Warning Messages
  warnings: {
    LOW_FUNDS: "Dangerously Close to Real Job Territory",
    HIGH_STRESS: "One Bad Show from Complete Meltdown",
    BAND_UNHAPPY: "Passive-Aggressive Social Media Posts Incoming",
    VENUE_TROUBLE: "Gentrification Wolves Circling",
    NO_SHOWS: "Nobody Remembers You Exist"
  },

  // Menu Options
  menu: {
    NEW_GAME: "Start Fresh Cycle of Disappointment",
    CONTINUE: "Resume Existing Nightmare",
    OPTIONS: "Adjust Your Suffering",
    CREDITS: "Blame These People",
    QUIT: "Return to Productive Life"
  },

  // Settings
  settings: {
    MUSIC_VOLUME: "How Loud to Cry",
    SFX_VOLUME: "Disappointment Sound Level",
    DIFFICULTY: "Masochism Setting",
    AUTO_SAVE: "Automatically Preserve Failures",
    RESET_DATA: "Erase All Evidence"
  },

  // Tutorial
  tutorial: {
    SKIP: "I Know How to Fail Already",
    NEXT: "Show Me More Ways to Mess Up",
    PREVIOUS: "I Missed That Mistake",
    COMPLETE: "Ready to Disappoint Everyone"
  },

  // Empty States
  emptyStates: {
    NO_BANDS: "Nobody Wants to Work With You",
    NO_VENUES: "All Your Spaces Got Gentrified",
    NO_SHOWS: "Another Night of Netflix Instead",
    NO_MONEY: "Time to Call Mom",
    NO_FANS: "Even Your Friends Stopped Pretending"
  },

  // Action Buttons
  actions: {
    TRY_AGAIN: "Make Same Mistakes Differently",
    GIVE_UP: "Accept Your Limitations",
    CONTINUE: "Persist Against Better Judgment",
    START_OVER: "Fresh Slate, Same Problems",
    VIEW_MORE: "Witness Additional Failures"
  }
};

// Helper function to get UI text
export const getUIText = (category: keyof typeof SATIRICAL_UI_UPDATES, key: string): string => {
  const categoryTexts = SATIRICAL_UI_UPDATES[category];
  return categoryTexts[key] || key; // Fallback to key if not found
};

// Button text variations for different states
export const DYNAMIC_BUTTON_TEXT = {
  bookShow: {
    default: "Book Show",
    hovering: "Do It, Coward",
    disabled: "Not Enough Clout",
    loading: "Making Terrible Decision..."
  },
  nextTurn: {
    default: "Next Turn",
    hovering: "What Could Go Wrong?",
    disabled: "Finish Your Disasters First",
    loading: "Time Passing Ominously..."
  },
  hire: {
    default: "Hire Band",
    hovering: "They Seem Normal (They're Not)",
    disabled: "Can't Afford More Drama",
    loading: "Background Check (Just Kidding)..."
  }
};