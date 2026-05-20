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
  { n: "Sem 4 Class 1", t: "10:30 AM", d: false },
  { n: "Sem 4 Class 2", t: "12:30 PM", d: false },
  { n: "Sem 3 Backlog", t: "02:30 PM", d: false },
  { n: "Workout", t: "04:00 PM", d: false },
  { n: "Coding Session", t: "06:00 PM", d: false },
  { n: "Reading", t: "09:00 PM", d: false },
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
  lastModified: 0,
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
  aiKey: "",
  firebaseUrl: "https://rudranil-exe-default-rtdb.firebaseio.com",
  firebaseKey: "AIzaSyAZAxQrfX8d36MMaTZrKcJAYuS9n8HLdQ",
  history: {},
  sem4ExamDate: "2026-06-15",
  sem3ExamDate: "2027-01-15",
  topicOfDayIndex: 0,
  lastTopicDate: "",
  lastBriefDate: "",
  lastReportDate: "",
  insight: "",
  weeklyReport: "",
  dsccWatched: {dscc5:0, dscc6:2, dscc7:0, dscc8:0},
  dsccTotal: {dscc5:8, dscc6:7, dscc7:12, dscc8:6},
  aiHistory: []
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
  if (mode === "custom" && (!S.customDailies || S.customDailies.length === 0)) {
    S.customDailies = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_DAILIES));
  }
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

function getMostBehindPaper() {
  var papers = ['dscc5', 'dscc6', 'dscc7', 'dscc8'];
  var minPct = 100;
  var behindId = null;
  
  papers.forEach(function(id) {
    var watched = S.dsccWatched[id] || 0;
    var total = S.dsccTotal[id] || 1;
    var pct = (watched / total) * 100;
    if (pct < 100 && pct < minPct) {
      minPct = pct;
      behindId = id;
    } else if (pct < 100 && pct === minPct && behindId) {
      var unwatchedCurr = total - watched;
      var unwatchedMin = S.dsccTotal[behindId] - S.dsccWatched[behindId];
      if (unwatchedCurr > unwatchedMin) {
        behindId = id;
      }
    }
  });
  
  return behindId;
}

function renderSem4() {
  var papers = [
    {id: 'dscc5', title: 'DSCC-5 · Theory of Real Functions'},
    {id: 'dscc6', title: 'DSCC-6 · Mechanics I'},
    {id: 'dscc7', title: 'DSCC-7 · Multivariate & PDE'},
    {id: 'dscc8', title: 'DSCC-8 · Group/Ring Theory'}
  ];
  
  var behindId = getMostBehindPaper();
  var h = "";
  
  var totalWatched = 0;
  var totalClasses = 0;
  
  papers.forEach(function(p) {
    var watched = S.dsccWatched[p.id] || 0;
    var total = S.dsccTotal[p.id] || 1;
    totalWatched += watched;
    totalClasses += total;
    
    var pct = Math.round((watched / total) * 100);
    var isBehind = (p.id === behindId);
    
    var cardStyle = isBehind ? 'border: 1px solid rgba(255, 71, 87, 0.4); background: rgba(255, 71, 87, 0.05);' : 'border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.15);';
    var textStyle = isBehind ? 'color: #ff4757; font-weight: bold;' : 'color: rgba(255,255,255,0.85);';
    var barColor = isBehind ? 'background: linear-gradient(90deg, #ff4757, #ff6b81);' : 'background: linear-gradient(90deg, #a855f7, #7c3aed);';
    
    h += '<div class="sem4-paper-item" style="padding:14px; border-radius:12px; margin-bottom:12px; transition: all 0.3s; ' + cardStyle + '">' +
           '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
             '<span style="font-size:12px; ' + textStyle + '">' + p.title + '</span>' +
             '<span style="font-size:12px; font-weight:700; color:#fff;">' + watched + '/' + total + '</span>' +
           '</div>' +
           '<div style="display:flex; align-items:center; gap:12px;">' +
             '<div style="flex:1; height:8px; border-radius:4px; background:rgba(255,255,255,0.06); overflow:hidden;">' +
               '<div style="height:100%; width:' + pct + '%; ' + barColor + ' transition: width 0.3s ease;"></div>' +
             '</div>' +
              '<div style="display:flex; gap:6px;">' +
               '<button ' +
                 'onmousedown="startHoldDsccTotal(\'' + p.id + '\', -1)" ' +
                 'onmouseup="cancelHoldDsccTotal()" ' +
                 'onmouseleave="cancelHoldDsccTotal()" ' +
                 'ontouchstart="startHoldDsccTotal(\'' + p.id + '\', -1)" ' +
                 'ontouchend="cancelHoldDsccTotal()" ' +
                 'ontouchcancel="cancelHoldDsccTotal()" ' +
                 'onclick="handleDsccClick(\'' + p.id + '\', -1)" ' +
                 'style="width:28px; height:28px; border-radius:8px; border:none; background:rgba(255,255,255,0.08); color:#fff; font-weight:bold; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; transition:background 0.2s;">−</button>' +
               '<button ' +
                 'onmousedown="startHoldDsccTotal(\'' + p.id + '\', 1)" ' +
                 'onmouseup="cancelHoldDsccTotal()" ' +
                 'onmouseleave="cancelHoldDsccTotal()" ' +
                 'ontouchstart="startHoldDsccTotal(\'' + p.id + '\', 1)" ' +
                 'ontouchend="cancelHoldDsccTotal()" ' +
                 'ontouchcancel="cancelHoldDsccTotal()" ' +
                 'onclick="handleDsccClick(\'' + p.id + '\', 1)" ' +
                 'style="width:28px; height:28px; border-radius:8px; border:none; background:rgba(168,85,247,0.2); border:1px solid rgba(168,85,247,0.3); color:#e0c3fc; font-weight:bold; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; transition:background 0.2s;">+</button>' +
             '</div>' +
           '</div>' +
         '</div>';
  });
  
  var totalProgressPct = totalClasses > 0 ? Math.round((totalWatched / totalClasses) * 100) : 0;
  document.getElementById("sem4-count").textContent = totalWatched + "/" + totalClasses + " (" + totalProgressPct + "%)";
  document.getElementById("sem4-list").innerHTML = h;
}

function changeDscc(id, diff) {
  var curr = S.dsccWatched[id] || 0;
  var total = S.dsccTotal[id] || 1;
  var newVal = curr + diff;
  if (newVal >= 0 && newVal <= total) {
    S.dsccWatched[id] = newVal;
    renderSem4();
    updStats();
    debouncedSave();
  }
}

let holdTimer = null;
let longPressFired = false;

function startHoldDsccTotal(id, delta) {
  longPressFired = false;
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = setTimeout(function() {
    longPressFired = true;
    changeDsccTotal(id, delta);
    if (navigator.vibrate) navigator.vibrate(50);
  }, 600);
}

function cancelHoldDsccTotal() {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
}

function handleDsccClick(id, delta) {
  if (longPressFired) {
    longPressFired = false;
    return;
  }
  changeDscc(id, delta);
}

