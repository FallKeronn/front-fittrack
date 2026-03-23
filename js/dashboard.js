let dashboardChartInstance = null;

document.addEventListener("DOMContentLoaded", initDashboardPage);

async function initDashboardPage() {
   initWeeklyTrainingDrag();

   const user = await requireAuth("/login.html");
   if (!user) return;

   handleStripeRedirectStatus();
   await loadDashboard();
}

function handleStripeRedirectStatus() {
   const params = new URLSearchParams(window.location.search);
   const isSuccess = params.get("success") === "true";
   const isCanceled = params.get("canceled") === "true";

   if (isSuccess) {
      alert("Welcome to FitTrack Pro!");
      clearDashboardQueryParams();
      return;
   }

   if (isCanceled) {
      alert("Checkout canceled. You have not been charged.");
      clearDashboardQueryParams();
   }
}

function clearDashboardQueryParams() {
   window.history.replaceState({}, document.title, window.location.pathname);
}

async function loadDashboard() {
   try {
      const [overview, calendar, recentHistory, volumeChart] = await Promise.all([
         api("/dashboard/overview"),
         api("/dashboard/calendar"),
         api("/dashboard/recent-history"),
         api("/analytics/charts/volume")
      ]);

      renderGreeting(overview?.user);
      renderTodayWorkout(overview?.todays_workout);
      renderWeeklyTraining(Array.isArray(calendar) ? calendar : []);
      renderRecentSessions(Array.isArray(recentHistory) ? recentHistory : []);
      renderProgressChart(volumeChart);
   } catch (error) {
      console.error("Dashboard loading error:", error);
   }
}

function renderGreeting(user) {
   const greetingElement = document.getElementById("dashboardGreeting");
   const subtitleElement = document.getElementById("dashboardSubtitle");

   if (greetingElement) {
      greetingElement.textContent = `Hello, ${user?.name || "User"}!`;
   }

   if (subtitleElement) {
      const level = user?.biometrics?.experience_level || "your next";
      subtitleElement.textContent = `Ready for ${String(level).toLowerCase()} training?`;
   }
}

function renderTodayWorkout(workout) {
   const nameElement = document.getElementById("todayWorkoutName");
   const metaElement = document.getElementById("todayWorkoutWeight");
   const imageElement = document.getElementById("todayWorkoutImage");
   const buttonElement = document.getElementById("todayWorkoutButton");

   if (!nameElement || !metaElement || !imageElement || !buttonElement) return;

   if (!workout) {
      nameElement.textContent = "No workout scheduled today";
      metaElement.textContent = "Take a rest day or explore available trainings.";
      imageElement.src = "./img/dashboard/bench-press.jpg";
      imageElement.alt = "No workout scheduled";
      buttonElement.textContent = "Browse Trainings";
      buttonElement.href = "workouts.html";
      return;
   }

   nameElement.textContent = workout.name || "Workout";
   metaElement.textContent = `${workout.difficulty || "Unknown"} • ${workout.status || "pending"}`;
   imageElement.src = "./img/dashboard/bench-press.jpg";
   imageElement.alt = workout.name || "Today workout";
   buttonElement.textContent = workout.status === "completed" ? "View Workout" : "Start Workout";
   buttonElement.href = `workout.html?id=${workout.training_id}&scheduled_workout_id=${workout.scheduled_workout_id}`;
}

function renderWeeklyTraining(days) {
   const container = document.getElementById("weeklyTrainingList");

   if (!container) return;

   container.innerHTML = "";

   if (!days.length) {
      container.innerHTML = "<p>No weekly training data.</p>";
      return;
   }

   days.forEach((day) => {
      const card = document.createElement("article");
      card.className = "training-day";

      if (day.is_today) {
         card.classList.add("training-day--active");
      }

      const shortWeekday = formatWeekdayShort(day.day_name);
      const dayNumber = formatDayNumber(day.date);
      const trainingLabel = day.training ? simplifyTrainingName(day.training.name) : "Rest";
      const isDone = day.status === "completed";
      const showChangeButton = Boolean(day.is_today);

      card.innerHTML = `
         <span class="training-day__weekday">${escapeHtml(shortWeekday)}</span>
         <span class="training-day__date">${escapeHtml(dayNumber)}</span>
         <span class="training-day__type">${escapeHtml(trainingLabel)}</span>
         ${showChangeButton
            ? `<a href="workouts.html" class="training-day__action">change</a>`
            : `<span class="training-day__status ${isDone ? "training-day__status--done" : ""}"></span>`
         }
      `;

      container.appendChild(card);
   });
}

function renderRecentSessions(sessions) {
   const container = document.getElementById("recentSessionsList");

   if (!container) return;

   container.innerHTML = "";

   if (!sessions.length) {
      container.innerHTML = "<p>No recent sessions yet.</p>";
      return;
   }

   sessions.forEach((session) => {
      const item = document.createElement("article");
      item.className = "session-item";

      item.innerHTML = `
         <div class="session-item__info">
            <h3 class="session-item__title">${escapeHtml(session.training_name || "Workout session")}</h3>
            <p class="session-item__date">${escapeHtml(session.date || "-")}</p>
         </div>

         <div class="session-item__meta">
            <span class="session-item__value">${formatDuration(session.duration_minutes)}</span>
            <span class="session-item__label">duration</span>
         </div>
      `;

      container.appendChild(item);
   });
}

