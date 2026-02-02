// Comentario (ES): Router SPA (hash) con rutas dinámicas, protección y render.
import { ROLES } from "../constants/config.js";
import { qs, setHTML } from "../helpers/dom.js";
import { isEmail, isEmpty, minLength } from "../helpers/validators.js";

import {
  isAuthenticated,
  getUser,
  getRole,
  loginWithEmail,
  registerUser,
  logout
} from "./auth.service.js";

import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerToEvent
} from "./event.service.js";

// Comentario (ES): URL del logo en assets para usarlo dentro de templates HTML.
const LOGO_URL = new URL("../assets/logo.svg", import.meta.url).href;

// Comentario (ES): Estado simple para abrir/cerrar menú en mobile.
let isMobileNavOpen = false;

/* =========================
   UI helpers
========================= */
function renderMessage(type, title, message) {
  const colorClass = type === "error" ? "error" : "success";
  return `
    <h3 style="margin-top:0;">${title}</h3>
    <p class="${colorClass}">${message}</p>
    <a href="#/">Go Home</a>
  `;
}

function renderLoading() {
  return `
    <h3 style="margin-top:0;">Loading...</h3>
    <p class="small">Please wait.</p>
  `;
}

/* =========================
   Layout
========================= */
function layout(contentHTML) {
  const auth = isAuthenticated();
  const user = getUser();
  const role = getRole();

  return `
    <section class="card">
      <div class="row">
        <div style="display:flex; align-items:center; gap:12px;">
          <img
            src="${LOGO_URL}"
            alt="EMS logo"
            style="width:44px; height:44px; border-radius:12px;"
          />
          <div>
            <h2 style="margin:0;">Event Management System</h2>
            <p class="small" style="margin:6px 0 0 0;">
              ${auth ? `Signed in as <b>${user.name}</b> (${role})` : "Not signed in"}
            </p>
          </div>
        </div>

        <!-- Comentario (ES): Botón hamburger visible solo en mobile por CSS -->
        <button id="navToggle" class="nav-toggle" type="button" aria-label="Toggle navigation">
          ☰ Menu
        </button>

        <nav id="topNav" class="toolbar ${isMobileNavOpen ? "open" : ""}">
          <a href="#/">Home</a>
          ${auth ? `<a href="#/events">Events</a>` : ""}
          ${auth && role === ROLES.ADMIN ? `<a href="#/admin/events/new">New Event</a>` : ""}
          ${!auth ? `<a href="#/login">Login</a>` : `<a href="#/logout">Logout</a>`}
        </nav>
      </div>
    </section>

    <div style="height:12px;"></div>

    <section class="card">
      ${contentHTML}
    </section>
  `;
}

/* =========================
   Views (HTML)
========================= */
function HomeView() {
  return `
    <h3 style="margin-top:0;">Home</h3>
    <p>Welcome to the Event Management System.</p>
    <p class="small" style="margin:0;">SPA with hash routing (no page reload).</p>
  `;
}

function LoginView() {
  return `
    <h3 style="margin-top:0;">Login</h3>

    <form id="loginForm" class="grid" style="max-width:520px;">
      <div>
        <label class="small">Email</label>
        <input id="email" type="email" placeholder="Enter your email" />
      </div>

      <div>
        <label class="small">Password</label>
        <input id="password" type="password" placeholder="Enter your password" />
      </div>

      <p id="formError" class="error" style="margin:0; display:none;"></p>

      <div class="row" style="justify-content:flex-start;">
        <button class="primary" type="submit">Sign in</button>
        <a class="secondary" href="#/register" style="padding:10px 12px; border-radius:10px;">Create account</a>
      </div>
    </form>
  `;
}

function RegisterView() {
  return `
    <h3 style="margin-top:0;">Register</h3>

    <form id="registerForm" class="grid" style="max-width:520px;">
      <div>
        <label class="small">Name</label>
        <input id="name" type="text" placeholder="Your name" />
      </div>

      <div>
        <label class="small">Email</label>
        <input id="email" type="email" placeholder="you@email.com" />
      </div>

      <div>
        <label class="small">Password</label>
        <input id="password" type="password" placeholder="At least 8 characters" />
      </div>

      <div>
        <label class="small">Role</label>
        <select id="role">
          <option value="visitor">visitor</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <p id="formError" class="error" style="margin:0; display:none;"></p>

      <div class="row" style="justify-content:flex-start;">
        <button class="primary" type="submit">Create account</button>
        <a class="secondary" href="#/login" style="padding:10px 12px; border-radius:10px;">Back to login</a>
      </div>
    </form>
  `;
}