function changeDsccTotal(id, delta) {
  var curr = S.dsccTotal[id] || 1;
  var newVal = curr + delta;
  if (newVal >= 1) { // Total shouldn't go below 1
    S.dsccTotal[id] = newVal;
    
    // Ensure watched doesn't exceed new total
    if ((S.dsccWatched[id] || 0) > newVal) {
      S.dsccWatched[id] = newVal;
    }
    
    renderSem4();
    updStats();
    debouncedSave();
  }
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
function togSem3(i) { S.mathSem3[i] = !S.mathSem3[i]; renderSem3(); updStats(); checkTopicOfDay(true); saveState(); }

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
  renderCalView();
}

function openDayDetail(idx) {
  openCalDayDetail(idx + 1, CURRENT_MONTH, CURRENT_YEAR);
}
  
function closeDayDetail(e) {
  if (e && e.target && e.target.id === 'cal-modal-overlay') {
    document.getElementById('cal-modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
    return;
  }
  if (!e) {
    document.getElementById('cal-modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
  }
}

// === ANALYTICS & AI ===
function openAnalytics() {
  document.getElementById('analytics-modal-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  generateWeeklyReport(false);
}

function closeAnalytics(e) {
  if (e && e.target && e.target.id === 'analytics-modal-overlay') {
    document.getElementById('analytics-modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
    return;
  }
  if (!e) {
    document.getElementById('analytics-modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
  }
}

function renderAnalytics() {
  // Get last 7 days keys
  var keys = [];
  var today = new Date(CURRENT_YEAR, CURRENT_MONTH, TODAY_DAY);
  for (var i=6; i>=0; i--) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var key = "rd-v7-" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    var label = d.toLocaleDateString('en-US', {weekday:'short'});
    keys.push({key: key, label: label, dateObj: d});
  }
  
  var barsH = "";
  var labelsH = "";
  var sumPct = 0;
  var validDays = 0;
  var streakCount = 0;
  
  keys.forEach(function(k) {
    var pct = 0;
    if (k.key === TODAY_KEY) {
      // Use current live state for today
      var cnt = countDailies();
      var total = S.dailyMode === "custom" ? Math.max(1, S.customDailies.length) : DAILIES.length;
      pct = Math.round((cnt / total) * 100);
    } else {
      var hist = S.history ? S.history[k.key] : null;
      if (hist) {
        pct = hist.pct || 0;
      } else {
        // Fallback to month array if in current month
        if (k.dateObj.getMonth() === CURRENT_MONTH && k.dateObj.getFullYear() === CURRENT_YEAR) {
          pct = S.month[k.dateObj.getDate() - 1] || 0;
        }
      }
    }
    
    sumPct += pct;
    validDays++;
    if (pct >= 70) streakCount++;
    
    var h = Math.max(5, pct) + "%"; // min height 5% for visibility
    barsH += '<div class="chart-bar-col"><div class="chart-bar-fill" style="height:' + h + '"></div></div>';
    labelsH += '<div class="chart-label">' + k.label + '</div>';
  });
  
  document.getElementById('analytics-bars').innerHTML = barsH;
  document.getElementById('analytics-labels').innerHTML = labelsH;
  document.getElementById('an-avg').textContent = Math.round(sumPct / validDays) + "%";
  document.getElementById('an-streak').textContent = streakCount;
  
  document.getElementById('ai-report-content').innerHTML = 'Click "Analyze Week" to have Gemini read your last 7 days of reviews and stats to generate insights.';
  document.getElementById('btn-gen-report').disabled = false;
  document.getElementById('btn-gen-report').textContent = "Analyze Week";
}

async function generateAIReport() {
  var keyToUse = S.aiKey || GEMINI_KEY;
  if (!keyToUse) {
    document.getElementById('ai-report-content').innerHTML = '<span style="color:#ff4757">API Key missing. Add it in Settings.</span>';
    return;
  }
  
  var btn = document.getElementById('btn-gen-report');
  btn.disabled = true;
  btn.textContent = "Analyzing...";
  
  var out = document.getElementById('ai-report-content');
  out.innerHTML = '<div style="display:flex; justify-content:center; padding:20px;"><div class="ai-status-dot typing" style="width:8px;height:8px;"></div><span style="margin-left:8px; color:#a855f7; font-weight:600;">Gemini is reading your history...</span></div>';
  
  // Gather last 7 days data
  var historyLog = "LAST 7 DAYS OF LOGS:\n\n";
  var today = new Date(CURRENT_YEAR, CURRENT_MONTH, TODAY_DAY);
  for (var i=6; i>=0; i--) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var key = "rd-v7-" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    
    var pct = 0;
    var review = "None";
    if (key === TODAY_KEY) {
      var cnt = countDailies();
      var total = S.dailyMode === "custom" ? Math.max(1, S.customDailies.length) : DAILIES.length;
      pct = Math.round((cnt / total) * 100);
      review = S.review || "None";
    } else {
      var hist = S.history ? S.history[key] : null;
      if (hist) {
        pct = hist.pct || 0;
        review = hist.review || "None";
      }
    }
    historyLog += "Date: " + d.toDateString() + "\nProductivity Score: " + pct + "%\nEnd of Day Review: " + review + "\n---\n";
  }
  
  try {
    var reqBody = {
      contents: [{role: "user", parts: [{text: "Analyze this week's productivity data and end-of-day reviews. Write a short, motivating 'Weekly Report Card' (max 3 short paragraphs). Point out trends, what went well, what failed, and give a strategy for next week. Use markdown bolding for emphasis, but NO markdown headers (#).\n\n" + historyLog}]}],
    };
    
    var res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + keyToUse, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(reqBody)
    });
    
    if (!res.ok) throw new Error("API Error");
    var data = await res.json();
    var text = data.candidates[0].content.parts[0].text;
    
    // Format markdown bold to HTML
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff">$1</strong>');
    text = text.replace(/\n\n/g, '<br><br>');
    text = text.replace(/\n/g, '<br>');
    
    out.innerHTML = text;
    btn.textContent = "Analyzed";
  } catch(e) {
    out.innerHTML = '<span style="color:#ff4757">Failed to generate report. Check connection or API key.</span>';
    btn.disabled = false;
    btn.textContent = "Try Again";
  }
}

function togMonth(i) { S.month[i] = S.month[i] > 0 ? 0 : 100; renderMonth(); updStats(); saveState(); }

function updV(id, v) {
  S[id + "Vid"] = parseInt(v);
  updStats(); saveState();
}

// ── STREAK ENGINE ──
function calcStreak() {
  if (!S.history) { S.streak = 0; return; }
  var streak = 0;
  var d = new Date(CURRENT_YEAR, CURRENT_MONTH, TODAY_DAY);
  d.setDate(d.getDate() - 1);
  for (var i = 0; i < 365; i++) {
    var key = "rd-v7-" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    var h = S.history[key];
    if (h && h.pct >= 70) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  var cnt = countDailies();
  var total = S.dailyMode === "custom" ? Math.max(1, S.customDailies.length) : DAILIES.length;
  if (Math.round((cnt / total) * 100) >= 70) streak++;
  S.streak = streak;
}
function renderStreak() {
  var el = document.getElementById("hero-sub");
  if (!el) return;
  if (S.streak > 0) {
    var emoji = S.streak >= 30 ? "💎" : S.streak >= 7 ? "🔥" : "⚡";
    el.textContent = emoji + " " + S.streak + " day streak";
  } else {
    el.textContent = "completed";
  }
}

// ── PENDING BANNER ──
function renderPending() {
  var items = [];
  if (S.dailyMode === "custom") {
    S.customDailies.forEach(function(d) { if (!d.d) items.push(d.n); });
  } else {
    DAILIES.forEach(function(d, i) { if (!S.dailies[i]) items.push(d); });
  }
  if (S.sem && S.semD) S.sem.forEach(function(t, i) { if (!S.semD[i]) items.push(t); });
  if (S.exercises) S.exercises.forEach(function(e) { if (!e.done) items.push(e.n); });
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

function saveReviewOnly() {
  if (!S.history) S.history = {};
  var cnt = countDailies();
  var total = S.dailyMode === "custom" ? Math.max(1, S.customDailies.length) : DAILIES.length;
  var pct = Math.round((cnt / total) * 100);
  
  S.history[TODAY_KEY] = {
    pct: pct,
    review: S.review || "",
    scratchpad: S.scratchpad || "",
    fsVid: S.fsVid,
    pyVid: S.pyVid,
    exercises: JSON.parse(JSON.stringify(S.exercises || [])),
    dailyMode: S.dailyMode,
    dailies: S.dailyMode === "custom" ? JSON.parse(JSON.stringify(S.customDailies || [])) : JSON.parse(JSON.stringify(S.dailies || [])),
    mathSem3: JSON.parse(JSON.stringify(S.mathSem3 || [])),
    mathSem1: JSON.parse(JSON.stringify(S.mathSem1 || [])),
    sem4: JSON.parse(JSON.stringify(S.sem4 || {})),
    dsccWatched: JSON.parse(JSON.stringify(S.dsccWatched || {dscc5:0, dscc6:2, dscc7:0, dscc8:0})),
    dsccTotal: JSON.parse(JSON.stringify(S.dsccTotal || {dscc5:8, dscc6:7, dscc7:12, dscc8:6}))
  };
  
  // Directly save to localStorage and trigger sync debounce
  try {
    localStorage.setItem("rudranil-v7", JSON.stringify(S));
    if (S.firebaseUrl) {
      debouncedSave();
    }
  } catch(e) {}
}

// ── SCRATCHPAD ──
function initScratchpad() {
  var el = document.getElementById("scratchpad");
  el.value = S.scratchpad || "";
  el.addEventListener("input", function() {
    S.scratchpad = el.value;
    saveReviewOnly();
  });
}

// ── END-OF-DAY REVIEW ──
function renderReview(pct) {
  var inner = document.getElementById("review-inner");
  var msg = document.getElementById("review-lock-msg");
  var textarea = document.getElementById("review-text");
  var hour = new Date().getHours();
  if (pct >= 50 || hour >= 20) {
    inner.className = "tasks-inner review-unlocked";
    msg.textContent = (hour >= 20 && pct < 50) ? "🌙 Evening unlock. Reflect on your day." : "✅ Unlocked! Write your review.";
    textarea.disabled = false;
  } else {
    inner.className = "tasks-inner review-locked";
    msg.textContent = "Complete 50% dailies to unlock (" + pct + "%)";
    textarea.disabled = true;
  }
  textarea.value = S.review || "";
}
function initReview() {
  var el = document.getElementById("review-text");
  el.addEventListener("input", function() {
    S.review = el.value;
    saveReviewOnly();
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
    var dailiesTotal = S.dailyMode === "custom" ? Math.max(1, S.customDailies.length) : DAILIES.length;
    var exLeft = S.exercises ? S.exercises.filter(function(e) { return !e.done; }).length : 0;
    var tasksLeft = exLeft + (dailiesTotal - dailiesDone);
    var data = { fsPercent: S.fsVid, pyPercent: S.pyVid, dailiesDone: dailiesDone, dailiesTotal: dailiesTotal, tasksLeft: tasksLeft, streak: S.streak || 0 };
    if (typeof AndroidBridge !== "undefined" && AndroidBridge.updateMetrics) {
      AndroidBridge.updateMetrics(JSON.stringify(data));
    }
  } catch(e) {}
}

function saveState(skipCloud) {
  var st = document.getElementById("sync-st");
  S.savedKey = TODAY_KEY;
  S.savedMonth = CURRENT_MONTH;
  S.lastModified = Date.now();
  
  // Track history for today — COMPLETE diary snapshot
  if (!S.history) S.history = {};
  var cnt = countDailies();
  var total = S.dailyMode === "custom" ? Math.max(1, S.customDailies.length) : DAILIES.length;
  S.history[TODAY_KEY] = {
    pct: Math.round((cnt / total) * 100),
    review: S.review || "",
    scratchpad: S.scratchpad || "",
    fsVid: S.fsVid,
    pyVid: S.pyVid,
    exercises: JSON.parse(JSON.stringify(S.exercises || [])),
    dailyMode: S.dailyMode,
    dailies: S.dailyMode === "custom" ? JSON.parse(JSON.stringify(S.customDailies || [])) : JSON.parse(JSON.stringify(S.dailies || [])),
    mathSem3: JSON.parse(JSON.stringify(S.mathSem3 || [])),
    mathSem1: JSON.parse(JSON.stringify(S.mathSem1 || [])),
    sem4: JSON.parse(JSON.stringify(S.sem4 || {})),
    dsccWatched: JSON.parse(JSON.stringify(S.dsccWatched || {dscc5:0, dscc6:2, dscc7:0, dscc8:0})),
    dsccTotal: JSON.parse(JSON.stringify(S.dsccTotal || {dscc5:8, dscc6:7, dscc7:12, dscc8:6}))
  };

  try {
    localStorage.setItem("rudranil-v7", JSON.stringify(S));
    
    // Show appropriate status based on cloud config
    if (!skipCloud && S.firebaseUrl) {
      updateSyncIndicator("pushing");
      pushToCloud();
    } else if (S.firebaseUrl) {
      updateSyncIndicator("saved");
    } else {
      // No cloud configured — just show local save
      st.textContent = "Saved";
      st.style.color = "rgba(255,255,255,0.5)";
      setTimeout(function() { st.textContent = ""; }, 2000);
    }
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
  renderExamTimers();
  checkTopicOfDay();
  checkMorningBrief();
}

// === PPL Workout Day Indicator ===
function renderPPLIndicator() {
  var el = document.getElementById("ppl-day-label");
  if (el) el.textContent = "Today: " + getTodayPPL() + " Day + Abs";
}

// === MINI GEMINI AI ===
const GEMINI_KEY = "";
let aiHistory = [];

function toggleSettingsSetup() {
  var area = document.getElementById("settings-setup-area");
  area.style.display = area.style.display === "none" ? "flex" : "none";
  if (S.aiKey) document.getElementById("ai-key-input").value = S.aiKey;
  if (S.firebaseUrl) document.getElementById("firebase-url-input").value = S.firebaseUrl;
  if (S.firebaseKey) document.getElementById("firebase-key-input").value = S.firebaseKey;
  if (S.sem4ExamDate) document.getElementById("sem4-date-input").value = S.sem4ExamDate;
  if (S.sem3ExamDate) document.getElementById("sem3-date-input").value = S.sem3ExamDate;
}

function updateCloudStatus(msg, err) {
  var st = document.getElementById("cloud-sync-status");
  if (!st) return;
  st.style.display = "inline";
  st.textContent = msg;
  st.style.color = err ? "#ff4757" : "#2ecc40";
  if (!err && msg === "Synced") {
    setTimeout(function() { st.style.display = "none"; }, 3000);
  }
}

// === PERSISTENT SYNC STATUS INDICATOR ===
function updateSyncIndicator(status) {
  var elements = [
    document.getElementById("sync-st"),
    document.getElementById("sync-st-fab")
  ];
  
  elements.forEach(function(st) {
    if (!st) return;
    switch (status) {
      case "pushing":
        st.textContent = "↑ Pushing...";
        st.style.color = "#f1c40f";
        break;
      case "pulling":
        st.textContent = "↓ Pulling...";
        st.style.color = "#3498db";
        break;
      case "synced":
        st.textContent = "☁ Synced";
        st.style.color = "#2ecc40";
        setTimeout(function() {
          st.textContent = "☁ Connected";
          st.style.color = "rgba(255,255,255,0.3)";
        }, 3000);
        break;
      case "pulled":
        st.textContent = "↓ Updated!";
        st.style.color = "#2ecc40";
        setTimeout(function() {
          st.textContent = "☁ Connected";
          st.style.color = "rgba(255,255,255,0.3)";
        }, 3000);
        break;
      case "in-sync":
        st.textContent = "✓ In Sync";
        st.style.color = "rgba(255,255,255,0.3)";
        break;
      case "saved":
        st.textContent = "Saved";
        st.style.color = "rgba(255,255,255,0.4)";
        setTimeout(function() {
          if (S.gistToken && S.gistId) {
            st.textContent = "☁ Connected";
            st.style.color = "rgba(255,255,255,0.3)";
          } else {
            st.textContent = "";
          }
        }, 2000);
        break;
      case "error":
        st.textContent = "✗ Sync Error";
        st.style.color = "#ff4757";
        break;
      case "offline":
        st.textContent = "✗ Offline";
        st.style.color = "#ff4757";
        break;
      case "connected":
        st.textContent = "☁ Connected";
        st.style.color = "rgba(255,255,255,0.3)";
        break;
      default:
        st.textContent = "";
    }
  });
}

// === FIREBASE SYNC ===
let firebaseDb = null;
let _isPulling = false;

function initFirebase() {
  if (!S.firebaseUrl) return;
  if (!window.firebase) {
    console.warn("Firebase SDK not loaded yet");
    return;
  }
  
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp({
        apiKey: S.firebaseKey || "AIzaSy_dummy",
        databaseURL: S.firebaseUrl
      });
      firebaseDb = firebase.database();
      
      updateSyncIndicator("connected");
      
      const stateRef = firebaseDb.ref('rudranil_state');
      stateRef.on('value', function(snapshot) {
        const data = snapshot.val();
        if (data) {
          handleCloudUpdate(data);
        } else {
          pushToCloud();
        }
      });
    } catch (e) {
      console.error("Firebase init error:", e);
      updateSyncIndicator("error");
      updateCloudStatus("Init Error", true);
    }
  }
}

function handleCloudUpdate(cloudStateStr) {
  _isPulling = true;
  updateSyncIndicator("pulling");
  try {
    var cloudS = JSON.parse(cloudStateStr);
    var cloudTime = cloudS.lastModified || 0;
    var localTime = S.lastModified || 0;
    
    if (cloudTime > localTime) {
      console.log("[Firebase] Cloud is newer. Pulling.");
      var localAi = S.aiKey;
      var localUrl = S.firebaseUrl;
      var localKey = S.firebaseKey;
      
      S = cloudS;
      S.aiKey = localAi;
      S.firebaseUrl = localUrl;
      S.firebaseKey = localKey;
      
      renderAll();
      S.savedKey = TODAY_KEY;
      S.savedMonth = CURRENT_MONTH;
      localStorage.setItem("rudranil-v7", JSON.stringify(S));
      
      updateSyncIndicator("synced");
      updateCloudStatus("Synced");
    } else if (localTime > cloudTime) {
      pushToCloud();
    } else {
      updateSyncIndicator("synced");
      updateCloudStatus("Synced");
    }
  } catch (e) {
    console.error("Firebase parse error:", e);
  }
  _isPulling = false;
}

let _pushTimer = null;
function pushToCloud() {
  if (!firebaseDb || _isPulling) return;
  
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(function() {
    updateSyncIndicator("pushing");
    updateCloudStatus("Pushing...");
    
    var secureS = JSON.parse(JSON.stringify(S));
    delete secureS.aiKey;
    delete secureS.firebaseUrl;
    delete secureS.firebaseKey;
    
    firebaseDb.ref('rudranil_state').set(JSON.stringify(secureS))
      .then(function() {
        updateSyncIndicator("synced");
        updateCloudStatus("Synced");
      })
      .catch(function(e) {
        console.error("Firebase push error:", e);
        updateSyncIndicator("error");
        updateCloudStatus("Push Error", true);
      });
  }, 1500);
}

// === VISIBILITY & ONLINE EVENTS ===
document.addEventListener('visibilitychange', function() {
  // Firebase handles reconnection automatically
});

window.addEventListener('online', function() {
  updateAIStatus();
  if (S.firebaseUrl) updateSyncIndicator("connected");
});
window.addEventListener('offline', function() {
  updateAIStatus();
  if (S.firebaseUrl) updateSyncIndicator("offline");
});

function saveSettings() {
  S.aiKey = document.getElementById("ai-key-input").value.trim();
  S.firebaseUrl = document.getElementById("firebase-url-input").value.trim();
  S.firebaseKey = document.getElementById("firebase-key-input").value.trim();
  
  var sem4Input = document.getElementById("sem4-date-input").value;
  var sem3Input = document.getElementById("sem3-date-input").value;
  if (sem4Input) S.sem4ExamDate = sem4Input;
  if (sem3Input) S.sem3ExamDate = sem3Input;
  
  saveState();
  renderAll(); // Re-render to update the countdowns
  toggleSettingsSetup();
  if (S.firebaseUrl) {
    initFirebase();
    pushToCloud();
  }
}

function initAI() {
  updateAIStatus();
  // Render persistent chat history
  var msgs = document.getElementById("ai-messages");
  if (msgs) {
    msgs.innerHTML = "";
    (S.aiHistory || []).forEach(function(m) {
      if (m.parts && m.parts[0] && m.parts[0].text) {
        renderAIMessage(m.role === "user" ? "user" : "ai", m.parts[0].text);
      }
    });
  }
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
// Online/offline listeners for AI status are now combined in the sync section above

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
  aiHistory = aiHistory.slice(-10);
  S.aiHistory = aiHistory;
  debouncedSave();
  
  try {
    var currentList = S.exercises.map(function(e) { return e.n + " (" + e.s + ")"; }).join(", ");
    if (!currentList) currentList = "Empty";
    
    var todayPct = Math.round(countDailies() / (S.dailyMode === "custom" ? Math.max(1, S.customDailies.length) : DAILIES.length) * 100);
    var sem3Done = S.mathSem3 ? S.mathSem3.filter(Boolean).length : 0;
    var sem1Done = S.mathSem1 ? S.mathSem1.filter(Boolean).length : 0;
    var contextStr = "You are Rudranil's personal life AI assistant." +
      "\n--- LIVE DASHBOARD ---" +
      "\nToday: " + todayPct + "% done | Streak: " + (S.streak || 0) + " days" +
      "\nWorkout (" + getTodayPPL() + " Day): " + currentList +
      "\nSem 3: " + sem3Done + "/" + MATH_SEM3_ALL.length + " | Sem 1: " + sem1Done + "/" + MATH_SEM1_ALL.length +
      "\nSem 4: " + JSON.stringify(S.sem4) +
      "\nScratchpad: " + (S.scratchpad || "empty").substring(0, 200) +
      "\nReview: " + (S.review || "none").substring(0, 200) +
      "\n--- END ---" +
      "\nTo modify workout: ```json [{\"action\":\"add\",\"name\":\"Squats\",\"sets\":\"3x10\"},{\"action\":\"delete\",\"name\":\"Push-ups\"}] ```" +
      "\nTo add sem4 task: ```json [{\"action\":\"add_sem4\",\"paper\":\"dscc5\",\"name\":\"Ch 1\"}] ``` (dscc5-8)" +
      "\nOnly output JSON if modifying. Keep replies under 3 sentences.";
    var reqBody = {
      contents: aiHistory,
      systemInstruction: {
        parts: [{text: contextStr}]
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
      aiHistory = aiHistory.slice(-10);
      S.aiHistory = aiHistory;
      debouncedSave();
    }
  } catch(err) {
    console.error("AI Request Failed:", err);
    renderAIMessage("model", "API Error: " + err.message + ". Check console for details.");
    aiHistory.pop(); // Remove user message from history on error
  }
  
  updateAIStatus();
}

// === HISTORY PRUNING (keep max 90 days) ===
function pruneHistory() {
  // Disabled per user request to retain past data permanently
  return;
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
      if (typeof loaded.firebaseUrl === 'undefined' || loaded.firebaseUrl === "") loaded.firebaseUrl = "https://rudranil-exe-default-rtdb.firebaseio.com";
      if (typeof loaded.firebaseKey === 'undefined' || loaded.firebaseKey === "") loaded.firebaseKey = "AIzaSyAZAxQrfX8d36MMaTZrKcJAYuS9n8HLdQ";
      if (typeof loaded.lastModified === 'undefined') loaded.lastModified = 0;
      if (typeof loaded.history === 'undefined') loaded.history = {};
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
      if (typeof loaded.sem4ExamDate === 'undefined') loaded.sem4ExamDate = "2026-06-15";
      if (typeof loaded.sem3ExamDate === 'undefined') loaded.sem3ExamDate = "2027-01-15";
      if (typeof loaded.topicOfDayIndex === 'undefined') loaded.topicOfDayIndex = 0;
      if (typeof loaded.lastTopicDate === 'undefined') loaded.lastTopicDate = "";
      if (typeof loaded.lastBriefDate === 'undefined') loaded.lastBriefDate = "";
      if (typeof loaded.lastReportDate === 'undefined') loaded.lastReportDate = "";
      if (typeof loaded.insight === 'undefined') loaded.insight = "";
      if (typeof loaded.weeklyReport === 'undefined') loaded.weeklyReport = "";
      if (!loaded.dsccWatched) loaded.dsccWatched = {dscc5:0, dscc6:2, dscc7:0, dscc8:0};
      if (!loaded.dsccTotal) loaded.dsccTotal = {dscc5:8, dscc6:7, dscc7:12, dscc8:6};
      if (!loaded.aiHistory) loaded.aiHistory = [];
      
      // Detect and migrate old default custom dailies (old list had 'Python' and 'Break 15 min')
      var hasOldDefaults = !loaded.customDailies || loaded.customDailies.length === 0 ||
        loaded.customDailies[0].n === "Wake up on time" ||
        (loaded.customDailies.some(function(d){ return d.n === 'Python' || d.n === 'Break 15 min'; }));
      if (hasOldDefaults) {
        loaded.customDailies = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_DAILIES));
      }
      
      for (var key in loaded) { S[key] = loaded[key]; }
      aiHistory = S.aiHistory || [];
    }
  } catch(e) {}
  pruneHistory();
  renderAll();
  initScratchpad();
  initReview();
  initAI();
  
  // Start cloud sync if configured
  if (S.firebaseUrl) {
    initFirebase();
  }
}



