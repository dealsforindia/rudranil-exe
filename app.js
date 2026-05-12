const APRIL_DAYS = 30;
const NOW = new Date();
const TODAY_DAY = NOW.getDate();
const TODAY_KEY = "rd-v7-" + NOW.getFullYear() + "-" + (NOW.getMonth() + 1) + "-" + NOW.getDate();

const DAILIES = [
  "Morning — no scroll", "Watch video session", "Study block done",
  "Post deals", "Bot checked", "Workout done", "Night review"
];

const MATH = {
  ra: ["Real Analysis", "Sequences", "Series", "Metric Spaces"],
  ode: ["1st Order ODE", "2nd Order ODE", "Laplace Transform"],
  lp: ["Simplex Method", "Duality", "Transport Problem"]
};
const MATH_ALL = [...MATH.ra, ...MATH.ode, ...MATH.lp];

let S = {
  dailies: Array(DAILIES.length).fill(false),
  math: Array(MATH_ALL.length).fill(false),
  sem: ["Real Analysis class", "ODE assignment", "LP problem set", "Group Theory notes"],
  semD: Array(4).fill(false),
  aff: ["Post deals", "Bot check", "EarnKaro links"],
  affD: Array(3).fill(false),
  exercises: [{n:"Push-ups",s:"3x15",done:false},{n:"Pull-ups",s:"3x8",done:false},{n:"Plank",s:"3x60s",done:false}],
  fsVid: 35, pyVid: 23,
  month: Array(APRIL_DAYS).fill(false),
  streak: 0,
  scratchpad: "",
  review: "",
  savedKey: ""
};

// Debounced save
var _saveTimer = null;
function debouncedSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(function() { saveState(); }, 800);
}

const checkIcon = '<svg viewBox="0 0 12 12"><polyline points="2.5 6 5 8.5 9.5 3.5"/></svg>';

function countDailies() { return S.dailies.filter(Boolean).length; }

function autoMarkToday() {
  if (NOW.getMonth() === 3) {
    const idx = TODAY_DAY - 1;
    if (idx >= 0 && idx < APRIL_DAYS) S.month[idx] = countDailies() >= 5;
  }
  renderMonth();
}

