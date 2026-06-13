const STUDENT1_BOOKS = [
    {
        id: "cuprija",
        numericId: 10,
        title: "На Дрини ћуприја",
        authorName: "Иво Андрић",
        authorUrl: "author-details-andric.html",
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
        authorUrl: "author-details-mate.html",
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
        authorUrl: "author-details-vuk.html",
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

document.addEventListener("DOMContentLoaded", () => {
    renderBookCatalog();
    renderBookAdminTable();
    setupBookForms();
    setupBookDetails();
    renderProfileReviews();
    addDeleteDialog();
});

function loadBooks() {
    // DZ2 zahteva dinamičko učitavanje. Ovde je izdvojeno kao adapter koji se kasnije menja Firebase pozivom.
    return STUDENT1_BOOKS;
}

function renderBookCatalog() {
    const grid = document.querySelector("[data-books-grid]");

    if (!grid) {
        return;
    }

    grid.innerHTML = loadBooks().map((book) => `
        <article class="card book-card">
            <h3><a href="${book.detailsUrl}" class="plain-link">${book.title}</a></h3>
            <p><b>Аутор:</b> <a href="${book.authorUrl}" class="text-link">${book.authorName}</a></p>
            <img src="${book.image}" alt="${book.title}" class="book-cover">
            <p>${book.description}</p>
            <a href="${book.detailsUrl}" class="btn btn-primary">Детаљи</a>
        </article>
    `).join("");
}

function renderBookAdminTable() {
    const tbody = document.querySelector("[data-admin-books]");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = loadBooks().map((book) => `
        <tr>
            <td>${book.title}</td>
            <td>${book.genre}</td>
            <td>${book.isbn}</td>
            <td class="table-actions">
                <a href="${book.detailsUrl}" class="btn btn-secondary btn-small">Детаљи</a>
                <button type="button" class="btn btn-secondary btn-small" data-edit-book="${book.id}">Измени</button>
                <button type="button" class="btn btn-danger btn-small" data-delete-book="${book.id}">Обриши</button>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("[data-edit-book]").forEach((button) => {
        button.addEventListener("click", () => fillEditBookForm(button.dataset.editBook));
    });

    tbody.querySelectorAll("[data-delete-book]").forEach((button) => {
        button.addEventListener("click", () => openDeleteDialog(button.dataset.deleteBook));
    });

    fillEditBookForm(loadBooks()[0].id);
}

function setupBookForms() {
    document.querySelectorAll("[data-book-form]").forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const data = Object.fromEntries(new FormData(form));
            const errors = validateBook(data);

            showFormErrors(form, errors);

            if (Object.keys(errors).length > 0) {
                showBookFormMessage(form.dataset.bookForm, "Провери податке о књизи.", "error");
                return;
            }

            showBookFormMessage(form.dataset.bookForm, "Подаци су исправни. Упис у базу је планиран за финалну предају.", "success");
        });
    });
}

function validateBook(data) {
    const errors = {};
    const isbn = (data.isbn || "").replaceAll("-", "");

    if (!data.title || data.title.trim().length < 2) {
        errors.title = "Наслов мора имати најмање 2 карактера.";
    }

    if (!data.description || data.description.trim().length < 10) {
        errors.description = "Опис мора имати најмање 10 карактера.";
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

    if (!Number(data.authorId) || Number(data.authorId) <= 0) {
        errors.authorId = "ID аутора мора бити позитиван број.";
    }

    if (!/^(978|979)\d{10}$/.test(isbn)) {
        errors.isbn = "ISBN мора имати 13 цифара и почети са 978 или 979.";
    }

    return errors;
}

function fillEditBookForm(bookId) {
    const form = document.querySelector('[data-book-form="edit"]');
    const book = loadBooks().find((item) => item.id === bookId);

    if (!form || !book) {
        return;
    }

    form.elements.title.value = book.title;
    form.elements.description.value = book.description;
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
    if (document.querySelector("#book-delete-dialog")) {
        return;
    }

    document.body.insertAdjacentHTML("beforeend", `
        <div class="modal-backdrop" id="book-delete-dialog" aria-hidden="true">
            <div class="modal-window" role="dialog" aria-modal="true" aria-labelledby="book-delete-title">
                <h2 id="book-delete-title">Потврда брисања</h2>
                <p data-delete-book-text>Да ли желите да обришете изабрану књигу?</p>
                <div class="dialog-actions">
                    <button type="button" class="btn btn-danger" data-confirm-delete-book>Обриши</button>
                    <button type="button" class="btn btn-secondary" data-cancel-delete-book>Одустани</button>
                </div>
            </div>
        </div>
    `);

    document.querySelector("[data-cancel-delete-book]").addEventListener("click", closeDeleteDialog);
    document.querySelector("[data-confirm-delete-book]").addEventListener("click", closeDeleteDialog);
}

function openDeleteDialog(bookId) {
    const dialog = document.querySelector("#book-delete-dialog");
    const book = loadBooks().find((item) => item.id === bookId);

    dialog.querySelector("[data-delete-book-text]").textContent = `Да ли желите да обришете књигу "${book.title}"?`;
    dialog.classList.add("is-open");
    dialog.setAttribute("aria-hidden", "false");
}

function closeDeleteDialog() {
    const dialog = document.querySelector("#book-delete-dialog");

    dialog.classList.remove("is-open");
    dialog.setAttribute("aria-hidden", "true");
}

function setupBookDetails() {
    const page = document.querySelector("[data-book-detail]");
    const form = document.querySelector("[data-review-form]");

    if (!page) {
        return;
    }

    renderReviewsForBook(page.dataset.bookDetail);

    if (!form) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const data = Object.fromEntries(new FormData(form));
        const errors = validateReview(data);

        showFormErrors(form, errors);

        if (Object.keys(errors).length > 0) {
            showReviewMessage("Рецензија није исправно попуњена.", "error");
            return;
        }

        const book = loadBooks().find((item) => item.id === page.dataset.bookDetail);

        student1Reviews.unshift({
            id: `r-${Date.now()}`,
            bookId: book.id,
            bookNumericId: book.numericId,
            userId: 300,
            username: data.username.trim(),
            date: new Date().toLocaleDateString("sr-RS"),
            text: data.comment.trim()
        });

        form.reset();
        renderReviewsForBook(book.id);
        showReviewMessage("Рецензија је додата у локални приказ.", "success");
    });
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

    list.innerHTML = reviews.map(renderReviewItem).join("");
}

function renderProfileReviews() {
    const list = document.querySelector("[data-profile-reviews]");

    if (!list) {
        return;
    }

    const currentUserReviews = student1Reviews.filter((review) => review.userId === 300);

    list.innerHTML = currentUserReviews.map((review) => {
        const book = loadBooks().find((item) => item.id === review.bookId);

        return `
            <article class="card activity-card">
                <p><strong>Књига:</strong> <a href="${book.detailsUrl}" class="text-link">${book.title}</a></p>
                <p class="activity-meta">Датум: ${review.date} | ID књиге: ${review.bookNumericId}</p>
                <p><strong>Рецензија:</strong> ${review.text}</p>
            </article>
        `;
    }).join("");
}

function renderReviewItem(review) {
    return `
        <article class="review-item">
            <p><strong>${review.username}</strong> (ID корисника: ${review.userId}) - <small>${review.date}</small></p>
            <p><small>ID књиге: ${review.bookNumericId}</small></p>
            <p>${review.text}</p>
        </article>
    `;
}

function showBookFormMessage(formName, message, type) {
    const messageBox = document.querySelector(`[data-book-form-message="${formName}"]`);

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;
    messageBox.className = `status-message ${type}`;
}

function showReviewMessage(message, type) {
    const messageBox = document.querySelector("[data-review-message]");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;
    messageBox.className = `status-message ${type}`;
}
