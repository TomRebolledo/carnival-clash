
const challengeCards = [
  {
    name: "Double Ring Toss",
    type: "doubleTarget",
    reward: 4,
    description: "Roll twice. Both rolls must be 4 or higher."
  },
  {
    name: "Balloon Pop",
    type: "target",
    reward: 2,
    description: "Roll a 4, 5, or 6."
  },
  {
    name: "High Striker Pro",
    type: "exactSix",
    reward: 5,
    description: "Roll a 6."
  },
  {
    name: "Lucky Duck",
    type: "guessParity",
    reward: 2,
    description: "Predict odd or even before rolling."
  },
  {
    name: "Lucky Cups",
    type: "guessRange",
    reward: 2,
    description: "Predict 1–3 or 4–6 before rolling."
  },
  {
    name: "Double Duck Pond",
    type: "doubleEven",
    reward: 4,
    description: "Roll twice. Both rolls must be even."
  },
  {
    name: "Golden Ring Toss",
    type: "fiveOrSix",
    reward: 3,
    description: "Roll a 5 or 6."
  },
  {
    name: "Balloon Battle",
    type: "duel",
    reward: 3,
    description: "Choose an opponent. Higher roll wins."
  },
  {
    name: "Ring Toss Rivalry",
    type: "duel",
    reward: 3,
    description: "Choose an opponent. Higher roll wins."
  },
  {
    name: "Carnival Showdown",
    type: "showdown",
    reward: 3,
    description: "Everyone rolls. A sole highest roller wins."
  }
];

const mysteryCards = [
  { name: "Golden Ticket!", tickets: 3 },
  { name: "Free Carnival Prize", tickets: 2 },
  { name: "Lucky Find", tickets: 1 },
  { name: "Bonus Giveaway", tickets: 2 },
  { name: "Grand Prize Winner", tickets: 3 },
  { name: "Dropped Your Tickets!", tickets: -2 },
  { name: "Broken Attraction", tickets: -1 },
  { name: "Ticket Mix-Up", tickets: -2 },
  { name: "Carnival Mishap", tickets: -1 },
  { name: "Snack Break", tickets: 0 }
];

