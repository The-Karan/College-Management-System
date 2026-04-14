const LIVE_SUPPORT_CONFIG = {
  endpoint: "/api/live-support",
  generationConfig: {
    temperature: 0.6,
    maxOutputTokens: 220
  }
};

const LIVE_SUPPORT_SYSTEM_PROMPT = [
  "You are Campus Edge Pro live support for a College Management System website.",
  "Answer in short, clear, friendly support language.",
  "Stay focused on platform questions such as admissions, attendance, student records, fees, exams, library, alerts, dashboards, onboarding, support, demos, and campus administration workflows.",
  "If the user asks for pricing, account-specific actions, or details that are not confirmed on the site, say the support team can help through the Contact page or by booking a demo.",
  "Do not claim actions have been completed. Do not invent policies, pricing, or guarantees."
].join(" ");

document.addEventListener("DOMContentLoaded", () => {
  initReveal();
  initCounters();
  initMouseTilt();
  initHeroSlider();
  initChatWidget();
  initFooterForm();
});

function initReveal() {
  const items = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  }, {
    threshold: 0.12
  });

  items.forEach((item) => observer.observe(item));
}

function initCounters() {
  const counters = document.querySelectorAll(".counter");

  counters.forEach((counter) => {
    const target = Number(counter.dataset.target || 0);
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 80));

    const update = () => {
      current += step;
      if (current >= target) {
        counter.textContent = target;
      } else {
        counter.textContent = current;
        requestAnimationFrame(update);
      }
    };

    update();
  });
}

