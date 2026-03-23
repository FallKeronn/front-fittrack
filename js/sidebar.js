document.addEventListener("DOMContentLoaded", loadSidebarUser);

async function loadSidebarUser() {
   try {
      const overview = await api("/dashboard/overview");
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
      avatarElement.src = createAvatarDataUrl(name);
      avatarElement.alt = `${name} avatar`;
   }
}

function createAvatarDataUrl(name) {
   const firstLetter = String(name).trim().charAt(0).toUpperCase() || "U";

   const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
         <rect width="120" height="120" rx="60" fill="#2A2A2A"></rect>
         <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-size="42" font-family="Arial, sans-serif" fill="#FFFFFF">${firstLetter}</text>
      </svg>
   `;

   return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}