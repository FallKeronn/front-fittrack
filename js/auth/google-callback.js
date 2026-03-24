document.addEventListener("DOMContentLoaded", initGoogleCallbackPage);

async function initGoogleCallbackPage() {
   const messageElement = document.getElementById("googleCallbackMessage");
   const params = new URLSearchParams(window.location.search);
   const code = params.get("code");

   if (!code) {
      if (messageElement) {
         messageElement.textContent = "Google authorization code not found.";
      }

      setTimeout(() => {
         window.location.href = "/login.html";
      }, 1500);

      return;
   }

   try {
      await completeGoogleAuth(code);
      window.location.href = "/dashboard.html";
   } catch (error) {
      console.error("Google callback error:", error);

      if (messageElement) {
         messageElement.textContent =
            error?.data?.message || "Failed to complete Google authentication.";
      }

      setTimeout(() => {
         window.location.href = "/login.html";
      }, 2000);
   }
}