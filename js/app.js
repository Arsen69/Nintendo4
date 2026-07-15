(() => {
  "use strict";

  const STORAGE_KEY = "wizard-scoreboard-game";
  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 6;
  const TOTAL_CARDS = 60;

  /** @type {HTMLElement} */
  const setupScreen = document.getElementById("setup-screen");
  const gameScreen = document.getElementById("game-screen");
  const endScreen = document.getElementById("end-screen");

  const playerCountValue = document.getElementById("player-count-value");
  const playerCountMinus = document.getElementById("player-count-minus");
  const playerCountPlus = document.getElementById("player-count-plus");
  const playerNamesContainer = document.getElementById("player-names");
  const roundsHint = document.getElementById("rounds-hint");
  const startGameBtn = document.getElementById("start-game-btn");

  const roundNumberEl = document.getElementById("round-number");
  const roundCardsEl = document.getElementById("round-cards");
  const roundDealerEl = document.getElementById("round-dealer");

  const biddingPanel = document.getElementById("bidding-panel");
  const biddingInputs = document.getElementById("bidding-inputs");
  const confirmBidsBtn = document.getElementById("confirm-bids-btn");

  const resultsPanel = document.getElementById("results-panel");
  const resultsInputs = document.getElementById("results-inputs");
  const resultsError = document.getElementById("results-error");
  const confirmResultsBtn = document.getElementById("confirm-results-btn");

  const scoreTable = document.getElementById("score-table");
  const newGameBtn = document.getElementById("new-game-btn");

  const finalRanking = document.getElementById("final-ranking");
  const restartGameBtn = document.getElementById("restart-game-btn");

  let playerCount = MIN_PLAYERS;
  let playerNameValues = ["", "", ""];
  let game = null;

  // ---------- Persistence ----------

  function loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveGame() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }

  function clearSavedGame() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ---------- Setup screen ----------

  function totalRoundsFor(nbPlayers) {
    return Math.floor(TOTAL_CARDS / nbPlayers);
  }

  function renderPlayerNameInputs() {
    playerNamesContainer.innerHTML = "";
    for (let i = 0; i < playerCount; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `Joueur ${i + 1}`;
      input.value = playerNameValues[i] || "";
      input.maxLength = 24;
      input.addEventListener("input", () => {
        playerNameValues[i] = input.value;
      });
      playerNamesContainer.appendChild(input);
    }
    roundsHint.textContent =
      `Avec ${playerCount} joueurs, la partie durera ${totalRoundsFor(playerCount)} manches.`;
  }

  function setPlayerCount(n) {
    playerCount = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, n));
    while (playerNameValues.length < playerCount) playerNameValues.push("");
    playerCountValue.textContent = String(playerCount);
    playerCountMinus.disabled = playerCount <= MIN_PLAYERS;
    playerCountPlus.disabled = playerCount >= MAX_PLAYERS;
    renderPlayerNameInputs();
  }

  playerCountMinus.addEventListener("click", () => setPlayerCount(playerCount - 1));
  playerCountPlus.addEventListener("click", () => setPlayerCount(playerCount + 1));

  startGameBtn.addEventListener("click", () => {
    const names = [];
    for (let i = 0; i < playerCount; i++) {
      const raw = (playerNameValues[i] || "").trim();
      names.push(raw || `Joueur ${i + 1}`);
    }
    game = createGame(names);
    saveGame();
    showScreen("game");
    renderGameScreen();
  });

  // ---------- Game model ----------

  function createGame(players) {
    const totalRounds = totalRoundsFor(players.length);
    return {
      players,
      totalRounds,
      currentRound: 1, // 1-indexed
      phase: "bidding", // "bidding" | "results"
      rounds: [], // completed rounds: { cardsDealt, dealerIndex, bids, actual, scores, totals }
      pendingBids: null,
    };
  }

  function currentDealerIndex() {
    return (game.currentRound - 1) % game.players.length;
  }

  function biddingOrderIndices() {
    // Order starts with the player to the left of the dealer.
    const n = game.players.length;
    const dealer = currentDealerIndex();
    const order = [];
    for (let i = 1; i <= n; i++) {
      order.push((dealer + i) % n);
    }
    return order;
  }

  function computeScore(bid, actual) {
    if (bid === actual) {
      return 20 + 10 * actual;
    }
    return -10 * Math.abs(bid - actual);
  }

  function cumulativeTotalsAfter(roundIdx) {
    // roundIdx is 0-based index into game.rounds, inclusive
    const totals = new Array(game.players.length).fill(0);
    for (let r = 0; r <= roundIdx; r++) {
      const round = game.rounds[r];
      for (let p = 0; p < game.players.length; p++) {
        totals[p] += round.scores[p];
      }
    }
    return totals;
  }

  // ---------- Game screen rendering ----------

  function showScreen(name) {
    setupScreen.classList.toggle("hidden", name !== "setup");
    gameScreen.classList.toggle("hidden", name !== "game");
    endScreen.classList.toggle("hidden", name !== "end");
  }

  function renderGameScreen() {
    if (game.currentRound > game.totalRounds) {
      renderEndScreen();
      showScreen("end");
      return;
    }

    const cardsDealt = game.currentRound;
    roundNumberEl.textContent = `${game.currentRound} / ${game.totalRounds}`;
    roundCardsEl.textContent = String(cardsDealt);
    roundDealerEl.textContent = game.players[currentDealerIndex()];

    biddingPanel.classList.toggle("hidden", game.phase !== "bidding");
    resultsPanel.classList.toggle("hidden", game.phase !== "results");

    if (game.phase === "bidding") {
      renderBiddingInputs();
    } else {
      renderResultsInputs();
    }

    renderScoreTable();
  }

  function renderBiddingInputs() {
    biddingInputs.innerHTML = "";
    const cardsDealt = game.currentRound;
    const order = biddingOrderIndices();

    order.forEach((playerIdx) => {
      const row = document.createElement("div");
      row.className = "input-row";

      const label = document.createElement("span");
      label.className = "player-name";
      label.textContent = game.players[playerIdx];

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = String(cardsDealt);
      input.step = "1";
      input.dataset.playerIdx = String(playerIdx);
      input.value = "0";
      input.className = "bid-input";

      row.appendChild(label);
      row.appendChild(input);
      biddingInputs.appendChild(row);
    });
  }

  confirmBidsBtn.addEventListener("click", () => {
    const cardsDealt = game.currentRound;
    const bids = new Array(game.players.length).fill(0);
    const inputs = biddingInputs.querySelectorAll(".bid-input");
    let valid = true;
    inputs.forEach((input) => {
      const idx = Number(input.dataset.playerIdx);
      let v = Math.round(Number(input.value));
      if (Number.isNaN(v) || v < 0) v = 0;
      if (v > cardsDealt) v = cardsDealt;
      bids[idx] = v;
      if (input.value === "" || Number.isNaN(Number(input.value))) valid = false;
    });
    if (!valid) return;

    game.pendingBids = bids;
    game.phase = "results";
    saveGame();
    renderGameScreen();
  });

  function renderResultsInputs() {
    resultsInputs.innerHTML = "";
    resultsError.classList.add("hidden");
    const cardsDealt = game.currentRound;

    game.players.forEach((name, idx) => {
      const row = document.createElement("div");
      row.className = "input-row";

      const label = document.createElement("span");
      label.className = "player-name";
      label.textContent = `${name} (a prédit ${game.pendingBids[idx]})`;

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = String(cardsDealt);
      input.step = "1";
      input.dataset.playerIdx = String(idx);
      input.value = "0";
      input.className = "actual-input";

      row.appendChild(label);
      row.appendChild(input);
      resultsInputs.appendChild(row);
    });
  }

  confirmResultsBtn.addEventListener("click", () => {
    const cardsDealt = game.currentRound;
    const actual = new Array(game.players.length).fill(0);
    const inputs = resultsInputs.querySelectorAll(".actual-input");
    inputs.forEach((input) => {
      const idx = Number(input.dataset.playerIdx);
      let v = Math.round(Number(input.value));
      if (Number.isNaN(v) || v < 0) v = 0;
      if (v > cardsDealt) v = cardsDealt;
      actual[idx] = v;
    });

    const sum = actual.reduce((a, b) => a + b, 0);
    if (sum !== cardsDealt) {
      resultsError.textContent =
        `Le total des plis remportés (${sum}) doit être égal au nombre de cartes distribuées (${cardsDealt}).`;
      resultsError.classList.remove("hidden");
      return;
    }

    const scores = game.players.map((_, idx) => computeScore(game.pendingBids[idx], actual[idx]));

    game.rounds.push({
      cardsDealt,
      dealerIndex: currentDealerIndex(),
      bids: game.pendingBids,
      actual,
      scores,
    });

    game.pendingBids = null;
    game.phase = "bidding";
    game.currentRound += 1;

    saveGame();
    renderGameScreen();
  });

  function renderScoreTable() {
    const thead = scoreTable.querySelector("thead");
    const tbody = scoreTable.querySelector("tbody");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const headRow = document.createElement("tr");
    const cornerTh = document.createElement("th");
    cornerTh.textContent = "Manche";
    headRow.appendChild(cornerTh);
    game.players.forEach((name) => {
      const th = document.createElement("th");
      th.textContent = name;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    game.rounds.forEach((round, roundIdx) => {
      const tr = document.createElement("tr");
      const roundTh = document.createElement("th");
      roundTh.textContent = String(roundIdx + 1);
      tr.appendChild(roundTh);

      const totals = cumulativeTotalsAfter(roundIdx);

      game.players.forEach((_, playerIdx) => {
        const td = document.createElement("td");

        const bidActual = document.createElement("span");
        bidActual.className = "cell-bidactual";
        bidActual.textContent = `${round.bids[playerIdx]} → ${round.actual[playerIdx]}`;

        const scoreEl = document.createElement("span");
        const score = round.scores[playerIdx];
        scoreEl.className = "cell-score " + (score >= 0 ? "positive" : "negative");
        scoreEl.textContent = (score >= 0 ? "+" : "") + score;

        const totalEl = document.createElement("span");
        totalEl.className = "cell-total";
        totalEl.textContent = `total ${totals[playerIdx]}`;

        td.appendChild(bidActual);
        td.appendChild(scoreEl);
        td.appendChild(totalEl);
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    if (game.rounds.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = game.players.length + 1;
      td.textContent = "Aucune manche jouée pour l'instant.";
      td.style.color = "var(--text-muted)";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  }

  function renderEndScreen() {
    const totals = game.rounds.length
      ? cumulativeTotalsAfter(game.rounds.length - 1)
      : game.players.map(() => 0);

    const ranking = game.players
      .map((name, idx) => ({ name, total: totals[idx] }))
      .sort((a, b) => b.total - a.total);

    const maxScore = ranking.length ? ranking[0].total : 0;

    finalRanking.innerHTML = "";
    ranking.forEach((entry, i) => {
      const row = document.createElement("div");
      row.className = "rank-row" + (entry.total === maxScore ? " winner" : "");

      const pos = document.createElement("span");
      pos.className = "rank-position";
      pos.textContent = entry.total === maxScore ? "🏆" : `${i + 1}.`;

      const name = document.createElement("span");
      name.className = "rank-name";
      name.textContent = entry.name;

      const score = document.createElement("span");
      score.className = "rank-score";
      score.textContent = String(entry.total);

      row.appendChild(pos);
      row.appendChild(name);
      row.appendChild(score);
      finalRanking.appendChild(row);
    });
  }

  // ---------- New game / reset ----------

  function resetToSetup() {
    game = null;
    clearSavedGame();
    setPlayerCount(MIN_PLAYERS);
    playerNameValues = new Array(MAX_PLAYERS).fill("");
    setPlayerCount(MIN_PLAYERS);
    showScreen("setup");
  }

  newGameBtn.addEventListener("click", () => {
    if (confirm("Abandonner la partie en cours et recommencer ?")) {
      resetToSetup();
    }
  });

  restartGameBtn.addEventListener("click", resetToSetup);

  // ---------- Init ----------

  function init() {
    const saved = loadGame();
    if (saved && saved.players && saved.players.length >= MIN_PLAYERS) {
      game = saved;
      showScreen("game");
      renderGameScreen();
    } else {
      setPlayerCount(MIN_PLAYERS);
      showScreen("setup");
    }
  }

  init();
})();
