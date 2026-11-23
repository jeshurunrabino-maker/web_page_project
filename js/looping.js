/* ==========================================================================
   SHARED LOOP EXECUTION ENGINE (Single Source of Truth)
   ========================================================================== */
const traceFactorial = (n) => {
  let product = 1;
  let multiplier = 1;
  const passes = [];

  while (multiplier <= n) {
    const previousProduct = product;
    product *= multiplier;
    const shortVal = formatCompactNumber(product);
    passes.push({
      pass: multiplier,
      iter: multiplier,
      prev: previousProduct,
      value: product,
      shortVal,
      full: product >= SCIENTIFIC_NOTATION_THRESHOLD ? formatExactInteger(product) : '',
      expr: `Pass ${multiplier}: ${formatCompactNumber(previousProduct)} × ${multiplier} = ${shortVal}`,
      summaryVal: shortVal,
    });
    multiplier++;
  }

  return { value: product, passes };
};

const traceSum = (n) => {
  let runningTotal = 0;
  let addend = 0;
  const passes = [];

  // do...while guarantees at least one iteration executes even when n = 0
  do {
    const previousTotal = runningTotal;
    runningTotal += addend;
    const passNumber = passes.length + 1;
    const shortVal = formatCompactNumber(runningTotal);
    passes.push({
      pass: passNumber,
      iter: addend,
      prev: previousTotal,
      value: runningTotal,
      shortVal,
      expr: `Pass ${passNumber} (i = ${addend}): ${formatCompactNumber(previousTotal)} + ${addend} = ${shortVal}`,
      summaryVal: shortVal,
    });
    addend++;
  } while (addend <= n);

  return { value: runningTotal, passes };
};

const traceAverage = (n) => {
  let runningTotal = 0;
  const passes = [];

  for (let term = 1; term <= n; term++) {
    runningTotal += term;
    const currentAverage = runningTotal / term;
    const formattedAverage = currentAverage.toFixed(2);
    passes.push({
      pass: term,
      iter: term,
      total: runningTotal,
      value: currentAverage,
      shortVal: formattedAverage,
      expr: `Pass ${term} (k = ${term}): sum ${formatCompactNumber(runningTotal)} ÷ ${term} = ${formattedAverage}`,
      summaryVal: formattedAverage,
    });
  }

  const finalAverage = n === 0 ? 0 : runningTotal / n;
  return { value: finalAverage, passes };
};

const computeLoopTraces = (n) => ({
  fact: traceFactorial(n),
  sum: traceSum(n),
  avg: traceAverage(n),
});

/* --- ENGINE A: Execution Tape Adapter --- */
const buildVisibleTapeItems = (passes) => {
  if (passes.length <= 12) {
    return passes.map((passRecord, stepIndex) => ({ type: 'step', step: passRecord, stepIndex }));
  }
  const head = passes.slice(0, 6).map((passRecord, stepIndex) => ({ type: 'step', step: passRecord, stepIndex }));
  const tail = passes.slice(-4).map((passRecord, offset) => ({
    type: 'step',
    step: passRecord,
    stepIndex: passes.length - 4 + offset,
  }));
  return [...head, { type: 'ellipsis', skipped: passes.length - 10 }, ...tail];
};

/* --- ENGINE B: Control-Flow Flowchart Frame Builders --- */
const buildFactorialFlowFrames = (n, { value, passes }) => {
  const frames = [{ node: 'init', edge: null, readout: 'Init: result = 1, i = 1' }];

  passes.forEach((passRecord) => {
    if (passRecord.iter <= 3 || passRecord.iter === n) {
      const entryEdge = passRecord.iter === 1 ? 'init-cond' : 'body-cond';
      frames.push({ node: 'cond', edge: entryEdge, readout: `Check (${passRecord.iter} <= ${n}) → True` });
      frames.push({ node: 'body', edge: 'cond-body', readout: passRecord.expr });
    } else if (passRecord.iter === 4) {
      frames.push({ node: 'body', edge: 'body-cond', readout: `Looping passes 4..${n - 1}...` });
    }
  });

  const exitCheckEdge = n === 0 ? 'init-cond' : 'body-cond';
  const passWord = n === 1 ? 'pass' : 'passes';
  frames.push({ node: 'cond', edge: exitCheckEdge, readout: `Check (${n + 1} <= ${n}) → False` });
  frames.push({ node: 'exit', edge: 'cond-exit', readout: `Done (${n} ${passWord}): ${formatCompactNumber(value)}` });
  return frames;
};

