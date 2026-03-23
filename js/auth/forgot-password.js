document.addEventListener("DOMContentLoaded", initForgotPasswordPage);

function initForgotPasswordPage() {
   const form = document.getElementById("forgotPasswordForm");

   if (!form) return;

   form.addEventListener("submit", handleForgotPasswordSubmit);
}

async function handleForgotPasswordSubmit(event) {
   event.preventDefault();

   const form = event.currentTarget;
   const submitButton = form.querySelector('button[type="submit"]');

   clearFormMessage("forgotMessage");
   setButtonLoading(submitButton, true, "Sending...");

   const payload = {
      email: form.elements["email"]?.value.trim()
   };

   try {
      await forgotPassword(payload);

      showFormMessage(
         "forgotMessage",
         "Check your email! We sent you a password reset link.",
         "success"
      );

      form.reset();

   } catch (error) {
      console.error("Forgot password error:", error);

      if (error.status === 422) {
         showFormMessage("forgotMessage", "Please enter a valid email address.");
      } else {
         showFormMessage("forgotMessage", "Something went wrong. Please try again.");
      }
   } finally {
      setButtonLoading(submitButton, false, "Send Reset Link");
   }
}

function showFormMessage(elementId, message, type = "error") {
   const messageElement = document.getElementById(elementId);

   if (!messageElement) return;

   messageElement.textContent = message;
   messageElement.classList.remove("forgot-card__message--success");

   if (type === "success") {
      messageElement.classList.add("forgot-card__message--success");
   }
}

function clearFormMessage(elementId) {
   const messageElement = document.getElementById(elementId);

   if (!messageElement) return;

   messageElement.textContent = "";
   messageElement.classList.remove("forgot-card__message--success");
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
   button.textContent = button.dataset.defaultText || "Send Reset Link";
}