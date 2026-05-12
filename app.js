const NOW = new Date();
const CURRENT_MONTH = NOW.getMonth(); // 0-indexed
const CURRENT_YEAR = NOW.getFullYear();
const MONTH_DAYS = new Date(CURRENT_YEAR, CURRENT_MONTH + 1, 0).getDate();
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_NAME = MONTH_NAMES[CURRENT_MONTH];
const TODAY_DAY = NOW.getDate();
const TODAY_KEY = "rd-v7-" + CURRENT_YEAR + "-" + (CURRENT_MONTH + 1) + "-" + TODAY_DAY;

const DAILIES = [
  "Wake up", "Workout", "Reading",
  "Python", "Break 15 min", "Revise", "Break", "Sleep"
];
const DEFAULT_CUSTOM_DAILIES = [
  { n: "Wake up", t: "07:00 AM", d: false },
  { n: "Workout", t: "08:00 AM", d: false },
  { n: "Reading", t: "09:00 AM", d: false },
  { n: "Python", t: "01:00 PM", d: false },
  { n: "Break 15 min", t: "04:00 PM", d: false },
  { n: "Revise", t: "06:00 PM", d: false },
  { n: "Break", t: "09:00 PM", d: false },
  { n: "Sleep", t: "10:30 PM", d: false }
];

// PPL rotation: 0=Push, 1=Pull, 2=Legs, repeats
const PPL_DAYS = ["Push", "Pull", "Legs"];
function getTodayPPL() {
  var dayOfYear = Math.floor((NOW - new Date(CURRENT_YEAR,0,0)) / 86400000);
  return PPL_DAYS[dayOfYear % 3];
}

// === SEMESTER BACKLOGS (Real CU CCF Syllabus) ===
// Sem 3 backlogs
const MATH_SEM3 = {
  dscc3: [
    "Real Number System", "L.U.B & G.L.B", "Archimedean Property", "Density of Rationals", 
    "Neighbourhoods & Limit Points", "Open/Closed Sets", "Bolzano-Weierstrass Theorem",
    "Sequence Bounds", "Monotone Sequences", "Sequence Limits", "Cauchy's Principle",
    "Convergence/Divergence", "Absolute/Conditional Convergence", "Comparison Tests",
    "D'Alembert's Ratio Test", "Cauchy's Root Test", "Kummer/Raabe/Gauss Tests", "Alternating Series & Leibniz Test"
  ],
  dscc4: [
    "Order & Degree of ODE", "Exact ODEs", "Integrating Factors", "Linear & Bernoulli Equations", 
    "Solvable for x, y, p", "Clairaut's Form & Singular Solutions", "Constant Coefficients Equations",
    "Binary Operations", "Properties of Groups", "Abelian Groups", "Permutation & Alternating Groups", 
    "Subgroups & Cyclic Groups", "Cosets & Lagrange's Theorem"
  ],
  sec3:  [
    "LPP Formulation", "Graphical Method", "Convex Sets & Hyperplanes", "Extreme Points", 
    "Standard Form of LPP", "Simplex Method", "Big-M Method",
    "Zero-sum Rectangular Games", "Saddle Points", "Mixed Strategies", "Dominance Principle"
  ]
};
const MATH_SEM3_ALL = [...MATH_SEM3.dscc3, ...MATH_SEM3.dscc4, ...MATH_SEM3.sec3];

// Sem 1 backlogs
const MATH_SEM1 = {
  dscc1: [
    "Higher-order Derivatives", "Leibniz Rule", "L'Hospital's Rule", "Concavity & Inflection", 
    "Asymptotes & Envelopes", "Curve Tracing", "Reduction Formulae", "Arc Length", "Area/Volume of Revolution",
    "2D Rotation of Axes", "Classification of Conics", "Polar Equations of Conics", "3D Lines & Planes", 
    "Angle Between Planes", "Signed Distance", "Vector Analysis Basics"
  ]
};
const MATH_SEM1_ALL = [...MATH_SEM1.dscc1];

let S = {
  dailyMode: "default",
  customDailies: [],
  dailies: Array(DAILIES.length).fill(false),
  mathSem3: Array(MATH_SEM3_ALL.length).fill(false),
  mathSem1: Array(MATH_SEM1_ALL.length).fill(false),
  sem4: { dscc5: [], dscc6: [], dscc7: [], dscc8: [] },
  exercises: [{n:"Push-ups",s:"3x15",done:false},{n:"Pull-ups",s:"3x8",done:false},{n:"Plank",s:"3x60s",done:false}],
  fsVid: 35, pyVid: 23,
  month: Array(MONTH_DAYS).fill(0),
  streak: 0,
  scratchpad: "",
  review: "",
  savedKey: "",
  savedMonth: CURRENT_MONTH,
  aiKey: ""
};

