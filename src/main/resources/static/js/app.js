/**
 * Student Management System - Client Application
 * Modern, safe, XSS-free DOM manipulation with validation feedback.
 */

const API_BASE_URL = '/api/students';

// Application State
let students = [];
let filteredStudents = [];
let editingStudentId = null;
let pendingDeleteId = null;

// DOM Elements
const studentTableBody = document.getElementById('studentTableBody');
const emptyState = document.getElementById('emptyState');
const studentTable = document.getElementById('studentTable');
const searchInput = document.getElementById('searchInput');
const studentModal = document.getElementById('studentModal');
const deleteModal = document.getElementById('deleteModal');
const studentForm = document.getElementById('studentForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtnText = document.getElementById('submitBtnText');
const deleteStudentName = document.getElementById('deleteStudentName');

// Metrics
const metricTotal = document.getElementById('metricTotal');
const metricMatches = document.getElementById('metricMatches');
const metricLatest = document.getElementById('metricLatest');
const tableCountBadge = document.getElementById('tableCountBadge');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    bindEvents();
});

function bindEvents() {
    // Search input with debounce
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filterStudents(e.target.value);
        }, 150);
    });

    // Form submission
    studentForm.addEventListener('submit', handleFormSubmit);

    // Modal buttons
    document.getElementById('openAddModalBtn').addEventListener('click', () => openStudentModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeStudentModal);
    document.getElementById('cancelFormBtn').addEventListener('click', closeStudentModal);

    document.getElementById('closeDeleteModalBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    // Close on Escape or click outside
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeStudentModal();
            closeDeleteModal();
        }
    });

    studentModal.addEventListener('click', (e) => {
        if (e.target === studentModal) closeStudentModal();
    });

    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });
}

// --- Data Fetching ---
async function loadStudents() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
            throw new Error(`Failed to load: HTTP ${response.status}`);
        }
        students = await response.json();
        filteredStudents = [...students];
        renderTable();
        updateMetrics();
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Failed to load students. Please check your connection.', 'error');
    }
}

// --- Filtering ---
function filterStudents(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
        filteredStudents = [...students];
    } else {
        filteredStudents = students.filter(s =>
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.email && s.email.toLowerCase().includes(q)) ||
            (s.phone && s.phone.includes(q))
        );
    }
    renderTable();
    updateMetrics();
}

// --- Metrics Update ---
function updateMetrics() {
    metricTotal.textContent = students.length;
    metricMatches.textContent = filteredStudents.length;
    tableCountBadge.textContent = `${filteredStudents.length} of ${students.length} students`;

    if (students.length > 0) {
        const latest = students[students.length - 1];
        metricLatest.textContent = latest.name || '—';
    } else {
        metricLatest.textContent = 'None';
    }
}

