document.addEventListener("DOMContentLoaded", initSubscriptionPage);

async function initSubscriptionPage() {
   const user = await requireAuth("/login.html");
   if (!user) return;

   bindUpgradeButton();
   await syncSubscriptionButtons();
}

function bindUpgradeButton() {
   const upgradeButton = document.getElementById("upgradeToProButton");
   if (!upgradeButton) return;

   upgradeButton.addEventListener("click", handleUpgradeToPro);
}

async function handleUpgradeToPro() {
   const upgradeButton = document.getElementById("upgradeToProButton");
   if (!upgradeButton) return;

   const originalText = upgradeButton.textContent;

   try {
      upgradeButton.disabled = true;
      upgradeButton.textContent = "Redirecting...";

      const response = await subscribeToPro();
      const url = response?.url;

      if (!url) {
         throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.href = url;
   } catch (error) {
      console.error("Subscribe error:", error);
      upgradeButton.disabled = false;
      upgradeButton.textContent = originalText;
      alert(error?.data?.message || "Failed to start checkout.");
   }
}

async function syncSubscriptionButtons() {
   const freeButton = document.getElementById("freePlanButton");
   const upgradeButton = document.getElementById("upgradeToProButton");

   if (!freeButton || !upgradeButton) return;

   try {
      const overview = await getDashboardOverview();
      const role = String(overview?.user?.role || overview?.user?.tier || "free").toLowerCase();

      if (role === "pro" || role === "admin") {
         freeButton.disabled = true;
         freeButton.textContent = "Free Plan";

         upgradeButton.disabled = true;
         upgradeButton.textContent = "Current Plan";
         return;
      }

      freeButton.disabled = true;
      freeButton.textContent = "Current Plan";

      upgradeButton.disabled = false;
      upgradeButton.textContent = "Upgrade to Pro";
   } catch (error) {
      console.error("Failed to sync subscription buttons:", error);

      freeButton.disabled = true;
      freeButton.textContent = "Current Plan";
      upgradeButton.disabled = false;
      upgradeButton.textContent = "Upgrade to Pro";
   }
}