// Debounced save
var _saveTimer = null;
function debouncedSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(function() { saveState(); }, 800);
}

const checkIcon = '<svg viewBox="0 0 12 12"><polyline points="2.5 6 5 8.5 9.5 3.5"/></svg>';

function countDailies() { 
  if (S.dailyMode === "custom") return S.customDailies.filter(function(d){return d.d}).length;
  return S.dailies.filter(Boolean).length; 
}

function autoMarkToday() {
  var idx = TODAY_DAY - 1;
  if (idx >= 0 && idx < MONTH_DAYS) {
    var total = S.dailyMode === "custom" ? Math.max(1, S.customDailies.length) : DAILIES.length;
    var cnt = countDailies();
    S.month[idx] = Math.round(cnt / total * 100);
  }
  renderMonth();
}

function updStats() {
  const cnt = countDailies();
  const total = S.dailyMode === "custom" ? Math.max(1, S.customDailies.length) : DAILIES.length;
  const pct = Math.round(cnt / total * 100);

  document.getElementById("hero-pct").textContent = pct + "%";
  document.getElementById("hero-ring-progress").style.strokeDashoffset = 440 - (pct / 100) * 440;

  document.getElementById("ring-fs").setAttribute("stroke-dasharray", (S.fsVid / 100) * 314 + " 314");
  document.getElementById("ring-py").setAttribute("stroke-dasharray", (S.pyVid / 100) * 226 + " 226");
  var mPct = S.month.filter(function(p) { return p >= 70; }).length / MONTH_DAYS;
  document.getElementById("ring-month").setAttribute("stroke-dasharray", mPct * 138 + " 138");

  document.getElementById("stat-fs").textContent = S.fsVid;
  document.getElementById("stat-py").textContent = S.pyVid;
  document.getElementById("stat-month").textContent = S.month.filter(function(p) { return p >= 70; }).length;

  document.getElementById("fs-slider").value = S.fsVid;
  document.getElementById("py-slider").value = S.pyVid;

  // Streak
  renderStreak();
  // Pending
  renderPending();
  // Review unlock
  renderReview(pct);

  pushToAndroid();
}

function renderDailies() {
  var total = S.dailyMode === "custom" ? S.customDailies.length : DAILIES.length;
  document.getElementById("dailies-count").textContent = countDailies() + "/" + total;
  var h = "";
  
  // Toggle UI
  var defBtn = document.getElementById("mode-default-btn");
  var cusBtn = document.getElementById("mode-custom-btn");
  var cusInput = document.getElementById("custom-dailies-input");
  
  if (defBtn && cusBtn && cusInput) {
    if (S.dailyMode === "custom") {
      defBtn.style.background = "transparent";
      defBtn.style.color = "rgba(255,255,255,0.5)";
      cusBtn.style.background = "#a855f7";
      cusBtn.style.color = "#fff";
      cusInput.style.display = "flex";
    } else {
      defBtn.style.background = "#a855f7";
      defBtn.style.color = "#fff";
      cusBtn.style.background = "transparent";
      cusBtn.style.color = "rgba(255,255,255,0.5)";
      cusInput.style.display = "none";
    }
  }

  if (S.dailyMode === "custom") {
    var dragHandle = '<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" style="width:14px; height:14px; margin-right:8px; cursor:grab; flex-shrink:0;"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>';
    S.customDailies.forEach(function(d, i) {
      var timeHtml = d.t ? '<span style="font-size:10px; color:#a855f7; margin-left:8px; font-variant-numeric:tabular-nums; background:rgba(168,85,247,0.15); padding:2px 6px; border-radius:4px;">' + d.t + '</span>' : '';
      h += '<div class="task-item" draggable="true" ondragstart="cdDragStart(event, ' + i + ')" ondragover="cdDragOver(event)" ondrop="cdDrop(event, ' + i + ')" onclick="togCustomDaily(' + i + ')">' +
        dragHandle +
        '<div class="task-check ' + (d.d ? 'completed' : '') + '">' + (d.d ? checkIcon : '') + '</div>' +
        '<div class="task-info" style="display:flex; align-items:center;"><div class="task-name" style="' + (d.d ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + d.n + '</div>' + timeHtml + '</div>' +
        '<div class="task-delete" onclick="event.stopPropagation();delCustomDaily(' + i + ')">x</div></div>';
    });
    if (S.customDailies.length === 0) {
      h = '<div style="padding:20px; text-align:center; color:rgba(255,255,255,0.4); font-size:12px;">Your custom routine is empty. Add tasks below!</div>';
    }
  } else {
    DAILIES.forEach(function(d, i) {
      var done = S.dailies[i];
      h += '<div class="task-item" onclick="togDaily(' + i + ')">' +
        '<div class="task-check ' + (done ? 'completed' : '') + '">' + (done ? checkIcon : '') + '</div>' +
        '<div class="task-info"><div class="task-name" style="' + (done ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + d + '</div></div></div>';
    });
  }
  document.getElementById("dailies-list").innerHTML = h;
}

function setDailyMode(mode) {
  S.dailyMode = mode;
  renderDailies();
  updStats();
  saveState();
}

function togDaily(i) { S.dailies[i] = !S.dailies[i]; renderDailies(); autoMarkToday(); updStats(); saveState(); }

// Drag and drop handlers
let cdDragIndex = -1;
function cdDragStart(e, i) {
  cdDragIndex = i;
  e.dataTransfer.effectAllowed = "move";
}
function cdDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}
function cdDrop(e, targetIdx) {
  e.preventDefault();
  if (cdDragIndex === -1 || cdDragIndex === targetIdx) return;
  var movedItem = S.customDailies.splice(cdDragIndex, 1)[0];
  S.customDailies.splice(targetIdx, 0, movedItem);
  cdDragIndex = -1;
  renderDailies();
  saveState();
}

function addCustomDaily() {
  var nameEl = document.getElementById("cd-name");
  var timeEl = document.getElementById("cd-time");
  var name = nameEl.value.trim();
  var timeRaw = timeEl.value.trim();
  var time = "";
  
  if (timeRaw) {
    var parts = timeRaw.split(':');
    if (parts.length === 2) {
      var h = parseInt(parts[0], 10);
      var m = parts[1];
      var ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      time = h + ':' + m + ' ' + ampm;
    } else {
      time = timeRaw;
    }
  }

  if (!name) return;
  S.customDailies.push({n: name, t: time, d: false});
  nameEl.value = ""; timeEl.value = "";
  renderDailies(); updStats(); saveState();
}
function togCustomDaily(i) { S.customDailies[i].d = !S.customDailies[i].d; renderDailies(); autoMarkToday(); updStats(); saveState(); }
function delCustomDaily(i) { if (!confirm('Delete "' + S.customDailies[i].n + '"?')) return; S.customDailies.splice(i, 1); renderDailies(); updStats(); saveState(); }

function resetDailies() {
  if (!confirm('Reset all dailies to default? This will overwrite your custom tasks with the default schedule.')) return;
  S.dailies = Array(DAILIES.length).fill(false);
  S.customDailies = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_DAILIES));
  renderDailies(); autoMarkToday(); updStats(); saveState();
}

