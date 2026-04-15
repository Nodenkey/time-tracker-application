const API_BASE_URL = 'http://localhost:8000';

async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const config = {
    headers: {
      'Accept': 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = data && data.detail ? data.detail : `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

async function fetchEntries() {
  return apiRequest('/api/time-entries');
}

async function createEntry(payload) {
  return apiRequest('/api/time-entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function updateEntry(id, payload) {
  return apiRequest(`/api/time-entries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

async function deleteEntry(id) {
  return apiRequest(`/api/time-entries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

const elements = {};

function cacheDom() {
  elements.form = document.getElementById('time-entry-form');
  elements.date = document.getElementById('date');
  elements.personName = document.getElementById('person_name');
  elements.activity = document.getElementById('activity');
  elements.hours = document.getElementById('hours');
  elements.formStatus = document.getElementById('form-status');
  elements.entriesTbody = document.getElementById('entries-tbody');
  elements.entriesLoading = document.getElementById('entries-loading');
  elements.entriesError = document.getElementById('entries-error');
  elements.entriesEmpty = document.getElementById('entries-empty');
  elements.entriesMeta = document.getElementById('entries-meta');
  elements.resetFormBtn = document.getElementById('reset-form-btn');
}

function setFormStatus(message, type = '') {
  if (!elements.formStatus) return;
  elements.formStatus.textContent = message || '';
  elements.formStatus.classList.remove('error', 'success');
  if (type) {
    elements.formStatus.classList.add(type);
  }
}

function setFieldError(fieldName, message) {
  const errorEl = document.querySelector(`.field-error[data-error-for="${fieldName}"]`);
  if (errorEl) {
    errorEl.textContent = message || '';
  }
}

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach((el) => {
    el.textContent = '';
  });
}

function validateFormValues(values) {
  const errors = {};

  if (!values.date) {
    errors.date = 'Please select a date.';
  }

  if (!values.person_name || !values.person_name.trim()) {
    errors.person_name = 'Please enter a name.';
  }

  if (!values.activity || !values.activity.trim()) {
    errors.activity = 'Please describe the activity.';
  }

  const hoursNumber = Number(values.hours);
  if (Number.isNaN(hoursNumber) || hoursNumber <= 0) {
    errors.hours = 'Hours must be a positive number.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

function getFormValues() {
  return {
    date: elements.date.value,
    person_name: elements.personName.value,
    activity: elements.activity.value,
    hours: elements.hours.value,
  };
}

function setLoadingEntries(isLoading) {
  if (elements.entriesLoading) {
    elements.entriesLoading.style.display = isLoading ? 'block' : 'none';
  }
}

function setEntriesError(message) {
  if (!elements.entriesError) return;
  if (message) {
    elements.entriesError.textContent = message;
    elements.entriesError.hidden = false;
  } else {
    elements.entriesError.textContent = '';
    elements.entriesError.hidden = true;
  }
}

function renderEntriesMeta(entries) {
  if (!elements.entriesMeta) return;
  if (!entries || entries.length === 0) {
    elements.entriesMeta.textContent = '';
    return;
  }

  const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  elements.entriesMeta.textContent = `${entries.length} entr${
    entries.length === 1 ? 'y' : 'ies'
  } · ${totalHours.toFixed(1)} total hours`;
}

function renderEntries(entries) {
  if (!elements.entriesTbody) return;

  elements.entriesTbody.innerHTML = '';

  if (!entries || entries.length === 0) {
    if (elements.entriesEmpty) elements.entriesEmpty.hidden = false;
    renderEntriesMeta([]);
    return;
  }

  if (elements.entriesEmpty) elements.entriesEmpty.hidden = true;

  entries.forEach((entry) => {
    const tr = document.createElement('tr');
    tr.className = 'entry-row';
    tr.dataset.entryId = entry.id;

    const dateTd = document.createElement('td');
    dateTd.textContent = entry.date;

    const personTd = document.createElement('td');
    personTd.textContent = entry.person_name;

    const activityTd = document.createElement('td');
    activityTd.className = 'entry-activity';
    activityTd.textContent = entry.activity;

    const hoursTd = document.createElement('td');
    hoursTd.className = 'numeric';
    hoursTd.textContent = Number(entry.hours).toFixed(1);

    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-col';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn small secondary';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEditEntry(tr, entry));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn small danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => handleDeleteEntry(entry));

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(dateTd);
    tr.appendChild(personTd);
    tr.appendChild(activityTd);
    tr.appendChild(hoursTd);
    tr.appendChild(actionsTd);

    elements.entriesTbody.appendChild(tr);
  });

  renderEntriesMeta(entries);
}

function startEditEntry(row, entry) {
  if (!row || !entry) return;

  const isEditing = row.classList.contains('editing');
  if (isEditing) {
    cancelRowEdit(row, entry);
    return;
  }

  row.classList.add('editing');

  const [dateTd, personTd, activityTd, hoursTd, actionsTd] = row.children;

  dateTd.innerHTML = '';
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = entry.date;
  dateTd.appendChild(dateInput);

  personTd.innerHTML = '';
  const personInput = document.createElement('input');
  personInput.type = 'text';
  personInput.value = entry.person_name;
  personTd.appendChild(personInput);

  activityTd.innerHTML = '';
  const activityInput = document.createElement('textarea');
  activityInput.rows = 2;
  activityInput.value = entry.activity;
  activityTd.appendChild(activityInput);

  hoursTd.innerHTML = '';
  const hoursInput = document.createElement('input');
  hoursInput.type = 'number';
  hoursInput.min = '0';
  hoursInput.step = '0.1';
  hoursInput.value = entry.hours;
  hoursTd.appendChild(hoursInput);

  actionsTd.innerHTML = '';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn small primary';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', async () => {
    const updated = {
      date: dateInput.value,
      person_name: personInput.value,
      activity: activityInput.value,
      hours: hoursInput.value,
    };

    const { errors, isValid } = validateFormValues(updated);
    if (!isValid) {
      alert(
        Object.values(errors)
          .filter(Boolean)
          .join('\n')
      );
      return;
    }

    try {
      const payload = {
        date: updated.date,
        person_name: updated.person_name,
        activity: updated.activity,
        hours: Number(updated.hours),
      };
      const saved = await updateEntry(entry.id, payload);
      Object.assign(entry, saved);
      cancelRowEdit(row, entry);
      refreshEntries();
    } catch (error) {
      alert(`Failed to update entry: ${error.message}`);
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn small secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => {
    cancelRowEdit(row, entry);
  });

  actionsTd.appendChild(saveBtn);
  actionsTd.appendChild(cancelBtn);
}

function cancelRowEdit(row, entry) {
  row.classList.remove('editing');
  const entries = collectEntriesFromDom(entry.id, entry);
  renderEntries(entries);
}

function collectEntriesFromDom(updatedId, updatedEntry) {
  const rows = Array.from(elements.entriesTbody.querySelectorAll('.entry-row'));
  const entries = rows.map((row) => {
    const id = row.dataset.entryId;
    if (id === updatedId) {
      return updatedEntry;
    }
    const [dateTd, personTd, activityTd, hoursTd] = row.children;
    return {
      id,
      date: dateTd.textContent,
      person_name: personTd.textContent,
      activity: activityTd.textContent,
      hours: parseFloat(hoursTd.textContent) || 0,
    };
  });
  return entries;
}

async function handleDeleteEntry(entry) {
  if (!entry || !entry.id) return;
  const confirmed = window.confirm('Delete this entry? This cannot be undone.');
  if (!confirmed) return;

  try {
    await deleteEntry(entry.id);
    await refreshEntries();
  } catch (error) {
    alert(`Failed to delete entry: ${error.message}`);
  }
}

async function refreshEntries() {
  setLoadingEntries(true);
  setEntriesError('');

  try {
    const entries = await fetchEntries();
    renderEntries(entries);
  } catch (error) {
    console.error('Failed to load entries:', error);
    setEntriesError('Failed to load entries. Please try again.');
  } finally {
    setLoadingEntries(false);
  }
}

function attachEventListeners() {
  if (!elements.form) return;

  elements.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors();
    setFormStatus('');

    const values = getFormValues();
    const { errors, isValid } = validateFormValues(values);

    if (!isValid) {
      Object.entries(errors).forEach(([field, message]) => {
        setFieldError(field, message);
      });
      setFormStatus('Please fix the highlighted errors and try again.', 'error');
      return;
    }

    const payload = {
      date: values.date,
      person_name: values.person_name.trim(),
      activity: values.activity.trim(),
      hours: Number(values.hours),
    };

    try {
      setFormStatus('Saving entry…');
      await createEntry(payload);
      setFormStatus('Entry saved successfully.', 'success');
      elements.form.reset();
      await refreshEntries();
    } catch (error) {
      console.error('Failed to create entry:', error);
      setFormStatus(`Failed to save entry: ${error.message}`, 'error');
    }
  });

  if (elements.resetFormBtn) {
    elements.resetFormBtn.addEventListener('click', () => {
      clearFieldErrors();
      setFormStatus('');
    });
  }
}

function init() {
  cacheDom();
  attachEventListeners();
  refreshEntries();
}

document.addEventListener('DOMContentLoaded', init);
