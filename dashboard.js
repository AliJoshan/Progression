let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];

const dashList = document.getElementById("dashTaskList");
const dashSummary = document.getElementById("dashSummary");
const dashProgressFill = document.getElementById("dashProgressFill");
const dashProgressPercent = document.getElementById("dashProgressPercent");
const dashAddTask = document.getElementById("dashAddTask");

const statTasksCompleted = document.getElementById("statTasksCompleted");
const statGoalsOnTrack = document.getElementById("statGoalsOnTrack");

const dashGoalsContainer = document.querySelector(".goals-card");
const dashGoalsList = document.querySelector(".goals-card");
const dashGoalsActive = document.querySelector(".active-badge");


function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderDashboardTasks() {
    dashList.innerHTML = "";

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

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    dashProgressFill.style.width = percent + "%";
    dashProgressPercent.textContent = percent + "%";

    statTasksCompleted.textContent = completed;
    statGoalsOnTrack.textContent = `${completed}/${total}`;
}

function renderDashboardGoals() {
    const container = document.querySelector(".goals-card");

    [...container.children].forEach(child => {
        if (!child.classList.contains("goals-header")) {
            child.remove();
        }
    });

    const activeGoals = goals.filter(g => !g.completed).length;
    dashGoalsActive.textContent = `${activeGoals} active`;

    goals.forEach(goal => {
        const progress = goal.completed ? 100 : 0;
        const statusText = goal.completed ? "Completed" : "0%";

        const div = document.createElement("div");
        div.classList.add("goal-item");

        div.innerHTML = `
            <div class="goal-title">
                <div class="goal-icon"></div>
                ${goal.text}
                <span class="goal-end">${statusText}</span>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width:${progress}%"></div>
            </div>

            <p class="goal-percent">${progress}%</p>
        `;

        container.appendChild(div);
    });
}

dashList.addEventListener("click", e => {
    const row = e.target.closest(".task");
    if (!row) return;

    const id = Number(row.dataset.id);
    const task = tasks.find(t => t.id === id);

    task.completed = !task.completed;
    saveTasks();
    renderDashboardTasks();
});

dashAddTask.addEventListener("click", () => {
    window.location.href = "tasks.html";
});

renderDashboardTasks();
renderDashboardGoals();