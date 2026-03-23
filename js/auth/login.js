document.addEventListener("DOMContentLoaded", initLoginPage);

async function initLoginPage() {
   await redirectIfAuthenticated("/dashboard.html");

   const form = document.getElementById("loginForm");

   if (!form) return;

   form.addEventListener("submit", handleLoginSubmit);
}

async function handleLoginSubmit(event) {
   event.preventDefault();

   const form = event.currentTarget;
   const submitButton = form.querySelector('button[type="submit"]');

   clearFormMessage("loginMessage");
   setButtonLoading(submitButton, true, "Signing in...");

   const payload = {
      email: form.elements["email"]?.value.trim(),
      password: form.elements["password"]?.value,
      remember: Boolean(form.elements["remember"]?.checked)
   };

   try {
      await loginUser(payload);
      window.location.href = "/dashboard.html";

   } catch (error) {
      console.error("Login error:", error);

      if (error.status === 422 || error.status === 401) {
         showFormMessage("loginMessage", "Incorrect email or password.");
      } else {
         showFormMessage("loginMessage", "Something went wrong. Please try again.");
      }
   } finally {
      setButtonLoading(submitButton, false, "Sign In");
   }
}

function showFormMessage(elementId, message, type = "error") {
   const messageElement = document.getElementById(elementId);

   if (!messageElement) return;

   messageElement.textContent = message;
   messageElement.classList.remove("auth-form__message--success");

   if (type === "success") {
      messageElement.classList.add("auth-form__message--success");
   }
}

function clearFormMessage(elementId) {
   const messageElement = document.getElementById(elementId);

   if (!messageElement) return;

   messageElement.textContent = "";
   messageElement.classList.remove("auth-form__message--success");
}

function setButtonLoading(button, isLoading, loadingText) {
   if (!button) return;

   if (isLoading) {
      button.disabled = true;
      button.dataset.defaultText = button.textContent.trim();
      button.textContent = loadingText;
      return;
   }

   button.disabled = false;
   button.textContent = button.dataset.defaultText || "Sign In";
}