function initMouseTilt() {
  const cards = document.querySelectorAll(".hover-lift");

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const rotateY = ((x / rect.width) - 0.5) * 4;
      const rotateX = ((y / rect.height) - 0.5) * -4;

      card.style.transform = `translateY(-7px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

function initHeroSlider() {
  const slides = document.querySelectorAll(".hero-slider .slide");
  const dotsWrap = document.querySelector(".slider-dots");

  if (!slides.length || !dotsWrap) return;

  let currentIndex = 0;
  let autoSlide;

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    if (index === 0) dot.classList.add("active");

    dot.addEventListener("click", () => {
      showSlide(index);
      resetAutoSlide();
    });

    dotsWrap.appendChild(dot);
  });

  const dots = dotsWrap.querySelectorAll("button");

  function showSlide(index) {
    slides.forEach((slide) => slide.classList.remove("active"));
    dots.forEach((dot) => {
      dot.classList.remove("active");
      dot.removeAttribute("aria-current");
    });

    slides[index].classList.add("active");
    dots[index].classList.add("active");
    dots[index].setAttribute("aria-current", "true");
    currentIndex = index;
  }

  function nextSlide() {
    const nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
  }

  function startAutoSlide() {
    autoSlide = setInterval(() => {
      nextSlide();
    }, 5000);
  }

  function resetAutoSlide() {
    clearInterval(autoSlide);
    startAutoSlide();
  }

  showSlide(0);
  startAutoSlide();
}

function initChatWidget() {
  const chatToggle = document.getElementById("chatToggle");
  const chatWindow = document.getElementById("chatWindow");
  const chatClose = document.getElementById("chatClose");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatBody = document.getElementById("chatBody");
  const chatSend = chatForm?.querySelector(".chat-send");

  if (!chatToggle || !chatWindow || !chatClose || !chatForm || !chatInput || !chatBody || !chatSend) return;
  if (chatForm.dataset.initialized === "true") return;

  chatForm.dataset.initialized = "true";
  const conversationHistory = [];

  const quickReplies = [
    {
      keywords: ["fee", "fees", "payment"],
      reply: "Our system can help with fee tracking, payment records, and reminders. You can also contact our team for a demo."
    },
    {
      keywords: ["demo", "trial", "start"],
      reply: "You can begin by clicking Get Started or Schedule a Demo on this page. We would be happy to walk you through the system."
    },
    {
      keywords: ["attendance", "student", "record"],
      reply: "Yes, the platform supports attendance tracking and student record management in one place."
    },
    {
      keywords: ["contact", "call", "email", "support"],
      reply: "You can reach the team from the Contact page for account-specific help, demos, implementation planning, and support follow-up."
    },
    {
      keywords: ["module", "feature", "dashboard", "analytics"],
      reply: "The platform includes student records, attendance, fees, exams, library tools, smart alerts, dashboards, and reporting in one place."
    }
  ];

  function setChatOpen(isOpen) {
    chatWindow.hidden = !isOpen;
    chatToggle.setAttribute("aria-expanded", String(isOpen));
    chatToggle.setAttribute("aria-label", isOpen ? "Close support chat" : "Open support chat");

    if (isOpen) {
      chatInput.focus();
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  function appendMessage(message, type, extraClass = "") {
    const bubble = document.createElement("div");
    bubble.className = `chat-message ${type}-message ${extraClass}`.trim();
    bubble.textContent = message;
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
    return bubble;
  }

  function setChatLoading(isLoading) {
    chatInput.disabled = isLoading;
    chatSend.disabled = isLoading;
    chatSend.textContent = isLoading ? "Sending..." : "Send";

    if (!isLoading) {
      chatInput.focus();
    }
  }

  function getFallbackReply(message, reason = "") {
    const normalized = message.toLowerCase();
    const match = quickReplies.find((item) =>
      item.keywords.some((keyword) => normalized.includes(keyword))
    );

    if (match) return match.reply;

    if (reason.includes("API key")) {
      return "Live AI support is not configured correctly yet. I can still help with modules, attendance, fees, exams, dashboards, demos, and contact options.";
    }

    if (reason) {
      return "Live AI support is temporarily unavailable. You can still ask about modules, attendance, fees, demos, onboarding, or use the Contact page for team support.";
    }

    return "I can help with modules, attendance, fees, exams, dashboards, onboarding, and demos. For account-specific help, please use the Contact page.";
  }

  function buildSupportRequest(message) {
    const history = conversationHistory.slice(-8).map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.text }]
    }));

    history.push({
      role: "user",
      parts: [{
        text: [
          `Current page: ${document.title}`,
          `Path: ${window.location.pathname}`,
          `User question: ${message}`
        ].join("\n")
      }]
    });

    return {
      systemInstruction: {
        parts: [{ text: LIVE_SUPPORT_SYSTEM_PROMPT }]
      },
      contents: history,
      generationConfig: LIVE_SUPPORT_CONFIG.generationConfig
    };
  }

  function extractSupportReply(data) {
    const parts = data?.candidates?.[0]?.content?.parts;

    if (!Array.isArray(parts)) {
      return "";
    }

    return parts
      .map((part) => part?.text || "")
      .join("")
      .trim();
  }

  function getSupportError(data, status) {
    return (
      data?.error?.message ||
      data?.message ||
      `Live support request failed with status ${status}.`
    );
  }

  async function fetchSupportReply(message) {
    if (!LIVE_SUPPORT_CONFIG.endpoint) {
      return getFallbackReply(message);
    }

    const response = await fetch(LIVE_SUPPORT_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildSupportRequest(message))
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(getSupportError(data, response.status));
    }

    const reply = extractSupportReply(data);

    if (!reply) {
      throw new Error("Live support returned an empty response.");
    }

    return reply;
  }

  chatToggle.addEventListener("click", () => {
    const shouldOpen = chatWindow.hidden;
    setChatOpen(shouldOpen);
  });

  chatClose.addEventListener("click", () => {
    setChatOpen(false);
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage(message, "user");
    conversationHistory.push({ role: "user", text: message });
    chatInput.value = "";
    setChatLoading(true);
    const loadingBubble = appendMessage("Thinking...", "bot", "chat-loading");

    try {
      const reply = await fetchSupportReply(message);
      loadingBubble.remove();
      appendMessage(reply, "bot");
      conversationHistory.push({ role: "model", text: reply });
    } catch (error) {
      console.error("Live support error:", error);
      loadingBubble.remove();
      const fallbackReply = getFallbackReply(message, error.message || "");
      appendMessage(fallbackReply, "bot");
      conversationHistory.push({ role: "model", text: fallbackReply });
    } finally {
      setChatLoading(false);
    }
  });
}

function initFooterForm() {
  const footerForms = document.querySelectorAll(".footer-form");

  footerForms.forEach((form) => {
    const input = form.querySelector("input[type='email']");
    const message = form.querySelector(".footer-form-message");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const email = input?.value.trim() || "";
      if (!message) return;

      if (!email) {
        message.textContent = "Please enter your email address.";
        message.className = "footer-form-message error";
        return;
      }

      message.textContent = "Thanks for subscribing. We will keep you updated.";
      message.className = "footer-form-message success";
      form.reset();
    });
  });
}
