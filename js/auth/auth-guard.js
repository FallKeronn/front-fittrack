async function redirectIfAuthenticated(redirectTo = "/dashboard.html") {
   try {
      const user = await checkAuthUser();

      if (user) {
         window.location.href = redirectTo;
      }
   } catch (error) {
      console.error("Auth guard error:", error);
   }
}

async function requireAuth(redirectTo = "/login.html") {
   try {
      const user = await checkAuthUser();

      if (!user) {
         window.location.href = redirectTo;
         return null;
      }

      return user;
   } catch (error) {
      console.error("Auth guard error:", error);
      window.location.href = redirectTo;
      return null;
   }
}