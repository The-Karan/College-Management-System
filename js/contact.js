const CONTACT_API_URL = `${getApiBaseUrl()}/api/auth/contact`;
const CONTACT_REQUIRED_FIELDS = ["fullName", "email", "phoneNumber", "subject", "message"];

const contactForm = document.getElementById("contactForm");
const contactMessage = document.getElementById("contactMessage");

if (contactForm) {
  contactForm.addEventListener("submit", handleContactSubmit);
}

async function handleContactSubmit(event) {
  event.preventDefault();

  const payload = buildContactPayload(contactForm);
  const validationError = validateContactPayload(payload);

  if (validationError) {
    showContactMessage(validationError, "error");
    return;
  }

  setContactLoading(true);
  showContactMessage("Sending your message...", "info");

  try {
    const response = await fetch(CONTACT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await parseContactResponse(response);

    if (!response.ok) {
      throw new Error(getContactError(data, response.status));
    }

    contactForm.reset();
    showContactMessage("Message sent successfully.", "success");
  } catch (error) {
    showContactMessage(getNetworkError(error), "error");
  } finally {
    setContactLoading(false);
  }
}

function buildContactPayload(form) {
  const formData = new FormData(form);
  const payload = {};

  CONTACT_REQUIRED_FIELDS.forEach((field) => {
    payload[field] = String(formData.get(field) || "").trim();
  });

  return payload;
}

function validateContactPayload(payload) {
  if (!CONTACT_REQUIRED_FIELDS.every((field) => payload[field])) {
    return "Please fill in all required fields.";
  }

  if (payload.fullName.length < 2) {
    return "Please enter a valid full name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Please enter a valid email address.";
  }

  const phoneDigits = payload.phoneNumber.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return "Please enter a valid phone number.";
  }

  if (payload.subject.length < 3) {
    return "Subject should be at least 3 characters long.";
  }

  if (payload.message.length < 10) {
    return "Message should be at least 10 characters long.";
  }

  return "";
}

async function parseContactResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    message: extractContactErrorMessage(text)
  };
}

function getContactError(data, status) {
  const normalizedMessage = String(data?.message || data?.error || getFirstValidationError(data?.errors) || "");

  if (
    normalizedMessage.includes("your_email_here") ||
    normalizedMessage.includes("RfcComplianceException") ||
    normalizedMessage.includes("RFC 2822")
  ) {
    return "Contact email is not configured correctly on the Laravel server. Set a real recipient email, then clear Laravel config cache.";
  }

  const validationError = getFirstValidationError(data?.errors);

  return (
    normalizedMessage ||
    data?.error ||
    validationError ||
    `Message failed. Server returned ${status}.`
  );
}

function getFirstValidationError(errors) {
  if (!errors || typeof errors !== "object") {
    return "";
  }

  const firstError = Object.values(errors)[0];

  if (Array.isArray(firstError)) {
    return firstError[0] || "";
  }

  return typeof firstError === "string" ? firstError : "";
}

function getNetworkError(error) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    if (window.location.protocol === "file:") {
      return "Open the site through a local server like http://localhost:5500. Browsers block live API calls from file:// pages.";
    }

    return `Browser blocked the contact API. Allow ${window.location.origin} in Laravel CORS settings.`;
  }

  return error.message || "Unable to send your message right now.";
}

function getApiBaseUrl() {
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return isLocalHost ? "http://127.0.0.1:8000" : "https://api.campusedgepro.com";
}

function extractContactErrorMessage(text) {
  if (!text) {
    return "";
  }

  const detailMatch = text.match(/<p[^>]*>([^<]*(?:RFC 2822|your_email_here|Internal Server Error)[^<]*)<\/p>/i);
  if (detailMatch?.[1]) {
    return decodeHtml(detailMatch[1]);
  }

  const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) {
    return decodeHtml(titleMatch[1]);
  }

  return "Internal Server Error";
}

function decodeHtml(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value.trim();
}

function setContactLoading(isLoading) {
  const submitButton = contactForm.querySelector(".submit-btn");
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Sending..." : "Send Message ✈";
}

function showContactMessage(message, type) {
  contactMessage.textContent = message;
  contactMessage.className = `form-message ${type}`;
}
