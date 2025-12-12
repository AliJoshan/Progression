let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const dashList = document.getElementById("dashTaskList");
const dashSummary = document.getElementById("dashSummary");
const dashProgressFill = document.getElementById("dashProgressFill");
const dashProgressPercent = document.getElementById("dashProgressPercent");
const dashAddTask = document.getElementById("dashAddTask");

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
