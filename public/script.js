const calendarEl = document.getElementById('calendar');
const selectedDateEl = document.getElementById('selected-date');
const entryContentEl = document.getElementById('entry-content');
const saveBtn = document.getElementById('save-entry');
const entriesListEl = document.getElementById('entries-list'); // container for entries with buttons

let selectedDate = null;
let isEditing = false;

// Create a simple 7-day calendar starting from today
function createCalendar() {
  calendarEl.innerHTML = '';
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0]; // yyyy-mm-dd

    const dayBtn = document.createElement('button');
    dayBtn.textContent = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    dayBtn.addEventListener('click', () => {
      selectedDate = dateStr;
      selectedDateEl.textContent = dayBtn.textContent;
      loadEntry(selectedDate);
    });

    calendarEl.appendChild(dayBtn);
  }
}

// Load entry for the selected date from backend
async function loadEntry(date) {
  entryContentEl.value = 'Loading...';
  isEditing = false;

  try {
    const res = await fetch(`/journal/entries?date=${date}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to load entry');

    const data = await res.json();

    if (data.length > 0) {
      entryContentEl.value = data[0].content;
      isEditing = true;
    } else {
      entryContentEl.value = '';
    }
  } catch (err) {
    console.error(err);
    entryContentEl.value = 'Error loading entry';
  }
}

// Save or update entry to backend
async function saveEntry() {
  if (!selectedDate) {
    alert('Please select a date first');
    return;
  }

  const content = entryContentEl.value.trim();
  if (!content) {
    alert('Entry content cannot be empty');
    return;
  }

  try {
    let res;

    if (isEditing) {
      // update existing entry
      res = await fetch(`/journal/entries/${selectedDate}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } else {
      // create new entry
      res = await fetch('/journal/entries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_date: selectedDate, content }),
      });
    }

    if (!res.ok) throw new Error('Failed to save entry');

    alert(isEditing ? 'Entry updated!' : 'Entry saved!');
    isEditing = true;
    loadAllEntries(); // refresh entries list if you have one
  } catch (err) {
    console.error(err);
    alert('Error saving entry');
  }
}

// Delete entry
async function deleteEntry(date) {
  if (!confirm(`Are you sure you want to delete the entry for ${date}?`)) return;

  try {
    const res = await fetch(`/journal/entries/${date}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to delete entry');

    alert('Entry deleted!');
    if (selectedDate === date) {
      entryContentEl.value = '';
      isEditing = false;
    }
    loadAllEntries();
  } catch (err) {
    console.error(err);
    alert('Error deleting entry');
  }
}

// Optional: If you want to list all entries somewhere with buttons
async function loadAllEntries() {
  const listEl = document.getElementById('entries-list');
  if (!listEl) return;

  try {
    const res = await fetch('/journal/entries', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to load entries');

    const entries = await res.json();

    listEl.innerHTML = '';
    entries.forEach(entry => {
      const item = document.createElement('div');
      item.innerHTML = `
        <strong>${entry.entry_date}</strong>: ${entry.content}
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      `;

      item.querySelector('.edit-btn').onclick = () => {
        selectedDate = new Date(entry.entry_date).toISOString().split('T')[0];
        selectedDateEl.textContent = entry.entry_date;
        entryContentEl.value = entry.content;
        isEditing = true;
      };

      item.querySelector('.delete-btn').onclick = () => {
        // The entry_date format here is like "5 June 2025"
        // Convert back to yyyy-mm-dd for API call:
        const d = new Date(entry.entry_date);
        const dateStr = d.toISOString().split('T')[0];
        deleteEntry(dateStr);
      };

      listEl.appendChild(item);
    });
  } catch (err) {
    console.error(err);
  }
}

saveBtn.addEventListener('click', saveEntry);

createCalendar();
loadAllEntries();