// --- Safe XSS-Free Table Rendering ---
function renderTable() {
    studentTableBody.innerHTML = '';

    if (filteredStudents.length === 0) {
        studentTable.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    studentTable.style.display = 'table';
    emptyState.style.display = 'none';

    filteredStudents.forEach(student => {
        const row = document.createElement('tr');

        // ID cell
        const idCell = document.createElement('td');
        const idBadge = document.createElement('span');
        idBadge.className = 'student-id-badge';
        idBadge.textContent = `#${student.id}`;
        idCell.appendChild(idBadge);
        row.appendChild(idCell);

        // Student Profile Cell (Avatar + Name)
        const nameCell = document.createElement('td');
        const studentWrapper = document.createElement('div');
        studentWrapper.className = 'student-cell';

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = getInitials(student.name);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'student-name-text';
        nameSpan.textContent = student.name;

        studentWrapper.appendChild(avatar);
        studentWrapper.appendChild(nameSpan);
        nameCell.appendChild(studentWrapper);
        row.appendChild(nameCell);

        // Email cell
        const emailCell = document.createElement('td');
        emailCell.textContent = student.email;
        row.appendChild(emailCell);

        // Phone cell
        const phoneCell = document.createElement('td');
        phoneCell.textContent = student.phone;
        row.appendChild(phoneCell);

        // Actions cell
        const actionsCell = document.createElement('td');
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'actions-cell';

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-icon edit';
        editBtn.title = 'Edit Student';
        editBtn.setAttribute('aria-label', `Edit ${student.name}`);
        editBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
        `;
        editBtn.addEventListener('click', () => openStudentModal(student));

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon delete';
        deleteBtn.title = 'Delete Student';
        deleteBtn.setAttribute('aria-label', `Delete ${student.name}`);
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
        `;
        deleteBtn.addEventListener('click', () => openDeleteModal(student));

        actionsWrapper.appendChild(editBtn);
        actionsWrapper.appendChild(deleteBtn);
        actionsCell.appendChild(actionsWrapper);
        row.appendChild(actionsCell);

        studentTableBody.appendChild(row);
    });
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// --- Student Modal Management ---
function openStudentModal(student = null) {
    clearFormErrors();
    studentForm.reset();

    if (student) {
        editingStudentId = student.id;
        modalTitle.textContent = 'Edit Student Profile';
        submitBtnText.textContent = 'Save Changes';
        document.getElementById('nameInput').value = student.name || '';
        document.getElementById('emailInput').value = student.email || '';
        document.getElementById('phoneInput').value = student.phone || '';
    } else {
        editingStudentId = null;
        modalTitle.textContent = 'Add New Student';
        submitBtnText.textContent = 'Add Student';
    }

    studentModal.classList.add('active');
    setTimeout(() => document.getElementById('nameInput').focus(), 100);
}

function closeStudentModal() {
    studentModal.classList.remove('active');
    editingStudentId = null;
    clearFormErrors();
}

function clearFormErrors() {
    const errorGroups = studentForm.querySelectorAll('.form-group');
    errorGroups.forEach(group => {
        group.classList.remove('has-error');
        const msgEl = group.querySelector('.error-msg');
        if (msgEl) msgEl.textContent = '';
    });
}

function setFieldError(fieldName, message) {
    const input = document.getElementById(`${fieldName}Input`);
    if (input) {
        const group = input.closest('.form-group');
        if (group) {
            group.classList.add('has-error');
            const msgEl = group.querySelector('.error-msg');
            if (msgEl) msgEl.textContent = message;
        }
    }
}

// --- Form Submission ---
async function handleFormSubmit(e) {
    e.preventDefault();
    clearFormErrors();

    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();

    const payload = { name, email, phone };
    const isEdit = Boolean(editingStudentId);
    const url = isEdit ? `${API_BASE_URL}/${editingStudentId}` : API_BASE_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeStudentModal();
            showToast(isEdit ? 'Student updated successfully!' : 'Student created successfully!', 'success');
            await loadStudents();
        } else if (response.status === 400) {
            const errData = await response.json();
            if (errData.validationErrors) {
                for (const [field, message] of Object.entries(errData.validationErrors)) {
                    setFieldError(field, message);
                }
            } else {
                showToast(errData.message || 'Validation failed.', 'error');
            }
        } else {
            const errData = await response.json().catch(() => ({}));
            showToast(errData.message || 'Failed to save student.', 'error');
        }
    } catch (err) {
        console.error('Save error:', err);
        showToast('Network error while saving student.', 'error');
    }
}

// --- Delete Modal Management ---
function openDeleteModal(student) {
    pendingDeleteId = student.id;
    deleteStudentName.textContent = student.name;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    pendingDeleteId = null;
}

async function confirmDelete() {
    if (!pendingDeleteId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${pendingDeleteId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeDeleteModal();
            showToast('Student deleted successfully.', 'info');
            await loadStudents();
        } else {
            showToast('Failed to delete student.', 'error');
        }
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Network error while deleting student.', 'error');
    }
}

// --- Toast Notifications ---
function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`;
    } else {
        iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>`;
    }

    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = iconSvg;

    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 250);
    }, duration);
}