// ── CALENDAR MONTH NAVIGATION ──
var calViewYear = CURRENT_YEAR;
var calViewMonth = CURRENT_MONTH;

function calNavMonth(dir) {
  calViewMonth += dir;
  if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
  if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
  renderCalView();
}

function renderCalView() {
  var isCurrentMonth = (calViewYear === CURRENT_YEAR && calViewMonth === CURRENT_MONTH);
  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var titleEl = document.getElementById('cal-month-title');
  if (titleEl) titleEl.textContent = monthNames[calViewMonth] + ' ' + calViewYear;

  var daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
  var startDow = new Date(calViewYear, calViewMonth, 1).getDay();
  var startDay = startDow === 0 ? 6 : startDow - 1;

  var h = '';
  for (var s = 0; s < startDay; s++) h += '<div class="cal-empty"></div>';

  for (var d = 1; d <= daysInMonth; d++) {
    var dayKey = 'rd-v7-' + calViewYear + '-' + (calViewMonth + 1) + '-' + d;
    var hist = S.history ? S.history[dayKey] : null;
    var pct = 0;
    var isToday = isCurrentMonth && d === TODAY_DAY;
    var isFuture = isCurrentMonth && d > TODAY_DAY;

    if (isToday) {
      var cnt = countDailies();
      var total = S.dailyMode === 'custom' ? Math.max(1, S.customDailies.length) : DAILIES.length;
      pct = Math.round((cnt / total) * 100);
    } else if (hist) {
      pct = hist.pct || 0;
    } else if (isCurrentMonth) {
      pct = S.month[d - 1] || 0;
    }

    var tier = getDayTier(pct);
    var classes = 'cal-day' + (tier ? ' ' + tier : '') + (isToday ? ' cal-today' : '') + (isFuture ? ' cal-future' : '');
    var click = isFuture ? '' : ' onclick="openCalDayDetail(' + d + ',' + calViewMonth + ',' + calViewYear + ')"';
    h += '<div class="' + classes + '"' + click + '>' +
      '<span class="cal-day-num">' + d + '</span>' +
      '<span class="cal-dot"></span>' +
      '</div>';
  }

  document.getElementById('mgrid').innerHTML = h;
  var productiveDays = 0;
  for (var dd = 1; dd <= daysInMonth; dd++) {
    var k = 'rd-v7-' + calViewYear + '-' + (calViewMonth + 1) + '-' + dd;
    var h2 = S.history ? S.history[k] : null;
    var p = h2 ? h2.pct : (isCurrentMonth ? (S.month[dd-1] || 0) : 0);
    if (p >= 70) productiveDays++;
  }
  var statsEl = document.getElementById('cal-stats');
  if (statsEl) statsEl.textContent = productiveDays + ' productive day' + (productiveDays !== 1 ? 's' : '');
}

