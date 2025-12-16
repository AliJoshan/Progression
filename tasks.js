let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];

goals = goals.map(goal => {
    if (typeof goal.current !== "number" || typeof goal.target !== "number") {
        return {
            ...goal,
            current: 0,
            target: 1
        };
    }
    return goal;
});
localStorage.setItem("goals", JSON.stringify(goals));

const addBtn = document.querySelector(".add-btn");
const addInput = document.querySelector(".add-task-box input");
const tasksList = document.querySelector(".tasks-list");
const summary = document.querySelector(".summary");

const addGoalBtn = document.querySelector(".add-goal-btn");
const addGoalInput = document.querySelector(".add-goal-box input");
const goalsList = document.querySelector(".goals-list");
const goalSummary = document.querySelector(".goal-summary");

const tabs = document.querySelectorAll(".tab");
const addTaskBox = document.querySelector(".add-task-box");
const taskContainer = document.querySelector(".task-container");
const goalsContainer = document.querySelector(".goals-container");

const params = new URLSearchParams(window.location.search);
const initialTab = params.get("tab");

const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const totalGoalsEl = document.getElementById("totalGoals");
const completedGoalsEl = document.getElementById("completedGoals");
const emptyState = document.getElementById("emptyState");
const emptyText = document.getElementById("emptyText");

// ====== SAVE TO STORAGE ======
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
function saveGoals() {
    localStorage.setItem("goals", JSON.stringify(goals));
}

tasks = tasks.map(task => ({
    ...task,
    createdAt: task.createdAt ?? task.id, // fallback to task.id if no createdAt
    completedAt: task.completed
        ? (task.completedAt ?? task.createdAt ?? task.id) // fallback properly
        : null
}));


saveTasks();

// ====== UPDATE STATS ======
function updateStats() {
    totalTasksEl.textContent = tasks.length;
    completedTasksEl.textContent = tasks.filter(t => t.completed).length;
    totalGoalsEl.textContent = goals.length;
    completedGoalsEl.textContent =
        goals.filter(g => g.current >= g.target).length;
}

// ====== RENDER TASKS ======
function renderTasks() {
    tasksList.innerHTML = "";

    const visibleTasks = tasks.filter(isTaskInTimeline);

    if (visibleTasks.length === 0) {
        emptyState.style.display = "flex";
        tasksList.style.display = "none";

        emptyText.textContent =
            timelineView === "week"
                ? "No tasks for this week. Add your first task above!"
                : "No tasks for this month. Add your first task above!";

    } else {
        emptyState.style.display = "none";
        tasksList.style.display = "block";

        tasks.filter(isTaskInTimeline).forEach(task => {
            const row = document.createElement("div");
            row.classList.add("task-row");
            row.dataset.id = task.id;

            row.innerHTML = `
                <label class="custom-checkbox">
                    <input type="checkbox" ${task.completed ? "checked" : ""}>
                    <span class="checkmark"></span>
                </label>
                <span class="task-text ${task.completed ? "completed" : ""}">
                    ${task.text}
                </span>
                <div class="actions">
                    <button class="edit">✎</button>
                    <button class="delete">🗑</button>
                </div>
            `;
            tasksList.appendChild(row);
        });
    }
    summary.textContent = `${visibleTasks.filter(t => t.completed).length} of ${visibleTasks.length} completed`;
    updateStats();
}

// ====== RENDER GOALS ======
function renderGoals() {
    goalsList.innerHTML = "";

    goals.forEach(goal => {
        const row = document.createElement("div");
        row.classList.add("goal-row");
        row.dataset.id = goal.id;

        const percent = Math.min(
            100,
            Math.round((goal.current / goal.target) * 100)
        );

        row.innerHTML = `
            <div class="goal-main">
                <h4 class="goal-title">${goal.text}</h4>
                <p class="goal-progress-text">
                    Progress: ${goal.current} / ${goal.target}
                </p>

                <div class="progress-bar">
                    <div class="progress-fill" style="width:${percent}%"></div>
                </div>
            </div>

            <div class="goal-actions">
                <span class="goal-percent">${percent}%</span>
                <button class="increment-btn">+ Increment</button>
                <button class="edit">✎</button>
                <button class="delete">🗑</button>
            </div>
        `;

        goalsList.appendChild(row);
    });

    const achieved = goals.filter(g => g.current >= g.target).length;
    goalSummary.textContent = `${achieved} of ${goals.length} achieved`;

    updateStats();
}

function isTaskInTimeline(task) {
    const date = new Date(task.createdAt);

    if (timelineView === "week") {
        const start = new Date(timelineDate);
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        return date >= start && date < end;
    }

    return (
        date.getFullYear() === timelineDate.getFullYear() &&
        date.getMonth() === timelineDate.getMonth()
    );
}


function activateTab(index) {
    tabs.forEach(t => t.classList.remove("active"));
    tabs[index].classList.add("active");

    if (index === 0) {
        addTaskBox.style.display = "flex";
        taskContainer.style.display = "block";
        goalsContainer.style.display = "none";
    } else {
        addTaskBox.style.display = "none";
        taskContainer.style.display = "none";
        goalsContainer.style.display = "block";
    }
}

// On page load
if (initialTab === "goals") {
    activateTab(1);
} else {
    activateTab(0);
}

// ====== ENTER KEY HANDLING ======
addInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        addBtn.click();
    }
});

