/**
 * Поведение публичных страниц. Всё здесь — надстройка: без скрипта страница работает,
 * формы отправляются обычным POST, каталог фильтруется кнопкой «Показать».
 */
(() => {
  "use strict";

  /* Мобильное меню через <dialog>: нативный перехват фокуса и Escape. */
  const menu = document.querySelector("[data-menu]");
  const openBtn = document.querySelector("[data-menu-open]");
  if (menu && openBtn) {
    const open = () => {
      menu.showModal();
      document.body.style.overflow = "hidden";
      openBtn.setAttribute("aria-expanded", "true");
    };
    const close = () => {
      menu.close();
    };
    openBtn.addEventListener("click", open);
    menu.querySelector("[data-menu-close]")?.addEventListener("click", close);
    menu.addEventListener("click", (e) => {
      if (e.target === menu) close();
    });
    menu.addEventListener("close", () => {
      document.body.style.overflow = "";
      openBtn.setAttribute("aria-expanded", "false");
    });
  }

  /* Фильтры каталога: на мобильном скрыты за кнопкой, на десктопе открыты всегда. */
  const filtersToggle = document.querySelector("[data-filters-toggle]");
  const filters = document.querySelector("[data-filters]");
  if (filtersToggle && filters) {
    const label = filtersToggle.querySelector("[data-filters-label]");
    const opened = label?.dataset.close || "Свернуть";
    const closed = label?.textContent || "Фильтры";
    filtersToggle.addEventListener("click", () => {
      const isOpen = filters.classList.toggle("hidden") === false;
      filtersToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (label) label.textContent = isOpen ? opened : closed;
    });
    // Изменение любого поля сразу применяет выборку — кнопка остаётся для тех, у кого нет скрипта.
    filters.addEventListener("change", (e) => {
      if (e.target instanceof HTMLElement && e.target.tagName !== "BUTTON") filters.requestSubmit();
    });
  }

  /* Галерея объекта: стрелки, миниатюры, клавиатура, свайп. */
  const gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    const slides = [...gallery.querySelectorAll("[data-slide]")];
    const thumbs = [...gallery.querySelectorAll("[data-gallery-thumb]")];
    const counter = gallery.querySelector("[data-gallery-counter]");
    const template = counter?.textContent || "";
    let index = 0;

    const show = (next) => {
      if (slides.length < 2) return;
      index = (next + slides.length) % slides.length;
      slides.forEach((img, i) => img.classList.toggle("hidden", i !== index));
      thumbs.forEach((btn, i) => {
        btn.classList.toggle("border-accent", i === index);
        btn.classList.toggle("border-transparent", i !== index);
        if (i === index) btn.setAttribute("aria-current", "true");
        else btn.removeAttribute("aria-current");
      });
      if (counter && template) {
        counter.textContent = template.replace(/^\d+/, String(index + 1));
      }
    };

    gallery.querySelector("[data-gallery-prev]")?.addEventListener("click", () => show(index - 1));
    gallery.querySelector("[data-gallery-next]")?.addEventListener("click", () => show(index + 1));
    thumbs.forEach((btn, i) => btn.addEventListener("click", () => show(i)));

    const stage = gallery.querySelector("section");
    stage?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        show(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        show(index + 1);
      }
    });
    let touchX = null;
    stage?.addEventListener("touchstart", (e) => {
      touchX = e.touches[0]?.clientX ?? null;
    }, { passive: true });
    stage?.addEventListener("touchend", (e) => {
      const end = e.changedTouches[0]?.clientX;
      if (touchX === null || end === undefined) return;
      const delta = end - touchX;
      touchX = null;
      if (Math.abs(delta) > 40) show(index + (delta < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* Маска телефона: значение остаётся читаемым, сервер нормализует его сам. */
  const formatPhone = (raw) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("8")) digits = "7" + digits.slice(1);
    if (!digits.startsWith("7")) digits = "7" + digits;
    digits = digits.slice(0, 11);
    const p = [digits.slice(1, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)];
    let out = "+7";
    if (p[0]) out += " (" + p[0];
    if (p[0]?.length === 3) out += ")";
    if (p[1]) out += " " + p[1];
    if (p[2]) out += "-" + p[2];
    if (p[3]) out += "-" + p[3];
    return out;
  };
  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener("input", () => {
      const pos = input.value.length - (input.selectionStart ?? 0);
      input.value = formatPhone(input.value);
      const next = Math.max(0, input.value.length - pos);
      input.setSelectionRange(next, next);
    });
    input.addEventListener("focus", () => {
      if (input.value.trim() === "") input.value = "+7 (";
    });
  });

  /* Метка времени: заявка, отправленная за секунду, — это бот. */
  document.querySelectorAll("[data-started-at]").forEach((field) => {
    field.value = String(Date.now());
  });

  /* Кнопка отправки: защита от повторного нажатия. */
  document.querySelectorAll("form[data-lead-form]").forEach((form) => {
    form.addEventListener("submit", () => {
      const button = form.querySelector("[data-submit]");
      if (!button) return;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      const loading = button.dataset.loadingText;
      if (loading) button.textContent = loading;
    });
  });

  /* Бриф: прогресс по заполненным шагам. */
  const brief = document.querySelector("[data-brief]");
  if (brief) {
    const progress = brief.querySelector("[data-brief-progress]");
    const template = progress?.textContent || "";
    const value = (name) => brief.querySelector(`[name="${name}"]`)?.value?.trim() || "";
    const update = () => {
      const districts = brief.querySelectorAll('[name="districts[]"]:checked').length;
      const done = [
        Boolean(value("briefKind") || value("dealType")),
        Boolean(value("areaFrom") || value("areaTo") || value("budget") || districts),
        Boolean(value("business")),
        Boolean(value("name").length >= 2 && value("phone").replace(/\D/g, "").length >= 11),
      ];
      done.forEach((isDone, i) => {
        const bar = brief.querySelector(`[data-brief-bar="${i + 1}"]`);
        bar?.classList.toggle("bg-accent", isDone);
        bar?.classList.toggle("bg-line", !isDone);
        const num = brief.querySelector(`[data-brief-num="${i + 1}"]`);
        if (num) {
          num.classList.toggle("border-accent", isDone);
          num.classList.toggle("bg-accent", isDone);
          num.classList.toggle("text-white", isDone);
          num.classList.toggle("border-line", !isDone);
          num.classList.toggle("text-ink-muted", !isDone);
          num.textContent = isDone ? "✓" : String(i + 1);
        }
      });
      if (progress && template) {
        progress.textContent = template.replace(/\d+/, String(done.filter(Boolean).length));
      }
    };
    brief.addEventListener("input", update);
    brief.addEventListener("change", update);
    update();
  }
})();
