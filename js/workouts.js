document.addEventListener("DOMContentLoaded", initWorkoutsPage);

const workoutsState = {
   all: [],
   filters: {
      level: "all"
   }
};

async function initWorkoutsPage() {
   const user = await requireAuth("/login.html");
   if (!user) return;

   if (window.WorkoutsFilters && typeof window.WorkoutsFilters.init === "function") {
      window.WorkoutsFilters.init();
   }

   await loadWorkouts();
}

async function loadWorkouts() {
   const grid = document.getElementById("workoutsGrid");

   try {
      const data = await api("/trainings");

      workoutsState.all = Array.isArray(data?.trainings) ? data.trainings : [];

      applyFilters();

   } catch (error) {
      console.error("Workouts loading error:", error);

      if (grid) {
         grid.innerHTML = `
            <div class="workouts-empty">
               <p class="workouts-empty__text">Failed to load workouts.</p>
            </div>
         `;
      }
   }
}

function updateFilters(nextFilters = {}) {
   workoutsState.filters = {
      ...workoutsState.filters,
      ...nextFilters
   };

   applyFilters();
}

function resetWorkoutFilters() {
   workoutsState.filters = {
      level: "all"
   };

   applyFilters();
}

function applyFilters() {
   const { all, filters } = workoutsState;

   const filteredWorkouts = all.filter((workout) => {
      const level = String(workout.difficulty_level || "").toLowerCase();

      const matchesLevel =
         filters.level === "all" || level === filters.level;

      return matchesLevel;
   });

   renderWorkouts(filteredWorkouts);
}

function renderWorkouts(workouts) {
   const grid = document.getElementById("workoutsGrid");

   if (!grid) return;

   if (!workouts.length) {
      grid.innerHTML = `
         <div class="workouts-empty">
            <p class="workouts-empty__text">No workouts found.</p>
         </div>
      `;
      return;
   }

   grid.innerHTML = workouts.map(createWorkoutCard).join("");
}

function createWorkoutCard(workout) {
   const imageSrc = workout.image_url || "./img/workouts/placeholder.png";

   return `
      <article class="workout-card">
         <a href="workout.html?id=${workout.id}" class="workout-card__image">
            <img
               src="${imageSrc}"
               alt="${workout.name}"
               onerror="this.onerror=null;this.src='./img/workouts/placeholder.png';"
            >
         </a>

         <div class="workout-card__body">
            <h2 class="workout-card__title">
               <a href="workout.html?id=${workout.id}" class="workout-card__link">
                  ${workout.name}
               </a>
            </h2>

            <p class="workout-card__meta">
               <span class="workout-card__label">Level:</span>
               <span class="workout-card__value">${workout.difficulty_level}</span>
            </p>

            <p class="workout-card__meta">
               <span class="workout-card__label">Description:</span>
               <span class="workout-card__value">${workout.description || "No description"}</span>
            </p>
         </div>
      </article>
   `;
}

window.WorkoutsPage = {
   state: workoutsState,
   updateFilters,
   resetWorkoutFilters,
   applyFilters
};