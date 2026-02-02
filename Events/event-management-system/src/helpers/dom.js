// Comentario (ES): Helpers de DOM para seleccionar elementos y renderizar HTML.
export const qs = (sel, parent = document) => parent.querySelector(sel);

export const setHTML = (el, html) => {
  el.innerHTML = html;
};
