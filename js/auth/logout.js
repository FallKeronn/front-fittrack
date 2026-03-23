document.addEventListener("DOMContentLoaded", initLogout);

function initLogout() {
   const logoutButton = document.getElementById("logoutButton");

   if (!logoutButton) return;

   logoutButton.addEventListener("click", handleLogout);
}

async function handleLogout(event) {
   event.preventDefault();

   try {
      await logoutUser();
      window.location.href = "/login.html";
   } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to sign out.");
   }
}