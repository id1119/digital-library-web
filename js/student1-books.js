const STUDENT1_BOOKS = [
    {
        id: "cuprija",
        numericId: 10,
        title: "На Дрини ћуприја",
        authorName: "Иво Андрић",
        authorUrl: "author-details.html?id=aut001",
        image: "images/na-drini-cuprija.jpg",
        detailsUrl: "book-details-cuprija.html",
        description: "Четири века балканске историје и људских судбина утканих у несаломиви камени мост.",
        genre: "Класика, Историјски роман",
        format: "Тврди повез",
        price: 1200,
        pages: 412,
        authorId: 1,
        isbn: "978-86-7346-613-2"
    },
    {
        id: "umovi",
        numericId: 30,
        title: "Расути умови",
        authorName: "Габор Мате",
        authorUrl: "author-details.html?id=aut002",
        image: "images/rasuti-umovi.jpg",
        detailsUrl: "book-details-umovi.html",
        description: "Револуционарни поглед на АДХД као последицу трауме и окружења, а не само генетике.",
        genre: "Психологија, Популарна наука",
        format: "Меки повез",
        price: 950,
        pages: 352,
        authorId: 2,
        isbn: "978-86-521-4122-3"
    },
    {
        id: "rijecnik",
        numericId: 20,
        title: "Српски ријечник",
        authorName: "Вук Караџић",
        authorUrl: "author-details.html?id=aut003",
        image: "images/srpski-rjecnik.jpg",
        detailsUrl: "book-details-rijecnik.html",
        description: "Комплетан српски ријечник са детаљним објашњењима и примерима употребе.",
        genre: "Лингвистика, Етнологија",
        format: "Тврди повез",
        price: 2500,
        pages: 800,
        authorId: 3,
        isbn: "978-86-17-15201-4"
    }
];

const STUDENT1_DEFAULT_USER_ID = "kor001";
const STUDENT1_REVIEW_USER_NAME = "Посетилац";

let currentBooks = [...STUDENT1_BOOKS];
let currentAuthors = {};
let currentUsers = {};
let student1Reviews = [
    {
        id: "r0",
        bookId: "cuprija",
        bookNumericId: 10,
        userId: 300,
        username: "Петар Петровић",
        date: "20.03.2025.",
        text: "Ово је била одлична књига! Андрићев стил је заиста уникатан."
    },
    {
        id: "r1",
        bookId: "cuprija",
        bookNumericId: 10,
        userId: 100,
        username: "Марко Марковић",
        date: "12.03.2025.",
        text: "Ремек-дело српске књижевности. Свако треба да прочита ову књигу бар једном."
    },
    {
        id: "r2",
        bookId: "cuprija",
        bookNumericId: 10,
        userId: 101,
        username: "Јелена Јовановић",
        date: "15.03.2025.",
        text: "Веома поучна и дубока прича. Језик је прелеп, мада на моменте захтеван за читање."
    },
    {
        id: "r3",
        bookId: "umovi",
        bookNumericId: 30,
        userId: 104,
        username: "Драган Д.",
        date: "10.01.2026.",
        text: "Потпуно нов поглед на пажњу и концентрацију. Веома поучно за све родитеље."
    },
    {
        id: "r4",
        bookId: "rijecnik",
        bookNumericId: 20,
        userId: 102,
        username: "Милан М.",
        date: "01.02.2026.",
        text: "Свака кућа треба да има овај речник. То је основ наше писмености."
    }
];
let selectedEditBookId = STUDENT1_BOOKS[0].id;
let selectedDeleteBookId = null;
let bookDeleteDialog = null;

document.addEventListener("DOMContentLoaded", () => {
    initStudent1Books();
});

async function initStudent1Books() {
    addDeleteDialog();
    const database = await getDatabaseFromSource();

    currentBooks = database.books;
    currentAuthors = database.authors;
    currentUsers = database.users;
    student1Reviews = database.reviews;
    renderBookCatalog();
    renderBookAdminTable();
    setupBookForms();
    setupBookDetails();
    renderProfileUser();
    renderProfileReviews();
    updateProfileSummary();
}

