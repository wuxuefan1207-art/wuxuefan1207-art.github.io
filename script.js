(function () {
  const content = window.SITE_CONTENT;

  const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
  const formatDate = (date) =>
    new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  const isRealUrl = (url) => Boolean(url && url !== "#");
  const isVideoFile = (url) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || "");

  const getEmbedUrl = (url) => {
    if (!url) return "";

    try {
      const parsed = new URL(url, window.location.href);
      const host = parsed.hostname.replace(/^www\./, "");

      if (host === "youtube.com" && parsed.searchParams.get("v")) {
        return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
      }

      if (host === "youtu.be") {
        return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
      }

      if (host === "vimeo.com") {
        const id = parsed.pathname.split("/").filter(Boolean)[0];
        return id ? `https://player.vimeo.com/video/${id}` : "";
      }

      if (host === "bilibili.com") {
        const match = parsed.pathname.match(/\/video\/([^/?]+)/);
        return match ? `https://player.bilibili.com/player.html?bvid=${match[1]}` : "";
      }
    } catch (error) {
      return "";
    }

    return "";
  };

  const linkWrap = (item, child) => {
    const anchor = el("a");
    anchor.href = isRealUrl(item.url) ? item.url : "#";
    if (isRealUrl(item.url)) {
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
    }
    anchor.appendChild(child);
    return anchor;
  };

  const modal = {
    root: document.getElementById("mediaModal"),
    media: document.getElementById("modalMedia"),
    title: document.getElementById("modalTitle"),
    meta: document.getElementById("modalMeta"),
    description: document.getElementById("modalDescription"),
    link: document.getElementById("modalLink"),
  };

  const photoArt = () => el("div", "fallback-art");

  const renderImage = (item) => {
    if (!item.src) return photoArt();

    const image = el("img");
    image.src = item.src;
    image.alt = item.title;
    image.loading = "lazy";
    return image;
  };

  const renderVideoMedia = (item) => {
    const url = item.url || "";
    const embedUrl = getEmbedUrl(url);

    if (isVideoFile(url)) {
      const video = el("video");
      video.src = url;
      video.controls = true;
      video.playsInline = true;
      if (item.thumb) video.poster = item.thumb;
      return video;
    }

    if (embedUrl) {
      const iframe = el("iframe");
      iframe.src = embedUrl;
      iframe.title = item.title;
      iframe.loading = "lazy";
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      return iframe;
    }

    if (item.thumb) {
      const image = el("img");
      image.src = item.thumb;
      image.alt = item.title;
      image.loading = "lazy";
      return image;
    }

    return photoArt();
  };

  const openModal = (item, type) => {
    modal.media.replaceChildren(type === "视频" ? renderVideoMedia(item) : renderImage(item));
    modal.title.textContent = item.title;
    modal.meta.textContent = [type, item.category, item.location, formatDate(item.date)]
      .filter(Boolean)
      .join(" · ");
    modal.description.textContent = item.excerpt || item.description || "";

    const linkTarget = type === "摄影" ? item.src : item.url;
    modal.link.href = isRealUrl(linkTarget) ? linkTarget : "#";
    modal.link.classList.toggle("is-hidden", !isRealUrl(linkTarget));
    modal.link.textContent = type === "摄影" ? "打开图片" : "打开原链接";

    modal.root.classList.add("is-open");
    modal.root.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    modal.root.classList.remove("is-open");
    modal.root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    modal.media.replaceChildren();
  };

  const interactiveWrap = (item, type, child) => {
    if (type === "文字") return linkWrap(item, child);

    const button = el("button", "card-button");
    button.type = "button";
    button.appendChild(child);
    button.addEventListener("click", () => openModal(item, type));
    return button;
  };

  const setProfile = () => {
    document.title = `${content.profile.name} | 文字 摄影 影像`;
    document.getElementById("siteName").textContent = content.profile.name;
    document.getElementById("siteTagline").textContent = content.profile.tagline;
    document.getElementById("siteIntro").textContent = content.profile.intro;
    document.getElementById("aboutText").textContent = content.profile.about;
    document.getElementById("footerName").textContent = content.profile.name;
    document.getElementById("year").textContent = new Date().getFullYear();

    const facts = document.getElementById("factsList");
    facts.replaceChildren(
      ...content.profile.facts.map(([label, value]) => {
        const item = el("div");
        item.append(el("dt", "", label), el("dd", "", value));
        return item;
      }),
    );
  };

  const renderLatest = () => {
    const all = [
      ...content.writing.map((item) => ({ ...item, type: "文字" })),
      ...content.photos.map((item) => ({ ...item, type: "摄影" })),
      ...content.videos.map((item) => ({ ...item, type: "视频" })),
    ].sort(byDateDesc);

    document.getElementById("latestNote").textContent =
      `当前收录 ${all.length} 条，最近更新 ${all[0] ? formatDate(all[0].date) : ""}`;

    document.getElementById("latestGrid").replaceChildren(
      ...all.slice(0, 3).map((item) => {
        const card = el("article", "card");
        const top = el("div");
        top.append(
          el("span", "tag", item.type),
          el("h3", "", item.title),
          el("p", "", item.excerpt || item.description || item.location || ""),
        );
        card.append(top, el("p", "meta", formatDate(item.date)));
        return interactiveWrap(item, item.type, card);
      }),
    );
  };

  const renderWriting = () => {
    document.getElementById("writingCount").textContent =
      `共 ${content.writing.length} 篇`;

    document.getElementById("writingList").replaceChildren(
      ...[...content.writing].sort(byDateDesc).map((item) => {
        const article = el("article", "writing-item");
        const copy = el("div");
        copy.append(el("h3", "", item.title), el("p", "", item.excerpt));
        article.append(
          el("p", "meta", `${formatDate(item.date)} · ${item.category}`),
          copy,
          el("strong", "writing-action", "阅读"),
        );
        return linkWrap(item, article);
      }),
    );
  };

  const renderPhotos = (category = "全部") => {
    const photos =
      category === "全部"
        ? [...content.photos]
        : content.photos.filter((photo) => photo.category === category);

    document.getElementById("photoCount").textContent =
      category === "全部" ? `共 ${content.photos.length} 组照片` : `${category} · ${photos.length} 组`;

    document.getElementById("photoGrid").replaceChildren(
      ...photos.sort(byDateDesc).map((item) => {
        const card = el("button", "photo-card");
        card.type = "button";
        card.append(
          renderImage(item),
          el("div", "photo-caption"),
        );
        const caption = card.querySelector(".photo-caption");
        caption.append(
          el("h3", "", item.title),
          el("p", "", `${item.location || "Unknown"} · ${formatDate(item.date)}`),
        );
        card.addEventListener("click", () => openModal(item, "摄影"));
        return card;
      }),
    );
  };

  const renderPhotoFilters = () => {
    const categories = ["全部", ...new Set(content.photos.map((photo) => photo.category))];
    const filterBar = document.getElementById("photoFilters");
    filterBar.replaceChildren(
      ...categories.map((category) => {
        const button = el("button", "filter-button", category);
        button.type = "button";
        if (category === "全部") button.classList.add("is-active");
        button.addEventListener("click", () => {
          filterBar
            .querySelectorAll(".filter-button")
            .forEach((node) => node.classList.remove("is-active"));
          button.classList.add("is-active");
          renderPhotos(category);
        });
        return button;
      }),
    );
  };

  const renderVideos = () => {
    document.getElementById("videoCount").textContent =
      `共 ${content.videos.length} 条视频`;

    document.getElementById("videoGrid").replaceChildren(
      ...[...content.videos].sort(byDateDesc).map((item) => {
        const card = el("button", "video-card");
        const thumb = el("div", "video-thumb");
        card.type = "button";

        if (item.thumb) {
          const image = el("img");
          image.src = item.thumb;
          image.alt = item.title;
          image.loading = "lazy";
          thumb.appendChild(image);
        } else {
          thumb.appendChild(photoArt());
        }

        thumb.appendChild(el("span", "play", "▶"));
        const copy = el("div", "content");
        copy.append(
          el("p", "meta", formatDate(item.date)),
          el("h3", "", item.title),
          el("p", "", item.description),
        );
        card.append(thumb, copy);
        card.addEventListener("click", () => openModal(item, "视频"));
        return card;
      }),
    );
  };

  const renderArchive = () => {
    const archive = [
      ...content.writing.map((item) => ({ ...item, type: "文字" })),
      ...content.photos.map((item) => ({ ...item, type: "摄影" })),
      ...content.videos.map((item) => ({ ...item, type: "视频" })),
    ].sort(byDateDesc);

    document.getElementById("archiveList").replaceChildren(
      ...archive.map((item) => {
        const row = el("div", "archive-row");
        row.append(
          el("span", "meta", formatDate(item.date)),
          el("strong", "", item.type),
          el("span", "", item.title),
        );
        return row;
      }),
    );
  };

  const setupModal = () => {
    modal.root.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-modal]")) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.root.classList.contains("is-open")) {
        closeModal();
      }
    });
  };

  const setupNavHighlight = () => {
    const links = [...document.querySelectorAll("[data-nav-link]")];
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        links.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${visible.target.id}`;
          link.classList.toggle("is-active", isActive);
          if (isActive) {
            link.setAttribute("aria-current", "page");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.12, 0.4, 0.7] },
    );

    sections.forEach((section) => observer.observe(section));
  };

  setProfile();
  renderLatest();
  renderWriting();
  renderPhotoFilters();
  renderPhotos();
  renderVideos();
  renderArchive();
  setupModal();
  setupNavHighlight();
})();
