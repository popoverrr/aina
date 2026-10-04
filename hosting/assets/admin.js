/** Панель: подтверждение удаления и отправка select'ов без лишней кнопки. */
(() => {
  "use strict";

  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!window.confirm(form.dataset.confirm)) e.preventDefault();
    });
  });

  document.querySelectorAll("[data-confirm-button]").forEach((button) => {
    button.addEventListener("click", (e) => {
      if (!window.confirm(button.dataset.confirmButton)) e.preventDefault();
    });
  });

  // Смена статуса в таблице применяется сразу: кнопка нужна только без скрипта.
  document.querySelectorAll("form[data-autosubmit] select").forEach((select) => {
    select.addEventListener("change", () => select.form?.requestSubmit());
  });
})();