function openCalDayDetail(dayNum, month, year) {
  var isCurrentMonth = (year === CURRENT_YEAR && month === CURRENT_MONTH);
  var dayKey = 'rd-v7-' + year + '-' + (month + 1) + '-' + dayNum;
  var hist = S.history ? S.history[dayKey] : null;
  var pct = 0;
  if (isCurrentMonth && dayNum === TODAY_DAY) {
    var cnt = countDailies();
    var total = S.dailyMode === 'custom' ? Math.max(1, S.customDailies.length) : DAILIES.length;
    pct = Math.round((cnt / total) * 100);
  } else if (hist) {
    pct = hist.pct || 0;
  } else if (isCurrentMonth) {
    pct = S.month[dayNum - 1] || 0;
  }
  // Reuse openDayDetail with a temporary index trick
  var dateObj = new Date(year, month, dayNum);
  var dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  var tierInfo = getDayTierLabel(pct);
  document.getElementById('cal-modal-date').textContent = dateStr;
  var scoreEl = document.getElementById('cal-modal-score');
  scoreEl.textContent = tierInfo.text;
  scoreEl.className = 'cal-modal-score ' + tierInfo.cls;
  document.getElementById('cal-modal-bar').style.width = pct + '%';

  // Build comprehensive daily snapshot
  var summary = '';
  var sectionStyle = 'margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.1);';
  var labelStyle = 'font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:rgba(255,255,255,0.4); margin-bottom:6px; font-weight:700;';

  var isToday = isCurrentMonth && dayNum === TODAY_DAY;
  
  // Extract daily task list
  var dailiesList = [];
  if (isToday) {
    if (S.dailyMode === 'custom') {
      dailiesList = (S.customDailies || []).map(function(d) { return { n: d.n, d: d.d }; });
    } else {
      dailiesList = DAILIES.map(function(d, i) { return { n: d, d: S.dailies[i] }; });
    }
  } else if (hist && hist.dailies) {
    if (hist.dailyMode === 'custom') {
      dailiesList = hist.dailies.map(function(d) { return { n: d.n, d: d.d }; });
    } else {
      dailiesList = hist.dailies.map(function(done, i) { return { n: DAILIES[i] || 'Task', d: done }; });
    }
  }

  // Extract DSCC watch state
  var dsccW = isToday ? S.dsccWatched : (hist && hist.dsccWatched ? hist.dsccWatched : null);
  var dsccT = isToday ? S.dsccTotal : (hist && hist.dsccTotal ? hist.dsccTotal : S.dsccTotal);
  if (!dsccT) dsccT = {dscc5:8, dscc6:7, dscc7:12, dscc8:6};

  // Extract push-pull-leg exercises
  var exList = isToday ? (S.exercises || []) : (hist && hist.exercises ? hist.exercises : []);

  // Extract review and scratchpad
  var reviewText = isToday ? S.review : (hist ? hist.review : '');
  var scratchpadText = isToday ? S.scratchpad : (hist ? hist.scratchpad : '');

  // 1. Productivity Score Header
  summary += '<div style="font-size:15px;color:#fff;font-weight:700;margin-bottom:12px;">Achieved ' + pct + '% of Goals</div>';

  // 2. Dailies List
  summary += '<div style="' + sectionStyle + '"><div style="' + labelStyle + '">Daily Execution Tasks</div>';
  if (dailiesList.length > 0) {
    summary += '<ul style="margin:0;padding-left:0;list-style:none;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.85);">';
    dailiesList.forEach(function(item) {
      summary += '<li style="display:flex;align-items:center;margin-bottom:4px;"><span style="display:inline-block;width:22px;font-size:14px;">' + (item.d ? '✅' : '❌') + '</span> ' + item.n + '</li>';
    });
    summary += '</ul>';
  } else {
    summary += '<div style="font-size:12px;color:rgba(255,255,255,0.4);font-style:italic;">No daily tasks recorded.</div>';
  }
  summary += '</div>';

  // 3. DSCC Classes Watched
  summary += '<div style="' + sectionStyle + '"><div style="' + labelStyle + '">DSCC Lecture Progress</div>';
  if (dsccW) {
    summary += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;color:rgba(255,255,255,0.85);">';
    summary += '<div>DSCC-5: <strong style="color:#a855f7;">' + (dsccW.dscc5 || 0) + '/' + (dsccT.dscc5 || 8) + '</strong></div>';
    summary += '<div>DSCC-6: <strong style="color:#a855f7;">' + (dsccW.dscc6 || 0) + '/' + (dsccT.dscc6 || 7) + '</strong></div>';
    summary += '<div>DSCC-7: <strong style="color:#a855f7;">' + (dsccW.dscc7 || 0) + '/' + (dsccT.dscc7 || 12) + '</strong></div>';
    summary += '<div>DSCC-8: <strong style="color:#a855f7;">' + (dsccW.dscc8 || 0) + '/' + (dsccT.dscc8 || 6) + '</strong></div>';
    summary += '</div>';
  } else {
    summary += '<div style="font-size:12px;color:rgba(255,255,255,0.4);font-style:italic;">No lecture progress recorded for this day.</div>';
  }
  summary += '</div>';

  // 4. Exercises Done/Not Done
  summary += '<div style="' + sectionStyle + '"><div style="' + labelStyle + '">PPL Workout Exercises</div>';
  if (exList.length > 0) {
    summary += '<ul style="margin:0;padding-left:0;list-style:none;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.85);">';
    exList.forEach(function(ex) {
      summary += '<li style="display:flex;align-items:center;margin-bottom:4px;"><span style="display:inline-block;width:22px;font-size:14px;">' + (ex.done ? '✅' : '❌') + '</span> ' + ex.n + ' <span style="font-size:11px;color:rgba(255,255,255,0.4);margin-left:6px;">(' + ex.s + ')</span></li>';
    });
    summary += '</ul>';
  } else {
    summary += '<div style="font-size:12px;color:rgba(255,255,255,0.4);font-style:italic;">No exercises recorded.</div>';
  }
  summary += '</div>';

  // 5. End-of-Day Review
  summary += '<div style="' + sectionStyle + '"><div style="' + labelStyle + '">End-of-Day Review</div>';
  if (reviewText) {
    summary += '<div style="background:rgba(168,85,247,0.1);padding:10px 14px;border-radius:10px;border-left:3px solid #a855f7;color:#e0c3fc;font-style:italic;font-size:13px;line-height:1.5;">"' + reviewText + '"</div>';
  } else {
    summary += '<div style="font-size:12px;color:rgba(255,255,255,0.4);font-style:italic;">No review notes captured for this day.</div>';
  }
  summary += '</div>';

  // 6. Scratchpad / Active Brainstorm
  summary += '<div style="' + sectionStyle + '"><div style="' + labelStyle + '">Scratchpad / Active Brainstorm</div>';
  if (scratchpadText) {
    summary += '<pre style="background:rgba(0,0,0,0.25);padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.8);font-family:Consolas,monospace;font-size:12px;white-space:pre-wrap;margin:0;max-height:150px;overflow-y:auto;text-align:left;">' + scratchpadText + '</pre>';
  } else {
    summary += '<div style="font-size:12px;color:rgba(255,255,255,0.4);font-style:italic;">Scratchpad was empty.</div>';
  }
  summary += '</div>';
  
  document.getElementById('cal-modal-summary').innerHTML = summary;
  document.getElementById('cal-modal-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ── FAB FUNCTIONS ──
function toggleFAB() {
  var panel = document.getElementById('fab-panel');
  var overlay = document.getElementById('fab-overlay');
  var isOpen = panel.classList.contains('open');
  if (isOpen) { closeFAB(); } else {
    panel.classList.add('open');
    overlay.style.display = 'block';
  }
}
function closeFAB() {
  document.getElementById('fab-panel').classList.remove('open');
  document.getElementById('fab-overlay').style.display = 'none';
}

// === NEW EXECUTIVE FEATURES: BRIEF, TIMERS, TOPIC OF DAY, WEEKLY REPORT ===

function getDaysRemaining(dateStr) {
  var target = new Date(dateStr + "T00:00:00");
  var today = new Date();
  target.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  var diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function renderExamTimers() {
  var sem4Date = S.sem4ExamDate || "2026-06-15";
  var sem3Date = S.sem3ExamDate || "2027-01-15";
  var sem4Days = getDaysRemaining(sem4Date);
  var sem3Days = getDaysRemaining(sem3Date);
  
  updateTimerElement("sem4-days", sem4Days);
  updateTimerElement("sem3-days", sem3Days);
  
  // Update date labels dynamically
  var sem4Label = document.getElementById("sem4-date-label");
  var sem3Label = document.getElementById("sem3-date-label");
  if (sem4Label) sem4Label.textContent = new Date(sem4Date + "T00:00:00").toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  if (sem3Label) sem3Label.textContent = new Date(sem3Date + "T00:00:00").toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function updateTimerElement(id, days) {
  var el = document.getElementById(id);
  if (!el) return;
  
  if (days < 0) {
    el.textContent = "Passed";
    el.className = "timer-card-days timer-red";
  } else {
    el.textContent = days + " d";
    if (days > 60) {
      el.className = "timer-card-days timer-green";
    } else if (days >= 30) {
      el.className = "timer-card-days timer-yellow";
    } else {
      el.className = "timer-card-days timer-red";
    }
  }
}

async function checkMorningBrief() {
  var todayStr = TODAY_KEY;
  var dateEl = document.getElementById("brief-date-el");
  var contentEl = document.getElementById("brief-content-el");
  
  if (dateEl) {
    var dateObj = new Date();
    dateEl.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }
  
  if (S.lastBriefDate === todayStr && S.insight) {
    if (contentEl) contentEl.innerHTML = S.insight;
    return;
  }
  
  if (contentEl) contentEl.innerHTML = '<span style="color:rgba(255,255,255,0.4); font-style:italic;">Synthesizing morning intelligence brief...</span>';
  
  var behindId = getMostBehindPaper();
  var papersMap = {
    dscc5: 'DSCC-5 (Theory of Real Functions)',
    dscc6: 'DSCC-6 (Mechanics I)',
    dscc7: 'DSCC-7 (Multivariate & PDE)',
    dscc8: 'DSCC-8 (Group/Ring Theory)'
  };
  var behindPaperName = behindId ? papersMap[behindId] : "None";
  
  var sem4Days = getDaysRemaining(S.sem4ExamDate || "2026-06-15");
  var sem3Days = getDaysRemaining(S.sem3ExamDate || "2027-01-15");
  
  var histSummary = "";
  if (S.history) {
    var keys = Object.keys(S.history).sort().slice(-7);
    keys.forEach(function(k) {
      var entry = S.history[k];
      if (entry) {
        histSummary += "\n- Date " + k.replace('rd-v7-', '') + ": " + (entry.pct || 0) + "% completed, Review: " + (entry.review || "None");
      }
    });
  }
  if (!histSummary) histSummary = "No historical snapshots in the last 7 days.";

  var fallbackBrief = "• <strong>Study Priority:</strong> You are currently most behind in <strong>" + behindPaperName + "</strong> (" + (S.dsccWatched[behindId] || 0) + "/" + (S.dsccTotal[behindId] || 0) + " classes watched).<br/>" +
    "• <strong>Exam countdown:</strong> Sem 4 exams in <strong>" + sem4Days + " days</strong> (" + (S.sem4ExamDate || "2026-06-15") + "); Sem 3 exams in <strong>" + sem3Days + " days</strong>.<br/>" +
    "• <strong>Productivity Advice:</strong> Consistency is key. Complete your dailies to unlock your streak!";

  var keyToUse = S.aiKey || GEMINI_KEY;
  if (!navigator.onLine || !keyToUse) {
    S.insight = fallbackBrief;
    S.lastBriefDate = todayStr;
    saveState(true);
    if (contentEl) contentEl.innerHTML = S.insight;
    return;
  }
  
  try {
    var prompt = "You are an executive productivity AI. Write a concise 3-sentence Morning Brief for Rudranil." +
      "\nLive state data:" +
      "\n- Sem 4 Exam countdown: " + sem4Days + " days left (Date: " + (S.sem4ExamDate || "2026-06-15") + ")" +
      "\n- Sem 3 Exam countdown: " + sem3Days + " days left (Date: " + (S.sem3ExamDate || "2027-01-15") + ")" +
      "\n- Sem 4 watched progress: DSCC-5 (" + S.dsccWatched.dscc5 + "/" + S.dsccTotal.dscc5 + "), DSCC-6 (" + S.dsccWatched.dscc6 + "/" + S.dsccTotal.dscc6 + "), DSCC-7 (" + S.dsccWatched.dscc7 + "/" + S.dsccTotal.dscc7 + "), DSCC-8 (" + S.dsccWatched.dscc8 + "/" + S.dsccTotal.dscc8 + ")" +
      "\n- Last 7 days history snapshot: " + histSummary +
      "\nBrief instructions: Identify which DSCC paper is most behind, highlight exam urgency, and point out one specific pattern/lesson from the last 7 days. Be sharp, direct, premium, and highly motivating. Wrap brief in HTML paragraphs or bullet points. No conversational filler.";
      
    var reqBody = {
      contents: [{role: "user", parts: [{text: prompt}]}]
    };
    
    var res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + keyToUse, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(reqBody)
    });
    
    if (!res.ok) throw new Error("Gemini brief failed");
    var data = await res.json();
    var replyText = data.candidates[0].content.parts[0].text.trim();
    
    replyText = replyText.replace(/```html\s*([\s\S]*?)\s*```/g, "$1");
    replyText = replyText.replace(/```\s*([\s\S]*?)\s*```/g, "$1");
    
    S.insight = replyText;
    S.lastBriefDate = todayStr;
    saveState(true);
    if (contentEl) contentEl.innerHTML = S.insight;
  } catch (err) {
    console.error("Gemini brief error, using fallback:", err);
    S.insight = fallbackBrief;
    S.lastBriefDate = todayStr;
    saveState(true);
    if (contentEl) contentEl.innerHTML = S.insight;
  }
}

function checkTopicOfDay(force) {
  var foundIdx = -1;
  for (var i = 0; i < MATH_SEM3_ALL.length; i++) {
    if (!S.mathSem3[i]) {
      foundIdx = i;
      break;
    }
  }
  
  var btn = document.getElementById("topic-of-day-btn");
  if (!btn) return;
  
  if (foundIdx !== -1) {
    S.topicOfDayIndex = foundIdx;
    var topicName = MATH_SEM3_ALL[foundIdx];
    btn.textContent = "📖 Today: " + topicName;
    btn.style.display = "inline-block";
    btn.style.cursor = "pointer";
    btn.style.background = "rgba(168,85,247,0.15)";
    btn.style.borderColor = "rgba(168,85,247,0.3)";
    btn.style.color = "#e0c3fc";
    btn.onclick = function() {
      if (confirm('Mark "' + topicName + '" as completed?')) {
        S.mathSem3[foundIdx] = true;
        renderSem3();
        updStats();
        checkTopicOfDay(true);
        saveState();
      }
    };
  } else {
    btn.textContent = "✅ All Sem 3 topics complete!";
    btn.onclick = null;
    btn.style.cursor = "default";
    btn.style.background = "rgba(46,204,64,0.15)";
    btn.style.borderColor = "rgba(46,204,64,0.3)";
    btn.style.color = "#86efac";
  }
}

async function generateWeeklyReport(force) {
  var todayStr = TODAY_KEY;
  var container = document.getElementById("weekly-report-container");
  var btn = document.getElementById("btn-trigger-report");
  
  if (!force && S.lastReportDate === todayStr && S.weeklyReport) {
    if (container) container.innerHTML = S.weeklyReport;
    return;
  }
  
  if (container) {
    container.innerHTML = '<span style="color:rgba(255,255,255,0.4); font-style:italic;">Synthesizing deep 30-day analytics history via Gemini AI... This will take a few seconds...</span>';
    if (btn) { btn.disabled = true; btn.textContent = "Analyzing..."; }
  }
  
  var histList = [];
  if (S.history) {
    var keys = Object.keys(S.history).sort().slice(-30);
    keys.forEach(function(k) {
      var entry = S.history[k];
      if (entry) {
        histList.push({
          date: k.replace('rd-v7-', ''),
          score: entry.pct || 0,
          review: entry.review || "",
          scratchpad: entry.scratchpad || ""
        });
      }
    });
  }
  
  var dsccSummary = "DSCC-5: " + (S.dsccWatched.dscc5 || 0) + "/" + (S.dsccTotal.dscc5 || 8) +
                    ", DSCC-6: " + (S.dsccWatched.dscc6 || 0) + "/" + (S.dsccTotal.dscc6 || 7) +
                    ", DSCC-7: " + (S.dsccWatched.dscc7 || 0) + "/" + (S.dsccTotal.dscc7 || 12) +
                    ", DSCC-8: " + (S.dsccWatched.dscc8 || 0) + "/" + (S.dsccTotal.dscc8 || 6);
  var sem3Summary = S.mathSem3 ? S.mathSem3.filter(Boolean).length + "/" + MATH_SEM3_ALL.length + " topics done" : "0 topics done";
  
  var fallbackReport = "<strong>📊 Fallback Intelligence Report (Offline/No Key):</strong><br/><br/>" +
    "• <strong>30-Day Activity:</strong> " + histList.length + " days of historical logs tracked.<br/>" +
    "• <strong>DSCC watched progress:</strong> " + dsccSummary + "<br/>" +
    "• <strong>Semester 3 backlogs progress:</strong> " + sem3Summary + "<br/><br/>" +
    "<em>Insight: Configure your Gemini API Key in Settings to unlock deep behavioral pattern intelligence and study suggestions.</em>";

  var keyToUse = S.aiKey || GEMINI_KEY;
  if (!navigator.onLine || !keyToUse) {
    S.weeklyReport = fallbackReport;
    if (force) {
      S.lastReportDate = todayStr;
      saveState(true);
    }
    if (container) container.innerHTML = S.weeklyReport;
    if (btn) { btn.disabled = false; btn.textContent = "⚡ Run Analysis"; }
    return;
  }
  
  try {
    var prompt = "You are an elite data scientist and cognitive psychologist. Write a detailed, realistic Weekly Intelligence Report for Rudranil." +
      "\n- Focus on real, actionable pattern analysis of his habits, study delays, and review notes." +
      "\n- Strictly avoid motivational fluff or generic advice. Be objective, sharp, and highly analytical." +
      "\n- Feeds from last 30 days history logs: " + JSON.stringify(histList) +
      "\n- DSCC progress: " + dsccSummary +
      "\n- Semester 3 backlog progress: " + sem3Summary +
      "\n- Exam countdowns: Sem 4 (" + getDaysRemaining(S.sem4ExamDate || "2026-06-15") + " days left), Sem 3 (" + getDaysRemaining(S.sem3ExamDate || "2027-01-15") + " days left)." +
      "\n- Strict styling: The response is rendered directly in a dark-themed glassmorphic card. Never wrap in light/white backgrounds or styled cards. Only output clean, native semantic HTML tags like <h3>, <p>, <ul>, <li>, and <strong>. Keep the tone elite, authoritative, and helpful.";
      
    var reqBody = {
      contents: [{role: "user", parts: [{text: prompt}]}]
    };
    
    var res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + keyToUse, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(reqBody)
    });
    
    if (!res.ok) throw new Error("Gemini API call failed");
    var data = await res.json();
    var replyText = data.candidates[0].content.parts[0].text.trim();
    
    replyText = replyText.replace(/```html\s*([\s\S]*?)\s*```/g, "$1");
    replyText = replyText.replace(/```\s*([\s\S]*?)\s*```/g, "$1");
    
    S.weeklyReport = replyText;
    S.lastReportDate = todayStr;
    saveState(true);
    if (container) container.innerHTML = S.weeklyReport;
  } catch (err) {
    console.error("Weekly report generation failed, using fallback:", err);
    S.weeklyReport = fallbackReport;
    if (container) container.innerHTML = S.weeklyReport;
  }
  
  if (btn) { btn.disabled = false; btn.textContent = "⚡ Run Analysis"; }
}

loadState();
