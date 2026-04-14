document.addEventListener("DOMContentLoaded", () => {
  const headerTarget = document.getElementById("header");
  const footerTarget = document.getElementById("footer");

  const loadPart = async (target, path, callback) => {
    if (!target) return;
    try {
      const res = await fetch(path);
      const html = await res.text();
      target.innerHTML = html;
      if (callback) callback();
    } catch (error) {
      console.error(`Error loading ${path}:`, error);
    }
  };

  loadPart(headerTarget, "./components/header.html", () => {
    setActiveNav();
    initMenu();
  });

  loadPart(footerTarget, "./components/footer.html", () => {
    window.initFooterForm?.();
    loadLiveSupport();
  });
});

async function loadLiveSupport() {
  if (document.body.classList.contains("auth-page")) return;
  if (document.querySelector(".chat-widget")) return;

  try {
    const res = await fetch("./components/live-support.html");
    const html = await res.text();
    document.body.insertAdjacentHTML("beforeend", html);
    window.initChatWidget?.();
  } catch (error) {
    console.error("Error loading live support widget:", error);
  }
}

function setActiveNav() {
  const pathName = window.location.pathname;
  const currentFile = (pathName.endsWith("/") ? "index" : pathName.split("/").pop() || "index")
    .replace(/\.html$/i, "");
  const links = document.querySelectorAll(".nav a");

  links.forEach((link) => {
    const href = ((link.getAttribute("href") || "").replace(/^\.\//, "").split("#")[0] || "index.html")
      .replace(/\.html$/i, "");

    if (href === currentFile) {
      link.classList.add("active");
    }
  });
}

function initMenu() {
  const btn = document.getElementById("menuBtn");
  const nav = document.getElementById("mainNav");

  if (btn && nav) {
    btn.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }
}