function renderProgressChart(chartData) {
   const canvas = document.getElementById("progressChart");
   if (!canvas || typeof Chart === "undefined") return;

   const labels = Array.isArray(chartData?.labels) ? chartData.labels : [];
   const data = Array.isArray(chartData?.data) ? chartData.data : [];

   destroyDashboardChart();

   if (!labels.length || !data.length || !hasNonZeroValues(data)) {
      renderProgressChartMessage("No progress data yet.");
      return;
   }

   dashboardChartInstance = new Chart(canvas, {
      type: "line",
      data: {
         labels,
         datasets: [
            {
               label: "Volume (kg)",
               data,
               borderColor: "#7c8df6",
               backgroundColor: "rgba(124, 141, 246, 0.10)",
               borderWidth: 3,
               tension: 0.35,
               fill: false,
               pointRadius: 4,
               pointHoverRadius: 6,
               pointBackgroundColor: "#7c8df6",
               pointBorderColor: "#ffffff",
               pointBorderWidth: 2
            }
         ]
      },
      options: {
         responsive: true,
         maintainAspectRatio: false,
         layout: {
            padding: {
               top: 8,
               right: 8,
               bottom: 0,
               left: 8
            }
         },
         plugins: {
            legend: {
               display: false
            },
            tooltip: {
               backgroundColor: "#111111",
               titleColor: "#ffffff",
               bodyColor: "#ffffff",
               displayColors: false,
               callbacks: {
                  label(context) {
                     return `${formatNumber(context.raw)} kg`;
                  }
               }
            }
         },
         scales: {
            x: {
               grid: {
                  display: false,
                  drawBorder: false
               },
               ticks: {
                  color: "#7b8190",
                  font: {
                     size: 12
                  }
               }
            },
            y: {
               beginAtZero: true,
               grid: {
                  color: "rgba(17, 17, 17, 0.08)",
                  drawBorder: false
               },
               ticks: {
                  color: "#7b8190",
                  font: {
                     size: 12
                  },
                  callback(value) {
                     return formatNumber(value);
                  }
               }
            }
         }
      }
   });
}

function destroyDashboardChart() {
   if (!dashboardChartInstance) return;

   dashboardChartInstance.destroy();
   dashboardChartInstance = null;
}

function renderProgressChartMessage(message) {
   const canvas = document.getElementById("progressChart");
   const wrapper = canvas?.parentElement;

   if (!wrapper) return;

   wrapper.innerHTML = `
      <div class="progress-card__empty">
         ${escapeHtml(message)}
      </div>
   `;
}

function hasNonZeroValues(values) {
   return values.some((value) => Number(value) > 0);
}

function formatDuration(minutes) {
   if (minutes == null) return "--";
   return `${Math.round(minutes)} min`;
}

function formatNumber(value) {
   return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0
   }).format(Number(value) || 0);
}

function formatWeekdayShort(dayName) {
   if (!dayName) return "-";

   const map = {
      Monday: "MON",
      Tuesday: "TUE",
      Wednesday: "WED",
      Thursday: "THU",
      Friday: "FRI",
      Saturday: "SAT",
      Sunday: "SUN"
   };

   return map[dayName] || dayName.slice(0, 3).toUpperCase();
}

function formatDayNumber(dateString) {
   if (!dateString) return "-";

   const date = new Date(dateString);
   if (Number.isNaN(date.getTime())) return "-";

   return String(date.getDate());
}

function simplifyTrainingName(name) {
   if (!name) return "Rest";

   if (name.includes("Push")) return "Push";
   if (name.includes("Pull")) return "Pull";
   if (name.includes("Leg")) return "Leg";
   if (name.includes("Upper")) return "Upper";
   if (name.includes("Lower")) return "Lower";
   if (name.includes("Core")) return "Core";
   if (name.includes("Full Body")) return "Full Body";

   return name;
}

function initWeeklyTrainingDrag() {
   const track = document.querySelector(".weekly-training__track");
   if (!track) return;

   let isDown = false;
   let startX = 0;
   let scrollLeft = 0;

   track.addEventListener("mousedown", (event) => {
      isDown = true;
      track.classList.add("is-dragging");
      startX = event.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
   });

   track.addEventListener("mouseleave", () => {
      isDown = false;
      track.classList.remove("is-dragging");
   });

   track.addEventListener("mouseup", () => {
      isDown = false;
      track.classList.remove("is-dragging");
   });

   track.addEventListener("mousemove", (event) => {
      if (!isDown) return;

      event.preventDefault();

      const x = event.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.2;
      track.scrollLeft = scrollLeft - walk;
   });
}

function escapeHtml(value) {
   return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
}