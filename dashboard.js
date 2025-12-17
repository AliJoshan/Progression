// ========================
// DASHBOARD DATA
// ========================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function normalizeTimestamp(value) {
    if (!value) return null;

    if (typeof value === "number") return value;

    if (!isNaN(value)) return Number(value);

    const parsed = Date.parse(value);
    if (!isNaN(parsed)) return parsed;

    return null;
}

tasks = tasks.map(task => {
    const createdAt =
        normalizeTimestamp(task.createdAt) ??
        normalizeTimestamp(task.id) ??
        Date.now();

    return {
        ...task,
        createdAt,
        completedAt: task.completed
            ? normalizeTimestamp(task.completedAt) ?? createdAt
            : null
    };
});

saveTasks();

// ========================
// DOM ELEMENTS
// ========================
const dashList = document.getElementById("dashTaskList");
const dashSummary = document.getElementById("dashSummary");
const dashProgressFill = document.getElementById("dashProgressFill");
const dashProgressPercent = document.getElementById("dashProgressPercent");
const dashAddTask = document.getElementById("dashAddTask");

const statTasksCompleted = document.getElementById("statTasksCompleted");
const statGoalsOnTrack = document.getElementById("statGoalsOnTrack");

const dashGoalsContainer = document.querySelector(".goals-card");
const dashGoalsActive = document.querySelector(".active-badge");

const statFocusTime = document.getElementById("statFocusTime");
const statCurrentStreak = document.getElementById("statCurrentStreak");

const lastCompletedEl = document.getElementById("lastCompleted");
const historyCompletedEl = document.getElementById("historyCompleted");
const historyRemainingEl = document.getElementById("historyRemaining");
const historyRateEl = document.getElementById("historyRate");
const historySubtitleEl = document.querySelector(".history-subtitle");

const tooltip = document.getElementById("chartTooltip");
const historyBtns = document.querySelectorAll(".history-btn");
let currentView = "week";

function isToday(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();

    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}

function startOfLocalDay(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getWeeklyCompletedTasks() {
    const now = new Date();

    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return tasks.filter(t => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d >= startOfWeek && d < endOfWeek;
    }).length;
}

function getWeeklyTaskCounts() {
    const counts = Array(7).fill(0);
    const now = new Date();

    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    tasks.forEach(task => {
        if (!task.completedAt) return;
        const d = new Date(task.completedAt);
        if (d >= startOfWeek && d < endOfWeek) {
            const index = (d.getDay() + 6) % 7; // Mon = 0
            counts[index]++;
        }
    });

    return counts;
}

const ctx = document.getElementById("weeklyProgressChart").getContext("2d");
let weeklyChart;
let currentChartType = "line";

