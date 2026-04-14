const API_URL = "https://api.campusedgepro.com/api/auth/blog";
const BLOGS_PER_PAGE = 6;
const HOME_BLOG_LIMIT = 4;
const FALLBACK_BLOG_IMAGE = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";

let allBlogs = [];
let currentPage = 1;
let totalPages = 1;

const blogGrid = document.getElementById("blogGrid");
const blogStatus = document.getElementById("blogStatus");
const paginationBar = document.getElementById("paginationBar");
const homeBlogGrid = document.getElementById("homeBlogGrid");
const homeBlogStatus = document.getElementById("homeBlogStatus");

document.addEventListener("DOMContentLoaded", () => {
  if (blogGrid || homeBlogGrid) {
    fetchBlogs(1);
  }
});

async function fetchBlogs(page = 1, shouldScroll = false) {
  try {
    showStatus("Loading blogs...");
    showHomeStatus("Loading blogs...");

    const response = await fetch(buildBlogUrl(page), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(await getBlogApiError(response));
    }

    const data = await response.json();
    const rawBlogs = getRawBlogs(data);
    const pagination = getPagination(data, rawBlogs.length, page);

    allBlogs = rawBlogs.map(normalizeBlog).filter(blog => blog.title);
    currentPage = pagination.currentPage;
    totalPages = pagination.lastPage;

    if (!allBlogs.length) {
      clearBlogGrid();
      clearHomeBlogGrid();
      showStatus("No blogs found.");
      showHomeStatus("No blogs found.");
      return;
    }

    if (blogGrid) {
      hideStatus();
      renderBlogGrid(shouldScroll);
    }

    if (homeBlogGrid) {
      hideHomeStatus();
      renderHomeBlogs();
    }
  } catch (error) {
    console.error("Blog fetch error:", error);
    clearBlogGrid();
    clearHomeBlogGrid();
    const errorMessage = getBlogErrorMessage(error);
    showStatus(errorMessage);
    showHomeStatus(errorMessage);
  }
}

function buildBlogUrl(page) {
  const url = new URL(API_URL);
  url.searchParams.set("page", String(page));
  return url.toString();
}

function getRawBlogs(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.blogs || data?.posts || data?.data || data?.items || [];
}

function getPagination(data, itemCount, page) {
  const lastPage = Number(data?.pagination?.last_page) || Math.max(1, Math.ceil(itemCount / BLOGS_PER_PAGE));
  const current = Number(data?.pagination?.current_page) || page;

  return {
    currentPage: current,
    lastPage
  };
}

function normalizeBlog(blog) {
  return {
    id: blog.id,
    title: getText(
      blog.title,
      blog.post_title,
      blog.name,
      blog.heading
    ),

    category: getText(
      blog.category,
      blog.categories?.[0]?.name,
      blog.categories_names?.[0],
      blog.category_name,
      blog.tag,
      "Blog"
    ),

    description: getText(
      blog.description,
      blog.excerpt,
      blog.short_description,
      blog.summary,
      blog.content
    ),

    image: getImage(blog),

    date: getDate(
      blog.date,
      blog.post_date,
      blog.created_at,
      blog.createdAt,
      blog.published_at,
      blog.modified
    ),

    readTime: getText(
      blog.readTime,
      blog.read_time,
      estimateReadTime(
        getText(blog.description, blog.excerpt, blog.content, "")
      )
    ),

    link: getLink(blog)
  };
}

function getText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return stripHtml(value.trim());
    }

    if (value && typeof value === "object") {
      if (typeof value.rendered === "string" && value.rendered.trim()) {
        return stripHtml(value.rendered.trim());
      }
    }
  }
  return "";
}

function getImage(blog) {
  return getImageUrl(
    blog.image_url ||
    blog.image ||
    blog.thumbnail ||
    blog.featured_image ||
    blog.featured_media_url ||
    blog.featured_image_url ||
    blog.thumbnail_url ||
    blog.post_thumbnail ||
    blog.banner ||
    blog.cover ||
    blog.featuredImage ||
    blog.jetpack_featured_media_url ||
    blog.yoast_head_json?.og_image?.[0]?.url ||
    blog._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
    blog._embedded?.["wp:featuredmedia"]?.[0] ||
    FALLBACK_BLOG_IMAGE
  );
}

function getImageUrl(value) {
  if (typeof value === "string" && value.trim()) {
    return normalizeImageUrl(value.trim());
  }

  if (!value || typeof value !== "object") {
    return FALLBACK_BLOG_IMAGE;
  }

  const possibleValues = [
    value.url,
    value.src,
    value.source_url,
    value.full,
    value.medium_large,
    value.large,
    value.guid?.rendered,
    value.sizes?.large,
    value.sizes?.full,
    value.sizes?.medium_large,
    value.media_details?.sizes?.large?.source_url,
    value.media_details?.sizes?.full?.source_url,
    value.media_details?.sizes?.medium_large?.source_url
  ];

  for (const possibleValue of possibleValues) {
    const imageUrl = getImageUrl(possibleValue);
    if (imageUrl !== FALLBACK_BLOG_IMAGE) {
      return imageUrl;
    }
  }

  return FALLBACK_BLOG_IMAGE;
}

