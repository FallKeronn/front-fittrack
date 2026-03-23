let adminPageState = {
   metrics: null,
   users: [],
   deletedUsers: [],
   logs: []
};

document.addEventListener("DOMContentLoaded", initAdminPage);

async function initAdminPage() {
   const user = await requireAuth("/login.html");
   if (!user) return;

   bindAnnouncementButton();
   bindAdminActions();

   await loadAdminPage();
}

async function loadAdminPage() {
   try {
      const [dashboardResult, usersResult, deletedUsersResult, logsResult] = await Promise.allSettled([
         api("/admin/dashboard"),
         api("/admin/users"),
         api("/admin/users/deleted"),
         api("/admin/logs")
      ]);

      if (dashboardResult.status === "rejected") {
         handleAdminAccessError(dashboardResult.reason);
         return;
      }

      adminPageState.metrics = dashboardResult.value?.metrics || null;
      adminPageState.users =
         usersResult.status === "fulfilled" && Array.isArray(usersResult.value)
            ? usersResult.value
            : [];
      adminPageState.deletedUsers =
         deletedUsersResult.status === "fulfilled" && Array.isArray(deletedUsersResult.value)
            ? deletedUsersResult.value
            : [];
      adminPageState.logs =
         logsResult.status === "fulfilled" && Array.isArray(logsResult.value)
            ? logsResult.value
            : [];

      renderMetrics(adminPageState.metrics);
      renderUsers(adminPageState.users);
      renderDeletedUsers(adminPageState.deletedUsers);
      renderLogs(adminPageState.logs);

      if (usersResult.status === "rejected") {
         console.error("Failed to load admin users:", usersResult.reason);
      }

      if (deletedUsersResult.status === "rejected") {
         console.error("Failed to load deleted users:", deletedUsersResult.reason);
      }

      if (logsResult.status === "rejected") {
         console.error("Failed to load admin logs:", logsResult.reason);
      }
   } catch (error) {
      console.error("Admin page loading error:", error);
      renderAdminLoadError();
   }
}

function handleAdminAccessError(error) {
   console.error("Admin access error:", error);

   if (error?.status === 404) {
      renderAdminAccessDenied();
      return;
   }

   renderAdminLoadError();
}

function renderMetrics(metrics) {
   if (!metrics) return;

   const totalUsersCard = document.getElementById("adminStatTotalUsers");
   const proUsersCard = document.getElementById("adminStatProUsers");
   const weeklyWorkoutsCard = document.getElementById("adminStatWeeklyWorkouts");
   const topRoutineCard = document.getElementById("adminStatTopRoutine");

   if (totalUsersCard) {
      totalUsersCard.innerHTML = `
         <h2 class="admin-stat-card__label">Total active users</h2>
         <p class="admin-stat-card__value">${formatNumber(metrics.total_users)}</p>
      `;
   }

   if (proUsersCard) {
      proUsersCard.innerHTML = `
         <h2 class="admin-stat-card__label">Pro Subscribers</h2>
         <p class="admin-stat-card__value">${formatNumber(metrics.pro_users)}</p>
      `;
   }

   if (weeklyWorkoutsCard) {
      weeklyWorkoutsCard.innerHTML = `
         <h2 class="admin-stat-card__label">Weekly Workouts</h2>
         <p class="admin-stat-card__value">${formatNumber(metrics.weekly_workouts_platform)}</p>
      `;
   }

   if (topRoutineCard) {
      topRoutineCard.innerHTML = `
         <h2 class="admin-stat-card__label">Top Routine</h2>
         <p class="admin-stat-card__text">${escapeHtml(metrics.most_popular_training || "—")}</p>
      `;
   }
}

function renderUsers(users) {
   const userTableBody = document.getElementById("adminUsersTableBody");
   if (!userTableBody) return;

   if (!users.length) {
      userTableBody.innerHTML = `
         <tr>
            <td colspan="4">No users found.</td>
         </tr>
      `;
      return;
   }

   userTableBody.innerHTML = users.map(createUserRow).join("");
}

function createUserRow(user) {
   const role = String(user.role || user.tier || "free").toLowerCase();
   const roleLabel = capitalize(role);
   const badgeClass = getRoleBadgeClass(role);
   const actionHtml = createRoleAction(user, role);

   return `
      <tr>
         <td>${escapeHtml(user.name || "User")}</td>
         <td>${escapeHtml(user.email || "—")}</td>
         <td>
            <span class="admin-badge ${badgeClass}">
               ${escapeHtml(roleLabel)}
            </span>
         </td>
         <td>${actionHtml}</td>
      </tr>
   `;
}

