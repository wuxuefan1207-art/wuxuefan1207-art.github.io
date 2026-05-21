(function () {
  const content = window.SITE_CONTENT;

  const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
  const formatDate = (date) =>
    new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));

  const el = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html) node.innerHTML = html;
    return node;
  };

  const linkWrap = (item, child) => {
    const href = item.url || "#";
    const anchor = el("a");
    anchor.href = href;
    if (href !== "#") anchor.target = "_blank";
    if (href !== "#") anchor.rel = "noreferrer";
    anchor.appendChild(child);
    return anchor;
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
    ]
      .sort(byDateDesc)
      .slice(0, 3);

    document.getElementById("latestGrid").replaceChildren(
      ...all.map((item) => {
        const card = el(
          "article",
          "card",
          `<span class="tag">${item.type}</span>
           <h3>${item.title}</h3>
           <p>${item.excerpt || item.description || item.location || ""}</p>
           <p class="meta">${formatDate(item.date)}</p>`,
        );
        return linkWrap(item, card);
      }),
    );
  };

  const renderWriting = () => {
    document.getElementById("writingList").replaceChildren(
      ...content.writing.sort(byDateDesc).map((item) => {
        const article = el(
          "article",
          "writing-item",
          `<p class="meta">${formatDate(item.date)} · ${item.category}</p>
           <div>
             <h3>${item.title}</h3>
             <p>${item.excerpt}</p>
           </div>
           <strong>阅读</strong>`,
        );
        return linkWrap(item, article);
      }),
    );
  };

  const photoArt = () => el("div", "fallback-art");

  const renderPhotos = (category = "全部") => {
    const photos =
      category === "全部"
        ? content.photos
        : content.photos.filter((photo) => photo.category === category);

    document.getElementById("photoGrid").replaceChildren(
      ...photos.sort(byDateDesc).map((item) => {
        const card = el("article", "photo-card");
        const visual = item.src ? el("img") : photoArt();
        if (item.src) {
          visual.src = item.src;
          visual.alt = item.title;
          visual.loading = "lazy";
        }
        card.append(
          visual,
          el(
            "div",
            "photo-caption",
            `<h3>${item.title}</h3>
             <p>${item.location} · ${formatDate(item.date)}</p>`,
          ),
        );
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
    document.getElementById("videoGrid").replaceChildren(
      ...content.videos.sort(byDateDesc).map((item) => {
        const card = el("article", "video-card");
        const thumb = el("div", "video-thumb");
        if (item.thumb) {
          const image = el("img");
          image.src = item.thumb;
          image.alt = item.title;
          image.loading = "lazy";
          thumb.appendChild(image);
        } else {
          thumb.appendChild(el("div", "fallback-art"));
        }
        thumb.appendChild(el("span", "play", "▶"));
        card.append(
          thumb,
          el(
            "div",
            "content",
            `<p class="meta">${formatDate(item.date)}</p>
             <h3>${item.title}</h3>
             <p>${item.description}</p>`,
          ),
        );
        return linkWrap(item, card);
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
      ...archive.map((item) =>
        el(
          "div",
          "archive-row",
          `<span class="meta">${formatDate(item.date)}</span>
           <strong>${item.type}</strong>
           <span>${item.title}</span>`,
        ),
      ),
    );
  };

  setProfile();
  renderLatest();
  renderWriting();
  renderPhotoFilters();
  renderPhotos();
  renderVideos();
  renderArchive();
})();