addGoalBtn.addEventListener("click", () => {
    const text = addGoalInput.value.trim();
    if (!text) return;

    let target;

    while (true) {
        const input = prompt("Enter target number (e.g. 5):");

        // User clicked Cancel
        if (input === null) return;

        target = Number(input);

        // Valid number check
        if (Number.isInteger(target) && target > 0) {
            break;
        }

        alert("Please enter a valid positive number.");
    }

    goals.push({
        id: Date.now(),
        text,
        current: 0,
        target
    });

    addGoalInput.value = "";
    saveGoals();
    renderGoals();
});

addGoalInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        addGoalBtn.click();
    }
});

// ====== TASK ACTIONS ======
tasksList.addEventListener("click", e => {
    const row = e.target.closest(".task-row");
    if (!row) return;
    const id = Number(row.dataset.id);

    if (e.target.type === "checkbox") {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        if (e.target.checked) {
            task.completed = true;
            task.completedAt = Date.now();
        } else {
            task.completed = false;
            task.completedAt = null;
        }

        saveTasks();
        renderTasks();
    }

    if (e.target.classList.contains("delete")) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }

    if (e.target.classList.contains("edit")) {
        const task = tasks.find(t => t.id === id);
        const newText = prompt("Edit task:", task.text);
        if (newText && newText.trim()) {
            task.text = newText.trim();
            saveTasks();
            renderTasks();
        }
    }
});

// ====== GOAL ACTIONS ======
goalsList.addEventListener("click", e => {
    const row = e.target.closest(".goal-row");
    if (!row) return;

    const id = Number(row.dataset.id);
    const goal = goals.find(g => g.id === id);

    if (e.target.classList.contains("increment-btn")) {
        if (goal.current < goal.target) {
            goal.current++;
            saveGoals();
            renderGoals();
        }
    }

    if (e.target.classList.contains("delete")) {
        goals = goals.filter(g => g.id !== id);
        saveGoals();
        renderGoals();
    }

    if (e.target.classList.contains("edit")) {
        const newText = prompt("Edit goal:", goal.text);
        if (newText && newText.trim()) {
            goal.text = newText.trim();
            saveGoals();
            renderGoals();
        }
    }
});


// ====== TAB SWITCHING ======
tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
        activateTab(index);
    });
});


// --- State ---
let timelineView = "week";
let timelineDate = new Date();

renderTasks();
renderGoals();

/* ======================================================
   TIMELINE VIEW (WEEK / MONTH)
   ====================================================== */

// --- Elements ---
const timelineViewBtns = document.querySelectorAll(".view-btn");
const weekView = document.getElementById("weekView");
const monthView = document.getElementById("monthView");
const dateRangeEl = document.getElementById("dateRange");
const todayBtn = document.getElementById("todayBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const weekProgress = document.getElementById("weekProgress");
const monthProgress = document.getElementById("monthProgress");

// --- Helpers ---
function formatWeekRange(date) {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - 
            ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function formatMonthYear(date) {
    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });
}

// --- Render ---
function renderTimeline() {
    const now = new Date();

    if (timelineView === "week") {
        weekView.style.display = "block";
        monthView.style.display = "none";

        dateRangeEl.textContent = formatWeekRange(timelineDate);
        weekProgress.textContent = "0 of 0 tasks completed this week";

        const startOfWeek = new Date(timelineDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        const startOfCurrentWeek = new Date(now);
        startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - startOfCurrentWeek.getDay() + 1);

        todayBtn.style.display = startOfWeek.getTime() === startOfCurrentWeek.getTime() ? "none" : "inline-block";

    } else {
        weekView.style.display = "none";
        monthView.style.display = "block";

        dateRangeEl.textContent = formatMonthYear(timelineDate);
        const monthName = timelineDate.toLocaleDateString("en-US", { month: "long" });
        monthProgress.textContent = `0 of 0 tasks completed in ${monthName}`;

        todayBtn.style.display = (timelineDate.getMonth() === now.getMonth() && timelineDate.getFullYear() === now.getFullYear())
            ? "none"
            : "inline-block";
    }
    renderTasks();
}


// --- View Switching ---
timelineViewBtns.forEach(btn => {
    btn.addEventListener("click", () => {

        timelineViewBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        timelineView = btn.dataset.view;
        renderTimeline();
    });
});

// --- Navigation ---
prevBtn.addEventListener("click", () => {
    if (timelineView === "week") {
        timelineDate.setDate(timelineDate.getDate() - 7);
    } else {
        timelineDate.setMonth(timelineDate.getMonth() - 1);
    }
    renderTimeline();
});

nextBtn.addEventListener("click", () => {
    if (timelineView === "week") {
        timelineDate.setDate(timelineDate.getDate() + 7);
    } else {
        timelineDate.setMonth(timelineDate.getMonth() + 1);
    }
    renderTimeline();
});

todayBtn.addEventListener("click", () => {
    timelineDate = new Date();
    renderTimeline();
});



addBtn.addEventListener("click", () => {
    const text = addInput.value.trim();
    if (!text) return;

    tasks.push({
        id: Date.now(),
        text,
        completed: false,
        createdAt: Date.now(),
        completedAt: null
    });

    addInput.value = "";
    saveTasks();
    renderTasks();
});

let lastKnownDate = new Date().toDateString();

setInterval(() => {
    const now = new Date();
    if (now.toDateString() !== lastKnownDate) {
        lastKnownDate = now.toDateString();
        timelineDate = new Date(); // jump to today
        renderTimeline();
    }
}, 60 * 1000); // check every minute

// --- Init ---
renderTimeline();