const buildSumFlowFrames = (n, { value, passes }) => {
  const frames = [{ node: 'init', edge: null, readout: 'Init: total = 0, i = 0' }];

  passes.forEach((passRecord) => {
    if (passRecord.pass <= 3 || passRecord.iter === n) {
      const entryEdge = passRecord.pass === 1 ? 'init-body' : 'cond-body';
      frames.push({ node: 'body', edge: entryEdge, readout: passRecord.expr });
      if (passRecord.iter < n) {
        frames.push({ node: 'cond', edge: 'body-cond', readout: `Check (${passRecord.iter + 1} <= ${n}) → True` });
      }
    } else if (passRecord.pass === 4) {
      frames.push({ node: 'body', edge: 'cond-body', readout: `Looping passes 4..${n}...` });
    }
  });

  const passWord = passes.length === 1 ? 'pass' : 'passes';
  frames.push({ node: 'cond', edge: 'body-cond', readout: `Check (${n + 1} <= ${n}) → False` });
  frames.push({ node: 'exit', edge: 'cond-exit', readout: `Done (${passes.length} ${passWord}): ${formatCompactNumber(value)}` });
  return frames;
};

const buildAverageFlowFrames = (n, { value, passes }) => {
  const frames = [{ node: 'init', edge: null, readout: 'Init: total = 0, k = 1' }];

  passes.forEach((passRecord) => {
    if (passRecord.iter <= 2 || passRecord.iter === n) {
      const entryEdge = passRecord.iter === 1 ? 'init-cond' : 'inc-cond';
      frames.push({ node: 'cond', edge: entryEdge, readout: `Test (${passRecord.iter} <= ${n}) → True` });
      frames.push({ node: 'body', edge: 'cond-body', readout: `Body: total = ${formatCompactNumber(passRecord.total)} (avg ${passRecord.shortVal})` });
      frames.push({ node: 'inc', edge: 'body-inc', readout: `Update: k++ → ${passRecord.iter + 1}` });
    } else if (passRecord.iter === 3) {
      frames.push({ node: 'inc', edge: 'inc-cond', readout: `Looping passes 3..${n - 1}...` });
    }
  });

  const exitCheckEdge = n === 0 ? 'init-cond' : 'inc-cond';
  const passWord = n === 1 ? 'pass' : 'passes';
  frames.push({ node: 'cond', edge: exitCheckEdge, readout: `Test (${n + 1} <= ${n}) → False` });
  frames.push({
    node: 'exit',
    edge: 'cond-exit',
    readout: n === 0 ? 'Done (0 passes): guarded 0.00' : `Done (${n} ${passWord}): ${value.toFixed(2)}`,
  });
  return frames;
};

const FLOW_FRAME_BUILDERS = {
  fact: buildFactorialFlowFrames,
  sum: buildSumFlowFrames,
  avg: buildAverageFlowFrames,
};

const FLOW_NODE_EXPLANATIONS = {
  fact: {
    init: 'Initializes accumulator result = 1 and counter i = 1 before entering the loop.',
    cond: 'Entry condition: tests i <= n before every pass. Skips body completely if n = 0.',
    body: 'Multiplies result by i and increments i by 1, then loops back to re-test i <= n.',
    exit: 'Condition became false; exits loop and outputs the final factorial (0! = 1).',
  },
  sum: {
    init: 'Initializes running sum total = 0 and counter i = 0.',
    body: 'Executed BEFORE checking the condition—guarantees at least 1 pass even when n = 0.',
    cond: 'Exit condition: tests i <= n after the body runs. Loops back while true.',
    exit: 'Condition became false; exits loop and outputs the accumulated sum.',
  },
  avg: {
    init: 'Runs once at start: initializes total = 0 and loop counter k = 1.',
    cond: 'Entry test: checks k <= n before each iteration. Exits immediately when n = 0.',
    body: 'Adds current counter k into total.',
    inc: 'Increments counter k++ at the end of each pass before jumping back to k <= n.',
    exit: 'Divides total by n (returning 0.00 safely if n = 0).',
  },
};

/* --- ENGINE C: Visual Math Block Builder Helpers --- */
const getBarTierClass = (columnValue, maxColumnValue) => {
  if (maxColumnValue <= 0 || columnValue <= 0) return 'tier-1';
  const scaledTier = Math.round((columnValue / maxColumnValue) * 12);
  const clampedTier = Math.max(1, Math.min(12, scaledTier));
  return `tier-${clampedTier}`;
};

