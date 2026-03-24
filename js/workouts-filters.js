window.WorkoutsFilters = {
   init
};

function init() {
   renderFilters();
   bindFilterToggle();
   bindFilterEvents();
}

function renderFilters() {
   const filtersContainer = document.getElementById("workoutsFilters");

   if (!filtersContainer) return;

   filtersContainer.innerHTML = `
      <div class="filters-panel">
         <div class="filters-panel__field">
            <label class="filters-panel__label" for="levelFilter">
               Level
            </label>
            <select class="filters-panel__select" id="levelFilter">
               <option value="all">All levels</option>
               <option value="beginner">Beginner</option>
               <option value="intermediate">Intermediate</option>
               <option value="advanced">Advanced</option>
            </select>
         </div>

         <div class="filters-panel__actions">
            <button
               class="filters-panel__reset"
               type="button"
               id="resetFiltersBtn"
            >
               Reset filters
            </button>
         </div>
      </div>
   `;
}

function bindFilterToggle() {
   const toggleButton = document.querySelector(".workouts-page__filter");
   const filtersContainer = document.getElementById("workoutsFilters");

   if (!toggleButton || !filtersContainer) return;

   toggleButton.setAttribute("aria-expanded", "false");

   toggleButton.addEventListener("click", function (event) {
      event.stopPropagation();

      const isOpen = filtersContainer.classList.toggle("is-open");
      toggleButton.setAttribute("aria-expanded", String(isOpen));
   });

   filtersContainer.addEventListener("click", function (event) {
      event.stopPropagation();
   });

   document.addEventListener("click", function () {
      closeFiltersPanel();
   });
}

function bindFilterEvents() {
   const filtersContainer = document.getElementById("workoutsFilters");

   if (!filtersContainer) return;

   filtersContainer.addEventListener("change", function (event) {
      if (event.target.id === "levelFilter") {
         if (window.WorkoutsPage && typeof window.WorkoutsPage.updateFilters === "function") {
            window.WorkoutsPage.updateFilters({
               level: event.target.value
            });
         }
      }
   });

   filtersContainer.addEventListener("click", function (event) {
      const resetButton = event.target.closest("#resetFiltersBtn");

      if (!resetButton) return;

      resetFilterControls();

      if (
         window.WorkoutsPage &&
         typeof window.WorkoutsPage.resetWorkoutFilters === "function"
      ) {
         window.WorkoutsPage.resetWorkoutFilters();
      }

      closeFiltersPanel();
   });
}

function resetFilterControls() {
   const levelFilter = document.getElementById("levelFilter");

   if (levelFilter) {
      levelFilter.value = "all";
   }
}

function closeFiltersPanel() {
   const filtersContainer = document.getElementById("workoutsFilters");
   const toggleButton = document.querySelector(".workouts-page__filter");

   if (filtersContainer) {
      filtersContainer.classList.remove("is-open");
   }

   if (toggleButton) {
      toggleButton.setAttribute("aria-expanded", "false");
   }
}