function loadBooks() {
    return currentBooks;
}

async function requestDatabase(path, options = {}) {
    if (typeof firebaseDatabaseUrl !== "function") {
        throw new Error("Firebase конфигурација није доступна.");
    }

    const response = await fetch(firebaseDatabaseUrl(path), {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error("Упис у Firebase није успео.");
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function createBookPayload(data) {
    return {
        naziv: data.title.trim(),
        opis: data.description.trim(),
        slike: [data.image.trim()],
        zanr: data.genre.trim(),
        format: data.format.trim(),
        cena: Number(data.price),
        brojStrana: Number(data.pages),
        idAutora: data.authorId.trim(),
        isbn: data.isbn.trim()
    };
}

function createReviewPayload(bookId, text) {
    return {
        datum: new Date().toISOString().slice(0, 10),
        idKnjige: bookId,
        idKorisnika: getActiveUserId(),
        tekst: text.trim()
    };
}

async function getDatabaseFromSource() {
    const databaseUrl = typeof firebaseDatabaseUrl === "function" ? firebaseDatabaseUrl() : "";

    if (!databaseUrl) {
        return getFallbackDatabase();
    }

    try {
        const response = await fetch(databaseUrl);

        if (!response.ok) {
            throw new Error("Database response failed");
        }

        const data = await response.json();
        const database = normalizeDatabase(data);

        return database.books.length > 0 ? database : getFallbackDatabase();
    } catch (error) {
        return getFallbackDatabase();
    }
}

function getFallbackDatabase() {
    return {
        books: [...STUDENT1_BOOKS],
        authors: {},
        users: {
            [STUDENT1_DEFAULT_USER_ID]: {
                ime: "Татјана",
                prezime: "Петровић",
                email: "tatjana.petrovic@example.com",
                korisnickoIme: "tatjana_p",
                adresa: "Београдска 1, Београд",
                datumRodjenja: "2003-01-01",
                zanimanje: "Економисткиња"
            }
        },
        reviews: [...student1Reviews]
    };
}

function normalizeDatabase(data) {
    if (!data || !data.knjige) {
        return getFallbackDatabase();
    }

    const authors = data.autori || {};
    const users = data.korisnici || {};
    const books = normalizeBooks(data.knjige, authors);
    const reviews = normalizeReviews(data.recenzije || {}, books, users);

    return { books, authors, users, reviews };
}

function normalizeBooks(data, authors) {
    if (!data) {
        return [];
    }

    return Object.entries(data).map(([id, book], index) => ({
        id,
        numericId: id,
        title: book.title || book.naziv || "",
        authorName: getAuthorName(authors, book.idAutora),
        authorUrl: getAuthorUrl(book.idAutora),
        image: getFirstImage(book.slike || book.image || book.slika),
        detailsUrl: getBookDetailsUrl(id, index),
        description: book.description || book.opis || "",
        genre: book.genre || book.zanr || "",
        format: book.format || "",
        price: Number(book.price || book.cena || 0),
        pages: Number(book.pages || book.brojStrana || 0),
        authorId: book.authorId || book.idAutora || "",
        isbn: book.isbn || ""
    }));
}

function normalizeReviews(data, books, users) {
    const knownBookIds = new Set(books.map((book) => book.id));

    return Object.entries(data)
        .filter(([, review]) => knownBookIds.has(review.idKnjige))
        .map(([id, review]) => ({
            id,
            bookId: review.idKnjige,
            bookNumericId: review.idKnjige,
            userId: review.idKorisnika,
            username: getUserName(users, review.idKorisnika),
            date: formatDate(review.datum),
            dateValue: review.datum || "",
            text: review.tekst || ""
        }))
        .sort((first, second) => new Date(second.dateValue) - new Date(first.dateValue));
}

function createReviewFromPayload(id, payload, fallbackUsername = "") {
    return {
        id,
        bookId: payload.idKnjige,
        bookNumericId: payload.idKnjige,
        userId: payload.idKorisnika,
        username: getUserName(currentUsers, payload.idKorisnika) || fallbackUsername.trim() || STUDENT1_REVIEW_USER_NAME,
        date: formatDate(payload.datum),
        dateValue: payload.datum,
        text: payload.tekst || ""
    };
}

function getActiveUserId() {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    return user?.id || STUDENT1_DEFAULT_USER_ID;
}

function getActiveUser() {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    if (user) {
        return {
            id: user.id,
            ime: user.firstName || "",
            prezime: user.lastName || "",
            email: user.email || "",
            korisnickoIme: user.username || "",
            adresa: user.address || "",
            datumRodjenja: user.birthDate || "",
            zanimanje: user.occupation || ""
        };
    }

    return {
        id: STUDENT1_DEFAULT_USER_ID,
        ...(currentUsers[STUDENT1_DEFAULT_USER_ID] || {})
    };
}

function getFirstImage(images) {
    if (Array.isArray(images) && images.length > 0) {
        return images[0];
    }

    return typeof images === "string" && images ? images : "images/na-drini-cuprija.jpg";
}

function getAuthorName(authors, authorId) {
    const author = authors[authorId];

    if (!author) {
        return "Непознат аутор";
    }

    return `${author.ime} ${author.prezime}`.trim();
}

function getAuthorUrl(authorId) {
    return authorId ? `author-details.html?id=${encodeURIComponent(authorId)}` : "authors.html";
}

function getBookDetailsUrl(bookId) {
    return `book-details-cuprija.html?id=${encodeURIComponent(bookId)}`;
}

function getUserName(users, userId) {
    const user = users[userId];

    if (!user) {
        return userId;
    }

    return `${user.ime} ${user.prezime}`.trim();
}

function formatDate(date) {
    const parsedDate = new Date(date);

    if (!date || Number.isNaN(parsedDate.getTime())) {
        return date || "";
    }

    return parsedDate.toLocaleDateString("sr-RS");
}

function renderBookCatalog() {
    const grid = document.querySelector("[data-books-grid]");

    if (!grid) {
        return;
    }

    const books = loadBooks();

    grid.innerHTML = books.length > 0 ? books.map((book) => `
        <article class="card book-card">
            <h3><a href="${s1EscapeAttribute(book.detailsUrl)}" class="plain-link">${s1EscapeHtml(book.title)}</a></h3>
            <p><b>Аутор:</b> <a href="${s1EscapeAttribute(book.authorUrl)}" class="text-link">${s1EscapeHtml(book.authorName)}</a></p>
            <img src="${s1EscapeAttribute(book.image)}" alt="${s1EscapeAttribute(book.title)}" class="book-cover" loading="lazy">
            <p>${s1EscapeHtml(shortenText(book.description, 170))}</p>
            <a href="${s1EscapeAttribute(book.detailsUrl)}" class="btn btn-primary">Детаљи</a>
        </article>
    `).join("") : `<p class="empty-state">Нема књига за приказ.</p>`;
}

function renderBookAdminTable() {
    const tbody = document.querySelector("[data-admin-books]");

    if (!tbody) {
        return;
    }

    const books = loadBooks();

    if (books.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">Нема књига за приказ.</td></tr>`;
        return;
    }

    tbody.innerHTML = books.map((book) => `
        <tr>
            <td>${s1EscapeHtml(book.title)}</td>
            <td>${s1EscapeHtml(book.genre)}</td>
            <td>${s1EscapeHtml(book.isbn)}</td>
            <td class="table-actions">
                <a href="${s1EscapeAttribute(book.detailsUrl)}" class="btn btn-primary btn-small">Детаљи</a>
                <button type="button" class="btn btn-secondary btn-small" data-edit-book="${s1EscapeAttribute(book.id)}">Измени</button>
                <button type="button" class="btn btn-danger btn-small" data-delete-book="${s1EscapeAttribute(book.id)}">Обриши</button>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("[data-edit-book]").forEach((button) => {
        button.addEventListener("click", () => {
            fillEditBookForm(button.dataset.editBook);
            document.querySelector('[data-book-form="edit"]').scrollIntoView({ behavior: "smooth" });
        });
    });

    tbody.querySelectorAll("[data-delete-book]").forEach((button) => {
        button.addEventListener("click", () => openDeleteDialog(button.dataset.deleteBook));
    });

    if (!selectedEditBookId || !books.some((book) => book.id === selectedEditBookId)) {
        fillEditBookForm(books[0].id);
    }
}

function setupBookForms() {
    document.querySelectorAll("[data-book-form]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const data = Object.fromEntries(new FormData(form));
            const errors = validateBook(data);

            showFormErrors(form, errors);

            if (Object.keys(errors).length > 0) {
                showBookFormMessage(form.dataset.bookForm, "Провери податке о књизи.", "error");
                return;
            }

            if (form.dataset.bookForm === "add") {
                const savedInDatabase = await addBook(data);

                form.reset();
                showBookFormMessage(
                    "add",
                    savedInDatabase ? "Књига је додата у Firebase базу." : "Књига је додата у локални приказ јер база тренутно није доступна.",
                    savedInDatabase ? "success" : "error"
                );
                return;
            }

            const savedInDatabase = await updateBook(data);
            showBookFormMessage(
                "edit",
                savedInDatabase ? "Измене су сачуване у Firebase бази." : "Измене су приказане локално јер база тренутно није доступна.",
                savedInDatabase ? "success" : "error"
            );
        });
    });
}

function validateBook(data) {
    const errors = {};
    const isbn = (data.isbn || "").replace(/\D/g, "");

    if (!data.title || data.title.trim().length < 2) {
        errors.title = "Наслов мора имати најмање 2 карактера.";
    }

    if (!data.description || data.description.trim().length < 10) {
        errors.description = "Опис мора имати најмање 10 карактера.";
    }

    if (!/^(https?:\/\/|images\/).+\.(jpg|jpeg|png|webp)$/i.test(data.image || "")) {
        errors.image = "Унеси URL слике или путању из images/ фолдера.";
    }

    if (!data.genre || data.genre.trim().length < 2) {
        errors.genre = "Жанр је обавезан.";
    }

    if (!data.format || data.format.trim().length < 2) {
        errors.format = "Формат је обавезан.";
    }

    if (!Number(data.price) || Number(data.price) <= 0) {
        errors.price = "Цена мора бити позитиван број.";
    }

    if (!Number(data.pages) || Number(data.pages) <= 0) {
        errors.pages = "Број страна мора бити позитиван број.";
    }

    if (!data.authorId || data.authorId.trim().length < 1) {
        errors.authorId = "ID аутора је обавезан.";
    }

    if (!/^(978|979)\d{10}$/.test(isbn)) {
        errors.isbn = "ISBN мора имати 13 цифара и почети са 978 или 979.";
    }

    return errors;
}

async function addBook(data) {
    const payload = createBookPayload(data);
    const localId = `local-book-${Date.now()}`;

    try {
        const result = await requestDatabase("knjige", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        const book = createBookFromPayload(result.name, payload);

        currentBooks.push(book);
        renderAfterBookChange();
        return true;
    } catch (error) {
        currentBooks.push(createBookFromPayload(localId, payload));
        renderAfterBookChange();
        return false;
    }
}

async function updateBook(data) {
    const payload = createBookPayload(data);

    try {
        await requestDatabase(`knjige/${selectedEditBookId}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        updateBookLocally(selectedEditBookId, payload);
        return true;
    } catch (error) {
        updateBookLocally(selectedEditBookId, payload);
        return false;
    }
}

function createBookFromPayload(id, payload) {
    return {
        id,
        numericId: id,
        title: payload.naziv,
        authorName: getAuthorName(currentAuthors, payload.idAutora),
        authorUrl: getAuthorUrl(payload.idAutora),
        image: getFirstImage(payload.slike),
        detailsUrl: getBookDetailsUrl(id),
        description: payload.opis,
        genre: payload.zanr,
        format: payload.format,
        price: Number(payload.cena),
        pages: Number(payload.brojStrana),
        authorId: payload.idAutora,
        isbn: payload.isbn
    };
}

function updateBookLocally(bookId, payload) {
    currentBooks = currentBooks.map((book) => {
        if (book.id !== bookId) {
            return book;
        }

        return {
            ...book,
            title: payload.naziv,
            authorName: getAuthorName(currentAuthors, payload.idAutora),
            authorUrl: getAuthorUrl(payload.idAutora),
            image: getFirstImage(payload.slike),
            description: payload.opis,
            genre: payload.zanr,
            format: payload.format,
            price: Number(payload.cena),
            pages: Number(payload.brojStrana),
            authorId: payload.idAutora,
            isbn: payload.isbn
        };
    });

    renderAfterBookChange();
}

function renderAfterBookChange() {
    renderBookCatalog();
    renderBookAdminTable();
    renderProfileReviews();
    updateProfileSummary();
}

function fillEditBookForm(bookId) {
    const form = document.querySelector('[data-book-form="edit"]');
    const book = loadBooks().find((item) => item.id === bookId);

    if (!form || !book) {
        return;
    }

    selectedEditBookId = book.id;
    form.elements.title.value = book.title;
    form.elements.description.value = book.description;
    form.elements.image.value = book.image;
    form.elements.genre.value = book.genre;
    form.elements.format.value = book.format;
    form.elements.price.value = book.price;
    form.elements.pages.value = book.pages;
    form.elements.authorId.value = book.authorId;
    form.elements.isbn.value = book.isbn;
    clearFormErrors(form);
    showBookFormMessage("edit", `Форма је попуњена подацима за књигу "${book.title}".`, "success");
}

function addDeleteDialog() {
    bookDeleteDialog = createConfirmDialog({
        id: "book-delete-dialog",
        title: "Потврда брисања",
        confirmText: "Обриши",
        onConfirm: deleteSelectedBook
    });
}

function openDeleteDialog(bookId) {
    const book = loadBooks().find((item) => item.id === bookId);

    if (!book || !bookDeleteDialog) {
        return;
    }

    selectedDeleteBookId = bookId;
    bookDeleteDialog.open(`Да ли желите да обришете књигу "${book.title}"?`);
}

async function deleteSelectedBook() {
    if (!selectedDeleteBookId) {
        bookDeleteDialog?.close();
        return;
    }

    const bookId = selectedDeleteBookId;
    const relatedReviews = student1Reviews.filter((review) => review.bookId === bookId);
    const updates = {
        [`knjige/${bookId}`]: null
    };

    relatedReviews.forEach((review) => {
        updates[`recenzije/${review.id}`] = null;
    });

    try {
        await requestDatabase("", {
            method: "PATCH",
            body: JSON.stringify(updates)
        });
        showBookFormMessage("edit", "Књига и њене рецензије су обрисане из Firebase базе.", "success");
    } catch (error) {
        showBookFormMessage("edit", "Књига је обрисана из локалног приказа јер база тренутно није доступна.", "error");
    }

    currentBooks = currentBooks.filter((book) => book.id !== bookId);
    student1Reviews = student1Reviews.filter((review) => review.bookId !== bookId);
    if (selectedEditBookId === bookId) {
        selectedEditBookId = null;
    }
    selectedDeleteBookId = null;
    renderAfterBookChange();
}

function setupBookDetails() {
    const page = document.querySelector("[data-book-detail]");
    const form = document.querySelector("[data-review-form]");

    if (!page) {
        return;
    }

    const bookId = getCurrentBookId(page);
    const book = loadBooks().find((item) => item.id === bookId)
        || STUDENT1_BOOKS.find((item) => item.id === bookId);

    if (!book) {
        renderMissingBook();
        return;
    }

    renderBookDetails(book);
    renderReviewsForBook(book.id);

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const data = Object.fromEntries(new FormData(form));
        const errors = validateReview(data);

        showFormErrors(form, errors);

        if (Object.keys(errors).length > 0) {
            showReviewMessage("Рецензија није исправно попуњена.", "error");
            return;
        }

        const payload = createReviewPayload(book.id, data.comment);
        const bookExistsInDatabase = currentBooks.some((item) => item.id === book.id);
        let message = bookExistsInDatabase
            ? "Рецензија је сачувана у Firebase бази."
            : "Рецензија је додата у локални приказ за демо књигу.";
        let type = "success";

        try {
            if (!bookExistsInDatabase) {
                throw new Error("Књига није у Firebase каталогу.");
            }

            const result = await requestDatabase("recenzije", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            student1Reviews.unshift(createReviewFromPayload(result.name, payload, data.username));
        } catch (error) {
            student1Reviews.unshift(createReviewFromPayload(`local-review-${Date.now()}`, payload, data.username));
            if (bookExistsInDatabase) {
                message = "Рецензија је додата у локални приказ јер база тренутно није доступна.";
                type = "error";
            }
        }

        form.reset();
        renderReviewsForBook(book.id);
        renderProfileReviews();
        updateProfileSummary();
        showReviewMessage(message, type);
    });
}

function getCurrentBookId(page) {
    const params = new URLSearchParams(window.location.search);

    return params.get("id") || page.dataset.bookDetail;
}

function renderBookDetails(book) {
    const title = document.querySelector("title");
    const cover = document.querySelector(".book-detail-cover img");
    const info = document.querySelector(".book-detail-info");

    if (title) {
        title.textContent = `Заједница Читалаца - ${book.title}`;
    }

    if (cover) {
        cover.src = book.image;
        cover.alt = book.title;
    }

    if (info) {
        info.innerHTML = `
            <h2>${s1EscapeHtml(book.title)}</h2>
            <p><strong>ID књиге:</strong> ${s1EscapeHtml(book.id)}</p>
            <p><strong>Аутор ID:</strong> ${s1EscapeHtml(book.authorId)}</p>
            <p><strong>Аутор:</strong> <a href="${s1EscapeAttribute(book.authorUrl)}" class="text-link">${s1EscapeHtml(book.authorName)}</a></p>
            <p><strong>Жанр:</strong> ${s1EscapeHtml(book.genre)}</p>
            <p><strong>Формат:</strong> ${s1EscapeHtml(book.format)}</p>
            <p><strong>Број страна:</strong> ${Number(book.pages).toLocaleString("sr-RS")}</p>
            <p><strong>Цена:</strong> ${Number(book.price).toLocaleString("sr-RS")} РСД</p>
            <p><strong>ISBN:</strong> ${s1EscapeHtml(book.isbn)}</p>
            <br>
            <p><strong>Опис:</strong> ${s1EscapeHtml(book.description)}</p>
        `;
    }
}

function renderMissingBook() {
    const info = document.querySelector(".book-detail-info");
    const list = document.querySelector("[data-reviews-list]");

    if (info) {
        info.innerHTML = `
            <h2>Књига није пронађена</h2>
            <p>Провери да ли је ID књиге исправан.</p>
        `;
    }

    if (list) {
        list.innerHTML = `<p class="empty-state">Нема рецензија јер књига није пронађена.</p>`;
    }
}

function validateReview(data) {
    const errors = {};

    if (!data.username || data.username.trim().length < 2) {
        errors.username = "Име мора имати најмање 2 карактера.";
    }

    if (!data.comment || data.comment.trim().length < 10) {
        errors.comment = "Рецензија мора имати најмање 10 карактера.";
    }

    return errors;
}

function renderReviewsForBook(bookId) {
    const list = document.querySelector("[data-reviews-list]");

    if (!list) {
        return;
    }

    const reviews = student1Reviews.filter((review) => review.bookId === bookId);

    list.innerHTML = reviews.length > 0 ? reviews.map(renderReviewItem).join("") : `<p class="empty-state">Нема рецензија за ову књигу.</p>`;
}

function renderProfileReviews() {
    const list = document.querySelector("[data-profile-reviews]");

    if (!list) {
        return;
    }

    const currentUserReviews = student1Reviews.filter((review) => review.userId === getActiveUserId());

    if (currentUserReviews.length === 0) {
        list.innerHTML = `<article class="card activity-card"><p>Корисник још нема рецензије.</p></article>`;
        return;
    }

    list.innerHTML = currentUserReviews.map((review) => {
        const book = loadBooks().find((item) => item.id === review.bookId);
        const detailsUrl = book?.detailsUrl || getBookDetailsUrl(review.bookId);
        const title = book?.title || review.bookId;

        return `
            <article class="card activity-card">
                <p><strong>Књига:</strong> <a href="${s1EscapeAttribute(detailsUrl)}" class="text-link">${s1EscapeHtml(title)}</a></p>
                <p class="activity-meta">Датум: ${s1EscapeHtml(review.date)} | ID књиге: ${s1EscapeHtml(review.bookNumericId)}</p>
                <p><strong>Рецензија:</strong> ${s1EscapeHtml(review.text)}</p>
            </article>
        `;
    }).join("");
}

function renderProfileUser() {
    const card = document.querySelector("[data-profile-user-card]");

    if (!card) {
        return;
    }

    const user = getActiveUser();
    const fields = {
        ime: user.ime || "Непознато",
        prezime: user.prezime || "Непознато",
        email: user.email || "Није унето",
        korisnickoIme: user.korisnickoIme || "Није унето",
        adresa: user.adresa || "Није унето",
        datumRodjenja: user.datumRodjenja ? formatDate(user.datumRodjenja) : "Није унето",
        zanimanje: user.zanimanje || "Није унето"
    };

    const badge = document.querySelector("[data-profile-user-id]");

    if (badge) {
        badge.textContent = `ID корисника: ${user.id}`;
    }

    Object.entries(fields).forEach(([field, value]) => {
        const element = card.querySelector(`[data-profile-field="${field}"]`);

        if (element) {
            element.textContent = value;
        }
    });
}

function updateProfileSummary() {
    const reviewCount = document.querySelector("[data-profile-review-count]");
    const bookCount = document.querySelector("[data-profile-book-count]");

    if (reviewCount) {
        reviewCount.textContent = student1Reviews.filter((review) => review.userId === getActiveUserId()).length;
    }

    if (bookCount) {
        bookCount.textContent = loadBooks().length;
    }
}

function renderReviewItem(review) {
    return `
        <article class="review-item">
            <p><strong>${s1EscapeHtml(review.username)}</strong> (ID корисника: ${s1EscapeHtml(review.userId)}) - <small>${s1EscapeHtml(review.date)}</small></p>
            <p><small>ID књиге: ${s1EscapeHtml(review.bookNumericId)}</small></p>
            <p>${s1EscapeHtml(review.text)}</p>
        </article>
    `;
}

function showBookFormMessage(formName, message, type) {
    const messageBox = document.querySelector(`[data-book-form-message="${formName}"]`);

    showStatus(messageBox, message, type);
}

function showReviewMessage(message, type) {
    const messageBox = document.querySelector("[data-review-message]");

    showStatus(messageBox, message, type);
}

function shortenText(text, maximumLength) {
    const value = String(text || "");

    return value.length <= maximumLength ? value : `${value.slice(0, maximumLength).trim()}...`;
}

function s1EscapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");
    return element.innerHTML;
}

function s1EscapeAttribute(value) {
    return s1EscapeHtml(value).replaceAll('"', "&quot;");
}