const renderLeveledDiscreteBlocks = (columnHeight, wholeLevel, hasHalfBlock) => {
  const maxDisplayRows = Math.max(columnHeight, wholeLevel);
  const blocks = [];

  for (let row = 1; row <= maxDisplayRows; row++) {
    if (row <= columnHeight && row <= wholeLevel) {
      blocks.push('<span class="unit-block"></span>');
    } else if (row > columnHeight && row <= wholeLevel) {
      blocks.push('<span class="unit-block is-leveled-gain"></span>');
    } else if (row <= columnHeight && row > wholeLevel) {
      const isHalfSurplus = hasHalfBlock && row === wholeLevel + 1;
      blocks.push(
        isHalfSurplus
          ? '<span class="unit-block is-half-block"></span>'
          : '<span class="unit-block is-leveled-trimmed"></span>'
      );
    }
  }

  if (hasHalfBlock && columnHeight <= wholeLevel) {
    blocks.push('<span class="unit-block is-half-block is-leveled-gain"></span>');
  }

  return blocks.join('');
};

const buildStaircaseHtml = (columnHeights, activeIndex, options = {}) => {
  const { leveledAvg = null, maxVal = 15 } = options;
  const isDiscrete = maxVal <= 15 && columnHeights.length <= 16;

  const visibleColumns = columnHeights.length <= 12
    ? columnHeights.map((columnHeight, columnIndex) => ({ type: 'col', columnHeight, columnIndex }))
    : [
        ...columnHeights.slice(0, 6).map((columnHeight, columnIndex) => ({ type: 'col', columnHeight, columnIndex })),
        { type: 'ellipsis', skipped: columnHeights.length - 10 },
        ...columnHeights.slice(-4).map((columnHeight, offset) => ({
          type: 'col',
          columnHeight,
          columnIndex: columnHeights.length - 4 + offset,
        })),
      ];

  const columnsMarkup = visibleColumns
    .map((entry) => {
      if (entry.type === 'ellipsis') {
        return '<span class="builder-ellipsis">&hellip;</span>';
      }

      const { columnHeight, columnIndex } = entry;
      const isActive = columnIndex === activeIndex;

      if (columnHeight === 0) {
        return `<div class="stair-col ${isActive ? 'is-active' : ''}"><div class="stair-stack"><span class="zero-col-marker"></span></div><span class="stair-label">i=0</span></div>`;
      }

      if (isDiscrete && leveledAvg !== null) {
        const wholeLevel = Math.floor(leveledAvg);
        const hasHalfBlock = Math.abs(leveledAvg - wholeLevel - 0.5) < 0.001;
        const blocksMarkup = renderLeveledDiscreteBlocks(columnHeight, wholeLevel, hasHalfBlock);
        return `<div class="stair-col is-active"><div class="stair-stack">${blocksMarkup}</div><span class="stair-label">${leveledAvg.toFixed(2)}</span></div>`;
      }

      if (isDiscrete) {
        const blocksMarkup = Array.from({ length: columnHeight }, () => '<span class="unit-block"></span>').join('');
        return `<div class="stair-col ${isActive ? 'is-active' : ''}"><div class="stair-stack">${blocksMarkup}</div><span class="stair-label">+${columnHeight}</span></div>`;
      }

      if (leveledAvg !== null) {
        return `<div class="stair-col is-active"><div class="stair-stack"><span class="tier-bar is-leveled tier-6"></span></div><span class="stair-label">${leveledAvg.toFixed(2)}</span></div>`;
      }

      const tierClass = getBarTierClass(columnHeight, maxVal);
      return `<div class="stair-col ${isActive ? 'is-active' : ''}"><div class="stair-stack"><span class="tier-bar ${tierClass}"></span></div><span class="stair-label">+${columnHeight}</span></div>`;
    })
    .join('');

  const legendMarkup = leveledAvg !== null && isDiscrete
    ? `<div class="builder-legend"><span class="legend-item"><span class="legend-swatch"></span> Original</span><span class="legend-item"><span class="legend-swatch is-gain"></span> Redistributed</span><span class="legend-item"><span class="legend-swatch is-trimmed"></span> Surplus moved</span></div>`
    : '';

  return `<div class="stair-arena">${columnsMarkup}</div>${legendMarkup}`;
};

