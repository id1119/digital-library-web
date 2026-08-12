# Digital Library Web Interface

A multi-page front-end project for a digital library experience, including public browsing pages, author and book views, user profiles and administrative interfaces.

## Highlights

- Multi-page responsive website structure
- Book and author browsing
- Detailed book pages
- User profile interface
- Administrative views for managing books and authors
- Separation of HTML, CSS, JavaScript and image assets

## Project structure

```text
index.html              # Main page
authors.html            # Author listing
author-details.html     # Author details
book-details-*.html     # Book detail views
profile.html            # User profile
admin-authors.html      # Author administration
admin-books.html        # Book administration
css/                    # Stylesheets
js/                     # Client-side JavaScript
images/                 # Static assets
```

## Running locally

No build step is required. Open `index.html` in a browser or serve the directory with a simple local HTTP server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Tech stack

- HTML
- CSS
- JavaScript

## Status

Academic front-end project demonstrating multi-page interface design and client-side web development.
