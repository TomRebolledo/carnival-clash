
const spaces = [
  { name: "Entrance", icon: "🎟️", color: "#f6d69d" },
  { name: "Ring Toss", icon: "⭕", color: "#cce5ff" },
  { name: "Challenge", icon: "🃏", color: "#d9d2fa" },
  { name: "Duck Pond", icon: "🦆", color: "#ccefd5" },
  { name: "Mystery", icon: "🎪", color: "#ffdfba" },
  { name: "Balloon Pop", icon: "🎈", color: "#cce5ff" },
  { name: "Challenge", icon: "🃏", color: "#d9d2fa" },
  { name: "Prize Booth", icon: "🏆", color: "#ffe6a0" },
  { name: "High Striker", icon: "🔨", color: "#ccefd5" },
  { name: "Mystery", icon: "🎪", color: "#ffdfba" },
  { name: "Lucky Cups", icon: "🥤", color: "#ccefd5" },
  { name: "Challenge", icon: "🃏", color: "#d9d2fa" }
];

const boardPositions = [
  0, 1, 2, 3,
  11, null, null, 4,
  10, null, null, 5,
  9, 8, 7, 6
];

const pawnColors = [
  "#e74c3c",
  "#3498db",
  "#27ae60",
  "#9b59b6"
];

const roundsByCount = {
  2: 10,
  3: 7,
  4: 5
};

let players = [];
let currentPlayer = 0;
let round = 1;
let maxRounds = 0;
let phase = "setup";

let challengeDeck = [];
let mysteryDeck = [];