const buildFactorialStageHtml = (n, currentPass, allPasses) => {
  if (n === 0) {
    return `<div class="cluster-arena"><div class="fact-cluster"><span class="fact-cluster-title">0! Identity (1 block)</span><div class="fact-pip-grid"><span class="fact-pip"></span></div></div></div>`;
  }

  // Render grouped pip clusters up to 5! (120 pips); switch to scaled multiplier bars beyond that.
  if (n <= 5) {
    const clustersMarkup = Array.from({ length: currentPass.iter }, (_, groupIndex) => {
      const pipsMarkup = Array.from({ length: currentPass.prev }, () => '<span class="fact-pip"></span>').join('');
      return `<div class="fact-cluster"><span class="fact-cluster-title">Group ${groupIndex + 1} (${currentPass.prev})</span><div class="fact-pip-grid">${pipsMarkup}</div></div>`;
    }).join('');
    return `<div class="cluster-arena">${clustersMarkup}</div>`;
  }

  const completedPasses = allPasses.slice(0, currentPass.iter);
  const visibleStageItems = completedPasses.length <= 12
    ? completedPasses.map((passRecord) => ({ type: 'step', passRecord }))
    : [
        ...completedPasses.slice(0, 6).map((passRecord) => ({ type: 'step', passRecord })),
        { type: 'ellipsis' },
        ...completedPasses.slice(-4).map((passRecord) => ({ type: 'step', passRecord })),
      ];

  const barsMarkup = visibleStageItems
    .map((stageItem) => {
      if (stageItem.type === 'ellipsis') {
        return '<span class="builder-ellipsis">&hellip;</span>';
      }
      const isCurrent = stageItem.passRecord.iter === currentPass.iter;
      const tierClass = getBarTierClass(stageItem.passRecord.iter, n);
      return `<div class="stair-col ${isCurrent ? 'is-active' : ''}"><div class="stair-stack"><span class="tier-bar ${tierClass}"></span></div><span class="stair-label">&times;${stageItem.passRecord.iter}</span></div>`;
    })
    .join('');

  return `<div class="stair-arena">${barsMarkup}</div>`;
};

const LOOP_VIEW_LABELS = {
  tape: '1. Execution Tape',
  flow: '2. Control-Flow Flowcharts',
  builder: '3. Visual Block Builder',
};

