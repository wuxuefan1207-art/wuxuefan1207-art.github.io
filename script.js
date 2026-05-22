(function () {
  document.documentElement.classList.add("has-js");

  const content = window.SITE_CONTENT;
  const visiblePhotos = () => content.photos.filter((photo) => photo.src);
  const photoById = (id) => visiblePhotos().find((photo) => photo.id === id);
  const writingById = (id) => content.writing.find((item) => item.id === id);
  const collectionPhotos = (collection) =>
    (collection.photoIds || []).map(photoById).filter(Boolean);
  const collectionCover = (collection) =>
    photoById(collection.cover) || collectionPhotos(collection)[0];
  const shuffle = (items) => {
    const list = [...items];
    for (let index = list.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [list[index], list[target]] = [list[target], list[index]];
    }
    return list;
  };

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
    modal.root.querySelectorAll(".related-writing").forEach((node) => node.remove());

    const relatedWriting = (item.relatedWritingIds || []).map(writingById).filter(Boolean);
    if (type === "摄影" && relatedWriting.length) {
      const related = el("div", "related-writing");
      related.appendChild(el("p", "eyebrow", "Related Writing"));
      related.append(
        ...relatedWriting.map((entry) => {
          const link = el("a");
          link.href = isRealUrl(entry.url) ? entry.url : "writing.html";
          if (isRealUrl(entry.url)) {
            link.target = "_blank";
            link.rel = "noreferrer";
          }
          link.textContent = entry.title;
          return link;
        }),
      );
      modal.description.insertAdjacentElement("afterend", related);
    }

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
    const siteName = document.getElementById("siteName");
    const siteTagline = document.getElementById("siteTagline");
    const siteIntro = document.getElementById("siteIntro");
    const aboutText = document.getElementById("aboutText");
    const footerName = document.getElementById("footerName");
    const year = document.getElementById("year");

    if (siteName) siteName.textContent = content.profile.name;
    if (siteTagline) siteTagline.textContent = content.profile.tagline;
    if (siteIntro) siteIntro.textContent = content.profile.intro;
    if (aboutText) aboutText.textContent = content.profile.about;
    if (footerName) footerName.textContent = content.profile.name;
    if (year) year.textContent = new Date().getFullYear();

    const facts = document.getElementById("factsList");
    if (!facts) return;

    facts.replaceChildren(
      ...content.profile.facts.map(([label, value]) => {
        const item = el("div");
        item.append(el("dt", "", label), el("dd", "", value));
        return item;
      }),
    );
  };

  const renderLatest = () => {
    const latestGrid = document.getElementById("latestGrid");
    const latestNote = document.getElementById("latestNote");
    if (!latestGrid || !latestNote) return;

    const all = [
      ...content.writing.map((item) => ({ ...item, type: "文字" })),
      ...visiblePhotos().map((item) => ({ ...item, type: "摄影" })),
      ...content.videos.map((item) => ({ ...item, type: "视频" })),
    ].sort(byDateDesc);

    latestNote.textContent =
      `当前收录 ${all.length} 条，最近更新 ${all[0] ? formatDate(all[0].date) : ""}`;

    latestGrid.replaceChildren(
      ...all.slice(0, 3).map((item) => {
        const card = el("article", `card latest-card ${item.type === "摄影" ? "has-media" : ""}`);
        const top = el("div");

        if (item.type === "摄影") {
          const media = el("div", "latest-media");
          media.appendChild(renderImage(item));
          card.appendChild(media);
        }

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
    const writingCount = document.getElementById("writingCount");
    const writingList = document.getElementById("writingList");
    if (!writingCount || !writingList) return;

    writingCount.textContent = `共 ${content.writing.length} 篇`;

    writingList.replaceChildren(
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
    const photoCount = document.getElementById("photoCount");
    const photoGrid = document.getElementById("photoGrid");
    if (!photoCount || !photoGrid) return;

    const photos =
      category === "全部"
        ? visiblePhotos()
        : visiblePhotos().filter((photo) => photo.category === category);

    photoCount.textContent =
      category === "全部" ? `共 ${visiblePhotos().length} 张照片，随机排列` : `${category} · ${photos.length} 张`;

    photoGrid.replaceChildren(
      ...shuffle(photos).map((item) => photoCard(item)),
    );
  };

  const photoCard = (item, className = "") => {
    const card = el("button", `photo-card${className ? ` ${className}` : ""}`);
    card.type = "button";
    card.append(renderImage(item), el("div", "photo-caption"));
    const caption = card.querySelector(".photo-caption");
    caption.append(
      el("h3", "", item.title),
      el("p", "", `${item.location || "Unknown"} · ${formatDate(item.date)}`),
    );
    card.addEventListener("click", () => openModal(item, "摄影"));
    return card;
  };

  const collectionCard = (collection, isLarge = false) => {
    const photos = collectionPhotos(collection);
    const cover = collectionCover(collection);
    const card = el("a", `collection-card${isLarge ? " is-large" : ""}`);
    card.href = `collection.html?id=${encodeURIComponent(collection.id)}`;
    if (cover) card.append(renderImage(cover));

    const copy = el("span", "collection-copy");
    copy.append(
      el("span", "showcase-kicker", `${photos.length} 张照片 · ${collection.dateRange}`),
      el("strong", "", collection.title),
      el("span", "", collection.subtitle || collection.location || ""),
      el("em", "", collection.description || ""),
    );
    card.appendChild(copy);
    return card;
  };

  const renderPhotoShowcase = () => {
    const showcase = document.getElementById("photoShowcase");
    const note = document.getElementById("photoShowcaseNote");
    if (!showcase || !note) return;

    const collections = (content.photoCollections || []).filter((collection) => collection.featured);
    note.textContent = `当前展示 ${collections.length} 个精选摄影集，进入后可查看对应主题下的照片。`;

    showcase.replaceChildren(...collections.slice(0, 5).map((collection) => collectionCard(collection)));
  };

  const renderPhotoCollections = () => {
    const grid = document.getElementById("photoCollectionGrid");
    if (!grid) return;

    const collections = content.photoCollections || [];
    grid.replaceChildren(
      ...collections.map((collection, index) => collectionCard(collection, index === 0)),
    );
  };

  const renderCollectionPage = () => {
    const hero = document.getElementById("collectionHero");
    const grid = document.getElementById("collectionPhotoGrid");
    const title = document.getElementById("collectionPhotosTitle");
    const nav = document.getElementById("collectionNav");
    if (!hero || !grid) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const collections = content.photoCollections || [];
    const collectionIndex = collections.findIndex((item) => item.id === id);
    const collection = collections[collectionIndex];

    if (!collection) {
      document.title = `未找到摄影集 | ${content.profile.name}`;
      hero.classList.add("collection-hero-empty");
      hero.append(
        el("p", "eyebrow", "Photography"),
        el("h1", "", "未找到摄影集"),
        el("p", "", "这个摄影集可能还没有创建，或链接地址不完整。"),
        el("a", "button secondary", "返回摄影页"),
      );
      hero.querySelector("a").href = "photography.html";
      return;
    }

    const photos = collectionPhotos(collection);
    const cover = collectionCover(collection);
    document.title = `${collection.title} | 摄影集`;
    if (title) title.textContent = `${collection.title} · ${photos.length} 张照片`;

    const copy = el("div", "collection-hero-copy");
    const metaList = el("dl", "collection-meta-list");
    [
      ["主题", collection.subtitle],
      ["地点", collection.location],
      ["时间", collection.dateRange],
      ["数量", `${photos.length} 张照片`],
    ]
      .filter(([, value]) => value)
      .forEach(([label, value]) => {
        const item = el("div");
        item.append(el("dt", "", label), el("dd", "", value));
        metaList.appendChild(item);
      });

    copy.append(
      el("p", "eyebrow", "Photography Collection"),
      el("h1", "", collection.title),
      el("p", "", collection.description),
      metaList,
    );

    const media = el("div", "collection-hero-media");
    if (cover) media.append(renderImage(cover));
    hero.replaceChildren(copy, media);

    const sequence = [];
    photos.forEach((item, index) => {
      const classes = [
        index === 0 ? "is-featured-photo" : "",
        index === 1 ? "is-quiet-photo" : "",
        index === 2 ? "is-tall-photo" : "",
      ]
        .filter(Boolean)
        .join(" ");
      sequence.push(photoCard(item, classes));

      if (index === 1 && photos.length > 3) {
        const note = el("aside", "collection-sequence-note");
        note.append(
          el("p", "eyebrow", "Sequence"),
          el("strong", "", collection.subtitle || collection.title),
          el("span", "", collection.description),
        );
        sequence.push(note);
      }
    });
    grid.replaceChildren(...sequence);

    if (nav && collections.length > 1) {
      const previous = collections[(collectionIndex - 1 + collections.length) % collections.length];
      const next = collections[(collectionIndex + 1) % collections.length];
      nav.replaceChildren(
        collectionNavLink(previous, "上一组", "Previous"),
        collectionNavLink(next, "下一组", "Next"),
      );
    }
  };

  const collectionNavLink = (collection, label, direction) => {
    const link = el("a", "collection-nav-link");
    link.href = `collection.html?id=${encodeURIComponent(collection.id)}`;
    link.append(
      el("span", "showcase-kicker", direction),
      el("strong", "", label),
      el("em", "", collection.title),
    );
    return link;
  };

  const renderPhotoFilters = () => {
    const filterBar = document.getElementById("photoFilters");
    if (!filterBar) return;

    const categories = ["全部", ...new Set(visiblePhotos().map((photo) => photo.category))];
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get("category") || "全部";
    const initialCategory = categories.includes(requestedCategory) ? requestedCategory : "全部";

    filterBar.replaceChildren(
      ...categories.map((category) => {
        const button = el("button", "filter-button", category);
        button.type = "button";
        if (category === initialCategory) button.classList.add("is-active");
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

    renderPhotos(initialCategory);
  };

  const renderVideos = () => {
    const videoCount = document.getElementById("videoCount");
    const videoGrid = document.getElementById("videoGrid");
    if (!videoCount || !videoGrid) return;

    videoCount.textContent = `共 ${content.videos.length} 条视频`;

    videoGrid.replaceChildren(
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
    const archiveList = document.getElementById("archiveList");
    if (!archiveList) return;

    const archive = [
      ...content.writing.map((item) => ({ ...item, type: "文字" })),
      ...visiblePhotos().map((item) => ({ ...item, type: "摄影" })),
      ...content.videos.map((item) => ({ ...item, type: "视频" })),
    ].sort(byDateDesc);

    archiveList.replaceChildren(
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
    if (!modal.root) return;

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
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === currentPage || (currentPage === "collection.html" && href === "photography.html")) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });

    const sections = links
      .map((link) => link.getAttribute("href"))
      .filter((href) => href && href.startsWith("#"))
      .map((href) => document.querySelector(href))
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

  const setupReveal = () => {
    const targets = [
      ...document.querySelectorAll(
        ".section, .collection-card, .collection-hero, .card, .writing-item, .photo-card, .video-card, .archive-row",
      ),
    ];

    targets.forEach((target) => target.classList.add("reveal"));

    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    targets.forEach((target) => observer.observe(target));
  };

  setProfile();
  renderLatest();
  renderWriting();
  renderPhotoShowcase();
  renderPhotoCollections();
  renderCollectionPage();
  renderPhotoFilters();
  if (!document.getElementById("photoFilters")) renderPhotos();
  renderVideos();
  renderArchive();
  setupModal();
  setupNavHighlight();
  setupReveal();
})();
