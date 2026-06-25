const SESSION_KEY = "currentUser";

document.addEventListener("DOMContentLoaded", () => {
    setupSiteNavigation();
    addAuthControls();
    addAuthModal();
    updateAuthControls();
});

function setupSiteNavigation() {
    const nav = document.querySelector("nav.container");
    const links = nav?.querySelector(".nav-links");

    if (!nav || !links || nav.querySelector("[data-site-menu]")) {
        return;
    }

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "site-menu-button";
    menuButton.dataset.siteMenu = "";
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-controls", "site-navigation");
    menuButton.textContent = "Мени";

    links.id = "site-navigation";
    nav.insertBefore(menuButton, links);

    menuButton.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("menu-open");

        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.textContent = isOpen ? "Затвори" : "Мени";
    });

    links.addEventListener("click", (event) => {
        if (event.target.matches("a")) {
            closeSiteNavigation(nav, menuButton);
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 720) {
            closeSiteNavigation(nav, menuButton);
        }
    });
}

function closeSiteNavigation(nav, menuButton) {
    nav.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "Мени";
}

function addAuthControls() {
    const nav = document.querySelector("nav.container");

    if (!nav || nav.querySelector(".auth-actions")) {
        return;
    }

    nav.insertAdjacentHTML("beforeend", `
        <div class="auth-actions">
            <span class="auth-user" data-auth-user></span>
            <button type="button" class="btn btn-secondary btn-small" data-open-auth="login">Пријава</button>
            <button type="button" class="btn btn-primary btn-small" data-open-auth="register">Регистрација</button>
            <button type="button" class="btn btn-secondary btn-small hidden" data-logout>Одјава</button>
        </div>
    `);

    nav.querySelector("[data-logout]").addEventListener("click", logoutUser);
}

function addAuthModal() {
    if (document.querySelector("#auth-modal")) {
        return;
    }

    document.body.insertAdjacentHTML("beforeend", `
        <div class="modal-backdrop" id="auth-modal" aria-hidden="true">
            <div class="modal-window" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
                <button type="button" class="modal-close" data-close-auth aria-label="Затвори">×</button>
                <h2 id="auth-modal-title">Пријава</h2>

                <div class="modal-tabs">
                    <button type="button" class="modal-tab is-active" data-auth-tab="login">Пријава</button>
                    <button type="button" class="modal-tab" data-auth-tab="register">Регистрација</button>
                </div>

                <p class="status-message hidden" data-auth-message></p>

                <form class="auth-form" data-auth-form="login" novalidate>
                    <div class="form-group">
                        <label for="login-username">Корисничко име или email:</label>
                        <input type="text" id="login-username" name="username" autocomplete="username">
                        <small class="field-error" data-error-for="username"></small>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Лозинка:</label>
                        <input type="password" id="login-password" name="password" autocomplete="current-password">
                        <small class="field-error" data-error-for="password"></small>
                    </div>
                    <button type="submit" class="btn btn-primary">Пријави се</button>
                </form>

                <form class="auth-form hidden" data-auth-form="register" novalidate>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="register-first-name">Име:</label>
                            <input type="text" id="register-first-name" name="firstName" autocomplete="given-name">
                            <small class="field-error" data-error-for="firstName"></small>
                        </div>
                        <div class="form-group">
                            <label for="register-last-name">Презиме:</label>
                            <input type="text" id="register-last-name" name="lastName" autocomplete="family-name">
                            <small class="field-error" data-error-for="lastName"></small>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="register-email">Email:</label>
                        <input type="email" id="register-email" name="email" autocomplete="email">
                        <small class="field-error" data-error-for="email"></small>
                    </div>
                    <div class="form-group">
                        <label for="register-username">Корисничко име:</label>
                        <input type="text" id="register-username" name="username" autocomplete="username">
                        <small class="field-error" data-error-for="username"></small>
                    </div>
                    <div class="form-group">
                        <label for="register-password">Лозинка:</label>
                        <input type="password" id="register-password" name="password" autocomplete="new-password">
                        <small class="field-error" data-error-for="password"></small>
                    </div>
                    <div class="form-group">
                        <label for="register-address">Адреса:</label>
                        <input type="text" id="register-address" name="address" autocomplete="street-address">
                        <small class="field-error" data-error-for="address"></small>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="register-birth-date">Датум рођења:</label>
                            <input type="date" id="register-birth-date" name="birthDate">
                            <small class="field-error" data-error-for="birthDate"></small>
                        </div>
                        <div class="form-group">
                            <label for="register-occupation">Занимање:</label>
                            <input type="text" id="register-occupation" name="occupation">
                            <small class="field-error" data-error-for="occupation"></small>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Региструј се</button>
                </form>
            </div>
        </div>
    `);

    const modal = document.querySelector("#auth-modal");

    modal.querySelector("[data-close-auth]").addEventListener("click", closeAuthModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeAuthModal();
        }
    });

    modal.querySelectorAll("[data-auth-tab]").forEach((button) => {
        button.addEventListener("click", () => showAuthForm(button.dataset.authTab));
    });

    modal.querySelector('[data-auth-form="login"]').addEventListener("submit", handleLogin);
    modal.querySelector('[data-auth-form="register"]').addEventListener("submit", handleRegister);

    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-open-auth]");

        if (button) {
            openAuthModal(button.dataset.openAuth);
        }
    });
}

