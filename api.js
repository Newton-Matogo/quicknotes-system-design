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
    deleteButton.disabled = true;
    deleteButton.setAttribute("aria-label", `Delete note ${note.id}`);
    deleteButton.title = "Delete will be enabled in the next milestone";

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

async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    showStatus("Please enter a title.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    showStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  submitButton.disabled = true;
  showStatus("Creating note...");

  try {
    const response = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body,
        userId: 1,
      }),
    });

    const newNote = await response.json();

    // JSONPlaceholder simulates creation but does not persist the note.
    // Add it locally so the user can see the successful POST response.
    const existingNotes = Array.from(notesList.children)
      .filter((item) => item.dataset.id)
      .map((item) => ({
        id: item.dataset.id,
        title: item.querySelector("h3").textContent,
        body: item.querySelector("p").textContent,
      }));

    renderNotes([newNote, ...existingNotes]);

    showStatus(
      `Note created (status ${response.status}, id ${newNote.id}).`,
      "success",
    );

    noteForm.reset();
  } catch (error) {
    showStatus(
      "Sorry, we couldn't create your note. Please try again.",
      "error",
    );
    console.error("Error creating note:", error);
  } finally {
    submitButton.disabled = false;
  }
}

noteForm.addEventListener("submit", createNote);