const initLooping = () => {
  const nInput = getById('loop-n');
  const speedSelect = getById('loop-speed');
  const replayButton = getById('loop-replay-btn');
  const errorDisplay = getById('loop-error');

  const viewToggleBar = getById('loop-view-bar');
  const allViewsHiddenNotice = getById('loop-views-hidden-notice');
  const showAllViewsButton = getById('loop-show-all-btn');

  const viewPanels = {
    tape: getById('loop-view-tape'),
    flow: getById('loop-view-flow'),
    builder: getById('loop-view-builder'),
  };

  const visibleViews = { tape: true, flow: true, builder: true };

  const syncViewVisibility = () => {
    const viewKeys = Object.keys(visibleViews);
    const visibleCount = viewKeys.filter((key) => visibleViews[key]).length;

    viewKeys.forEach((key) => {
      const isShown = visibleViews[key];
      const panelElement = viewPanels[key];
      panelElement.hidden = !isShown;

      const focusButton = panelElement.querySelector(`.view-action-btn[data-focus-view="${key}"]`);
      if (focusButton) {
        focusButton.textContent = visibleCount === 1 && isShown ? 'Show All' : 'Only This';
      }

      const togglePill = viewToggleBar.querySelector(`[data-view-toggle="${key}"]`);
      if (togglePill) {
        togglePill.classList.toggle('active', isShown);
        togglePill.classList.toggle('is-off', !isShown);
        togglePill.setAttribute('aria-pressed', String(isShown));
        togglePill.innerHTML = `${isShown ? '&#10003;' : '&#10005;'} ${LOOP_VIEW_LABELS[key]}`;
      }
    });

    const showAllPill = viewToggleBar.querySelector('[data-view-action="all"]');
    if (showAllPill) {
      showAllPill.classList.toggle('active', visibleCount === viewKeys.length);
    }
    allViewsHiddenNotice.hidden = visibleCount > 0;
  };

  const showAllViews = () => {
    visibleViews.tape = true;
    visibleViews.flow = true;
    visibleViews.builder = true;
    syncViewVisibility();
  };

  viewToggleBar.addEventListener('click', (event) => {
    if (event.target.closest('[data-view-action="all"]')) {
      showAllViews();
      return;
    }
    const toggleButton = event.target.closest('[data-view-toggle]');
    if (toggleButton) {
      const viewKey = toggleButton.dataset.viewToggle;
      visibleViews[viewKey] = !visibleViews[viewKey];
      syncViewVisibility();
    }
  });

  showAllViewsButton.addEventListener('click', showAllViews);

  Object.entries(viewPanels).forEach(([viewKey, panelElement]) => {
    panelElement.addEventListener('click', (event) => {
      if (event.target.closest(`[data-hide-view="${viewKey}"]`)) {
        visibleViews[viewKey] = false;
        syncViewVisibility();
        return;
      }

      if (event.target.closest(`[data-focus-view="${viewKey}"]`)) {
        const visibleCount = Object.values(visibleViews).filter(Boolean).length;
        const isCurrentlySolo = visibleViews[viewKey] && visibleCount === 1;
        if (isCurrentlySolo) {
          showAllViews();
        } else {
          Object.keys(visibleViews).forEach((key) => {
            visibleViews[key] = key === viewKey;
          });
          syncViewVisibility();
        }
      }
    });
  });

  const summaryOutputs = {
    fact: getById('loop-factorial'),
    sum: getById('loop-sum'),
    avg: getById('loop-avg'),
  };

  const tapeViews = {
    fact: {
      exprElement: getById('trace-expr-fact'),
      statusElement: getById('trace-status-fact'),
      trackElement: getById('tape-track-fact'),
      emptyMessage: 'Condition (1 <= 0) is false at entry — 0 passes • 0! = 1',
      formatCompletion: (val, count) =>
        `Completed (${count} ${count === 1 ? 'pass' : 'passes'}) • Final Factorial = ${formatCompactNumber(val)}`,
    },
    sum: {
      exprElement: getById('trace-expr-sum'),
      statusElement: getById('trace-status-sum'),
      trackElement: getById('tape-track-sum'),
      emptyMessage: 'Executed 1 pass before checking exit condition',
      formatCompletion: (val, count) =>
        `Completed (${count} ${count === 1 ? 'pass' : 'passes'}) • Final Sum = ${formatCompactNumber(val)}`,
    },
    avg: {
      exprElement: getById('trace-expr-avg'),
      statusElement: getById('trace-status-avg'),
      trackElement: getById('tape-track-avg'),
      emptyMessage: 'Condition (1 <= 0) is false at entry — 0 passes • Average = 0.00',
      formatCompletion: (val, count) =>
        `Completed (${count} ${count === 1 ? 'pass' : 'passes'}) • Final Average = ${val.toFixed(2)}`,
    },
  };

  const flowCards = {
    fact: {
      cardElement: document.querySelector('.flow-card[data-loop="fact"]'),
      badgeElement: getById('flow-badge-fact'),
      readoutElement: getById('flow-readout-fact'),
      defaultBadge: 'Entry-Controlled',
    },
    sum: {
      cardElement: document.querySelector('.flow-card[data-loop="sum"]'),
      badgeElement: getById('flow-badge-sum'),
      readoutElement: getById('flow-readout-sum'),
      defaultBadge: 'Exit-Controlled',
    },
    avg: {
      cardElement: document.querySelector('.flow-card[data-loop="avg"]'),
      badgeElement: getById('flow-badge-avg'),
      readoutElement: getById('flow-readout-avg'),
      defaultBadge: 'Counter-Controlled',
    },
  };

  const builderStages = {
    fact: {
      exprElement: getById('builder-expr-fact'),
      badgeElement: getById('builder-badge-fact'),
      stageElement: getById('builder-stage-fact'),
    },
    sum: {
      exprElement: getById('builder-expr-sum'),
      badgeElement: getById('builder-badge-sum'),
      stageElement: getById('builder-stage-sum'),
    },
    avg: {
      exprElement: getById('builder-expr-avg'),
      badgeElement: getById('builder-badge-avg'),
      stageElement: getById('builder-stage-avg'),
    },
  };

  let scheduledTimers = [];
  let lastValidN = null;

  const scheduleFrame = (callback, delayMs) => {
    const timerId = window.setTimeout(callback, delayMs);
    scheduledTimers.push(timerId);
    return timerId;
  };

  const clearScheduledAnimations = () => {
    scheduledTimers.forEach((timerId) => window.clearTimeout(timerId));
    scheduledTimers = [];
  };

  const setStatusBadge = (badgeElement, label, stateClass = '') => {
    badgeElement.textContent = label;
    badgeElement.classList.remove('is-running', 'is-complete');
    if (stateClass) badgeElement.classList.add(stateClass);
  };

  const clearFlowHighlights = (cardElement) => {
    cardElement.querySelectorAll('.flow-node, .flow-edge').forEach((element) => {
      element.classList.remove('is-active', 'is-visited');
    });
  };

  const resetAllVisualizers = () => {
    clearScheduledAnimations();
    Object.values(summaryOutputs).forEach((outputElement) => {
      outputElement.textContent = '-';
    });
    Object.values(tapeViews).forEach((view) => {
      view.exprElement.textContent = 'Ready: enter n and click Run All Loops';
      setStatusBadge(view.statusElement, 'Idle');
      view.trackElement.innerHTML = '';
    });
    Object.values(flowCards).forEach(({ cardElement, badgeElement, readoutElement, defaultBadge }) => {
      clearFlowHighlights(cardElement);
      badgeElement.textContent = defaultBadge;
      badgeElement.classList.remove('is-running');
      readoutElement.textContent = 'Ready: enter n and click Run All Loops';
    });
    Object.values(builderStages).forEach((stage) => {
      stage.exprElement.textContent = 'Ready: enter n and click Run All Loops';
      setStatusBadge(stage.badgeElement, 'Idle');
      stage.stageElement.innerHTML = '';
    });
  };

  const renderTapeVisualizer = (loopKey, { value, passes }, delayMs) => {
    const view = tapeViews[loopKey];
    const finalFormatted = loopKey === 'avg' ? value.toFixed(2) : formatCompactNumber(value);
    summaryOutputs[loopKey].title = loopKey === 'fact' ? formatExactInteger(value) : '';
    view.trackElement.innerHTML = '';

    if (passes.length === 0) {
      summaryOutputs[loopKey].textContent = finalFormatted;
      view.exprElement.textContent = view.emptyMessage;
      setStatusBadge(view.statusElement, '0 passes', 'is-complete');
      view.trackElement.innerHTML = `<span class="tape-empty-note">${escapeHtml(view.emptyMessage)}</span>`;
      return;
    }

    const visibleItems = buildVisibleTapeItems(passes);
    view.trackElement.innerHTML = visibleItems
      .map((tapeEntry) => {
        if (tapeEntry.type === 'ellipsis') {
          return `<span class="tape-ellipsis">&hellip; (${tapeEntry.skipped} more) &hellip;</span>`;
        }
        const { step, stepIndex } = tapeEntry;
        const tooltipText = step.full ? `${step.expr} (exact: ${step.full})` : step.expr;
        return `<button type="button" class="tape-cell" data-step-idx="${stepIndex}" title="${escapeHtml(tooltipText)}"><span class="tape-cell-step">i=${step.iter}</span><span class="tape-cell-val">${escapeHtml(step.shortVal)}</span></button>`;
      })
      .join('');

    const stepButtons = Array.from(view.trackElement.querySelectorAll('.tape-cell[data-step-idx]'));
    stepButtons.forEach((cellButton) => {
      cellButton.addEventListener('click', () => {
        const selectedPass = passes[Number(cellButton.dataset.stepIdx)];
        if (!selectedPass) return;
        stepButtons.forEach((candidate) => candidate.classList.remove('is-current'));
        cellButton.classList.add('is-current');
        view.exprElement.textContent = `Inspecting ${selectedPass.expr}`;
      });
    });

    const passCountLabel = `${passes.length} ${passes.length === 1 ? 'pass' : 'passes'}`;

    if (delayMs === 0) {
      stepButtons.forEach((cellButton, index) => {
        cellButton.classList.add(index === stepButtons.length - 1 ? 'is-current' : 'is-done');
      });
      summaryOutputs[loopKey].textContent = finalFormatted;
      view.exprElement.textContent = view.formatCompletion(value, passes.length);
      setStatusBadge(view.statusElement, passCountLabel, 'is-complete');
      return;
    }

    setStatusBadge(view.statusElement, 'Running...', 'is-running');
    stepButtons.forEach((cellButton, frameIndex) => {
      scheduleFrame(() => {
        const currentPass = passes[Number(cellButton.dataset.stepIdx)];
        stepButtons.forEach((candidate, priorIndex) => {
          candidate.classList.remove('is-current');
          if (priorIndex < frameIndex) candidate.classList.add('is-done');
        });
        cellButton.classList.add('is-current');
        view.exprElement.textContent = currentPass.expr;
        summaryOutputs[loopKey].textContent = currentPass.summaryVal;

        if (frameIndex === stepButtons.length - 1) {
          summaryOutputs[loopKey].textContent = finalFormatted;
          view.exprElement.textContent = view.formatCompletion(value, passes.length);
          setStatusBadge(view.statusElement, passCountLabel, 'is-complete');
        }
      }, frameIndex * delayMs);
    });
  };

  const applyFlowFrame = (loopKey, frame) => {
    const { cardElement, readoutElement } = flowCards[loopKey];
    cardElement.querySelectorAll('.flow-node.is-active, .flow-edge.is-active').forEach((element) => {
      element.classList.remove('is-active');
      element.classList.add('is-visited');
    });

    if (frame.edge) {
      const edgeElement = cardElement.querySelector(`.flow-edge[data-edge="${frame.edge}"]`);
      if (edgeElement) edgeElement.classList.add('is-active');
    }

    const nodeElement = cardElement.querySelector(`.flow-node[data-node="${frame.node}"]`);
    if (nodeElement) {
      nodeElement.classList.remove('is-visited');
      nodeElement.classList.add('is-active');
    }

    readoutElement.textContent = frame.readout;
  };

  const renderFlowchartVisualizer = (loopKey, frames, delayMs) => {
    const { cardElement, badgeElement, defaultBadge } = flowCards[loopKey];
    clearFlowHighlights(cardElement);

    if (delayMs === 0) {
      frames.forEach((frame) => applyFlowFrame(loopKey, frame));
      badgeElement.textContent = defaultBadge;
      badgeElement.classList.remove('is-running');
      return;
    }

    badgeElement.textContent = 'Tracing...';
    badgeElement.classList.add('is-running');
    frames.forEach((frame, frameIndex) => {
      scheduleFrame(() => {
        applyFlowFrame(loopKey, frame);
        if (frameIndex === frames.length - 1) {
          badgeElement.textContent = defaultBadge;
          badgeElement.classList.remove('is-running');
        }
      }, frameIndex * delayMs);
    });
  };

  Object.entries(flowCards).forEach(([loopKey, { cardElement, readoutElement }]) => {
    const inspectNode = (nodeElement) => {
      const explanation = FLOW_NODE_EXPLANATIONS[loopKey][nodeElement.dataset.node];
      if (!explanation) return;
      cardElement.querySelectorAll('.flow-node').forEach((node) => node.classList.remove('is-active'));
      nodeElement.classList.add('is-active');
      readoutElement.textContent = explanation;
    };

    cardElement.addEventListener('click', (event) => {
      const nodeElement = event.target.closest('.flow-node[data-node]');
      if (nodeElement) inspectNode(nodeElement);
    });

    cardElement.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const nodeElement = event.target.closest('.flow-node[data-node]');
      if (nodeElement) {
        event.preventDefault();
        inspectNode(nodeElement);
      }
    });
  });

  const renderBuilderStage = (stage, passes, delayMs, { runningLabel, onEmpty, onFrame, onComplete }) => {
    if (passes.length === 0) {
      onEmpty();
      return;
    }
    if (delayMs === 0) {
      onComplete();
      return;
    }

    setStatusBadge(stage.badgeElement, runningLabel, 'is-running');
    const sampledIndices = selectAnimationIndices(passes.length);
    sampledIndices.forEach((passIndex, framePosition) => {
      scheduleFrame(() => {
        onFrame(passes[passIndex], passIndex);
        if (passIndex === passes.length - 1) onComplete();
      }, framePosition * delayMs);
    });
  };

  const renderBlockBuilderVisualizer = (n, { fact, sum, avg }, delayMs) => {
    const stages = builderStages;
    stages.fact.badgeElement.title = formatExactInteger(fact.value);

    renderBuilderStage(stages.fact, fact.passes, delayMs, {
      runningLabel: 'Building...',
      onEmpty: () => {
        stages.fact.exprElement.textContent = 'Condition (1 <= 0) is false at entry • 0! = 1 block';
        setStatusBadge(stages.fact.badgeElement, '1 block', 'is-complete');
        stages.fact.stageElement.innerHTML = buildFactorialStageHtml(0, null, []);
      },
      onFrame: (passRecord) => {
        stages.fact.exprElement.textContent = `Pass ${passRecord.iter}: ${passRecord.iter} × ${formatCompactNumber(passRecord.prev)} = ${passRecord.shortVal} blocks`;
        stages.fact.stageElement.innerHTML = buildFactorialStageHtml(n, passRecord, fact.passes);
      },
      onComplete: () => {
        const finalPass = fact.passes[fact.passes.length - 1];
        const groupWord = n === 1 ? 'group' : 'groups';
        stages.fact.exprElement.textContent = `Built ${n} ${groupWord} • Total = ${formatCompactNumber(fact.value)} blocks`;
        setStatusBadge(stages.fact.badgeElement, `${formatCompactNumber(fact.value)} blocks`, 'is-complete');
        stages.fact.stageElement.innerHTML = buildFactorialStageHtml(n, finalPass, fact.passes);
      },
    });

    renderBuilderStage(stages.sum, sum.passes, delayMs, {
      runningLabel: 'Stacking...',
      onEmpty: () => {},
      onFrame: (passRecord, passIndex) => {
        const columns = sum.passes.slice(0, passIndex + 1).map((record) => record.iter);
        stages.sum.exprElement.textContent = `Pass ${passIndex + 1} (i = ${passRecord.iter}): +${passRecord.iter} blocks → ${passRecord.shortVal} total`;
        stages.sum.stageElement.innerHTML = buildStaircaseHtml(columns, columns.length - 1, { maxVal: n });
      },
      onComplete: () => {
        const columns = sum.passes.map((record) => record.iter);
        stages.sum.exprElement.textContent = `Staircase complete (i = 0..${n}) • Total = ${formatCompactNumber(sum.value)} blocks`;
        setStatusBadge(stages.sum.badgeElement, `${formatCompactNumber(sum.value)} blocks`, 'is-complete');
        stages.sum.stageElement.innerHTML = buildStaircaseHtml(columns, columns.length - 1, { maxVal: n });
      },
    });

    const showLeveledAverage = () => {
      const columns = avg.passes.map((record) => record.iter);
      stages.avg.exprElement.textContent = `Leveled all ${n} columns to equal height = ${avg.value.toFixed(2)}`;
      setStatusBadge(stages.avg.badgeElement, `Avg: ${avg.value.toFixed(2)}`, 'is-complete');
      stages.avg.stageElement.innerHTML = buildStaircaseHtml(columns, -1, { leveledAvg: avg.value, maxVal: n });
    };

    renderBuilderStage(stages.avg, avg.passes, delayMs, {
      runningLabel: 'Accumulating...',
      onEmpty: () => {
        stages.avg.exprElement.textContent = '0 columns accumulated • Guarded division → Average = 0.00';
        setStatusBadge(stages.avg.badgeElement, 'Avg: 0.00', 'is-complete');
        stages.avg.stageElement.innerHTML = '<span class="builder-empty-note">No columns to level when n = 0 (0.00).</span>';
      },
      onFrame: (passRecord, passIndex) => {
        const columns = avg.passes.slice(0, passIndex + 1).map((record) => record.iter);
        stages.avg.exprElement.textContent = `Pass ${passRecord.iter}: sum ${formatCompactNumber(passRecord.total)} ÷ ${passRecord.iter} = ${passRecord.shortVal}`;
        stages.avg.stageElement.innerHTML = buildStaircaseHtml(columns, columns.length - 1, { maxVal: n });
      },
      onComplete: () => {
        if (delayMs === 0) {
          showLeveledAverage();
        } else {
          scheduleFrame(showLeveledAverage, 180);
        }
      },
    });
  };

  const executeAllLoopVisualizers = (n, shouldLog = true) => {
    clearScheduledAnimations();
    const delayMs = Number(speedSelect.value);
    const traces = computeLoopTraces(n);

    ['fact', 'sum', 'avg'].forEach((loopKey) => {
      renderTapeVisualizer(loopKey, traces[loopKey], delayMs);
      renderFlowchartVisualizer(loopKey, FLOW_FRAME_BUILDERS[loopKey](n, traces[loopKey]), delayMs);
    });

    renderBlockBuilderVisualizer(n, traces, delayMs);

    if (shouldLog) {
      const summary = `n=${n} → n!=${formatCompactNumber(traces.fact.value)}, Sum=${formatCompactNumber(traces.sum.value)}, Avg=${traces.avg.value.toFixed(2)}`;
      logScratchpadEntry('Looping', summary, () => {
        nInput.value = String(n);
        clearFieldError(errorDisplay);
        lastValidN = n;
        replayButton.disabled = false;
        executeAllLoopVisualizers(n, false);
      });
    }
  };

  getById('loop-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const rawValue = nInput.value.trim();
    const n = Number(rawValue);

    // 171! exceeds IEEE-754 double-precision max (~1.797e308) and overflows to Infinity.
    if (rawValue === '' || !Number.isInteger(n) || n < 0 || n > 170) {
      setFieldError(errorDisplay, 'Please enter a whole number from 0 to 170.');
      lastValidN = null;
      replayButton.disabled = true;
      resetAllVisualizers();
      return;
    }

    clearFieldError(errorDisplay);
    lastValidN = n;
    replayButton.disabled = false;
    executeAllLoopVisualizers(n);
  });

  replayButton.addEventListener('click', () => {
    if (lastValidN !== null) {
      executeAllLoopVisualizers(lastValidN, false);
    }
  });

  syncViewVisibility();
};