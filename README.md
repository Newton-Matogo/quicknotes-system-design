# QuickNotes System Design

## Overview

QuickNotes is a simple notes application that demonstrates frontend API integration and backend system design concepts. Users can load notes from an API, create new notes, and delete notes. The project also documents a REST API, relational data model, and scalable system architecture.

## Features

- Load up to 10 notes from the API.
- Create notes using a POST request.
- Delete notes using a DELETE request.
- Display loading, success, error, and empty states.
- Validate note titles before submission.
- Document API endpoints, database tables, capacity estimates, and architecture.

**Note:** This project uses JSONPlaceholder, a demonstration API. Creating and deleting resources are simulated; changes are not permanently stored on the remote server.

## Technologies

- HTML5
- CSS3
- JavaScript and Fetch API
- REST API concepts
- SQL and PostgreSQL database design
- Git and GitHub

## How to Run

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Start a local development server, for example with the VS Code Live Server extension.
4. Open `index.html` through the local server in your browser.
5. Click **Load Notes** to fetch notes.
6. Enter a title and optional body, then submit the form to create a note.
7. Click a note's **Delete** button to remove it from the displayed list.

An internet connection is required to access the demonstration API.

## System Design Documentation

- [API Design](docs/api-design.md)
- [Data Model](docs/data-model.md)
- [System Architecture](docs/architecture.md)

## What I Learned

1. How to use JavaScript's Fetch API to make GET, POST, and DELETE requests.
2. How to handle asynchronous requests, errors, loading states, and user input validation.
3. How REST API endpoints use HTTP methods and status codes.
4. How primary keys, foreign keys, indexes, and junction tables represent relational data.
5. How load balancers, caches, read replicas, and background workers support scalability and availability.
6. How Git commits and GitHub support version control and project submission.