function renderWeeklyChart(type = "line") {
    const data = getWeeklyTaskCounts();

    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctx, {
        type,
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
                label: "Tasks Completed",
                data,
                borderColor: "#000",
                backgroundColor:
                    type === "line"
                        ? "rgba(0,0,0,0.08)"
                        : "#000",
                fill: type === "line",
                tension: 0.45,
                borderWidth: 2,
                borderRadius: type === "bar" ? 8 : 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: "#eee" },
                    ticks: { stepSize: 1 }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ========================
// RENDER DASHBOARD TASKS
// ========================
function renderDashboardTasks() {
    dashList.innerHTML = "";

    const todaysTasks = tasks.filter(task => isToday(task.forDate ?? task.createdAt));

    if (todaysTasks.length === 0) {
        dashList.innerHTML = `<p class="empty-state">No tasks for today</p>`;
        dashSummary.textContent = "0 of 0 completed";
        dashProgressFill.style.width = "0%";
        dashProgressPercent.textContent = "0%";
        statTasksCompleted.textContent = "0";
        updateLastCompleted();
        return;
    }

    todaysTasks.forEach(task => {
        const row = document.createElement("div");
        row.classList.add("task");
        if (task.completed) row.classList.add("completed");
        row.dataset.id = task.id;

        row.innerHTML = `
            <div class="task-left">
                <div class="checkbox ${task.completed ? "checked" : ""}"></div>
                <span class="task-text">${task.text}</span>
            </div>
        `;
        dashList.appendChild(row);
    });

    const completed = todaysTasks.filter(t => t.completed).length;
    const total = todaysTasks.length;
    const percent = Math.round((completed / total) * 100);

    dashSummary.textContent = `${completed} of ${total} completed`;
    dashProgressFill.style.width = percent + "%";
    dashProgressPercent.textContent = percent + "%";
    statTasksCompleted.textContent = completed;

    updateLastCompleted();
}


// ========================
// DASHBOARD TASK TOGGLING
// ========================
dashList.addEventListener("click", e => {
    const checkbox = e.target.closest(".checkbox");
    if (!checkbox) return;

    const row = checkbox.closest(".task");
    const taskId = row.dataset.id;

    const task = tasks.find(t => t.id == taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;

    saveTasks();
    renderDashboardTasks();
    updateQuickStats();
    updateChart(currentView);
    renderWeeklyChart(currentChartType);
});

// ========================
// LAST COMPLETED TASK
// ========================
function updateLastCompleted() {
    const completedTasks = tasks.filter(t => t.completed && t.completedAt);
    if (completedTasks.length === 0) {
        lastCompletedEl.textContent = "—";
        return;
    }
    const lastTask = completedTasks.reduce((a, b) =>
        a.completedAt > b.completedAt ? a : b
    );
    lastCompletedEl.textContent = new Date(lastTask.completedAt).toLocaleString();
}

// ========================
// RENDER DASHBOARD GOALS
// ========================
function renderDashboardGoals() {
    [...dashGoalsContainer.children].forEach(child => {
        if (!child.classList.contains("goals-header")) child.remove();
    });

    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.current >= g.target).length;
    statGoalsOnTrack.textContent = `${completedGoals}/${totalGoals}`;

    if (totalGoals === 0) {
        dashGoalsActive.textContent = "0 active";
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No goals added";
        dashGoalsContainer.appendChild(empty);
        return;
    }

    const activeGoals = goals.filter(g => g.current < g.target).length;
    dashGoalsActive.textContent = `${activeGoals} active`;

    goals.forEach(goal => {
        const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
        const div = document.createElement("div");
        div.classList.add("goal-item");

        div.innerHTML = `
            <div class="goal-title">
                <div class="goal-icon"></div>
                ${goal.text}
                <span class="goal-end">${goal.current}/${goal.target}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${percent}%"></div>
            </div>
            <p class="goal-percent">${percent}%</p>
        `;

        dashGoalsContainer.appendChild(div);
    });
}

// ========================
// ADD TASK BUTTON
// ========================
dashAddTask.addEventListener("click", () => {
    window.location.href = "tasks.html";
});

// ========================
// UNIFIED CHART FUNCTION
// ========================
function updateChart(view = "week") {
    const chartContainer = document.querySelector(".history-chart");

    let totalPerSlot = [], completedPerSlot = [], labels = [];
    const now = new Date();

    if (view === "week") {
        totalPerSlot = Array(7).fill(0);
        completedPerSlot = Array(7).fill(0);
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        startOfWeek.setDate(now.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        tasks.forEach(task => {
            const taskDate = new Date(task.forDate ?? task.createdAt);
            taskDate.setHours(0, 0, 0, 0);

            if (taskDate < startOfWeek || taskDate >= endOfWeek) return;

            const index = (taskDate.getDay() + 6) % 7;
            totalPerSlot[index]++;

            if (task.completed && task.completedAt) {
                const completedDate = new Date(task.completedAt);
                completedDate.setHours(0, 0, 0, 0);
                if (completedDate >= startOfWeek && completedDate < endOfWeek) {
                    completedPerSlot[index]++;
                }
            }
        });
    } else {
        totalPerSlot = [0, 0, 0, 0];
        completedPerSlot = [0, 0, 0, 0];

        const year = now.getFullYear();
        const month = now.getMonth();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        const monthName = startOfMonth.toLocaleString("default", { month: "short" });

        const ranges = [
            { start: 1, end: 7 },
            { start: 8, end: 14 },
            { start: 15, end: 21 },
            { start: 22, end: endOfMonth.getDate() }
        ];

        labels = ranges.map(r => `${r.start}–${r.end} ${monthName}`);

        tasks.forEach(task => {
            const refDate = new Date(task.forDate ?? task.createdAt);
            if (refDate.getFullYear() !== year || refDate.getMonth() !== month) return;

            const day = refDate.getDate();
            const index = ranges.findIndex(r => day >= r.start && day <= r.end);
            if (index === -1) return;

            totalPerSlot[index]++;
            if (task.completed) {
                completedPerSlot[index]++;
            }
        });

        historySubtitleEl.textContent = `This month (${monthName})`;
    }

    const maxCompleted = Math.max(...completedPerSlot, 1);

    chartContainer.innerHTML = "";
    totalPerSlot.forEach((total, i) => {
        const completed = completedPerSlot[i] || 0;
        const heightPercent = Math.round((completed / maxCompleted) * 100);
        const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

        const barDiv = document.createElement("div");
        barDiv.className = "chart-bar";
        barDiv.dataset.tooltip = `${labels[i]} • ${completed}/${total} completed (${completionRate}%)`;

        barDiv.innerHTML = `
    <div class="bar-fill" style="height:${heightPercent}%"></div>
    <span>${labels[i]}</span>
`;
        chartContainer.appendChild(barDiv);

        barDiv.addEventListener("mouseenter", () => {
            tooltip.textContent = barDiv.dataset.tooltip;
            requestAnimationFrame(() => tooltip.classList.add("visible"));
            const rect = barDiv.getBoundingClientRect();
            const containerRect = chartContainer.getBoundingClientRect();
            tooltip.style.left = rect.left - containerRect.left + rect.width / 2 + "px";
            tooltip.style.top = rect.top - containerRect.top - 8 + "px";
        });
        barDiv.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
    });

    const totalCompleted = completedPerSlot.reduce((a, b) => a + b, 0);
    const totalTasks = totalPerSlot.reduce((a, b) => a + b, 0);

    historySubtitleEl.textContent = `${totalCompleted} of ${totalTasks} completed`;
    historyCompletedEl.textContent = totalCompleted;
    historyRemainingEl.textContent = totalTasks - totalCompleted;
    historyRateEl.textContent = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) + "%" : "0%";
}

const toggleBtns = document.querySelectorAll(".chart-toggle .toggle");

toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        toggleBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentChartType = btn.textContent === "Bar" ? "bar" : "line";
        renderWeeklyChart(currentChartType);
    });
});