function createRoleAction(user, role) {
   if (role === "admin") {
      return `<span class="admin-action admin-action--muted">Protected</span>`;
   }

   if (role === "pro") {
      return `
         <div class="admin-table__actions">
            <button
               class="admin-action"
               type="button"
               data-action="change-role"
               data-user-id="${user.id}"
               data-next-role="free"
            >
               Make Free
            </button>

            <button
               class="admin-action"
               type="button"
               data-action="change-role"
               data-user-id="${user.id}"
               data-next-role="admin"
            >
               Make Admin
            </button>
         </div>
      `;
   }

   return `
      <div class="admin-table__actions">
         <button
            class="admin-action"
            type="button"
            data-action="change-role"
            data-user-id="${user.id}"
            data-next-role="pro"
         >
            Make Pro
         </button>

         <button
            class="admin-action"
            type="button"
            data-action="change-role"
            data-user-id="${user.id}"
            data-next-role="admin"
         >
            Make Admin
         </button>
      </div>
   `;
}

function renderDeletedUsers(users) {
   const deletedTableBody = document.getElementById("adminDeletedUsersTableBody");
   if (!deletedTableBody) return;

   if (!users.length) {
      deletedTableBody.innerHTML = `
         <tr>
            <td colspan="4">Recycle bin is empty.</td>
         </tr>
      `;
      return;
   }

   deletedTableBody.innerHTML = users.map(createDeletedUserRow).join("");
}

function createDeletedUserRow(user) {
   return `
      <tr>
         <td>${escapeHtml(user.name || "User")}</td>
         <td>${escapeHtml(user.email || "—")}</td>
         <td>
            <span class="admin-date admin-date--deleted">
               ${escapeHtml(formatDeletedAt(user.deleted_at))}
            </span>
         </td>
         <td>
            <div class="admin-table__actions">
               <button
                  class="admin-action admin-action--restore"
                  type="button"
                  data-action="restore-user"
                  data-user-id="${user.id}"
               >
                  Restore
               </button>

               <button
                  class="admin-action admin-action--delete"
                  type="button"
                  data-action="force-delete-user"
                  data-user-id="${user.id}"
               >
                  Permanently delete
               </button>
            </div>
         </td>
      </tr>
   `;
}

function renderLogs(logs) {
   const logsContainer = document.getElementById("adminLogs");
   if (!logsContainer) return;

   if (!logs.length) {
      logsContainer.innerHTML = `
         <div class="admin-empty-state">
            No audit logs yet.
         </div>
      `;
      return;
   }

   logsContainer.innerHTML = logs.map(createLogItem).join("");
}

function createLogItem(log) {
   const adminName = log?.admin?.name || "Admin";
   const action = log?.action || "unknown_action";
   const details = stringifyLogDetails(log?.details);
   const time = log?.human_readable_time || log?.created_at || "—";

   return `
      <article class="admin-log-item">
         <div class="admin-log-item__icon">
            <span>&gt;_</span>
         </div>

         <div class="admin-log-item__content">
            <p class="admin-log-item__text">
               <strong>${escapeHtml(adminName)}</strong> performed
               <span class="admin-log-item__tag">${escapeHtml(action)}</span>
            </p>

            <pre class="admin-log-item__meta">${escapeHtml(details)}</pre>

            <p class="admin-log-item__time">
               ${escapeHtml(time)}
            </p>
         </div>
      </article>
   `;
}

function bindAnnouncementButton() {
   const button = document.getElementById("adminAnnouncementButton");
   if (!button) return;

   button.addEventListener("click", async (event) => {
      event.preventDefault();

      const title = window.prompt("Announcement title:");
      if (title == null) return;

      const message = window.prompt("Announcement message:");
      if (message == null) return;

      const trimmedTitle = title.trim();
      const trimmedMessage = message.trim();

      if (!trimmedTitle || !trimmedMessage) {
         alert("Title and message are required.");
         return;
      }

      const originalText = button.textContent;
      button.textContent = "Broadcasting...";
      button.setAttribute("aria-disabled", "true");

      try {
         await getCsrfCookie();

         const response = await request(CONFIG.API_URL + "/api/admin/announcements", {
            method: "POST",
            body: JSON.stringify({
               title: trimmedTitle,
               message: trimmedMessage
            })
         });

         alert(response?.message || "Announcement broadcasted successfully.");
      } catch (error) {
         console.error("Announcement error:", error);
         alert(error?.data?.message || "Failed to broadcast announcement.");
      } finally {
         button.textContent = originalText;
         button.removeAttribute("aria-disabled");
      }
   });
}

function bindAdminActions() {
   document.addEventListener("click", async (event) => {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) return;

      const action = actionButton.dataset.action;
      const userId = Number(actionButton.dataset.userId);

      if (!userId) return;

      if (action === "change-role") {
         await handleChangeRole(actionButton, userId, actionButton.dataset.nextRole);
         return;
      }

      if (action === "restore-user") {
         await handleRestoreUser(actionButton, userId);
         return;
      }

      if (action === "force-delete-user") {
         await handleForceDeleteUser(actionButton, userId);
      }
   });
}

