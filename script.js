// ==========================================================================
//  Dice Roll -Main Script
// ==========================================================================

(function () {
  'use strict';

  // --- DOM References ---
  const numDiceSelect  = document.getElementById('num-dice');
  const numSidesSelect = document.getElementById('num-sides');
  const diceArea       = document.getElementById('dice-area');
  const rollBtn        = document.getElementById('roll-btn');
  const resultDisplay  = document.getElementById('result-display');
  const rollPrompt     = document.getElementById('roll-prompt');

  // Modifier DOM references
  const modifierBtn     = document.getElementById('modifier-btn');
  const modifierOverlay = document.getElementById('modifier-overlay');
  const modifierInput   = document.getElementById('modifier-input');
  const modifierDec     = document.getElementById('modifier-dec');
  const modifierInc     = document.getElementById('modifier-inc');
  const modifierApply   = document.getElementById('modifier-apply');

  // --- Page config (set by data attributes on <body>) ---
  const pageDice  = parseInt(document.body.dataset.pageDice, 10);
  const pageSides = parseInt(document.body.dataset.pageSides, 10);

  // History DOM reference
  const historyContainer = document.getElementById('roll-history');

  // --- State ---
  let isRolling       = false;
  let hasRolled       = false;
  let currentModifier = 0;
  let lastRawTotal    = 0;
  let rollHistory     = [];
  let rollCount       = 0;

  // --- Constants ---
  const ROLL_ANIMATION_MS   = 600;  // matches CSS animation duration
  const INTERIM_INTERVAL_MS = 60;   // speed of face-shuffling during roll

  // ========================================================================
  //  Dot layouts for classic dice faces 1–6
  //  Each entry is an array of CSS modifier class suffixes.
  // ========================================================================

  const DOT_LAYOUTS = {
    1: ['center'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'mid-left', 'mid-right', 'bottom-left', 'bottom-right'],
  };

  // ========================================================================
  //  Random number generation (uniform distribution)
  //  Returns an integer in [1, sides] inclusive.
  //  Uses crypto.getRandomValues for better randomness when available.
  // ========================================================================

  function rollDie(sides) {
    if (sides < 1) return 1;
    if (sides === 1) return 1;

    if (window.crypto && window.crypto.getRandomValues) {
      // Rejection sampling to avoid modulo bias
      const max = Math.floor(0xFFFFFFFF / sides) * sides;
      const arr = new Uint32Array(1);
      let rand;
      do {
        window.crypto.getRandomValues(arr);
        rand = arr[0];
      } while (rand >= max);
      return (rand % sides) + 1;
    }

    // Fallback
    return Math.floor(Math.random() * sides) + 1;
  }

  // ========================================================================
  //  Render helpers
  // ========================================================================

  /** Build the inner HTML for a die showing dots (values 1–6). */
  function createDotFace(value) {
    const layout = DOT_LAYOUTS[value];
    if (!layout) return '';
    return layout
      .map(pos => `<span class="die-dot die-dot--${pos}"></span>`)
      .join('');
  }

  /** Build the inner HTML for a die showing a number (values 7–10). */
  function createNumberFace(value) {
    return `<span class="die-number-text">${value}</span>`;
  }

  /** Create a single die element with the given value and number of sides. */
  function createDieElement(value, sides) {
    const die = document.createElement('div');

    if (sides <= 6) {
      die.className = 'die';
      die.innerHTML = createDotFace(value);
    } else {
      die.className = 'die die--number';
      die.innerHTML = createNumberFace(value);
    }

    return die;
  }

  /** Render all dice into the dice area. */
  function renderDice(values, sides, extraClass) {
    diceArea.innerHTML = '';
    values.forEach(val => {
      const die = createDieElement(val, sides);
      if (extraClass) die.classList.add(extraClass);
      diceArea.appendChild(die);
    });
  }

  /** Show the result display with optional modifier breakdown. */
  function showResult(rawTotal) {
    lastRawTotal = rawTotal;
    rollPrompt.classList.add('roll-prompt--hidden');

    if (currentModifier === 0) {
      // Single-block mode (original behavior)
      resultDisplay.classList.remove('result-display--multi');
      resultDisplay.innerHTML =
        '<span class="result-label">Total</span>' +
        '<span class="result-value" id="result-value">' + rawTotal + '</span>';
    } else {
      // Equation mode: 3 + 2 = 5
      var finalTotal = rawTotal + currentModifier;
      var modSign = currentModifier > 0 ? ' + ' : ' - ';
      var modText = Math.abs(currentModifier).toString();

      resultDisplay.classList.add('result-display--multi');
      resultDisplay.innerHTML =
        '<span class="result-label">Total</span>' +
        '<div class="result-equation">' +
          '<span class="result-equation-part">' + rawTotal + '</span>' +
          '<span class="result-equation-part">' + modSign + modText + '</span>' +
          '<span class="result-equation-part result-equation-equals"> = </span>' +
          '<span class="result-equation-total">' + finalTotal + '</span>' +
        '</div>';
    }

    resultDisplay.classList.add('result-display--visible');
  }

  function hideResult() {
    resultDisplay.classList.remove('result-display--visible');
    resultDisplay.classList.remove('result-display--multi');
  }

  // ========================================================================
  //  Modifier modal
  // ========================================================================

  function openModifierModal() {
    modifierInput.value = currentModifier;
    modifierOverlay.classList.add('modifier-overlay--visible');
    modifierInput.focus();
    modifierInput.select();
  }

  function closeModifierModal() {
    modifierOverlay.classList.remove('modifier-overlay--visible');
  }

  function applyModifier() {
    var val = parseInt(modifierInput.value, 10);
    currentModifier = isNaN(val) ? 0 : val;
    updateModifierButton();
    closeModifierModal();

    // If a result is currently displayed, re-render with the new modifier
    if (hasRolled) {
      showResult(lastRawTotal);
    }
  }

  function updateModifierButton() {
    if (currentModifier === 0) {
      modifierBtn.textContent = '+/\u2212';
      modifierBtn.classList.remove('modifier-btn--active');
    } else {
      var sign = currentModifier > 0 ? '+' : '';
      modifierBtn.textContent = sign + currentModifier;
      modifierBtn.classList.add('modifier-btn--active');
    }
  }

  // ========================================================================
  //  Navigation -dropdown option values are actual page URLs
  // ========================================================================

  function navigateOnChange() {
    var url = this.value;
    // Don't reload if selecting the current page
    if (url === window.location.pathname) return;
    window.location.href = url;
  }

  // ========================================================================
  //  Roll History
  // ========================================================================

  const MAX_HISTORY = 10;

  function addToHistory(values, sides, total) {
    rollCount++;
    var modifier = currentModifier;
    var finalTotal = total + modifier;
    rollHistory.unshift({
      number: rollCount,
      values: values.slice(),
      sides: sides,
      total: total,
      modifier: modifier,
      finalTotal: finalTotal
    });
    if (rollHistory.length > MAX_HISTORY) {
      rollHistory.pop();
    }
    renderHistory();
  }

  function renderHistory() {
    if (rollHistory.length === 0) {
      historyContainer.innerHTML = '';
      return;
    }

    var header =
      '<div class="roll-history-header">' +
        '<span class="roll-history-col-no">No</span>' +
        '<span class="roll-history-col-roll">Roll</span>' +
        '<span class="roll-history-col-mod">Modifier</span>' +
        '<span class="roll-history-col-total">Total</span>' +
      '</div>';

    var rows = rollHistory.map(function (entry, i) {
      var diceStr = entry.values.join(', ');
      var modStr = entry.modifier === 0 ? '-' : (entry.modifier > 0 ? '+' + entry.modifier : '' + entry.modifier);
      var rowClass = 'roll-history-row' + (i === 0 ? ' roll-history-row--latest' : '');
      return '<div class="' + rowClass + '">' +
        '<span class="roll-history-col-no">' + entry.number + '</span>' +
        '<span class="roll-history-col-roll">' + diceStr + '</span>' +
        '<span class="roll-history-col-mod">' + modStr + '</span>' +
        '<span class="roll-history-col-total">' + entry.finalTotal + '</span>' +
      '</div>';
    });

    historyContainer.innerHTML =
      '<div class="roll-history-top">' +
        '<h2 class="roll-history-heading">Roll History</h2>' +
        '<button class="roll-history-clear" id="roll-history-clear" type="button">Reset</button>' +
      '</div>' +
      '<div class="roll-history-table">' +
        header +
        rows.join('') +
      '</div>';

    document.getElementById('roll-history-clear').addEventListener('click', function () {
      rollHistory = [];
      rollCount = 0;
      historyContainer.innerHTML = '';
    });
  }

  // ========================================================================
  //  Initial render (show dice on page load using body data attributes)
  // ========================================================================

  function renderInitialDice() {
    // Generate random initial roll
    const values = [];
    for (let i = 0; i < pageDice; i++) {
      values.push(rollDie(pageSides));
    }
    renderDice(values, pageSides);

    // Show initial result
    const total = values.reduce((sum, v) => sum + v, 0);
    showResult(total);
    addToHistory(values, pageSides, total);
    hasRolled = true;
  }

  // ========================================================================
  //  Roll logic
  // ========================================================================

  function performRoll() {
    if (isRolling) return;
    isRolling = true;
    rollBtn.disabled = true;

    // During rolling, show single-block shuffling mode
    resultDisplay.classList.remove('result-display--multi');
    resultDisplay.innerHTML =
      '<span class="result-label">Total</span>' +
      '<span class="result-value result-value--shuffling" id="result-value">-</span>';
    resultDisplay.classList.add('result-display--visible');

    // Grab a fresh reference to the result-value element
    var rollingResultValue = document.getElementById('result-value');

    // Generate final results
    const finalValues = [];
    for (let i = 0; i < pageDice; i++) {
      finalValues.push(rollDie(pageSides));
    }

    // Start the rolling animation: show random faces rapidly
    const interimValues = Array(pageDice).fill(1);
    renderDice(interimValues, pageSides, 'die--rolling');

    // Shuffle the total display while rolling
    const interimTimer = setInterval(() => {
      for (let i = 0; i < pageDice; i++) {
        interimValues[i] = rollDie(pageSides);
      }
      // Update the dice faces but keep the rolling animation class
      const dieElements = diceArea.querySelectorAll('.die');
      dieElements.forEach((die, i) => {
        if (pageSides <= 6) {
          die.innerHTML = createDotFace(interimValues[i]);
        } else {
          die.innerHTML = createNumberFace(interimValues[i]);
        }
      });
      // Shuffle random total in the result badge
      const randomTotal = interimValues.reduce((sum, v) => sum + v, 0);
      rollingResultValue.textContent = randomTotal;
    }, INTERIM_INTERVAL_MS);

    // After the animation duration, show the final result
    setTimeout(() => {
      clearInterval(interimTimer);

      // Render final values with a landing animation
      renderDice(finalValues, pageSides, 'die--landed');

      const total = finalValues.reduce((sum, v) => sum + v, 0);
      showResult(total);
      addToHistory(finalValues, pageSides, total);

      hasRolled = true;
      isRolling = false;
      rollBtn.disabled = false;
    }, ROLL_ANIMATION_MS);
  }

  // ========================================================================
  //  Event listeners
  // ========================================================================

  rollBtn.addEventListener('click', performRoll);

  // Dropdown changes navigate to the URL stored in the option value
  numDiceSelect.addEventListener('change', navigateOnChange);
  numSidesSelect.addEventListener('change', navigateOnChange);

  // Modifier modal
  modifierBtn.addEventListener('click', openModifierModal);

  modifierDec.addEventListener('click', function () {
    modifierInput.value = parseInt(modifierInput.value || 0, 10) - 1;
  });

  modifierInc.addEventListener('click', function () {
    modifierInput.value = parseInt(modifierInput.value || 0, 10) + 1;
  });

  modifierApply.addEventListener('click', applyModifier);

  modifierOverlay.addEventListener('click', function (e) {
    if (e.target === modifierOverlay) {
      closeModifierModal();
    }
  });

  modifierInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      applyModifier();
    }
  });

  // Spacebar to roll (ignore when typing in inputs or modal is open)
  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ') return;
    var tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (modifierOverlay.classList.contains('modifier-overlay--visible')) return;
    e.preventDefault();
    performRoll();
  });

  // --- Boot ---
  renderInitialDice();
})();
