# Digital Library Web

A responsive multi-page web application for discovering books and authors, publishing book reviews, rating authors, and managing content through Firebase-backed workflows.

## Highlights

- Dynamic book and author catalogues backed by Firebase
- Book detail pages with linked author information and text reviews
- Author detail pages with linked books and interactive 1–5 star ratings
- Automatic average-rating calculation
- User activity profile with review and rating history
- Full create, edit and delete workflows for books and authors
- Book search by title and genre
- Author search by name and status
- Search-term highlighting in results
- Client-side form validation, including ISBN and phone-number rules
- Custom confirmation dialogs for destructive actions
- Responsive layouts and navigation

## Books

The book module provides catalogue browsing, detailed book pages, review functionality, advanced filtering and administration.

- Dynamic catalogue rendering
- Book-to-author links
- Text reviews associated with users
- Dynamic review lists
- Search by title and genre
- Firebase-backed create, edit and delete operations
- 13-digit ISBN validation for `978` / `979` prefixes

## Authors

The author module provides discovery, detailed profiles, ratings and administration.

- Dynamic author catalogue
- Author-to-book links
- Interactive star ratings
- Persisted ratings and average-score calculation
- Search by name and status
- Firebase-backed create, edit and delete operations
- Client-side validation

## Architecture

```text
index.html                  # Book catalogue
book-details-*.html         # Book detail and review views
authors.html                # Author catalogue
author-details.html         # Author detail and rating view
profile.html                # User activity
admin-books.html            # Book administration
admin-authors.html          # Author administration

css/                        # Responsive styling
js/
  firebase-config.js        # Firebase configuration
  shared.js                 # Shared UI and application logic
  student1-books.js         # Books, reviews, search and CRUD
  student2-authors.js       # Authors, ratings, search and CRUD
images/                     # Static assets
```

## Data relationships

The application works with related data for books, authors, users, reviews and ratings. Relationships are resolved client-side, including book-to-author, author-to-books, review-to-book/user and rating-to-author/user links.

## Running locally

No build step is required. Serve the repository with a local HTTP server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

A configured Firebase Realtime Database is required for the full dynamic experience.

## Tech stack

- HTML5
- CSS
- JavaScript
- Firebase Realtime Database
- Fetch API
- Responsive web design

## What this project demonstrates

- Multi-page front-end application architecture
- Client-side CRUD workflows
- Related-data handling with Firebase
- Search and filtering UX
- Form and RegEx validation
- Responsive design
- Modular separation of shared and feature-specific JavaScript

## Status

Completed academic web-design project maintained as a portfolio example of vanilla JavaScript, Firebase integration, client-side CRUD and responsive UI design.
