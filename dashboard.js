// ========================
// DASHBOARD DATA (READ-ONLY)
// ========================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

tasks = tasks.map(task => ({
    ...task,
    createdAt: task.createdAt ?? task.id,
    completedAt: task.completed
        ? (task.completedAt ?? task.createdAt ?? task.id)
        : null
}));

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

const lastCompletedEl = document.getElementById("lastCompleted");
const historyCompletedEl = document.getElementById("historyCompleted");
const historyRemainingEl = document.getElementById("historyRemaining");
const historyRateEl = document.getElementById("historyRate");
const historySubtitleEl = document.querySelector(".history-subtitle");

const tooltip = document.getElementById("chartTooltip");
const chartBars = document.querySelectorAll(".chart-bar");
const historyBtns = document.querySelectorAll(".history-btn");
let currentView = "week";

// ========================
// RENDER DASHBOARD TASKS
// ========================
function renderDashboardTasks() {
    dashList.innerHTML = "";

    if (tasks.length === 0) {
        dashList.innerHTML = `<p class="empty-state">No tasks added</p>`;
        dashSummary.textContent = "0 of 0 completed";
        dashProgressFill.style.width = "0%";
        dashProgressPercent.textContent = "0%";
        statTasksCompleted.textContent = "0";
        updateLastCompleted();
        return;
    }

    tasks.forEach(task => {
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

    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
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
    updateChart(currentView);
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
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const chartContainer = document.querySelector(".history-chart");

    let totalPerSlot = [], completedPerSlot = [], labels = [];
    const now = new Date();

    if (view === "week") {
        totalPerSlot = Array(7).fill(0);
        completedPerSlot = Array(7).fill(0);
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        tasks.forEach(task => {
            if (!task.createdAt) return;
            const created = new Date(task.createdAt);
            if (created < startOfWeek || created >= endOfWeek) return;

            const index = (created.getDay() + 6) % 7;
            totalPerSlot[index]++;
            if (task.completed && task.completedAt) {
                const completed = new Date(task.completedAt);
                if (completed >= startOfWeek && completed < endOfWeek) completedPerSlot[index]++;
            }
        });

    } else {
        totalPerSlot = [0, 0, 0, 0];
        completedPerSlot = [0, 0, 0, 0];
        labels = ["Week 1", "Week 2", "Week 3", "Week 4"];

        const startOfMonth = new Date(now);
        startOfMonth.setDate(now.getDate() - 29);
        startOfMonth.setHours(0, 0, 0, 0);

        tasks.forEach(task => {
            if (!task.createdAt) return;
            const created = new Date(task.createdAt);
            if (created < startOfMonth || created > now) return;

            const diffDays = Math.floor((created - startOfMonth) / (1000 * 60 * 60 * 24));
            const index = Math.min(Math.floor(diffDays / 7), 3);

            totalPerSlot[index]++;
            if (task.completed && task.completedAt) {
                const completed = new Date(task.completedAt);
                if (completed >= startOfMonth && completed <= now) completedPerSlot[index]++;
            }
        });
    }

    chartContainer.innerHTML = "";

    totalPerSlot.forEach((total, i) => {
        const completed = completedPerSlot[i] || 0;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        const barDiv = document.createElement("div");
        barDiv.className = "chart-bar";
        barDiv.dataset.tooltip = `${labels[i]} • ${completed}/${total} completed (${percent}%)`;

        barDiv.innerHTML = `<div class="bar-fill" style="height:${percent}%"></div><span>${labels[i]}</span>`;
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

// ========================
// CHART TOOLTIP EVENTS
// ========================
chartBars.forEach(bar => {
    bar.addEventListener("mouseenter", () => {
        const text = bar.dataset.tooltip;
        if (!text) return;
        tooltip.textContent = text;
        requestAnimationFrame(() => tooltip.classList.add("visible"));

        const rect = bar.getBoundingClientRect();
        const containerRect = bar.parentElement.getBoundingClientRect();
        tooltip.style.left = rect.left - containerRect.left + rect.width / 2 + "px";
        tooltip.style.top = rect.top - containerRect.top - 8 + "px";
    });

    bar.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
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

// ========================
// INITIAL RENDER
// ========================
renderDashboardTasks();
renderDashboardGoals();
updateChart(currentView);