function normalizeImageUrl(url) {
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (url.startsWith("/")) {
    return new URL(url, API_URL).href;
  }

  if (url.startsWith("storage/")) {
    return new URL(`/${url}`, API_URL).href;
  }

  return new URL(`/storage/${url}`, API_URL).href;
}

function getDate(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      }
    }
  }
  return "No date";
}

function getLink(blog) {
  return (
    blog.link ||
    blog.url ||
    blog.permalink ||
    (blog.slug && `/blog/${blog.slug}`) ||
    "#"
  );
}

async function renderPage(page, shouldScroll = false) {
  const nextPage = Number(page);

  if (!blogGrid || !Number.isInteger(nextPage) || nextPage < 1 || nextPage > totalPages) {
    return;
  }

  await fetchBlogs(nextPage, shouldScroll);
}

function renderBlogGrid(shouldScroll = false) {
  blogGrid.innerHTML = allBlogs.map(createBlogCard).join("");
  renderPagination();

  if (shouldScroll) {
    window.scrollTo({
      top: blogGrid.offsetTop - 120,
      behavior: "smooth"
    });
  }
}

function renderHomeBlogs() {
  const homeBlogs = allBlogs.slice(0, HOME_BLOG_LIMIT);
  homeBlogGrid.innerHTML = homeBlogs.map(createBlogCard).join("");
}

function createBlogCard(blog) {
  return `
    <article class="card blog-card hover-lift">
      <div class="blog-thumb">
        <img src="${escapeHtml(blog.image)}" alt="${escapeHtml(blog.title)}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_BLOG_IMAGE}';">
      </div>
      <div class="blog-body">
        <div class="category">${escapeHtml(blog.category)}</div>
        <h3>${escapeHtml(blog.title)}</h3>
        <p>${escapeHtml(limitText(blog.description, 120))}</p>
        <a class="blog-read-more" href="${escapeHtml(blog.link)}">Read More →</a>
        <div class="blog-meta">
          <span>${escapeHtml(blog.date)}</span>
          <span>${escapeHtml(blog.readTime)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderPagination() {
  if (totalPages <= 1) {
    paginationBar.innerHTML = "";
    return;
  }

  let html = `
    <button class="pagination-btn" ${currentPage === 1 ? "disabled" : ""} onclick="renderPage(${currentPage - 1}, true)">
      Prev
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="pagination-btn ${i === currentPage ? "active" : ""}" onclick="renderPage(${i}, true)">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="pagination-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="renderPage(${currentPage + 1}, true)">
      Next
    </button>
  `;

  paginationBar.innerHTML = html;
}

function showStatus(message) {
  if (!blogStatus) return;
  blogStatus.textContent = message;
  blogStatus.style.display = "block";
}

function hideStatus() {
  if (!blogStatus) return;
  blogStatus.style.display = "none";
}

function showHomeStatus(message) {
  if (!homeBlogStatus) return;
  homeBlogStatus.textContent = message;
  homeBlogStatus.style.display = "block";
}

function hideHomeStatus() {
  if (!homeBlogStatus) return;
  homeBlogStatus.style.display = "none";
}

function clearBlogGrid() {
  if (blogGrid) {
    blogGrid.innerHTML = "";
  }

  if (paginationBar) {
    paginationBar.innerHTML = "";
  }
}

function clearHomeBlogGrid() {
  if (homeBlogGrid) {
    homeBlogGrid.innerHTML = "";
  }
}

function getBlogErrorMessage(error) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return `Browser blocked the blog API. Allow ${window.location.origin} in the CORS settings for ${new URL(API_URL).origin}.`;
  }

  return error.message || "Unable to load blogs right now.";
}

async function getBlogApiError(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => ({}));
    return data?.message || data?.error || `Blog API returned HTTP ${response.status}.`;
  }

  const text = await response.text().catch(() => "");

  if (text.includes("<title>Server Error</title>")) {
    return `Blog API returned HTTP ${response.status}. Fix the Laravel /api/auth/blog endpoint.`;
  }

  return `Blog API returned HTTP ${response.status}.`;
}

function stripHtml(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

function limitText(text, maxLength) {
  if (!text) return "No description available.";
  return text.length > maxLength ? text.slice(0, maxLength).trim() + "..." : text;
}

function estimateReadTime(text) {
  const words = stripHtml(text).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function escapeHtml(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.renderPage = renderPage;