async function handleChangeRole(button, userId, nextRole) {
   if (!nextRole) return;

   const originalText = button.textContent;
   button.disabled = true;
   button.textContent = "Saving...";

   try {
      await getCsrfCookie();

      const response = await request(CONFIG.API_URL + `/api/admin/users/${userId}/role`, {
         method: "PATCH",
         body: JSON.stringify({
            role: nextRole
         })
      });

      alert(response?.message || "User role updated.");
      await reloadAdminUsers();
      await reloadAdminLogs();
   } catch (error) {
      console.error("Change role error:", error);
      alert(error?.data?.message || "Failed to update user role.");
   } finally {
      button.disabled = false;
      button.textContent = originalText;
   }
}

async function handleRestoreUser(button, userId) {
   const originalText = button.textContent;
   button.disabled = true;
   button.textContent = "Restoring...";

   try {
      await getCsrfCookie();

      const response = await request(CONFIG.API_URL + `/api/admin/users/${userId}/restore`, {
         method: "POST"
      });

      alert(response?.message || "User restored successfully.");
      await reloadDeletedUsers();
      await reloadAdminUsers();
      await reloadAdminLogs();
   } catch (error) {
      console.error("Restore user error:", error);
      alert(error?.data?.message || "Failed to restore user.");
   } finally {
      button.disabled = false;
      button.textContent = originalText;
   }
}

async function handleForceDeleteUser(button, userId) {
   const confirmed = window.confirm(
      "Are you sure you want to permanently delete this user and all associated data?"
   );

   if (!confirmed) return;

   const originalText = button.textContent;
   button.disabled = true;
   button.textContent = "Deleting...";

   try {
      await getCsrfCookie();

      const response = await request(CONFIG.API_URL + `/api/admin/users/${userId}/force`, {
         method: "DELETE"
      });

      alert(response?.message || "User permanently deleted.");
      await reloadDeletedUsers();
      await reloadAdminLogs();
   } catch (error) {
      console.error("Force delete user error:", error);
      alert(error?.data?.message || "Failed to permanently delete user.");
   } finally {
      button.disabled = false;
      button.textContent = originalText;
   }
}

async function reloadAdminUsers() {
   try {
      const users = await api("/admin/users");
      adminPageState.users = Array.isArray(users) ? users : [];
      renderUsers(adminPageState.users);
   } catch (error) {
      console.error("Reload admin users error:", error);
   }
}

async function reloadDeletedUsers() {
   try {
      const users = await api("/admin/users/deleted");
      adminPageState.deletedUsers = Array.isArray(users) ? users : [];
      renderDeletedUsers(adminPageState.deletedUsers);
   } catch (error) {
      console.error("Reload deleted users error:", error);
   }
}

async function reloadAdminLogs() {
   try {
      const logs = await api("/admin/logs");
      adminPageState.logs = Array.isArray(logs) ? logs : [];
      renderLogs(adminPageState.logs);
   } catch (error) {
      console.error("Reload admin logs error:", error);
   }
}

function renderAdminAccessDenied() {
   const container = document.getElementById("adminPageContainer");
   if (!container) return;

   container.innerHTML = `
      <section class="admin-section">
         <div class="admin-section__header">
            <h1 class="admin-section__title">Access denied</h1>
         </div>

         <div class="admin-table-card">
            <div class="admin-error-state">
               You do not have access to the admin dashboard.
            </div>
         </div>
      </section>
   `;
}

function renderAdminLoadError() {
   const container = document.getElementById("adminPageContainer");
   if (!container) return;

   container.innerHTML = `
      <section class="admin-section">
         <div class="admin-section__header">
            <h1 class="admin-section__title">Failed to load admin dashboard</h1>
         </div>

         <div class="admin-table-card">
            <div class="admin-error-state">
               Something went wrong while loading admin data.
            </div>
         </div>
      </section>
   `;
}

function getRoleBadgeClass(role) {
   if (role === "admin") return "admin-badge--admin";
   if (role === "pro") return "admin-badge--pro";
   return "admin-badge--free";
}

function formatDeletedAt(value) {
   return value || "—";
}

function stringifyLogDetails(details) {
   if (!details) return "{}";

   try {
      return JSON.stringify(details, null, 2);
   } catch (_) {
      return String(details);
   }
}

function formatNumber(value) {
   return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0
   }).format(Number(value) || 0);
}

function capitalize(value) {
   const stringValue = String(value || "");
   if (!stringValue) return "";

   return stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
}

function escapeHtml(value) {
   return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
}