function renderSem4() {
  var papers = [
    {id: 'dscc5', title: 'DSCC-5 · Theory of Real Functions'},
    {id: 'dscc6', title: 'DSCC-6 · Mechanics I'},
    {id: 'dscc7', title: 'DSCC-7 · Multivariate & PDE'},
    {id: 'dscc8', title: 'DSCC-8 · Group/Ring Theory'}
  ];
  
  var totalTasks = 0;
  var doneTasks = 0;
  var h = "";
  
  papers.forEach(function(p) {
    var tasks = S.sem4[p.id] || [];
    totalTasks += tasks.length;
    var paperDone = 0;
    
    var listH = "";
    tasks.forEach(function(t, i) {
      if (t.d) { doneTasks++; paperDone++; }
      listH += '<div class="task-item" onclick="togSem4(\'' + p.id + '\', ' + i + ')">' +
        '<div class="task-check ' + (t.d ? 'completed' : '') + '">' + (t.d ? checkIcon : '') + '</div>' +
        '<div class="task-info"><div class="task-name" style="' + (t.d ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + t.n + '</div></div>' +
        '<div class="task-delete" onclick="event.stopPropagation();delSem4(\'' + p.id + '\', ' + i + ')">x</div></div>';
    });
    
    h += '<div class="sem4-paper-group" style="margin-bottom:16px;">' +
         '<div class="pill-label" style="display:flex; justify-content:space-between; margin-bottom:8px; color:rgba(255,255,255,0.7);">' + p.title + ' <span style="opacity:0.5">' + paperDone + '/' + tasks.length + '</span></div>' +
         '<div class="sem4-tasks" style="margin-bottom:8px;">' + listH + '</div>' +
         '<div style="display:flex; gap:8px;">' +
           '<input type="text" id="sem-new-' + p.id + '" class="add-task-input" placeholder="Add task..." onkeypress="if(event.key===\'Enter\') addSem4(\'' + p.id + '\')" style="flex:1; margin-top:0; font-size:11px; padding:8px 12px;">' +
           '<button class="add-task-input" style="width:50px; cursor:pointer; background:rgba(255,255,255,0.1); border:none; margin-top:0; padding:8px;" onclick="addSem4(\'' + p.id + '\')">Add</button>' +
         '</div></div>';
  });
  
  document.getElementById("sem4-count").textContent = doneTasks + "/" + totalTasks;
  document.getElementById("sem4-list").innerHTML = h;
}

function togSem4(pId, i) { S.sem4[pId][i].d = !S.sem4[pId][i].d; renderSem4(); updStats(); saveState(); }
function delSem4(pId, i) { if (!confirm('Delete "' + S.sem4[pId][i].n + '"?')) return; S.sem4[pId].splice(i, 1); renderSem4(); updStats(); saveState(); }
function addSem4(pId) {
  var inp = document.getElementById("sem-new-" + pId);
  var v = inp.value.trim();
  if (!v) return;
  if (!S.sem4[pId]) S.sem4[pId] = [];
  S.sem4[pId].push({n: v, d: false});
  inp.value = "";
  renderSem4(); updStats(); saveState();
}

// === SEM 3 BACKLOG RENDERING ===
function renderSem3Group(id, topics, offset) {
  var el = document.getElementById("pills-" + id);
  if (!el) return;
  var h = "";
  topics.forEach(function(t, i) {
    var gi = offset + i;
    var done = S.mathSem3[gi];
    h += '<div class="math-pill ' + (done ? 'completed' : '') + '" onclick="togSem3(' + gi + ')">' + (done ? '✓ ' : '') + t + '</div>';
  });
  el.innerHTML = h;
}
function renderSem3() {
  renderSem3Group("dscc3", MATH_SEM3.dscc3, 0);
  renderSem3Group("dscc4", MATH_SEM3.dscc4, MATH_SEM3.dscc3.length);
  renderSem3Group("sec3", MATH_SEM3.sec3, MATH_SEM3.dscc3.length + MATH_SEM3.dscc4.length);
  // Update progress count
  var done3 = S.mathSem3.filter(Boolean).length;
  var el = document.getElementById("sem3-progress");
  if (el) el.textContent = done3 + '/' + MATH_SEM3_ALL.length + ' topics';
  // Update fluid bubble (horizontal capsule)
  var pct3 = Math.round(done3 / MATH_SEM3_ALL.length * 100);
  var fluidEl = document.getElementById("fluid-sem3");
  if (fluidEl) fluidEl.style.width = pct3 + '%';
  var fluidPct = document.getElementById("fluid-sem3-pct");
  if (fluidPct) fluidPct.textContent = pct3 + '%';
}
function togSem3(i) { S.mathSem3[i] = !S.mathSem3[i]; renderSem3(); updStats(); saveState(); }

// === SEM 1 BACKLOG RENDERING ===
function renderSem1Group(id, topics, offset) {
  var el = document.getElementById("pills-" + id);
  if (!el) return;
  var h = "";
  topics.forEach(function(t, i) {
    var gi = offset + i;
    var done = S.mathSem1[gi];
    h += '<div class="math-pill ' + (done ? 'completed' : '') + '" onclick="togSem1(' + gi + ')">' + (done ? '✓ ' : '') + t + '</div>';
  });
  el.innerHTML = h;
}
function renderSem1() {
  renderSem1Group("dscc1", MATH_SEM1.dscc1, 0);
  var done1 = S.mathSem1.filter(Boolean).length;
  var el = document.getElementById("sem1-progress");
  if (el) el.textContent = done1 + '/' + MATH_SEM1_ALL.length + ' topics';
  // Update fluid bubble (horizontal capsule)
  var pct1 = Math.round(done1 / MATH_SEM1_ALL.length * 100);
  var fluidEl = document.getElementById("fluid-sem1");
  if (fluidEl) fluidEl.style.width = pct1 + '%';
  var fluidPct = document.getElementById("fluid-sem1-pct");
  if (fluidPct) fluidPct.textContent = pct1 + '%';
}
function togSem1(i) { S.mathSem1[i] = !S.mathSem1[i]; renderSem1(); updStats(); saveState(); }

// === COLLAPSIBLE BACKLOG TOGGLE ===
function toggleBacklog(cardId) {
  var card = document.getElementById(cardId);
  if (card) card.classList.toggle('collapsed');
}

function renderEx() {
  var h = "";
  S.exercises.forEach(function(e, i) {
    h += '<div class="task-item" onclick="togEx(' + i + ')">' +
      '<div class="task-check ' + (e.done ? 'completed' : '') + '">' + (e.done ? checkIcon : '') + '</div>' +
      '<div class="task-info"><div class="task-name" style="' + (e.done ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + e.n + '</div>' +
      '<div class="task-meta">' + e.s + '</div></div>' +
      '<div class="task-delete" onclick="event.stopPropagation();delEx(' + i + ')">x</div></div>';
  });
  document.getElementById("ex-list").innerHTML = h;
}
function togEx(i) { S.exercises[i].done = !S.exercises[i].done; renderEx(); updStats(); saveState(); }
function delEx(i) { if (!confirm('Delete "' + S.exercises[i].n + '"?')) return; S.exercises.splice(i, 1); renderEx(); updStats(); saveState(); }
function addEx() {
  var n = document.getElementById("ex-name-in").value.trim();
  var s = document.getElementById("ex-sets-in").value.trim();
  if (!n) return;
  S.exercises.push({ n: n, s: s || "—", done: false });
  document.getElementById("ex-name-in").value = "";
  document.getElementById("ex-sets-in").value = "";
  renderEx(); updStats(); saveState();
}



function getMonthStartDay() {
  // Get the day of week the 1st of the current month falls on (0=Sun...6=Sat)
  var d = new Date(CURRENT_YEAR, CURRENT_MONTH, 1);
  var dow = d.getDay();
  // Convert to Monday-start (Mon=0, Tue=1... Sun=6)
  return dow === 0 ? 6 : dow - 1;
}

function getDayTier(pct) {
  if (pct <= 0) return '';
  if (pct < 40) return 'cal-red';
  if (pct < 70) return 'cal-yellow';
  if (pct < 90) return 'cal-green';
  return 'cal-purple';
}

function getDayTierLabel(pct) {
  if (pct <= 0) return { text: '0% \u2014 No Activity', cls: 'tier-none' };
  if (pct < 40) return { text: pct + '% \u2014 Needs Work', cls: 'tier-red' };
  if (pct < 70) return { text: pct + '% \u2014 Okay Day', cls: 'tier-yellow' };
  if (pct < 90) return { text: pct + '% \u2014 Good Day', cls: 'tier-green' };
  return { text: pct + '% \u2014 Perfect Day!', cls: 'tier-purple' };
}

function renderMonth() {
  // Update title
  var titleEl = document.getElementById('cal-month-title');
  if (titleEl) titleEl.textContent = MONTH_NAME + ' ' + CURRENT_YEAR;
  
  var startDay = getMonthStartDay();
  var h = '';
  
  // Add empty spacers for days before the 1st
  for (var s = 0; s < startDay; s++) {
    h += '<div class="cal-empty"></div>';
  }
  
  // Add day cells
  S.month.forEach(function(pct, i) {
    var dayNum = i + 1;
    var isToday = dayNum === TODAY_DAY;
    var isFuture = dayNum > TODAY_DAY;
    var tier = getDayTier(pct);
    
    var classes = 'cal-day';
    if (tier) classes += ' ' + tier;
    if (isToday) classes += ' cal-today';
    if (isFuture) classes += ' cal-future';
    
    var clickHandler = isFuture ? '' : ' onclick="openDayDetail(' + i + ')"';
    
    h += '<div class="' + classes + '"' + clickHandler + '>' +
      '<span class="cal-day-num">' + dayNum + '</span>' +
      '<span class="cal-dot"></span>' +
      '</div>';
  });
  
  document.getElementById('mgrid').innerHTML = h;
  
  // Update stats
  var productiveDays = S.month.filter(function(p) { return p >= 70; }).length;
  var statsEl = document.getElementById('cal-stats');
  if (statsEl) statsEl.textContent = productiveDays + ' productive day' + (productiveDays !== 1 ? 's' : '');
}

function openDayDetail(idx) {
  var pct = S.month[idx] || 0;
  var dayNum = idx + 1;
  var dateObj = new Date(CURRENT_YEAR, CURRENT_MONTH, dayNum);
  var dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  var tierInfo = getDayTierLabel(pct);
  
  document.getElementById('cal-modal-date').textContent = dateStr;
  
  var scoreEl = document.getElementById('cal-modal-score');
  scoreEl.textContent = tierInfo.text;
  scoreEl.className = 'cal-modal-score ' + tierInfo.cls;
  
  document.getElementById('cal-modal-bar').style.width = pct + '%';
  
  // Summary text
  var summary = '';
  if (dayNum === TODAY_DAY) {
    var total = S.dailyMode === 'custom' ? Math.max(1, S.customDailies.length) : DAILIES.length;
    var done = countDailies();
    var listHTML = '<ul style="margin:8px 0; padding-left:20px; list-style:none;">';
    
    if (S.dailyMode === 'custom') {
      S.customDailies.forEach(function(d) {
        listHTML += '<li>' + (d.d ? '✅' : '❌') + ' ' + d.n + '</li>';
      });
    } else {
      DAILIES.forEach(function(d, idx) {
        listHTML += '<li>' + (S.dailies[idx] ? '✅' : '❌') + ' ' + d.n + '</li>';
      });
    }
    listHTML += '</ul>';
    
    summary = 'Today: ' + done + '/' + total + ' dailies completed.<br>' + listHTML;
  } else if (pct > 0) {
    summary = 'You achieved ' + pct + '% of your daily goals.';
  } else {
    summary = 'No activity was recorded for this day.';
  }
  document.getElementById('cal-modal-summary').innerHTML = summary;
  
  document.getElementById('cal-modal-overlay').classList.add('active');
}

function closeDayDetail(e) {
  if (e && e.target && e.target.id === 'cal-modal-overlay') {
    document.getElementById('cal-modal-overlay').classList.remove('active');
    return;
  }
  if (!e) {
    document.getElementById('cal-modal-overlay').classList.remove('active');
  }
}

function togMonth(i) { S.month[i] = S.month[i] > 0 ? 0 : 100; renderMonth(); updStats(); saveState(); }

function updV(id, v) {
  S[id + "Vid"] = parseInt(v);
  updStats(); saveState();
}

// ── STREAK ──
function renderStreak() {
  var badge = document.getElementById("streak-badge");
  var countEl = document.getElementById("streak-count");
  if (S.streak > 0) {
    badge.style.display = "inline-block";
    countEl.textContent = S.streak;
  } else {
    badge.style.display = "none";
  }
}
function calcStreak() {
  // Count consecutive productive days ending at today
  var streak = 0;
  var idx = Math.min(TODAY_DAY - 1, S.month.length - 1);
  for (var i = idx; i >= 0; i--) {
    if (S.month[i]) streak++;
    else break;
  }
  S.streak = streak;
}

// ── PENDING BANNER ──
function renderPending() {
  var items = [];
  DAILIES.forEach(function(d, i) { if (!S.dailies[i]) items.push(d); });
  S.sem.forEach(function(t, i) { if (!S.semD[i]) items.push(t); });
  S.exercises.forEach(function(e) { if (!e.done) items.push(e.n); });
  var banner = document.getElementById("pending-banner");
  var list = document.getElementById("pending-list");
  var count = document.getElementById("pending-count");
  if (items.length === 0) {
    banner.style.display = "none";
    return;
  }
  banner.style.display = "block";
  count.textContent = items.length + " left";
  var h = "";
  var show = items.slice(0, 8);
  show.forEach(function(t) {
    h += '<div class="pending-pill">' + t + '</div>';
  });
  if (items.length > 8) h += '<div class="pending-pill">+' + (items.length - 8) + ' more</div>';
  list.innerHTML = h;
}

// ── SCRATCHPAD ──
function initScratchpad() {
  var el = document.getElementById("scratchpad");
  el.value = S.scratchpad || "";
  el.addEventListener("input", function() {
    S.scratchpad = el.value;
    debouncedSave();
  });
}

// ── END-OF-DAY REVIEW ──
function renderReview(pct) {
  var inner = document.getElementById("review-inner");
  var msg = document.getElementById("review-lock-msg");
  var textarea = document.getElementById("review-text");
  if (pct >= 100) {
    inner.className = "tasks-inner review-unlocked";
    msg.textContent = "\u2705 Unlocked! Write your review.";
    textarea.disabled = false;
  } else {
    inner.className = "tasks-inner review-locked";
    msg.textContent = "Complete 100% dailies to unlock (" + pct + "%)";
    textarea.disabled = true;
  }
  textarea.value = S.review || "";
}
function initReview() {
  var el = document.getElementById("review-text");
  el.addEventListener("input", function() {
    S.review = el.value;
    debouncedSave();
  });
}

// ── BACKUP EXPORT / IMPORT ──
function exportBackup() {
  var data = JSON.stringify(S, null, 2);
  var blob = new Blob([data], {type: "application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "rudranil-backup-" + TODAY_KEY + ".json";
  a.click();
  URL.revokeObjectURL(url);
  var st = document.getElementById("sync-st");
  st.textContent = "Exported!";
  st.style.color = "#6366f1";
  setTimeout(function() { st.textContent = ""; }, 2000);
}
function importBackup(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var loaded = JSON.parse(e.target.result);
      if (!loaded.dailies) throw new Error("Invalid backup");
      for (var key in loaded) { S[key] = loaded[key]; }
      renderAll();
      saveState();
      var st = document.getElementById("sync-st");
      st.textContent = "Imported!";
      st.style.color = "#2ecc40";
      setTimeout(function() { st.textContent = ""; }, 2000);
    } catch(err) {
      var st = document.getElementById("sync-st");
      st.textContent = "Invalid file";
      st.style.color = "#ff4757";
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function pushToAndroid() {
  try {
    var dailiesDone = countDailies();
    var dailiesTotal = DAILIES.length;
    var semLeft = S.semD.filter(function(d) { return !d; }).length;
    var exLeft = S.exercises.filter(function(e) { return !e.done; }).length;
    var affLeft = S.affD.filter(function(d) { return !d; }).length;
    var tasksLeft = semLeft + exLeft + affLeft + (dailiesTotal - dailiesDone);
    var data = { fsPercent: S.fsVid, pyPercent: S.pyVid, dailiesDone: dailiesDone, dailiesTotal: dailiesTotal, tasksLeft: tasksLeft };
    if (typeof AndroidBridge !== "undefined" && AndroidBridge.updateMetrics) {
      AndroidBridge.updateMetrics(JSON.stringify(data));
    }
  } catch(e) {}
}

function saveState() {
  var st = document.getElementById("sync-st");
  S.savedKey = TODAY_KEY;
  S.savedMonth = CURRENT_MONTH;
  try {
    localStorage.setItem("rudranil-v7", JSON.stringify(S));
    st.textContent = "Synced";
    st.style.color = "#2ecc40";
    setTimeout(function() { st.textContent = ""; }, 2000);
  } catch(e) {
    st.textContent = "Error";
    st.style.color = "#ff4757";
  }
}

function renderAll() {
  renderDailies(); renderSem3(); renderSem1(); renderSem4(); renderEx(); renderMonth();
  renderPPLIndicator();
  calcStreak(); updStats();
  document.getElementById("scratchpad").value = S.scratchpad || "";
  document.getElementById("review-text").value = S.review || "";
}

// === PPL Workout Day Indicator ===
function renderPPLIndicator() {
  var el = document.getElementById("ppl-day-label");
  if (el) el.textContent = "Today: " + getTodayPPL() + " Day + Abs";
}

// === MINI GEMINI AI ===
const GEMINI_KEY = "AIzaSyB1QaBA1uSXjq7sc6oxiZ1NWz5hmeE94vk";
let aiHistory = [];

function toggleAISetup() {
  var area = document.getElementById("ai-setup-area");
  area.style.display = area.style.display === "none" ? "flex" : "none";
  if (S.aiKey) document.getElementById("ai-key-input").value = S.aiKey;
}

function saveAIKey() {
  var val = document.getElementById("ai-key-input").value.trim();
  S.aiKey = val;
  debouncedSave();
  toggleAISetup();
}

function initAI() {
  updateAIStatus();
}

function updateAIStatus() {
  var dot = document.getElementById("ai-dot");
  var text = document.getElementById("ai-status-text");
  if (!dot || !text) return;
  if (!navigator.onLine) {
    dot.className = "ai-status-dot";
    text.textContent = "offline";
  } else {
    dot.className = "ai-status-dot online";
    text.textContent = "online";
  }
}
window.addEventListener('online', updateAIStatus);
window.addEventListener('offline', updateAIStatus);

function renderAIMessage(role, text) {
  var msgs = document.getElementById("ai-messages");
  var div = document.createElement("div");
  div.className = "ai-msg " + (role === "user" ? "ai-msg-user" : "ai-msg-ai");
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendAI() {
  var inp = document.getElementById("ai-input");
  var msg = inp.value.trim();
  var keyToUse = S.aiKey || GEMINI_KEY;
  
  if (!msg) return;
  if (!keyToUse) {
    renderAIMessage("ai", "API Key missing. Please open Settings (⚙) and add your Gemini API Key.");
    return;
  }
  
  inp.value = "";
  renderAIMessage("user", msg);
  
  var dot = document.getElementById("ai-dot");
  var text = document.getElementById("ai-status-text");
  dot.className = "ai-status-dot typing";
  text.textContent = "thinking...";
  
  aiHistory.push({role: "user", parts: [{text: msg}]});
  
  try {
    var currentList = S.exercises.map(function(e) { return e.n + " (" + e.s + ")"; }).join(", ");
    if (!currentList) currentList = "Empty";
    
    var reqBody = {
      contents: aiHistory,
      systemInstruction: {
        parts: [{text: "You are Rudranil's productivity AI assistant. \nHis current workout list contains: " + currentList + ".\nHis 4th Sem tasks are: " + JSON.stringify(S.sem4) + "\nTo modify his workout, output JSON: ```json [{\"action\":\"add\", \"name\":\"Squats\", \"sets\":\"3x10\"}, {\"action\":\"delete\", \"name\":\"Push-ups\"}] ```.\nTo add a 4th sem task, output JSON: ```json [{\"action\":\"add_sem4\", \"paper\":\"dscc5\", \"name\":\"Read chapter 1\"}] ``` (Papers available: dscc5, dscc6, dscc7, dscc8).\nOnly output JSON if modifying state. Keep regular text replies under 2 sentences."}]
      }
    };
    
    var res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + keyToUse, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(reqBody)
    });
    
    if (!res.ok) {
      var errData = await res.json();
      console.error("Gemini API Error Data:", errData);
      throw new Error(errData.error && errData.error.message ? errData.error.message : "API Key Error or Rate Limit Exceeded.");
    }
    var data = await res.json();
    var replyText = data.candidates[0].content.parts[0].text;
    
    // Parse actions
    var jsonMatch = replyText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        var actions = JSON.parse(jsonMatch[1]);
        var changed = false;
        actions.forEach(function(a) {
          if (a.action === "add") {
            S.exercises.push({n: a.name, s: a.sets || "—", done: false});
            changed = true;
          } else if (a.action === "delete") {
            var idx = S.exercises.findIndex(function(e) { return e.n.toLowerCase() === a.name.toLowerCase(); });
            if (idx > -1) { S.exercises.splice(idx, 1); changed = true; }
          } else if (a.action === "add_sem4") {
            if (S.sem4[a.paper]) {
              S.sem4[a.paper].push({n: a.name, d: false});
              changed = true;
            }
          }
        });
        if (changed) { renderEx(); renderSem4(); updStats(); saveState(); }
      } catch(e) {}
      replyText = replyText.replace(/```json\s*([\s\S]*?)\s*```/, "").trim();
    }
    
    if (replyText) {
      renderAIMessage("model", replyText);
      aiHistory.push({role: "model", parts: [{text: replyText}]});
    }
  } catch(err) {
    console.error("AI Request Failed:", err);
    renderAIMessage("model", "API Error: " + err.message + ". Check console for details.");
    aiHistory.pop(); // Remove user message from history on error
  }
  
  updateAIStatus();
}

function loadState() {
  try {
    var json = localStorage.getItem("rudranil-v7");
    if (json) {
      var loaded = JSON.parse(json);
      if (loaded.savedKey && loaded.savedKey !== TODAY_KEY) {
        // New day: reset only dailies, exercises, and review — NOT sem tasks or affiliates
        loaded.dailies = Array(DAILIES.length).fill(false);
        loaded.review = "";
        if (loaded.exercises) loaded.exercises = loaded.exercises.map(function(e) { return {n:e.n, s:e.s, done:false}; });
        if (loaded.customDailies) loaded.customDailies = loaded.customDailies.map(function(d) { return {n:d.n, t:d.t, d:false}; });
      }
      // Handle month rollover
      var savedMonth = loaded.savedMonth;
      if (savedMonth !== undefined && savedMonth !== CURRENT_MONTH) {
        loaded.month = Array(MONTH_DAYS).fill(0);
      }
      if (!loaded.exercises) loaded.exercises = S.exercises;
      if (typeof loaded.streak === 'undefined') loaded.streak = 0;
      if (typeof loaded.scratchpad === 'undefined') loaded.scratchpad = "";
      if (typeof loaded.review === 'undefined') loaded.review = "";
      if (typeof loaded.aiKey === 'undefined') loaded.aiKey = "";
      // Ensure month array matches current month length
      if (!loaded.month || loaded.month.length !== MONTH_DAYS) {
        loaded.month = Array(MONTH_DAYS).fill(0);
      }
      // Migrate boolean month data to percentage (old format: true/false → new: 0-100)
      if (loaded.month && loaded.month.length > 0 && typeof loaded.month[0] === 'boolean') {
        loaded.month = loaded.month.map(function(v) { return v ? 100 : 0; });
      }
      // Ensure sem3/sem1 backlog arrays exist
      if (!loaded.mathSem3) loaded.mathSem3 = Array(MATH_SEM3_ALL.length).fill(false);
      if (!loaded.mathSem1) loaded.mathSem1 = Array(MATH_SEM1_ALL.length).fill(false);
      
      // Migrate sem to sem4 if necessary
      if (!loaded.sem4) {
        loaded.sem4 = { dscc5: [], dscc6: [], dscc7: [], dscc8: [] };
      }
      
      // Ensure dailies array length matches current DAILIES (handles new tasks added)
      if (loaded.dailies && loaded.dailies.length !== DAILIES.length) {
        var newDailies = Array(DAILIES.length).fill(false);
        for(var i=0; i<Math.min(loaded.dailies.length, DAILIES.length); i++) {
          newDailies[i] = loaded.dailies[i];
        }
        loaded.dailies = newDailies;
      }
      
      if (!loaded.dailyMode) loaded.dailyMode = "default";
      if (!loaded.customDailies || loaded.customDailies.length === 0 || loaded.customDailies[0].n === "Wake up on time") {
        // Initialize custom dailies with default DAILIES
        loaded.customDailies = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_DAILIES));
      }
      
      for (var key in loaded) { S[key] = loaded[key]; }
    }
  } catch(e) {}
  renderAll();
  initScratchpad();
  initReview();
  initAI();
}

loadState();
