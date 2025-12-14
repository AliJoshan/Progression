// ========================
// DASHBOARD DATA
// ========================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];

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

// ========================
// SAVE TASKS TO LOCALSTORAGE
// ========================
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ========================
// RENDER TASKS
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

    dashSummary.textContent = `${completed} of ${total} completed`;
    const percent = Math.round((completed / total) * 100);
    dashProgressFill.style.width = percent + "%";
    dashProgressPercent.textContent = percent + "%";

    statTasksCompleted.textContent = completed;

    updateLastCompleted();
}

// ========================
// TASK CHECKBOX TOGGLE
// ========================
dashList.addEventListener("click", e => {
    if (!e.target.classList.contains("checkbox")) return;

    const row = e.target.closest(".task");
    const id = row.dataset.id;
    const task = tasks.find(t => t.id == id);

    if (!task) return;

    task.completed = !task.completed;
    if (task.completed && !task.completedAt) task.completedAt = Date.now();

    saveTasks();
    renderDashboardTasks();
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
    const lastTask = completedTasks.reduce((a, b) => (a.completedAt > b.completedAt ? a : b));
    const date = new Date(lastTask.completedAt);
    lastCompletedEl.textContent = date.toLocaleString();
}

// ========================
// RENDER GOALS
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
        const percent = Math.min(
            100,
            Math.round((goal.current / goal.target) * 100)
        );

        const div = document.createElement("div");
        div.classList.add("goal-item");

        div.innerHTML = `
            <div class="goal-title">
                <div class="goal-icon"></div>
                ${goal.text}
                <span class="goal-end">
                    ${goal.current}/${goal.target}
                </span>
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
// INITIAL RENDER
// ========================
renderDashboardTasks();
renderDashboardGoals();
