const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

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

    const title = document.createElement("h3");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";

    item.append(title, body);
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
