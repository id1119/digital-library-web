let databasePromise;
let selectedAuthorId = null;
let currentAuthorsList = [];
let currentAuthorFilters = {
    name: "",
    status: ""
};
let authorDeleteDialog = null;

document.addEventListener("DOMContentLoaded", () => {
    renderAuthorsPage();
    setupAdminAuthorsPage();
    renderAuthorDetailsPage();
    renderProfileRatings();
    document.addEventListener("auth-change", renderProfileRatings);
});

async function loadDatabase() {
    if (!databasePromise) {
        databasePromise = fetch(firebaseDatabaseUrl()).then((response) => {
            if (!response.ok) {
                throw new Error("База података није доступна.");
            }

            return response.json();
        });
    }

    return databasePromise;
}

async function reloadDatabase() {
    databasePromise = null;
    return loadDatabase();
}

async function firebaseRequest(path, options = {}) {
    const response = await fetch(firebaseDatabaseUrl(path), {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    if (!response.ok) {
        throw new Error("Firebase операција није успела. Покушај поново.");
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function objectToArray(collection) {
    return Object.entries(collection || {}).map(([id, value]) => ({ id, ...value }));
}

async function renderAuthorsPage() {
    const grid = document.querySelector("[data-authors-grid]");

    if (!grid) {
        return;
    }

    try {
        const database = await loadDatabase();
        currentAuthorsList = objectToArray(database.autori);

        setupAuthorSearch();
        renderFilteredAuthors();

        hideStatus("[data-authors-status]");
    } catch (error) {
        showStatus("[data-authors-status]", error.message, "error");
    }
}

function setupAuthorSearch() {
    const form = document.querySelector("[data-author-search]");

    if (!form || form.dataset.ready === "true") {
        return;
    }

    form.dataset.ready = "true";
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        currentAuthorFilters = Object.fromEntries(new FormData(form));
        renderFilteredAuthors();
    });

    document.querySelector("[data-author-search-reset]")?.addEventListener("click", () => {
        form.reset();
        currentAuthorFilters = { name: "", status: "" };
        renderFilteredAuthors();
    });
}

function renderFilteredAuthors() {
    const grid = document.querySelector("[data-authors-grid]");
    const summary = document.querySelector("[data-authors-result-summary]");

    if (!grid) {
        return;
    }

    const nameQuery = normalizeSearch(currentAuthorFilters.name);
    const statusQuery = currentAuthorFilters.status || "";
    const authors = currentAuthorsList.filter((author) => {
        const nameMatches = !nameQuery || normalizeSearch(fullName(author)).includes(nameQuery);
        const statusMatches = !statusQuery || author.status === statusQuery;

        return nameMatches && statusMatches;
    });

    grid.innerHTML = authors.length > 0
        ? authors.map((author) => authorCardTemplate(author, nameQuery, statusQuery)).join("")
        : `<p class="empty-state">Нема аутора који одговарају претрази.</p>`;

    if (summary) {
        const activeFilters = [currentAuthorFilters.name, currentAuthorFilters.status].filter(Boolean).length;
        summary.textContent = activeFilters
            ? `Пронађено аутора: ${authors.length} од ${currentAuthorsList.length}.`
            : "";
    }
}

function authorCardTemplate(author, nameQuery, statusQuery) {
    return `
        <article class="card author-card">
            <img
                class="author-image"
                src="${escapeAttribute(author.slike?.[0] || "")}"
                alt="${escapeAttribute(fullName(author))}"
                loading="lazy"
            >
            <p class="author-status">${highlightMatch(author.status, statusQuery)}</p>
            <h2>${highlightMatch(fullName(author), nameQuery)}</h2>
            <p>${escapeHtml(shorten(author.biografija || "", 180))}</p>
            <a class="btn btn-primary" href="author-details.html?id=${encodeURIComponent(author.id)}">Детаљи</a>
        </article>
    `;
}

async function setupAdminAuthorsPage() {
    const tableBody = document.querySelector("[data-admin-authors]");

    if (!tableBody) {
        return;
    }

    document.querySelectorAll("[data-author-form]").forEach((form) => {
        form.innerHTML = authorFormFields(form.dataset.authorForm);
        form.addEventListener("submit", handleAuthorFormSubmit);
    });

    addAuthorDeleteDialog();

    try {
        const database = await loadDatabase();
        const authors = objectToArray(database.autori);

        renderAuthorsTable(authors);
        fillEditAuthorForm(authors[0]);
        hideStatus("[data-admin-authors-status]");
    } catch (error) {
        showStatus("[data-admin-authors-status]", error.message, "error");
    }
}

function authorFormFields(prefix) {
    const field = (name) => `${prefix}-${name}`;

    return `
        <div class="form-row">
            <div class="form-group">
                <label for="${field("first-name")}">Име:</label>
                <input id="${field("first-name")}" name="ime" type="text">
                <small class="field-error" data-error-for="ime"></small>
            </div>
            <div class="form-group">
                <label for="${field("last-name")}">Презиме:</label>
                <input id="${field("last-name")}" name="prezime" type="text">
                <small class="field-error" data-error-for="prezime"></small>
            </div>
        </div>

        <div class="form-group">
            <label for="${field("biography")}">Биографија:</label>
            <textarea id="${field("biography")}" name="biografija" rows="5"></textarea>
            <small class="field-error" data-error-for="biografija"></small>
        </div>

        <div class="form-group">
            <label for="${field("images")}">URL слика (раздвојити зарезом):</label>
            <textarea id="${field("images")}" name="slike" rows="2"></textarea>
            <small class="field-error" data-error-for="slike"></small>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="${field("birth-date")}">Датум рођења:</label>
                <input id="${field("birth-date")}" name="datumRodjenja" type="date">
                <small class="field-error" data-error-for="datumRodjenja"></small>
            </div>
            <div class="form-group">
                <label for="${field("status")}">Статус:</label>
                <select id="${field("status")}" name="status">
                    <option value="">Изабери статус</option>
                    <option value="Активан">Активан</option>
                    <option value="У пензији">У пензији</option>
                    <option value="Преминуо">Преминуо</option>
                </select>
                <small class="field-error" data-error-for="status"></small>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="${field("awards")}">Број награда:</label>
                <input id="${field("awards")}" name="brojOsvojenihNagrada" type="number" min="0">
                <small class="field-error" data-error-for="brojOsvojenihNagrada"></small>
            </div>
            <div class="form-group">
                <label for="${field("sold")}">Продати примерци:</label>
                <input id="${field("sold")}" name="brojProdatihPrimeraka" type="number" min="0">
                <small class="field-error" data-error-for="brojProdatihPrimeraka"></small>
            </div>
        </div>

        <div class="form-group">
            <label for="${field("phone")}">Телефон менаџера:</label>
            <input id="${field("phone")}" name="kontaktTelefonMenadzera" type="text" placeholder="+381 64 123-4567">
            <small class="field-error" data-error-for="kontaktTelefonMenadzera"></small>
        </div>

        <button class="btn btn-primary" type="submit">
            ${prefix === "add" ? "Додај аутора" : "Сачувај измене"}
        </button>
    `;
}

function renderAuthorsTable(authors) {
    const tableBody = document.querySelector("[data-admin-authors]");

    tableBody.innerHTML = authors.map((author) => `
        <tr>
            <td>${escapeHtml(fullName(author))}</td>
            <td>${escapeHtml(author.status)}</td>
            <td>${Number(author.brojOsvojenihNagrada).toLocaleString("sr-RS")}</td>
            <td class="table-actions">
                <a class="btn btn-primary btn-small" href="author-details.html?id=${encodeURIComponent(author.id)}">Детаљи</a>
                <button class="btn btn-secondary btn-small" type="button" data-edit-author="${author.id}">Измени</button>
                <button class="btn btn-danger btn-small" type="button" data-delete-author="${author.id}">Обриши</button>
            </td>
        </tr>
    `).join("");

    tableBody.querySelectorAll("[data-edit-author]").forEach((button) => {
        button.addEventListener("click", async () => {
            const database = await loadDatabase();
            const author = { id: button.dataset.editAuthor, ...database.autori[button.dataset.editAuthor] };

            fillEditAuthorForm(author);
            document.querySelector('[data-author-form="edit"]').scrollIntoView({ behavior: "smooth" });
        });
    });

    tableBody.querySelectorAll("[data-delete-author]").forEach((button) => {
        button.addEventListener("click", async () => {
            const database = await loadDatabase();
            openAuthorDeleteDialog(button.dataset.deleteAuthor, database.autori[button.dataset.deleteAuthor]);
        });
    });
}

function fillEditAuthorForm(author) {
    const form = document.querySelector('[data-author-form="edit"]');

    if (!form || !author) {
        return;
    }

    selectedAuthorId = author.id;
    form.elements.ime.value = author.ime;
    form.elements.prezime.value = author.prezime;
    form.elements.biografija.value = author.biografija;
    form.elements.slike.value = (author.slike || []).join(", ");
    form.elements.datumRodjenja.value = author.datumRodjenja;
    form.elements.status.value = author.status;
    form.elements.brojOsvojenihNagrada.value = author.brojOsvojenihNagrada;
    form.elements.brojProdatihPrimeraka.value = author.brojProdatihPrimeraka;
    form.elements.kontaktTelefonMenadzera.value = author.kontaktTelefonMenadzera;

    clearFormErrors(form);
    showAuthorFormMessage("edit", `Форма је попуњена подацима аутора: ${fullName(author)}.`, "success");
}

async function handleAuthorFormSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const errors = validateAuthor(data);

    showFormErrors(form, errors);

    if (Object.keys(errors).length > 0) {
        showAuthorFormMessage(form.dataset.authorForm, "Провери означена поља.", "error");
        return;
    }

    try {
        const authorPayload = formDataToAuthor(data);

        if (form.dataset.authorForm === "add") {
            const result = await firebaseRequest("autori", {
                method: "POST",
                body: JSON.stringify(authorPayload)
            });

            form.reset();
            showAuthorFormMessage("add", `Аутор је додат у Firebase базу. ID: ${result.name}.`, "success");
        } else {
            if (!selectedAuthorId) {
                showAuthorFormMessage("edit", "Прво изабери аутора за измену.", "error");
                return;
            }

            await firebaseRequest(`autori/${selectedAuthorId}`, {
                method: "PATCH",
                body: JSON.stringify(authorPayload)
            });

            showAuthorFormMessage("edit", `Аутор ${selectedAuthorId} је измењен у Firebase бази.`, "success");
        }

        await refreshAdminAuthors();
    } catch (error) {
        showAuthorFormMessage(form.dataset.authorForm, error.message, "error");
    }
}

function formDataToAuthor(data) {
    return {
        ime: data.ime.trim(),
        prezime: data.prezime.trim(),
        biografija: data.biografija.trim(),
        slike: splitImages(data.slike),
        datumRodjenja: data.datumRodjenja,
        status: data.status,
        brojOsvojenihNagrada: Number(data.brojOsvojenihNagrada),
        brojProdatihPrimeraka: Number(data.brojProdatihPrimeraka),
        kontaktTelefonMenadzera: data.kontaktTelefonMenadzera.trim()
    };
}

function splitImages(value) {
    return (value || "").split(",").map((url) => url.trim()).filter(Boolean);
}

function validateAuthor(author) {
    const errors = {};
    const statuses = ["Активан", "У пензији", "Преминуо"];
    const phonePattern = /^\+381 \d{2} \d{3}-\d{3,4}$/;
    const imageUrls = (author.slike || "").split(",").map((url) => url.trim()).filter(Boolean);

    if (!author.ime || !/^[\p{L} .'-]{2,}$/u.test(author.ime.trim())) {
        errors.ime = "Име мора имати најмање 2 слова.";
    }

    if (!author.prezime || !/^[\p{L} .'-]{2,}$/u.test(author.prezime.trim())) {
        errors.prezime = "Презиме мора имати најмање 2 слова.";
    }

    if (!author.biografija || author.biografija.trim().length < 30) {
        errors.biografija = "Биографија мора имати најмање 30 карактера.";
    }

    if (imageUrls.length === 0 || imageUrls.some((url) => !/^https?:\/\/\S+$/i.test(url))) {
        errors.slike = "Унеси бар један исправан HTTP(S) URL.";
    }

    if (!author.datumRodjenja || Number.isNaN(Date.parse(author.datumRodjenja))) {
        errors.datumRodjenja = "Изабери исправан датум.";
    }

    if (!statuses.includes(author.status)) {
        errors.status = "Изабери један од понуђених статуса.";
    }

    if (author.brojOsvojenihNagrada === "" || Number(author.brojOsvojenihNagrada) < 0) {
        errors.brojOsvojenihNagrada = "Број награда мора бити 0 или већи.";
    }

    if (author.brojProdatihPrimeraka === "" || Number(author.brojProdatihPrimeraka) < 0) {
        errors.brojProdatihPrimeraka = "Број примерака мора бити 0 или већи.";
    }

    if (!phonePattern.test(author.kontaktTelefonMenadzera || "")) {
        errors.kontaktTelefonMenadzera = "Формат мора бити: +381 64 123-4567.";
    }

    return errors;
}

function addAuthorDeleteDialog() {
    authorDeleteDialog = createConfirmDialog({
        id: "author-delete-dialog",
        title: "Потврда брисања",
        confirmText: "Обриши",
        onConfirm: async () => {
            if (!selectedAuthorId) {
                return;
            }

            try {
                const deletedAuthorId = selectedAuthorId;

                await firebaseRequest(`autori/${deletedAuthorId}`, { method: "DELETE" });
                await deleteRatingsForAuthor(deletedAuthorId);
                await refreshAdminAuthors();
                showStatus(
                    "[data-admin-authors-status]",
                    `Аутор ${deletedAuthorId} је обрисан из Firebase базе.`,
                    "success"
                );
                selectedAuthorId = null;
            } catch (error) {
                showStatus("[data-admin-authors-status]", error.message, "error");
            }
        }
    });
}

async function deleteRatingsForAuthor(authorId) {
    const database = await reloadDatabase();
    const ratingIds = objectToArray(database.ocene)
        .filter((rating) => rating.idAutora === authorId)
        .map((rating) => rating.id);

    await Promise.all(ratingIds.map((ratingId) =>
        firebaseRequest(`ocene/${ratingId}`, { method: "DELETE" })
    ));
}

async function refreshAdminAuthors() {
    const database = await reloadDatabase();
    const authors = objectToArray(database.autori);

    renderAuthorsTable(authors);
    fillEditAuthorForm(authors[0]);

    if (document.querySelector("[data-admin-authors-status]")) {
        showStatus(
            "[data-admin-authors-status]",
            `Табела је освежена. Укупно аутора: ${authors.length}.`,
            "success"
        );
    }
}

function openAuthorDeleteDialog(authorId, author) {
    if (!author || !authorDeleteDialog) {
        return;
    }

    selectedAuthorId = authorId;
    authorDeleteDialog.open(`Да ли сигурно желиш да обришеш аутора ${fullName(author)}?`);
}

async function renderAuthorDetailsPage() {
    const container = document.querySelector("[data-author-detail]");

    if (!container) {
        return;
    }

    const authorId = new URLSearchParams(window.location.search).get("id");

    if (!authorId) {
        showStatus("[data-author-detail-status]", "Није прослеђен ID аутора.", "error");
        return;
    }

    try {
        const database = await loadDatabase();
        const authorData = database.autori?.[authorId];

        if (!authorData) {
            showStatus("[data-author-detail-status]", "Аутор није пронађен у бази.", "error");
            return;
        }

        const author = { id: authorId, ...authorData };
        const books = objectToArray(database.knjige).filter((book) => book.idAutora === authorId);
        const ratings = objectToArray(database.ocene).filter((rating) => rating.idAutora === authorId);

        container.innerHTML = authorDetailsTemplate(author, books, ratings);
        setupStarRating(author, ratings);
        hideStatus("[data-author-detail-status]");
        document.title = `Заједница Читалаца - ${fullName(author)}`;
    } catch (error) {
        showStatus("[data-author-detail-status]", error.message, "error");
    }
}

function authorDetailsTemplate(author, books, ratings) {
    const average = calculateAverage(ratings);
    const bookCards = books.length > 0
        ? books.map((book) => `
            <article class="book-link-card">
                <h3>${escapeHtml(book.naziv)}</h3>
                <p>${escapeHtml(book.zanr)} | ${escapeHtml(book.format)}</p>
                <a class="text-link" href="${getAuthorBookDetailsUrl(book.id)}">Погледај књигу</a>
            </article>
        `).join("")
        : "<p>За овог аутора нема књига у бази.</p>";

    return `
        <section class="card author-detail-card">
            <img class="author-detail-image" src="${escapeAttribute(author.slike?.[0] || "")}" alt="${escapeAttribute(fullName(author))}">
            <div class="author-detail-info">
                <p class="author-status">${escapeHtml(author.status)}</p>
                <h2>${escapeHtml(fullName(author))}</h2>
                <p>${escapeHtml(author.biografija)}</p>
                <dl class="author-facts">
                    <div><dt>Датум рођења</dt><dd>${formatDate(author.datumRodjenja)}</dd></div>
                    <div><dt>Освојене награде</dt><dd>${Number(author.brojOsvojenihNagrada).toLocaleString("sr-RS")}</dd></div>
                    <div><dt>Продати примерци</dt><dd>${Number(author.brojProdatihPrimeraka).toLocaleString("sr-RS")}</dd></div>
                    <div><dt>Телефон менаџера</dt><dd>${escapeHtml(author.kontaktTelefonMenadzera)}</dd></div>
                </dl>
            </div>
        </section>

        <div class="grid author-content-grid">
            <section class="card content-card">
                <h2>Оцените аутора</h2>
                <p>Просечна оцена: <strong data-average-rating>${average}</strong> / 5 (<span data-rating-count>${ratings.length}</span> оцена)</p>
                <div class="interactive-rating" data-star-rating aria-label="Оцена аутора од 1 до 5">
                    ${[1, 2, 3, 4, 5].map((value) =>
                        `<button type="button" data-rating="${value}" aria-label="${value} звездица">☆</button>`
                    ).join("")}
                </div>
                <p class="status-message hidden" data-rating-message></p>
            </section>

            <section class="card content-card">
                <h2>Књиге овог аутора</h2>
                <div class="book-links">${bookCards}</div>
            </section>
        </div>
    `;
}

function getAuthorBookDetailsUrl(bookId) {
    return `book-details-cuprija.html?id=${encodeURIComponent(bookId)}`;
}

function setupStarRating(author, databaseRatings) {
    const ratingBox = document.querySelector("[data-star-rating]");
    const userRating = databaseRatings.find((rating) => rating.idKorisnika === currentUserId());

    if (!ratingBox) {
        return;
    }

    if (userRating) {
        paintStars(Number(userRating.vrednost));
    }

    ratingBox.querySelectorAll("[data-rating]").forEach((button) => {
        button.addEventListener("mouseenter", () => paintStars(Number(button.dataset.rating)));
        button.addEventListener("focus", () => paintStars(Number(button.dataset.rating)));
        button.addEventListener("click", async () => {
            const value = Number(button.dataset.rating);
            const userId = currentUserId();

            if (!userId) {
                showStatus("[data-rating-message]", "Морате бити пријављени да бисте оценили аутора.", "error");
                return;
            }

            try {
                const savedRating = {
                    idAutora: author.id,
                    idKorisnika: userId,
                    vrednost: value,
                    datum: new Date().toISOString().slice(0, 10)
                };
                const existingRating = databaseRatings.find((rating) => rating.idKorisnika === userId);

                if (existingRating) {
                    await firebaseRequest(`ocene/${existingRating.id}`, {
                        method: "PATCH",
                        body: JSON.stringify(savedRating)
                    });
                    Object.assign(existingRating, savedRating);
                } else {
                    const result = await firebaseRequest("ocene", {
                        method: "POST",
                        body: JSON.stringify(savedRating)
                    });
                    databaseRatings.push({ id: result.name, ...savedRating });
                }

                document.querySelector("[data-average-rating]").textContent = calculateAverage(databaseRatings);
                document.querySelector("[data-rating-count]").textContent = databaseRatings.length;
                paintStars(value);
                showStatus("[data-rating-message]", `Оцена ${value} је сачувана у Firebase бази.`, "success");
            } catch (error) {
                showStatus("[data-rating-message]", error.message, "error");
            }
        });
    });

    ratingBox.addEventListener("mouseleave", () => {
        const savedUserRating = databaseRatings.find((rating) => rating.idKorisnika === currentUserId());
        paintStars(savedUserRating ? Number(savedUserRating.vrednost) : 0);
    });
}

function paintStars(value) {
    document.querySelectorAll("[data-star-rating] [data-rating]").forEach((button) => {
        const isSelected = Number(button.dataset.rating) <= value;
        button.textContent = isSelected ? "★" : "☆";
        button.classList.toggle("is-selected", isSelected);
    });
}

async function renderProfileRatings() {
    const container = document.querySelector("[data-profile-ratings]");

    if (!container) {
        return;
    }

    const userId = currentUserId();

    if (!userId) {
        container.innerHTML = "";
        return;
    }

    try {
        const database = await loadDatabase();
        const ratings = objectToArray(database.ocene).filter((rating) => rating.idKorisnika === userId);

        const ratingCards = ratings.map((rating) => {
                const author = database.autori[rating.idAutora];

                if (!author) {
                    return "";
                }

                return `
                    <article class="card activity-card">
                        <p><strong>Аутор:</strong>
                            <a class="text-link" href="author-details.html?id=${encodeURIComponent(rating.idAutora)}">
                                ${escapeHtml(fullName(author))}
                            </a>
                        </p>
                        <p class="activity-meta">${formatDate(rating.datum)} | ${escapeHtml(rating.idAutora)}</p>
                        <p class="rating-stars">${"★".repeat(rating.vrednost)}${"☆".repeat(5 - rating.vrednost)}</p>
                    </article>
                `;
            }).filter(Boolean);

        container.innerHTML = ratingCards.length > 0
            ? ratingCards.join("")
            : "<p>Корисник још није оценио ниједног аутора.</p>";
    } catch (error) {
        container.innerHTML = `<p class="status-message error">${escapeHtml(error.message)}</p>`;
    }
}

function currentUserId() {
    return getCurrentUser()?.id || null;
}

function calculateAverage(ratings) {
    if (ratings.length === 0) {
        return "0.0";
    }

    const sum = ratings.reduce((total, rating) => total + Number(rating.vrednost), 0);
    return (sum / ratings.length).toFixed(1);
}

function fullName(person) {
    return `${person?.ime || ""} ${person?.prezime || ""}`.trim();
}

function formatDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`);

    return Number.isNaN(date.getTime())
        ? escapeHtml(dateValue || "")
        : new Intl.DateTimeFormat("sr-RS").format(date);
}

function shorten(text, maximumLength) {
    return text.length <= maximumLength ? text : `${text.slice(0, maximumLength).trim()}...`;
}

function normalizeSearch(value) {
    return String(value || "").trim().toLocaleLowerCase("sr-RS");
}

function highlightMatch(value, query) {
    const text = String(value || "");
    const normalizedQuery = normalizeSearch(query);

    if (!normalizedQuery) {
        return escapeHtml(text);
    }

    const normalizedText = text.toLocaleLowerCase("sr-RS");
    const index = normalizedText.indexOf(normalizedQuery);

    if (index === -1) {
        return escapeHtml(text);
    }

    const before = text.slice(0, index);
    const match = text.slice(index, index + normalizedQuery.length);
    const after = text.slice(index + normalizedQuery.length);

    return `${escapeHtml(before)}<mark class="search-highlight">${escapeHtml(match)}</mark>${escapeHtml(after)}`;
}

function showAuthorFormMessage(formName, message, type) {
    showStatus(`[data-author-message="${formName}"]`, message, type);
}

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");
    return element.innerHTML;
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('"', "&quot;");
}
