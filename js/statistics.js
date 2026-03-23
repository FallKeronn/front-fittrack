let volumeChartInstance = null;
let muscleChartInstance = null;

document.addEventListener("DOMContentLoaded", initStatisticsPage);

async function initStatisticsPage() {
   try {
      await loadStatistics();
   } catch (error) {
      console.error("Failed to initialize statistics page:", error);
   }
}

async function loadStatistics() {
   const [summaryResult, volumeResult, muscleResult] = await Promise.allSettled([
      getAnalyticsSummary(),
      getAnalyticsVolumeChart(),
      getAnalyticsMuscleDistribution()
   ]);

   if (summaryResult.status === "fulfilled") {
      renderSummary(summaryResult.value);
   } else {
      console.error("Summary request failed:", summaryResult.reason);
      renderSummaryError();
   }

   if (volumeResult.status === "fulfilled") {
      renderVolumeChart(volumeResult.value);
   } else {
      console.error("Volume request failed:", volumeResult.reason);
      renderVolumeError();
   }

   if (muscleResult.status === "fulfilled") {
      renderMuscleChart(muscleResult.value);
   } else {
      console.error("Muscle distribution request failed:", muscleResult.reason);
      renderMuscleError(muscleResult.reason);
   }
}

function renderSummary(summary) {
   const summaryContainer = document.getElementById("statisticsSummary");
   if (!summaryContainer) return;

   const tier = summary?.tier || "—";
   const totalWorkouts = summary?.total_workouts_all_time ?? 0;
   const monthlyVolume = summary?.monthly_volume_kg ?? 0;

   summaryContainer.innerHTML = `
      <div class="statistics-summary">
         <div class="statistics-summary__item">
            <span class="statistics-summary__label">Tier</span>
            <strong class="statistics-summary__value">${escapeHtml(tier)}</strong>
         </div>

         <div class="statistics-summary__item">
            <span class="statistics-summary__label">Total workouts</span>
            <strong class="statistics-summary__value">${formatNumber(totalWorkouts)}</strong>
         </div>

         <div class="statistics-summary__item">
            <span class="statistics-summary__label">Monthly volume</span>
            <strong class="statistics-summary__value">${formatNumber(monthlyVolume)} kg</strong>
         </div>
      </div>
   `;
}

function renderSummaryError() {
   const summaryContainer = document.getElementById("statisticsSummary");
   if (!summaryContainer) return;

   summaryContainer.innerHTML = `
      <div class="statistics-message">
         Failed to load summary.
      </div>
   `;
}

function renderVolumeChart(volume) {
   const canvas = document.getElementById("volumeChart");
   if (!canvas || typeof Chart === "undefined") return;

   const labels = Array.isArray(volume?.labels) ? volume.labels : [];
   const data = Array.isArray(volume?.data) ? volume.data : [];

   if (volumeChartInstance) {
      volumeChartInstance.destroy();
      volumeChartInstance = null;
   }

   if (!labels.length || !data.length || !hasNonZeroValues(data)) {
      renderChartMessage(canvas, "No training volume recorded yet.");
      return;
   }

   volumeChartInstance = new Chart(canvas, {
      type: "bar",
      data: {
         labels,
         datasets: [
            {
               label: "Volume (kg)",
               data,
               backgroundColor: "rgba(124, 141, 246, 0.35)",
               borderColor: "#7c8df6",
               borderWidth: 1,
               borderRadius: 10,
               barThickness: 56,
               maxBarThickness: 64
            }
         ]
      },
      options: {
         responsive: true,
         maintainAspectRatio: false,
         plugins: {
            legend: {
               display: false
            },
            tooltip: {
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
                  display: false
               }
            },
            y: {
               beginAtZero: true,
               ticks: {
                  callback(value) {
                     return formatNumber(value);
                  }
               }
            }
         }
      }
   });
}

function renderVolumeError() {
   const canvas = document.getElementById("volumeChart");
   if (!canvas) return;

   if (volumeChartInstance) {
      volumeChartInstance.destroy();
      volumeChartInstance = null;
   }

   renderChartMessage(canvas, "Failed to load volume chart.");
}

function renderMuscleChart(distribution) {
   const canvas = document.getElementById("muscleChart");
   if (!canvas || typeof Chart === "undefined") return;

   const entries = Object.entries(distribution || {});
   const labels = entries.map(([label]) => label);
   const data = entries.map(([, value]) => value);

   if (muscleChartInstance) {
      muscleChartInstance.destroy();
      muscleChartInstance = null;
   }

   if (!labels.length || !data.length) {
      renderChartMessage(canvas, "No muscle distribution data yet.");
      return;
   }

   muscleChartInstance = new Chart(canvas, {
      type: "doughnut",
      data: {
         labels,
         datasets: [
            {
               label: "Muscle distribution",
               data,
               borderWidth: 2
            }
         ]
      },
      options: {
         responsive: true,
         maintainAspectRatio: false,
         plugins: {
            legend: {
               position: "bottom"
            }
         }
      }
   });
}

function renderMuscleError(error) {
   const canvas = document.getElementById("muscleChart");
   if (!canvas) return;

   if (muscleChartInstance) {
      muscleChartInstance.destroy();
      muscleChartInstance = null;
   }

   if (error?.status === 403) {
      renderChartMessage(canvas, "Muscle distribution is not available for your current plan.");
      return;
   }

   renderChartMessage(canvas, "Failed to load muscle distribution.");
}

function renderChartMessage(canvas, message) {
   const container = canvas?.parentElement;
   if (!container) return;

   container.innerHTML = `
      <div class="statistics-message">
         ${escapeHtml(message)}
      </div>
   `;
}

function hasNonZeroValues(values) {
   return values.some((value) => Number(value) > 0);
}

function formatNumber(value) {
   return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0
   }).format(Number(value) || 0);
}

function escapeHtml(value) {
   return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
}