// ========================
// HISTORY VIEW TOGGLE
// ========================
historyBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        historyBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentView = btn.dataset.view;
        updateChart(currentView);
    });
});

let lastKnownDate = new Date().toDateString();

let didMigrateTasks = false;

tasks = tasks.map(task => {
    if (!task.createdAt || isNaN(new Date(task.createdAt))) {
        return { ...task, createdAt: task.id };
    }
    return task;
});

if (!didMigrateTasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    didMigrateTasks = true;
}

setInterval(() => {
    const now = new Date();
    if (now.toDateString() !== lastKnownDate) {
        lastKnownDate = now.toDateString();
        renderDashboardTasks();
        updateQuickStats();
        updateChart(currentView);
    }
}, 60 * 1000);

// ========================
// QUICK STATS (DYNAMIC)
// ========================
function updateQuickStats() {
    statTasksCompleted.textContent = getWeeklyCompletedTasks();
    statFocusTime.textContent = "0h";
    if (!tasks.length) {
        statCompletionRate.textContent = "0%";
        statAvgPerDay.textContent = "0";
        statBestDay.textContent = "—";
        statLongestStreak.textContent = "0 days";
        return;
    }

    // -------- Completion Rate --------
    const completedCount = tasks.filter(t => t.completed).length;
    const completionRate = Math.round((completedCount / tasks.length) * 100);
    statCompletionRate.textContent = `${completionRate}%`;

    // -------- Avg Tasks / Day --------
    const tasksByDay = {};
    tasks.forEach(t => {
        const d = new Date(t.createdAt);
        const key = d.toISOString().split("T")[0];
        tasksByDay[key] = (tasksByDay[key] || 0) + 1;
    });

    const activeDays = Object.keys(tasksByDay).length;
    const avgPerDay = activeDays
        ? (tasks.length / activeDays).toFixed(1)
        : "0";

    statAvgPerDay.textContent = avgPerDay;

    // -------- Best Day --------
    const dayStats = [
        { completed: 0, total: 0 }, // Sun
        { completed: 0, total: 0 }, // Mon
        { completed: 0, total: 0 }, // Tue
        { completed: 0, total: 0 }, // Wed
        { completed: 0, total: 0 }, // Thu
        { completed: 0, total: 0 }, // Fri
        { completed: 0, total: 0 }  // Sat
    ];

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    tasks.forEach(t => {
        const refDate = new Date(t.forDate ?? t.createdAt);
        refDate.setHours(0, 0, 0, 0);

        if (refDate < startOfWeek || refDate >= endOfWeek) return;

        const weekday = refDate.getDay();
        dayStats[weekday].total++;

        if (t.completed) {
            dayStats[weekday].completed++;
        }
    });

    let bestDayIndex = -1;

    dayStats.forEach((stat, index) => {
        if (stat.completed === 0) return;

        if (
            bestDayIndex === -1 ||
            stat.completed > dayStats[bestDayIndex].completed ||
            (
                stat.completed === dayStats[bestDayIndex].completed &&
                stat.total > dayStats[bestDayIndex].total
            )
        ) {
            bestDayIndex = index;
        }
    });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    statBestDay.textContent =
        bestDayIndex !== -1 ? dayNames[bestDayIndex] : "—";

    // -------- Longest Streak --------
    const completedDays = new Set(
        tasks
            .filter(t => t.completedAt)
            .map(t => {
                const d = new Date(t.completedAt);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            })
    );

    const sortedDays = [...completedDays].sort((a, b) => a - b);

    let longest = 0;
    let current = 0;

    for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0 || sortedDays[i] - sortedDays[i - 1] === 86400000) {
            current++;
        } else {
            current = 1;
        }
        longest = Math.max(longest, current);
    }

    statLongestStreak.textContent = `${longest} days`;
    statCurrentStreak.textContent = longest;
}

// ========================
// INITIAL RENDER
// ========================
saveTasks();
renderDashboardTasks();
updateQuickStats();
updateChart(currentView);
renderWeeklyChart(currentChartType);