const LOGIN_API_URL = "https://api.campusedgepro.com/api/auth/login";

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPhone = document.getElementById("loginPhone");
const loginPassword = document.getElementById("loginPassword");
const rememberLogin = document.getElementById("rememberLogin");
const loginMessage = document.getElementById("loginMessage");
const passwordToggle = document.querySelector(".auth-toggle");

if (passwordToggle && loginPassword) {
  passwordToggle.addEventListener("click", () => {
    const isPasswordHidden = loginPassword.type === "password";
    loginPassword.type = isPasswordHidden ? "text" : "password";
    passwordToggle.setAttribute("aria-label", isPasswordHidden ? "Hide password" : "Show password");
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();

  const email = loginEmail.value.trim();
  const phone = loginPhone.value.trim();
  const password = loginPassword.value.trim();

  if (!email && !phone) {
    showLoginMessage("Please enter your email or phone number.", "error");
    return;
  }

  if (!password) {
    showLoginMessage("Please enter your password.", "error");
    return;
  }

  setLoginLoading(true);
  showLoginMessage("Signing you in...", "info");

  try {
    const loginPayload = {
      password
    };

    if (email) {
      loginPayload.email = email;
    }

    if (phone) {
      loginPayload.phone = phone;
    }

    const response = await fetch(LOGIN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify(loginPayload)
    });

    const data = await parseLoginResponse(response);

    if (!response.ok) {
      throw new Error(getLoginError(data, response.status));
    }

    saveLoginSession(data);
    showLoginMessage("Login successful.", "success");
  } catch (error) {
    showLoginMessage(error.message || "Unable to login right now.", "error");
  } finally {
    setLoginLoading(false);
  }
}

async function parseLoginResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {
    message: await response.text()
  };
}

function getLoginError(data, status) {
  return (
    data?.message ||
    data?.error ||
    data?.errors?.[0]?.message ||
    `Login failed. Server returned ${status}.`
  );
}

function saveLoginSession(data) {
  const token = data?.token || data?.accessToken || data?.access_token || data?.data?.token;
  const user = data?.user || data?.data?.user || data?.data;
  const storage = rememberLogin.checked ? localStorage : sessionStorage;

  if (token) {
    storage.setItem("cmsAuthToken", token);
  }

  if (user) {
    storage.setItem("cmsUser", JSON.stringify(user));
  }
}

function setLoginLoading(isLoading) {
  const submitButton = loginForm.querySelector(".auth-submit");
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Signing In..." : "Sign In";
}

function showLoginMessage(message, type) {
  loginMessage.textContent = message;
  loginMessage.className = `auth-message ${type}`;
}