function updStats() {
  const cnt = countDailies();
  const pct = Math.round(cnt / DAILIES.length * 100);

  document.getElementById("hero-pct").textContent = pct + "%";
  document.getElementById("hero-ring-progress").style.strokeDashoffset = 440 - (pct / 100) * 440;

  document.getElementById("ring-fs").setAttribute("stroke-dasharray", (S.fsVid / 100) * 314 + " 314");
  document.getElementById("ring-py").setAttribute("stroke-dasharray", (S.pyVid / 100) * 226 + " 226");
  var mPct = S.month.filter(Boolean).length / APRIL_DAYS;
  document.getElementById("ring-month").setAttribute("stroke-dasharray", mPct * 138 + " 138");

  document.getElementById("stat-fs").textContent = S.fsVid;
  document.getElementById("stat-py").textContent = S.pyVid;
  document.getElementById("stat-month").textContent = S.month.filter(Boolean).length;

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
  document.getElementById("dailies-count").textContent = countDailies() + "/" + DAILIES.length;
  var h = "";
  DAILIES.forEach(function(d, i) {
    var done = S.dailies[i];
    h += '<div class="task-item" onclick="togDaily(' + i + ')">' +
      '<div class="task-check ' + (done ? 'completed' : '') + '">' + (done ? checkIcon : '') + '</div>' +
      '<div class="task-info"><div class="task-name" style="' + (done ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + d + '</div></div></div>';
  });
  document.getElementById("dailies-list").innerHTML = h;
}
function togDaily(i) { S.dailies[i] = !S.dailies[i]; renderDailies(); autoMarkToday(); updStats(); saveState(); }
function resetDailies() { S.dailies = Array(DAILIES.length).fill(false); renderDailies(); autoMarkToday(); updStats(); saveState(); }

function renderSem4() {
  var cnt = S.semD.filter(Boolean).length;
  document.getElementById("sem4-count").textContent = cnt + "/" + S.sem.length;
  var h = "";
  S.sem.forEach(function(t, i) {
    var done = S.semD[i];
    h += '<div class="task-item" onclick="togSem(' + i + ')">' +
      '<div class="task-check ' + (done ? 'completed' : '') + '">' + (done ? checkIcon : '') + '</div>' +
      '<div class="task-info"><div class="task-name" style="' + (done ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + t + '</div></div>' +
      '<div class="task-delete" onclick="event.stopPropagation();delSem(' + i + ')">x</div></div>';
  });
  document.getElementById("sem4-list").innerHTML = h;
}
function togSem(i) { S.semD[i] = !S.semD[i]; renderSem4(); updStats(); saveState(); }
function delSem(i) { S.sem.splice(i, 1); S.semD.splice(i, 1); renderSem4(); updStats(); saveState(); }
function addSemTask() {
  var inp = document.getElementById("sem-new-input");
  var v = inp.value.trim();
  if (!v) return;
  S.sem.push(v); S.semD.push(false); inp.value = "";
  renderSem4(); updStats(); saveState();
}

function renderMathGroup(id, topics, offset) {
  var el = document.getElementById("pills-" + id);
  var h = "";
  topics.forEach(function(t, i) {
    var gi = offset + i;
    var done = S.math[gi];
    h += '<div class="math-pill ' + (done ? 'completed' : '') + '" onclick="togMath(' + gi + ')">' + (done ? '✓ ' : '') + t + '</div>';
  });
  el.innerHTML = h;
}
function renderMath() {
  renderMathGroup("ra", MATH.ra, 0);
  renderMathGroup("ode", MATH.ode, MATH.ra.length);
  renderMathGroup("lp", MATH.lp, MATH.ra.length + MATH.ode.length);
}
function togMath(i) { S.math[i] = !S.math[i]; renderMath(); updStats(); saveState(); }

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
function delEx(i) { S.exercises.splice(i, 1); renderEx(); updStats(); saveState(); }
function addEx() {
  var n = document.getElementById("ex-name-in").value.trim();
  var s = document.getElementById("ex-sets-in").value.trim();
  if (!n) return;
  S.exercises.push({ n: n, s: s || "—", done: false });
  document.getElementById("ex-name-in").value = "";
  document.getElementById("ex-sets-in").value = "";
  renderEx(); updStats(); saveState();
}

function renderAff() {
  var h = "";
  S.aff.forEach(function(t, i) {
    var done = S.affD[i];
    h += '<div class="task-item" onclick="togAff(' + i + ')">' +
      '<div class="task-check ' + (done ? 'completed' : '') + '">' + (done ? checkIcon : '') + '</div>' +
      '<div class="task-info"><div class="task-name" style="' + (done ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + t + '</div></div></div>';
  });
  document.getElementById("aff-list").innerHTML = h;
}
function togAff(i) { S.affD[i] = !S.affD[i]; renderAff(); updStats(); saveState(); }

function renderMonth() {
  var h = "";
  S.month.forEach(function(done, i) {
    var isT = (i + 1) === TODAY_DAY && NOW.getMonth() === 3;
    h += '<div class="mday ' + (done ? 'productive' : '') + ' ' + (isT ? 'today' : '') + '" onclick="togMonth(' + i + ')"></div>';
  });
  document.getElementById("mgrid").innerHTML = h;
}
function togMonth(i) { S.month[i] = !S.month[i]; renderMonth(); updStats(); saveState(); }

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
  var idx = TODAY_DAY - 1;
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
  renderDailies(); renderMath(); renderSem4(); renderEx(); renderAff(); renderMonth();
  calcStreak(); updStats();
  document.getElementById("scratchpad").value = S.scratchpad || "";
  document.getElementById("review-text").value = S.review || "";
}

function loadState() {
  try {
    var json = localStorage.getItem("rudranil-v7");
    if (json) {
      var loaded = JSON.parse(json);
      if (loaded.savedKey && loaded.savedKey !== TODAY_KEY) {
        loaded.dailies = Array(DAILIES.length).fill(false);
        loaded.review = "";
        if (loaded.semD) loaded.semD = loaded.semD.map(function() { return false; });
        if (loaded.affD) loaded.affD = loaded.affD.map(function() { return false; });
        if (loaded.exercises) loaded.exercises = loaded.exercises.map(function(e) { return {n:e.n, s:e.s, done:false}; });
      }
      if (!loaded.exercises) loaded.exercises = S.exercises;
      if (typeof loaded.streak === 'undefined') loaded.streak = 0;
      if (typeof loaded.scratchpad === 'undefined') loaded.scratchpad = "";
      if (typeof loaded.review === 'undefined') loaded.review = "";
      for (var key in loaded) { S[key] = loaded[key]; }
    }
  } catch(e) {}
  renderAll();
  initScratchpad();
  initReview();
}

loadState();