const board = document.getElementById("board");
const scoreboard = document.getElementById("scoreboard");
const gameStatus = document.getElementById("game-status");
const diceDisplay = document.getElementById("dice-display");
const rollButton = document.getElementById("roll-button");
const actionPanel = document.getElementById("action-panel");
const roundDisplay = document.getElementById("round-display");

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function shuffle(cards) {
  const result = [...cards];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function drawCard(type) {
  if (type === "challenge") {
    if (!challengeDeck.length) {
      challengeDeck = shuffle(challengeCards);
    }

    return challengeDeck.pop();
  }

  if (!mysteryDeck.length) {
    mysteryDeck = shuffle(mysteryCards);
  }

  return mysteryDeck.pop();
}

function playerName(index) {
  return `Player ${index + 1}`;
}

function changeTickets(index, amount) {
  const player = players[index];

  player.tickets = Math.max(
    0,
    player.tickets + amount
  );

  renderPlayers();
}

function createBoard() {
  board.innerHTML = "";

  boardPositions.forEach(position => {
    if (position === null) {
      const empty = document.createElement("div");
      empty.className = "empty-space";

      board.appendChild(empty);
      return;
    }

    const space = spaces[position];
    const element = document.createElement("div");

    element.className = "space";
    element.style.backgroundColor = space.color;

    element.innerHTML = `
      <span class="space-number">${position + 1}</span>
      <span class="space-icon">${space.icon}</span>
      <span class="space-name">${space.name}</span>
      <div class="pawns" id="pawns-${position}"></div>
    `;

    board.appendChild(element);
  });
}

function renderPlayers() {
  document.querySelectorAll(".pawns").forEach(container => {
    container.innerHTML = "";
  });

  players.forEach((player, index) => {
    const pawn = document.createElement("div");

    pawn.className = "pawn";
    pawn.style.backgroundColor = player.color;
    pawn.title = playerName(index);

    document
      .getElementById(`pawns-${player.position}`)
      .appendChild(pawn);
  });

  scoreboard.innerHTML = players.map((player, index) => `
    <div class="score-row">
      <span>
        <span style="color:${player.color}">●</span>
        ${playerName(index)}
      </span>
      <strong>${player.tickets} 🎟️</strong>
    </div>
  `).join("");
}

function showAction(title, description, buttons) {
  actionPanel.innerHTML = "";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const details = document.createElement("p");
  details.textContent = description;

  actionPanel.append(heading, details);

  buttons.forEach(({ label, action }) => {
    const button = document.createElement("button");

    button.textContent = label;

button.addEventListener("click", () => {
  if (
    phase !== "action" &&
    phase !== "resolved" &&
    phase !== "finished"
  ) {
    return;
  }

  action();
});

    actionPanel.appendChild(button);
  });
}

function finishAction(message) {
  phase = "resolved";
  gameStatus.textContent = message;

  showAction("Turn Complete", message, [
    {
      label: "End Turn",
      action: nextTurn
    }
  ]);
}

function nextTurn() {
  if (phase !== "resolved") return;

  currentPlayer++;

  if (currentPlayer >= players.length) {
    currentPlayer = 0;
    round++;
  }

  if (round > maxRounds) {
    endGame();
    return;
  }

  phase = "move";

  roundDisplay.textContent =
    `Round ${round} of ${maxRounds}`;

  gameStatus.textContent =
    `${playerName(currentPlayer)}'s turn.`;

  actionPanel.innerHTML = "";
  diceDisplay.textContent = "🎲";
  rollButton.disabled = false;
}

function startGame() {
  const count = Number(
    document.getElementById("player-count").value
  );

  players = Array.from({ length: count }, (_, index) => ({
    position: 0,
    tickets: 0,
    color: pawnColors[index]
  }));

  challengeDeck = shuffle(challengeCards);
  mysteryDeck = shuffle(mysteryCards);

  currentPlayer = 0;
  round = 1;
  maxRounds = roundsByCount[count];
  phase = "move";

  roundDisplay.textContent =
    `Round 1 of ${maxRounds}`;

  gameStatus.textContent =
    "Player 1's turn. Roll to move!";

  diceDisplay.textContent = "🎲";
  actionPanel.innerHTML = "";
  rollButton.disabled = false;

  renderPlayers();
}

function rollMovement() {
  if (phase !== "move") return;

  const roll = rollDie();
  const player = players[currentPlayer];

  player.position =
    (player.position + roll) % spaces.length;

  diceDisplay.textContent = `🎲 ${roll}`;
  rollButton.disabled = true;
  phase = "action";

  const space = spaces[player.position];

  gameStatus.textContent =
    `${playerName(currentPlayer)} rolled ${roll} ` +
    `and landed on ${space.name}.`;

  renderPlayers();
  resolveSpace(player.position);
}

function singleRoll(title, success, reward) {
  showAction(
    title,
    "Roll the die to attempt this attraction.",
    [
      {
        label: "Roll for Tickets",
        action: () => {
          const value = rollDie();
          const won = success(value);

          if (won) {
            changeTickets(currentPlayer, reward);
          }

          finishAction(
            `Rolled ${value}. ` +
            (won
              ? `Won ${reward} tickets!`
              : "No tickets won.")
          );
        }
      }
    ]
  );
}

function guessingGame(title, choices, correct, reward) {
  showAction(
    title,
    "Choose your prediction before rolling.",
    choices.map(choice => ({
      label: choice.label,
      action: () => {
        const value = rollDie();
        const won = correct(choice.value, value);

        if (won) {
          changeTickets(currentPlayer, reward);
        }

        finishAction(
          `Predicted ${choice.label}, rolled ${value}. ` +
          (won
            ? `Won ${reward} tickets!`
            : "No tickets won.")
        );
      }
    }))
  );
}

function parityChallenge(title, reward) {
  guessingGame(
    title,
    [
      { label: "Odd", value: "odd" },
      { label: "Even", value: "even" }
    ],
    (guess, value) =>
      (value % 2 === 0 ? "even" : "odd") === guess,
    reward
  );
}

function rangeChallenge(title, reward) {
  guessingGame(
    title,
    [
      { label: "1–3", value: "low" },
      { label: "4–6", value: "high" }
    ],
    (guess, value) =>
      (value <= 3 ? "low" : "high") === guess,
    reward
  );
}

function doubleRoll(title, success, reward) {
  showAction(
    title,
    "Roll twice to complete the challenge.",
    [
      {
        label: "Roll Twice",
        action: () => {
          const first = rollDie();
          const second = rollDie();

          const won =
            success(first) && success(second);

          if (won) {
            changeTickets(currentPlayer, reward);
          }

          finishAction(
            `Rolled ${first} and ${second}. ` +
            (won
              ? `Won ${reward} tickets!`
              : "Challenge failed.")
          );
        }
      }
    ]
  );
}

function duel(card) {
  const opponents = players
    .map((_, index) => index)
    .filter(index => index !== currentPlayer);

  showAction(
    card.name,
    "Choose an opponent. Higher roll wins; ties award nothing.",
    opponents.map(opponent => ({
      label: `Challenge ${playerName(opponent)}`,
      action: () => {
        const mine = rollDie();
        const theirs = rollDie();

        let winner = null;

        if (mine > theirs) {
          winner = currentPlayer;
        }

        if (theirs > mine) {
          winner = opponent;
        }

        if (winner !== null) {
          changeTickets(winner, card.reward);
        }

        finishAction(
          `${playerName(currentPlayer)} rolled ${mine}; ` +
          `${playerName(opponent)} rolled ${theirs}. ` +
          (winner === null
            ? "Tie! No tickets awarded."
            : `${playerName(winner)} wins ${card.reward} tickets!`)
        );
      }
    }))
  );
}

function showdown(card) {
  showAction(
    card.name,
    "All players roll once.",
    [
      {
        label: "Roll for Everyone",
        action: () => {
          const rolls = players.map(() => rollDie());
          const highest = Math.max(...rolls);

          const winners = rolls
            .map((value, index) =>
              value === highest ? index : -1
            )
            .filter(index => index !== -1);

          if (winners.length === 1) {
            changeTickets(winners[0], card.reward);
          }

          const results = rolls
            .map((value, index) =>
              `${playerName(index)}: ${value}`
            )
            .join(" | ");

          finishAction(
            results + ". " +
            (winners.length === 1
              ? `${playerName(winners[0])} wins ${card.reward} tickets!`
              : "Highest roll tied. No tickets awarded.")
          );
        }
      }
    ]
  );
}

function resolveChallenge(card) {
  const title = `Challenge: ${card.name}`;

  switch (card.type) {
    case "target":
      singleRoll(
        title,
        value => value >= 4,
        card.reward
      );
      break;

    case "exactSix":
      singleRoll(
        title,
        value => value === 6,
        card.reward
      );
      break;

    case "fiveOrSix":
      singleRoll(
        title,
        value => value >= 5,
        card.reward
      );
      break;

    case "guessParity":
      parityChallenge(title, card.reward);
      break;

    case "guessRange":
      rangeChallenge(title, card.reward);
      break;

    case "doubleTarget":
      doubleRoll(
        title,
        value => value >= 4,
        card.reward
      );
      break;

    case "doubleEven":
      doubleRoll(
        title,
        value => value % 2 === 0,
        card.reward
      );
      break;

    case "duel":
      duel(card);
      break;

    case "showdown":
      showdown(card);
      break;
  }
}

function resolveSpace(position) {
  const space = spaces[position];

  switch (space.name) {
    case "Entrance":
      finishAction("Entrance: No action.");
      break;

    case "Prize Booth":
      changeTickets(currentPlayer, 2);
      finishAction(
        "Prize Booth: You earned 2 tickets!"
      );
      break;

    case "Ring Toss":
    case "Balloon Pop":
      singleRoll(
        space.name,
        value => value >= 4,
        2
      );
      break;

    case "Duck Pond":
    case "Lucky Cups":
      parityChallenge(space.name, 2);
      break;

    case "High Striker":
      singleRoll(
        space.name,
        value => value >= 5,
        3
      );
      break;

    case "Mystery": {
      const card = drawCard("mystery");

      changeTickets(currentPlayer, card.tickets);

      const effect = card.tickets > 0
        ? `Gain ${card.tickets} tickets!`
        : card.tickets < 0
          ? `Lose ${Math.abs(card.tickets)} tickets!`
          : "No tickets gained or lost.";

      finishAction(
        `Mystery: ${card.name}. ${effect}`
      );
      break;
    }

    case "Challenge": {
      const card = drawCard("challenge");
      resolveChallenge(card);
      break;
    }
  }
}

function endGame() {
  phase = "finished";
  rollButton.disabled = true;
  roundDisplay.textContent = "Game Finished!";

  const highest = Math.max(
    ...players.map(player => player.tickets)
  );

  const leaders = players
    .map((player, index) =>
      player.tickets === highest ? index : -1
    )
    .filter(index => index !== -1);

  if (leaders.length === 1) {
    gameStatus.textContent =
      `${playerName(leaders[0])} is the Carnival Champion ` +
      `with ${highest} tickets!`;

    actionPanel.innerHTML = "";
    return;
  }

  gameStatus.textContent =
    `Tie for first at ${highest} tickets!`;

  function tieBreaker(contenders) {
    const rolls = contenders.map(index => ({
      index,
      value: rollDie()
    }));

    const best = Math.max(
      ...rolls.map(result => result.value)
    );

    const remaining = rolls
      .filter(result => result.value === best)
      .map(result => result.index);

    const summary = rolls
      .map(result =>
        `${playerName(result.index)} rolled ${result.value}`
      )
      .join(". ");

    if (remaining.length === 1) {
      gameStatus.textContent =
        `${summary}. ${playerName(remaining[0])} wins!`;

      actionPanel.innerHTML = "";
    } else {
      showAction(
        "Tie Breaker",
        `${summary}. Roll again!`,
        [
          {
            label: "Roll Again",
            action: () => tieBreaker(remaining)
          }
        ]
      );
    }
  }

  showAction(
    "Tie Breaker",
    "Tied players roll for the win.",
    [
      {
        label: "Roll Tie Breaker",
        action: () => tieBreaker(leaders)
      }
    ]
  );
}

document
  .getElementById("start-button")
  .addEventListener("click", startGame);

rollButton.addEventListener("click", rollMovement);

createBoard();

