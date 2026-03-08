(function () {
  'use strict';

  const STORAGE_KEY = 'zeigarn_goals';
  const CHECK_KEY = 'zeigarn_checks';
  const DATE_KEY = 'zeigarn_date';
  const STREAK_KEY = 'zeigarn_streak';
  const STREAK_DATE_KEY = 'zeigarn_streak_date';
  const WORK_MS = 25 * 60 * 1000;
  const SHORT_BREAK_MS = 5 * 60 * 1000;
  const LONG_BREAK_MS = 15 * 60 * 1000;
  const LONG_BREAK_AFTER = 3;

  const goalView = document.getElementById('goal-view');
  const checklistView = document.getElementById('checklist-view');
  const goalForm = document.getElementById('goal-form');
  const majorGoalInput = document.getElementById('major-goal');
  const tasksList = document.getElementById('tasks-list');
  const maintenanceList = document.getElementById('maintenance-list');
  const addTaskBtn = document.getElementById('add-task');
  const removeTaskBtn = document.getElementById('remove-task');
  const addMaintenanceBtn = document.getElementById('add-maintenance');
  const removeMaintenanceBtn = document.getElementById('remove-maintenance');
  const backToGoalsBtn = document.getElementById('back-to-goals');
  const startNewGoalBtn = document.getElementById('start-new-goal');
  const goalDaysSelect = document.getElementById('goal-days');
  const streakDisplay = document.getElementById('streak-display');
  const congratsOverlay = document.getElementById('congrats-overlay');
  const congratsMessage = document.getElementById('congrats-message');
  const congratsStreak = document.getElementById('congrats-streak');
  const congratsDismiss = document.getElementById('congrats-dismiss');

  const displayMajorGoal = document.getElementById('display-major-goal');
  const displayTasks = document.getElementById('display-tasks');
  const displayMaintenance = document.getElementById('display-maintenance');

  const pomodoroPhase = document.getElementById('pomodoro-phase');
  const pomodoroCycle = document.getElementById('pomodoro-cycle');
  const pomodoroDisplay = document.getElementById('pomodoro-display');
  const pomodoroSection = document.querySelector('.pomodoro-section');
  const startBtn = document.getElementById('pomodoro-start');
  const pauseBtn = document.getElementById('pomodoro-pause');
  const resetBtn = document.getElementById('pomodoro-reset');

  let pomodoroInterval = null;
  let pomodoroRemaining = WORK_MS;
  let pomodoroCycleCount = 0;
  let isBreak = false;
  let isPaused = true;

  function today() {
    return new Date().toDateString();
  }

  function todayYYYYMMDD() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(ymd, days) {
    const d = new Date(ymd + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function loadStoredRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {}
    return null;
  }

  function loadStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const date = localStorage.getItem(DATE_KEY);
      if (raw && date === today()) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }

  function loadChecks() {
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      const date = localStorage.getItem(DATE_KEY);
      if (raw && date === today()) return JSON.parse(raw);
    } catch (_) {}
    return {};
  }

  function saveGoals(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(DATE_KEY, today());
  }

  function saveChecks(checks) {
    localStorage.setItem(CHECK_KEY, JSON.stringify(checks));
    localStorage.setItem(DATE_KEY, today());
  }

  function getStreak() {
    const v = localStorage.getItem(STREAK_KEY);
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  }

  function setStreak(n) {
    localStorage.setItem(STREAK_KEY, String(n));
    if (streakDisplay) streakDisplay.textContent = 'Streak: ' + n;
  }

  function getLastStreakIncrementDate() {
    return localStorage.getItem(STREAK_DATE_KEY) || '';
  }

  function setLastStreakIncrementDate(ymd) {
    localStorage.setItem(STREAK_DATE_KEY, ymd);
  }

  function checkStreakReset() {
    const goal = loadStoredRaw();
    if (!goal || !goal.setDate || goal.durationDays == null || goal.completed) return;
    const endDate = addDays(goal.setDate, goal.durationDays - 1);
    if (todayYYYYMMDD() > endDate) setStreak(0);
  }

  function showGoalView() {
    goalView.classList.remove('hidden');
    checklistView.classList.add('hidden');
  }

  function showChecklistView() {
    goalView.classList.add('hidden');
    checklistView.classList.remove('hidden');
    renderChecklist();
  }

  function getFormData() {
    const tasks = Array.from(document.querySelectorAll('input[name="task"]')).map((i) => i.value.trim());
    const maintenance = Array.from(document.querySelectorAll('input[name="maintenance"]')).map((i) => i.value.trim());
    const durationDays = Math.min(7, Math.max(1, parseInt(goalDaysSelect.value, 10) || 1));
    return {
      majorGoal: majorGoalInput.value.trim(),
      tasks: tasks.filter(Boolean),
      maintenance: maintenance.filter(Boolean),
      setDate: todayYYYYMMDD(),
      durationDays: durationDays,
      completed: false,
    };
  }

  addTaskBtn.addEventListener('click', function () {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'task';
    input.placeholder = 'Task ' + (tasksList.children.length + 1);
    input.className = 'input-task';
    tasksList.appendChild(input);
  });

  removeTaskBtn.addEventListener('click', function () {
    if (tasksList.children.length <= 1) return;
    tasksList.removeChild(tasksList.lastElementChild);
  });

  addMaintenanceBtn.addEventListener('click', function () {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'maintenance';
    input.placeholder = 'Maintenance ' + (maintenanceList.children.length + 1);
    input.className = 'input-maintenance';
    maintenanceList.appendChild(input);
  });

  removeMaintenanceBtn.addEventListener('click', function () {
    if (maintenanceList.children.length <= 1) return;
    maintenanceList.removeChild(maintenanceList.lastElementChild);
  });

  goalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const data = getFormData();
    if (!data.majorGoal) return;
    saveGoals(data);
    saveChecks({});
    showChecklistView();
  });

  backToGoalsBtn.addEventListener('click', function () {
    const data = loadStored();
    if (data) {
      majorGoalInput.value = data.majorGoal || '';
      if (goalDaysSelect && data.durationDays) goalDaysSelect.value = String(data.durationDays);
      tasksList.innerHTML = '';
      (data.tasks && data.tasks.length ? data.tasks : ['', '']).forEach((t, i) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'task';
        input.placeholder = 'Task ' + (i + 1);
        input.className = 'input-task';
        input.value = t;
        tasksList.appendChild(input);
      });
      maintenanceList.innerHTML = '';
      const maint = data.maintenance && data.maintenance.length ? data.maintenance : ['', '', ''];
      maint.forEach((m, i) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'maintenance';
        input.placeholder = 'Maintenance ' + (i + 1);
        input.className = 'input-maintenance';
        input.value = m;
        maintenanceList.appendChild(input);
      });
    }
    showGoalView();
  });

  startNewGoalBtn.addEventListener('click', function () {
    majorGoalInput.value = '';
    if (goalDaysSelect) goalDaysSelect.value = '1';
    tasksList.innerHTML = '';
    ['', ''].forEach((t, i) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'task';
      input.placeholder = 'Task ' + (i + 1);
      input.className = 'input-task';
      input.value = t;
      tasksList.appendChild(input);
    });
    maintenanceList.innerHTML = '';
    ['', '', ''].forEach((m, i) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'maintenance';
      input.placeholder = 'Maintenance ' + (i + 1);
      input.className = 'input-maintenance';
      input.value = m;
      maintenanceList.appendChild(input);
    });
    showGoalView();
  });

  function allChecked(data, checks) {
    if (!data) return false;
    const taskLen = (data.tasks || []).length;
    const maintLen = (data.maintenance || []).length;
    for (let i = 0; i < taskLen; i++) {
      if (!checks['task_' + i]) return false;
    }
    for (let i = 0; i < maintLen; i++) {
      if (!checks['maint_' + i]) return false;
    }
    return taskLen + maintLen > 0;
  }

  const MOTIVATIONAL_MESSAGES = [
    "You're doing great. Keep it up!",
    "What a step! You're making progress! Keep going!",
    "Small steps lead to big wins. You're on fire!",
    "Consistency is key—and you've got it!",
    "Today you showed up. That's what matters. You're on the right track!",
    "One goal down. You're building something real!"
  ];

  function showCongratsPopup(newStreak) {
    if (!congratsOverlay || !congratsMessage || !congratsStreak) return;
    congratsMessage.textContent = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
    congratsStreak.textContent = "Your streak is now " + newStreak + "!";
    congratsOverlay.classList.remove('hidden');
    congratsOverlay.classList.add('is-open');
  }

  function hideCongratsPopup() {
    if (congratsOverlay) {
      congratsOverlay.classList.add('hidden');
      congratsOverlay.classList.remove('is-open');
    }
  }

  if (congratsDismiss) congratsDismiss.addEventListener('click', hideCongratsPopup);
  if (congratsOverlay) congratsOverlay.addEventListener('click', function (e) {
    if (e.target === congratsOverlay) hideCongratsPopup();
  });

  function updateCompletionState() {
    const data = loadStored();
    const checks = loadChecks();
    const done = data && startNewGoalBtn ? allChecked(data, checks) : false;
    if (!data || !startNewGoalBtn) return;
    if (done) {
      startNewGoalBtn.classList.remove('hidden');
      if (!data.completed) {
        data.completed = true;
        saveGoals(data);
        const todayYmd = todayYYYYMMDD();
        const lastInc = getLastStreakIncrementDate();
        const alreadyIncrementedToday = lastInc === todayYmd;
        if (!alreadyIncrementedToday) {
          const added = data.durationDays || 1;
          const newStreak = getStreak() + added;
          setStreak(newStreak);
          setLastStreakIncrementDate(todayYYYYMMDD());
          requestAnimationFrame(function () { showCongratsPopup(newStreak); });
        }
      }
    } else {
      startNewGoalBtn.classList.add('hidden');
    }
  }

  function renderChecklist() {
    const data = loadStored();
    const checks = loadChecks();
    if (!data) {
      showGoalView();
      return;
    }

    if (streakDisplay) streakDisplay.textContent = 'Streak: ' + getStreak();

    displayMajorGoal.textContent = data.majorGoal || '—';

    displayTasks.innerHTML = '';
    (data.tasks || []).forEach((text, i) => {
      const key = 'task_' + i;
      const done = checks[key];
      const label = document.createElement('label');
      label.className = 'task-item' + (done ? ' done' : '');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!done;
      cb.dataset.key = key;
      cb.addEventListener('change', function () {
        checks[key] = this.checked;
        saveChecks(checks);
        label.classList.toggle('done', this.checked);
        updateCompletionState();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(text || '—'));
      displayTasks.appendChild(label);
    });

    displayMaintenance.innerHTML = '';
    (data.maintenance || []).forEach((text, i) => {
      const key = 'maint_' + i;
      const done = checks[key];
      const label = document.createElement('label');
      label.className = 'maintenance-item' + (done ? ' done' : '');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!done;
      cb.dataset.key = key;
      cb.addEventListener('change', function () {
        checks[key] = this.checked;
        saveChecks(checks);
        label.classList.toggle('done', this.checked);
        updateCompletionState();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(text || '—'));
      displayMaintenance.appendChild(label);
    });

    updateCompletionState();
  }

  function formatTime(ms) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function startPomodoro() {
    if (pomodoroInterval) return;
    isPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pomodoroInterval = setInterval(tick, 1000);
  }

  function pausePomodoro() {
    if (!pomodoroInterval) return;
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    isPaused = true;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function resetPomodoro() {
    pausePomodoro();
    pomodoroCycleCount = 0;
    isBreak = false;
    pomodoroRemaining = WORK_MS;
    pomodoroPhase.textContent = 'Focus';
    pomodoroCycle.textContent = 'Cycle 1';
    pomodoroSection.classList.remove('break');
    pomodoroDisplay.textContent = formatTime(WORK_MS);
    startBtn.disabled = false;
  }

  function tick() {
    pomodoroRemaining -= 1000;
    pomodoroDisplay.textContent = formatTime(pomodoroRemaining);
    if (pomodoroRemaining <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroInterval = null;
      if (isBreak) {
        pomodoroCycleCount += 1;
        pomodoroPhase.textContent = 'Focus';
        pomodoroRemaining = WORK_MS;
        pomodoroSection.classList.remove('break');
        pomodoroCycle.textContent = 'Cycle ' + (pomodoroCycleCount + 1);
      } else {
        const isLongBreak = (pomodoroCycleCount + 1) % LONG_BREAK_AFTER === 0;
        pomodoroPhase.textContent = isLongBreak ? 'Long break' : 'Short break';
        pomodoroRemaining = isLongBreak ? LONG_BREAK_MS : SHORT_BREAK_MS;
        pomodoroSection.classList.add('break');
      }
      isBreak = !isBreak;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      isPaused = true;
    }
  }

  startBtn.addEventListener('click', startPomodoro);
  pauseBtn.addEventListener('click', pausePomodoro);
  resetBtn.addEventListener('click', resetPomodoro);

  (function init() {
    const storedDate = localStorage.getItem(DATE_KEY);
    const todayStr = today();
    const data = loadStored();
    const showChecklist = data && storedDate === todayStr;
    if (showChecklist) {
      showChecklistView();
    } else {
      checkStreakReset();
      showGoalView();
    }
    if (pomodoroDisplay) pomodoroDisplay.textContent = formatTime(WORK_MS);
  })();
})();
