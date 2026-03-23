document.addEventListener("DOMContentLoaded", initRegisterPage);

async function initRegisterPage() {
   await redirectIfAuthenticated("/dashboard.html");

   const form = document.getElementById("registerForm");

   if (!form) return;

   form.addEventListener("submit", handleRegisterSubmit);
}

async function handleRegisterSubmit(event) {
   event.preventDefault();

   const form = event.currentTarget;
   const submitButton = form.querySelector('button[type="submit"]');

   clearFormMessage("registerMessage");
   setButtonLoading(submitButton, true, "Creating account...");

   const payload = {
      name: form.elements["name"]?.value.trim(),
      email: form.elements["email"]?.value.trim(),
      password: form.elements["password"]?.value,
      password_confirmation: form.elements["password_confirmation"]?.value
   };

   try {
      await registerUser(payload);

      await registerUser(payload);
      window.location.href = "/biometric.html";

   } catch (error) {
      console.error("Registration error:", error);

      if (error.status === 422) {
         showFormMessage("registerMessage", "Validation error. Check entered data.");
      } else {
         showFormMessage("registerMessage", "Something went wrong. Please try again.");
      }
   } finally {
      setButtonLoading(submitButton, false, "Create Account");
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
   button.textContent = button.dataset.defaultText || "Create Account";
}