function EventsListView({ events }) {
  const auth = isAuthenticated();
  const role = getRole();

  return `
    <div class="row">
      <h3 style="margin:0;">Events</h3>
      <p class="small" style="margin:0;">Total: ${events.length}</p>
    </div>

    <div style="height:12px;"></div>

    <div class="grid two">
      ${events
        .map(
          (e) => `
            <div class="card" style="box-shadow:none; border:1px solid #eef0f7;">
              <h4 style="margin:0 0 6px 0;">${e.title}</h4>
              <p class="small" style="margin:0 0 10px 0;">
                ${e.date} • ${e.time} • ${e.location}
              </p>
              <p style="margin:0 0 10px 0;">${e.description}</p>
              <p class="small" style="margin:0 0 10px 0;">
                Capacity: <b>${e.capacity}</b> • Registered: <b>${e.registeredCount}</b>
              </p>

              <div class="row" style="justify-content:flex-start;">
                <a class="secondary" href="#/events/${e.id}" style="padding:10px 12px; border-radius:10px;">View</a>

                ${
                  auth && role === ROLES.ADMIN
                    ? `<a class="secondary" href="#/admin/events/${e.id}/edit" style="padding:10px 12px; border-radius:10px;">Edit</a>`
                    : ""
                }
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function EventDetailView({ event, canRegister, message = "", isError = false }) {
  return `
    <div class="row">
      <h3 style="margin:0;">Event Detail</h3>
      <a href="#/events">Back</a>
    </div>

    <div style="height:12px;"></div>

    <h4 style="margin:0 0 6px 0;">${event.title}</h4>
    <p class="small" style="margin:0 0 10px 0;">
      ${event.date} • ${event.time} • ${event.location}
    </p>
    <p style="margin:0 0 10px 0;">${event.description}</p>

    <p class="small" style="margin:0 0 12px 0;">
      Capacity: <b>${event.capacity}</b> • Registered: <b>${event.registeredCount}</b>
    </p>

    ${message ? `<p class="${isError ? "error" : "success"}" style="margin:0 0 12px 0;">${message}</p>` : ""}

    ${
      canRegister
        ? `<button id="registerBtn" class="primary" type="button">Register</button>`
        : `<p class="small" style="margin:0;">Sign in as visitor to register.</p>`
    }
  `;
}

function AdminEventFormView({ mode, initial = {}, error = "" }) {
  const title = mode === "create" ? "Create Event" : "Edit Event";

  return `
    <div class="row">
      <h3 style="margin:0;">${title}</h3>
      <a href="#/events">Back</a>
    </div>

    <div style="height:12px;"></div>

    <form id="eventForm" class="grid" style="max-width:720px;">
      <div>
        <label class="small">Title</label>
        <input id="title" type="text" value="${initial.title ?? ""}" />
      </div>

      <div>
        <label class="small">Description</label>
        <textarea id="description" rows="3">${initial.description ?? ""}</textarea>
      </div>

      <div class="grid two">
        <div>
          <label class="small">Date</label>
          <input id="date" type="date" value="${initial.date ?? ""}" />
        </div>

        <div>
          <label class="small">Time</label>
          <input id="time" type="time" value="${initial.time ?? ""}" />
        </div>
      </div>

      <div class="grid two">
        <div>
          <label class="small">Location</label>
          <input id="location" type="text" value="${initial.location ?? ""}" />
        </div>

        <div>
          <label class="small">Capacity</label>
          <input id="capacity" type="number" min="1" value="${initial.capacity ?? 1}" />
        </div>
      </div>

      ${error ? `<p class="error" style="margin:0;">${error}</p>` : ""}

      <div class="row" style="justify-content:flex-start;">
        <button class="primary" type="submit">${mode === "create" ? "Create" : "Save"}</button>
        ${mode === "edit" ? `<button id="deleteBtn" class="secondary" type="button">Delete</button>` : ""}
      </div>
    </form>
  `;
}

function NotFoundView() {
  return `
    <h3 style="margin-top:0;">Not Found</h3>
    <p class="error">This route does not exist.</p>
    <a href="#/">Go Home</a>
  `;
}

/* =========================
   Router core
========================= */
function pathToRegex(path) {
  const pattern = path.replace(/\//g, "\\/").replace(/:\w+/g, "([^\\/]+)");
  return new RegExp(`^${pattern}$`);
}

function extractParams(routePath, currentPath) {
  const keys = [...routePath.matchAll(/:(\w+)/g)].map((m) => m[1]);
  const values = currentPath.match(pathToRegex(routePath))?.slice(1) ?? [];
  return keys.reduce((acc, k, i) => ((acc[k] = values[i]), acc), {});
}

function getPathFromHash() {
  const hash = window.location.hash || "#/";
  const path = hash.replace("#", "");
  return path === "" ? "/" : path;
}

const routes = [
  { path: "/", handler: () => HomeView() },

  { path: "/login", handler: () => LoginView(), publicOnly: true },
  { path: "/register", handler: () => RegisterView(), publicOnly: true },
  { path: "/logout", handler: () => "<p>Signing out...</p>", protected: true },

  { path: "/events", handler: eventsRouteHandler, protected: true },
  { path: "/events/:id", handler: eventDetailRouteHandler, protected: true },

  { path: "/admin/events/new", handler: adminCreateRouteHandler, protected: true, role: ROLES.ADMIN },
  { path: "/admin/events/:id/edit", handler: adminEditRouteHandler, protected: true, role: ROLES.ADMIN },

  { path: "*", handler: () => NotFoundView() }
];

function matchRoute(pathname) {
  for (const r of routes) {
    if (r.path === "*") continue;
    const regex = pathToRegex(r.path);
    if (regex.test(pathname)) return { route: r, params: extractParams(r.path, pathname) };
  }
  return { route: routes.find((r) => r.path === "*"), params: {} };
}

function navigate(to) {
  // Comentario (ES): Al navegar, cerramos el menú en mobile para mejor UX.
  isMobileNavOpen = false;
  window.location.hash = `#${to}`;
}

async function render() {
  const app = qs("#app");
  const pathname = getPathFromHash();
  const { route, params } = matchRoute(pathname);

  if (route.protected && !isAuthenticated()) {
    navigate("/login");
    return;
  }

  if (route.publicOnly && isAuthenticated()) {
    navigate("/events");
    return;
  }

  if (route.role && getRole() !== route.role) {
    setHTML(app, layout(renderMessage("error", "Access denied", "You do not have permission to access this page.")));
    wireGlobalHeaderListeners();
    return;
  }

  setHTML(app, layout(renderLoading()));

  try {
    const html = await route.handler({ params, pathname });
    setHTML(app, layout(html));
    wireGlobalHeaderListeners();
    wireViewListeners(pathname, params);
  } catch (err) {
    setHTML(app, layout(renderMessage("error", "Something went wrong", err.message || "Unknown error.")));
    wireGlobalHeaderListeners();
  }
}

/* =========================
   Global header listeners (hamburger)
========================= */
function wireGlobalHeaderListeners() {
  const toggle = qs("#navToggle");
  const nav = qs("#topNav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    isMobileNavOpen = !isMobileNavOpen;
    nav.classList.toggle("open", isMobileNavOpen);
  });
}

/* =========================
   Route Handlers
========================= */
async function eventsRouteHandler() {
  const events = await getEvents();
  return EventsListView({ events });
}

async function eventDetailRouteHandler({ params }) {
  const eventId = Number(params.id);
  if (!Number.isFinite(eventId)) throw new Error("Invalid event id.");

  const event = await getEventById(eventId);
  const canRegister = isAuthenticated() && getRole() === ROLES.VISITOR;
  return EventDetailView({ event, canRegister });
}

async function adminCreateRouteHandler() {
  return AdminEventFormView({ mode: "create" });
}

async function adminEditRouteHandler({ params }) {
  const eventId = Number(params.id);
  if (!Number.isFinite(eventId)) throw new Error("Invalid event id.");

  const event = await getEventById(eventId);
  return AdminEventFormView({ mode: "edit", initial: event });
}

/* =========================
   View Listeners
========================= */
function showFormError(id, message) {
  const el = qs(id);
  if (!el) return;
  el.style.display = "block";
  el.textContent = message;
}

function hideFormError(id) {
  const el = qs(id);
  if (!el) return;
  el.style.display = "none";
  el.textContent = "";
}

function wireViewListeners(pathname, params) {
  if (pathname === "/login") {
    const form = qs("#loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideFormError("#formError");

      const email = qs("#email").value.trim();
      const password = qs("#password").value;

      if (!isEmail(email)) return showFormError("#formError", "Please enter a valid email.");
      if (isEmpty(password)) return showFormError("#formError", "Password is required.");

      try {
        await loginWithEmail(email, password);
        navigate("/events");
      } catch (err) {
        showFormError("#formError", err.message);
      }
    });
  }

  if (pathname === "/register") {
    const form = qs("#registerForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideFormError("#formError");

      const name = qs("#name").value.trim();
      const email = qs("#email").value.trim();
      const password = qs("#password").value;
      const role = qs("#role").value;

      if (isEmpty(name)) return showFormError("#formError", "Name is required.");
      if (!isEmail(email)) return showFormError("#formError", "Please enter a valid email.");
      if (!minLength(password, 8)) return showFormError("#formError", "Password must be at least 8 characters.");
      if (![ROLES.ADMIN, ROLES.VISITOR].includes(role)) return showFormError("#formError", "Invalid role.");

      try {
        await registerUser({ name, email, password, role });
        navigate("/login");
      } catch (err) {
        showFormError("#formError", err.message);
      }
    });
  }

  if (pathname === "/logout") {
    logout();
    navigate("/login");
  }

  if (pathname.startsWith("/events/") && params?.id) {
    const btn = qs("#registerBtn");
    if (btn) {
      btn.addEventListener("click", async () => {
        try {
          const user = getUser();
          const eventId = Number(params.id);
          if (!Number.isFinite(eventId)) throw new Error("Invalid event id.");

          await registerToEvent(eventId, user.id);

          const event = await getEventById(eventId);
          const canRegister = isAuthenticated() && getRole() === ROLES.VISITOR;

          const app = qs("#app");
          setHTML(app, layout(EventDetailView({ event, canRegister, message: "Registered successfully!", isError: false })));
          wireGlobalHeaderListeners();
          wireViewListeners(pathname, params);
        } catch (err) {
          try {
            const eventId = Number(params.id);
            const event = await getEventById(eventId);
            const canRegister = isAuthenticated() && getRole() === ROLES.VISITOR;

            const app = qs("#app");
            setHTML(app, layout(EventDetailView({ event, canRegister, message: err.message, isError: true })));
            wireGlobalHeaderListeners();
            wireViewListeners(pathname, params);
          } catch {
            const app = qs("#app");
            setHTML(app, layout(renderMessage("error", "Something went wrong", err.message || "Unknown error.")));
            wireGlobalHeaderListeners();
          }
        }
      });
    }
  }

  if (pathname === "/admin/events/new" || pathname.startsWith("/admin/events/")) {
    const form = qs("#eventForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = qs("#title").value.trim();
      const description = qs("#description").value.trim();
      const date = qs("#date").value;
      const time = qs("#time").value;
      const location = qs("#location").value.trim();

      const capacityRaw = Number(qs("#capacity").value);
      const capacityInt = Number.isFinite(capacityRaw) ? Math.floor(capacityRaw) : NaN;

      if (isEmpty(title)) return rerenderAdminForm("Title is required.", pathname, params);
      if (isEmpty(description)) return rerenderAdminForm("Description is required.", pathname, params);
      if (isEmpty(date)) return rerenderAdminForm("Date is required.", pathname, params);
      if (isEmpty(time)) return rerenderAdminForm("Time is required.", pathname, params);
      if (isEmpty(location)) return rerenderAdminForm("Location is required.", pathname, params);
      if (!Number.isFinite(capacityInt) || capacityInt < 1) {
        return rerenderAdminForm("Capacity must be an integer greater than or equal to 1.", pathname, params);
      }

      try {
        if (pathname === "/admin/events/new") {
          const user = getUser();
          await createEvent({
            title,
            description,
            date,
            time,
            location,
            capacity: capacityInt,
            createdBy: user.id
          });
        } else {
          await updateEvent(params.id, { title, description, date, time, location, capacity: capacityInt });
        }

        navigate("/events");
      } catch (err) {
        rerenderAdminForm(err.message, pathname, params);
      }
    });

    const delBtn = qs("#deleteBtn");
    if (delBtn && params?.id) {
      delBtn.addEventListener("click", async () => {
        try {
          await deleteEvent(params.id);
          navigate("/events");
        } catch (err) {
          rerenderAdminForm(err.message, pathname, params);
        }
      });
    }
  }
}

async function rerenderAdminForm(error, pathname, params) {
  const app = qs("#app");

  if (pathname === "/admin/events/new") {
    setHTML(app, layout(AdminEventFormView({ mode: "create", error })));
    wireGlobalHeaderListeners();
    wireViewListeners(pathname, params);
    return;
  }

  const eventId = Number(params.id);
  if (!Number.isFinite(eventId)) {
    setHTML(app, layout(renderMessage("error", "Invalid request", "Invalid event id.")));
    wireGlobalHeaderListeners();
    return;
  }

  const event = await getEventById(eventId);
  setHTML(app, layout(AdminEventFormView({ mode: "edit", initial: event, error })));
  wireGlobalHeaderListeners();
  wireViewListeners(pathname, params);
}

/* =========================
   Public init
========================= */
export function startRouter() {
  window.addEventListener("hashchange", render);
  window.addEventListener("load", render);
  render();
}