document.addEventListener("DOMContentLoaded", loadSidebarUser);

async function loadSidebarUser() {
   try {
      const overview = await getSharedDashboardOverview();

      renderSidebarUser(overview?.user);
   } catch (error) {
      console.error("Sidebar loading error:", error);
   }
}

function renderSidebarUser(user) {
   if (!user) return;

   const nameElement = document.getElementById("profileName");
   const metaElement = document.getElementById("profileMeta");
   const heightElement = document.getElementById("profileHeight");
   const weightElement = document.getElementById("profileWeight");
   const avatarElement = document.getElementById("profileAvatar");

   const biometrics = user.biometrics || {};

   const name = user.name || "User";
   const age = biometrics.age ?? "--";
   const height = biometrics.height ?? "--";
   const weight = biometrics.weight ?? "--";
   const experienceLevel = biometrics.experience_level ?? user.tier ?? "--";

   if (nameElement) {
      nameElement.textContent = name;
   }

   if (metaElement) {
      metaElement.textContent = `${age} years, ${experienceLevel}`;
   }

   if (heightElement) {
      heightElement.textContent = height;
   }

   if (weightElement) {
      weightElement.textContent = weight;
   }

   if (avatarElement) {
      avatarElement.alt = name;
   }
}