function openAuthModal(mode) {
    const modal = document.querySelector("#auth-modal");

    showAuthForm(mode);
    clearAuthMessage();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
}

function closeAuthModal() {
    const modal = document.querySelector("#auth-modal");

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
}

function showAuthForm(mode) {
    const modal = document.querySelector("#auth-modal");
    const title = modal.querySelector("#auth-modal-title");

    title.textContent = mode === "register" ? "Регистрација" : "Пријава";

    modal.querySelectorAll("[data-auth-tab]").forEach((tab) => {
        tab.classList.toggle("is-active", tab.dataset.authTab === mode);
    });

    modal.querySelectorAll("[data-auth-form]").forEach((form) => {
        form.classList.toggle("hidden", form.dataset.authForm !== mode);
        clearFormErrors(form);
    });
}

async function handleLogin(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const errors = validateLogin(data);

    showFormErrors(form, errors);

    if (Object.keys(errors).length > 0) {
        showAuthMessage("Провери податке за пријаву.", "error");
        return;
    }

    try {
        const users = await loadAuthUsers();
        const identifier = data.username.trim().toLowerCase();
        const foundUser = users.find((user) => {
            const username = String(user.korisnickoIme || "").toLowerCase();
            const email = String(user.email || "").toLowerCase();

            return (username === identifier || email === identifier) && user.lozinka === data.password;
        });

        if (!foundUser) {
            showAuthMessage("Корисничко име/email или лозинка нису исправни.", "error");
            return;
        }

        saveCurrentUser(mapDatabaseUser(foundUser));
    } catch (error) {
        showAuthMessage(error.message, "error");
        return;
    }

    form.reset();
    closeAuthModal();
    updateAuthControls();
    notifyAuthChanged();
}

