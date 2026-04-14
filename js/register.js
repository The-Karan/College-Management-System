const registerForm = document.getElementById("registerForm");
const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPhone = document.getElementById("registerPhone");
const registerPassword = document.getElementById("registerPassword");
const registerMessage = document.getElementById("registerMessage");
const registerAgree = document.getElementById("registerAgree");
const registerPasswordToggle = document.getElementById("registerPasswordToggle");

if (registerPasswordToggle && registerPassword) {
  registerPasswordToggle.addEventListener("click", () => {
    const isPasswordHidden = registerPassword.type === "password";
    registerPassword.type = isPasswordHidden ? "text" : "password";
    registerPasswordToggle.setAttribute("aria-label", isPasswordHidden ? "Hide password" : "Show password");
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", handleRegisterSubmit);
}

function handleRegisterSubmit(event) {
  event.preventDefault();

  const name = registerName.value.trim();
  const email = registerEmail.value.trim();
  const phone = registerPhone.value.trim();
  const password = registerPassword.value.trim();

  if (!name || !email || !phone || !password) {
    showRegisterMessage("Please complete all fields.", "error");
    return;
  }

  if (!registerAgree.checked) {
    showRegisterMessage("Please accept the terms to continue.", "error");
    return;
  }

  if (password.length < 6) {
    showRegisterMessage("Password should be at least 6 characters long.", "error");
    return;
  }

  setRegisterLoading(true);
  showRegisterMessage("Creating your account...", "info");

  window.setTimeout(() => {
    setRegisterLoading(false);
    registerForm.reset();
    showRegisterMessage("Account created successfully. Redirecting to login...", "success");

    window.setTimeout(() => {
      window.location.href = "./login.html";
    }, 1200);
  }, 900);
}

function setRegisterLoading(isLoading) {
  const submitButton = registerForm.querySelector(".auth-submit");
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Creating..." : "Create Account";
}

function showRegisterMessage(message, type) {
  registerMessage.textContent = message;
  registerMessage.className = `auth-message ${type}`;
}
