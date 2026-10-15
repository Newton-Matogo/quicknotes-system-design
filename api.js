const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");

// Keep status messages safe by using textContent.
function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

// Reusable helper for HTTP requests.
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response;
}

// Display notes without inserting user-controlled HTML.

function renderNotes(notes) {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No notes found. Create your first note!";
    notesList.appendChild(emptyItem);
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement("li");
    item.className = "note";
    item.dataset.id = note.id;

    const title = document.createElement("h3");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete note ${note.id}`);

    deleteButton.addEventListener("click", () =>
      deleteNote(note.id, deleteButton),
    );

    item.append(title, body, deleteButton);
    notesList.appendChild(item);
  });
}

// GET: load the first 10 notes.
async function loadNotes() {
  loadButton.disabled = true;
  showStatus("Loading notes...");

  try {
    const response = await request(`${API_URL}?_limit=10`);
    const notes = await response.json();

    renderNotes(notes);

    if (notes.length === 0) {
      showStatus("No notes were returned by the server.", "success");
    } else {
      showStatus(`Loaded ${notes.length} notes from the server.`, "success");
    }
  } catch (error) {
    showStatus(
      "Sorry, we couldn't load your notes. Please try again.",
      "error",
    );
    console.error("Error loading notes:", error);
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadNotes);

async function deleteNote(noteId, deleteButton) {
  const noteItem = deleteButton.closest("li");

  deleteButton.disabled = true;
  showStatus("Deleting note...");

  try {
    const response = await request(`${API_URL}/${noteId}`, {
      method: "DELETE",
    });

    // JSONPlaceholder simulates deletion but does not persist changes.
    // Remove the note from this page after a successful response.
    noteItem.remove();

    if (notesList.children.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = "No notes found. Create your first note!";
      notesList.appendChild(emptyItem);
    }

    showStatus(
      `Note deleted (status ${response.status}, id ${noteId}).`,
      "success",
    );
  } catch (error) {
    showStatus(
      "Sorry, we couldn't delete this note. Please try again.",
      "error",
    );
    console.error("Error deleting note:", error);
    deleteButton.disabled = false;
  }
}

noteForm.addEventListener("submit", createNote);