async function handleRegister(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const errors = validateRegister(data);

    showFormErrors(form, errors);

    if (Object.keys(errors).length > 0) {
        showAuthMessage("Регистрација није прошла валидацију.", "error");
        return;
    }

    try {
        const users = await loadAuthUsers();
        const username = data.username.trim().toLowerCase();
        const email = data.email.trim().toLowerCase();

        if (users.some((user) => String(user.korisnickoIme || "").toLowerCase() === username)) {
            showAuthMessage("Корисничко име је већ заузето.", "error");
            return;
        }

        if (users.some((user) => String(user.email || "").toLowerCase() === email)) {
            showAuthMessage("Email је већ регистрован.", "error");
            return;
        }

        const payload = {
            ime: data.firstName.trim(),
            prezime: data.lastName.trim(),
            email: data.email.trim(),
            korisnickoIme: data.username.trim(),
            lozinka: data.password,
            adresa: data.address.trim(),
            datumRodjenja: data.birthDate,
            zanimanje: data.occupation.trim()
        };
        const response = await fetch(firebaseDatabaseUrl("korisnici"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Регистрација тренутно није доступна.");
        }

        const result = await response.json();

        saveCurrentUser(mapDatabaseUser({ id: result.name, ...payload }));
    } catch (error) {
        showAuthMessage(error.message, "error");
        return;
    }

    form.reset();
    closeAuthModal();
    updateAuthControls();
    notifyAuthChanged();
}

async function loadAuthUsers() {
    if (typeof firebaseDatabaseUrl !== "function") {
        throw new Error("Firebase конфигурација није доступна.");
    }

    const response = await fetch(firebaseDatabaseUrl("korisnici"));

    if (!response.ok) {
        throw new Error("Корисници тренутно нису доступни.");
    }

    const users = await response.json();

    return Object.entries(users || {}).map(([id, user]) => ({ id, ...user }));
}

function mapDatabaseUser(user) {
    return {
        source: "firebase",
        id: user.id,
        username: user.korisnickoIme,
        firstName: user.ime,
        lastName: user.prezime,
        email: user.email,
        address: user.adresa,
        birthDate: user.datumRodjenja,
        occupation: user.zanimanje
    };
}

function validateLogin(data) {
    const errors = {};

    if (!data.username || data.username.trim().length < 3) {
        errors.username = "Унеси бар 3 карактера.";
    }

    if (!data.password || data.password.length < 6) {
        errors.password = "Лозинка мора имати најмање 6 карактера.";
    }

    return errors;
}

function validateRegister(data) {
    const errors = {};

    if (!data.firstName || data.firstName.trim().length < 2) {
        errors.firstName = "Име мора имати најмање 2 карактера.";
    }

    if (!data.lastName || data.lastName.trim().length < 2) {
        errors.lastName = "Презиме мора имати најмање 2 карактера.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "")) {
        errors.email = "Унеси исправан email.";
    }

    if (!data.username || data.username.trim().length < 3) {
        errors.username = "Корисничко име мора имати најмање 3 карактера.";
    }

    if (!data.password || data.password.length < 6) {
        errors.password = "Лозинка мора имати најмање 6 карактера.";
    }

    if (!data.address || data.address.trim().length < 5) {
        errors.address = "Адреса мора имати најмање 5 карактера.";
    }

    if (!data.birthDate) {
        errors.birthDate = "Изабери датум рођења.";
    }

    if (!data.occupation || data.occupation.trim().length < 2) {
        errors.occupation = "Занимање је обавезно.";
    }

    return errors;
}

function showFormErrors(form, errors) {
    clearFormErrors(form);

    Object.entries(errors).forEach(([fieldName, message]) => {
        const field = form.elements[fieldName];
        const messageBox = form.querySelector(`[data-error-for="${fieldName}"]`);

        if (field) {
            field.classList.add("is-invalid");
        }

        if (messageBox) {
            messageBox.textContent = message;
        }
    });
}

function clearFormErrors(form) {
    form.querySelectorAll(".field-error").forEach((element) => {
        element.textContent = "";
    });

    form.querySelectorAll(".is-invalid").forEach((element) => {
        element.classList.remove("is-invalid");
    });
}

function findElement(target) {
    return typeof target === "string" ? document.querySelector(target) : target;
}

function showStatus(target, message, type = "") {
    const status = findElement(target);

    if (!status) {
        return;
    }

    status.textContent = message;
    status.className = `status-message ${type}`.trim();
}

function hideStatus(target) {
    findElement(target)?.classList.add("hidden");
}

function createConfirmDialog(options) {
    const {
        id,
        title,
        confirmText = "Потврди",
        cancelText = "Одустани",
        danger = true,
        onConfirm
    } = options;
    let dialog = document.querySelector(`#${id}`);

    if (!dialog) {
        document.body.insertAdjacentHTML("beforeend", `
            <div class="modal-backdrop" id="${id}" aria-hidden="true">
                <div class="modal-window" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
                    <h2 id="${id}-title">${title}</h2>
                    <p data-confirm-dialog-message></p>
                    <div class="dialog-actions">
                        <button type="button" class="btn ${danger ? "btn-danger" : "btn-primary"}" data-confirm-dialog-submit>${confirmText}</button>
                        <button type="button" class="btn btn-secondary" data-confirm-dialog-cancel>${cancelText}</button>
                    </div>
                </div>
            </div>
        `);

        dialog = document.querySelector(`#${id}`);
    }

    const close = () => {
        dialog.classList.remove("is-open");
        dialog.setAttribute("aria-hidden", "true");
    };

    const open = (message) => {
        dialog.querySelector("[data-confirm-dialog-message]").textContent = message;
        dialog.classList.add("is-open");
        dialog.setAttribute("aria-hidden", "false");
    };

    dialog.querySelector("[data-confirm-dialog-cancel]").addEventListener("click", close);
    dialog.querySelector("[data-confirm-dialog-submit]").addEventListener("click", () => {
        if (typeof onConfirm === "function") {
            onConfirm();
        }

        close();
    });
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            close();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && dialog.classList.contains("is-open")) {
            close();
        }
    });

    return { open, close };
}

function showAuthMessage(message, type) {
    const messageBox = document.querySelector("[data-auth-message]");

    showStatus(messageBox, message, type);
}

function clearAuthMessage() {
    const messageBox = document.querySelector("[data-auth-message]");

    messageBox.textContent = "";
    messageBox.className = "status-message hidden";
}

function saveCurrentUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getCurrentUser() {
    const rawUser = localStorage.getItem(SESSION_KEY);

    if (!rawUser) {
        return null;
    }

    try {
        const user = JSON.parse(rawUser);

        if (user.source !== "firebase" || !user.id) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        return user;
    } catch (error) {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
    updateAuthControls();
    notifyAuthChanged();
}

function notifyAuthChanged() {
    document.dispatchEvent(new CustomEvent("auth-change"));
}

function updateAuthControls() {
    const user = getCurrentUser();
    const userLabel = document.querySelector("[data-auth-user]");
    const loginButton = document.querySelector('[data-open-auth="login"]');
    const registerButton = document.querySelector('[data-open-auth="register"]');
    const logoutButton = document.querySelector("[data-logout]");

    if (!userLabel || !loginButton || !registerButton || !logoutButton) {
        return;
    }

    userLabel.textContent = user ? user.username : "";
    loginButton.classList.toggle("hidden", Boolean(user));
    registerButton.classList.toggle("hidden", Boolean(user));
    logoutButton.classList.toggle("hidden", !user);
}
