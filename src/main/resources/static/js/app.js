/**
 * Student Management System — Academic Portal Client Application
 * Features: Interactive Charts (Chart.js), Dark Theme, Column Sorting, Pagination, CSV Export & Safe DOM
 */

const API_BASE_URL = '/api/students';

// State
let students = [];
let filteredStudents = [];
let editingStudentId = null;
let pendingDeleteId = null;

// Sorting & Pagination State
let sortColumn = 'id';
let sortDirection = 'asc';
let currentPage = 1;
const pageSize = 6;

// Chart Instances
let deptChartInstance = null;
let gpaChartInstance = null;

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

// Metrics Elements
const metricTotal = document.getElementById('metricTotal');
const metricAvgGpa = document.getElementById('metricAvgGpa');
const metricTopDept = document.getElementById('metricTopDept');
const metricMatches = document.getElementById('metricMatches');
const tableCountBadge = document.getElementById('tableCountBadge');

// Pagination Elements
const paginationBar = document.getElementById('paginationBar');
const paginationInfo = document.getElementById('paginationInfo');
const pageIndicator = document.getElementById('pageIndicator');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    bindEvents();
    loadStudents();
});

function bindEvents() {
    // Theme toggle
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // Search input with debounce
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filterStudents(e.target.value);
        }, 150);
    });

    // CSV Export
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);

    // Modal triggers
    document.getElementById('openAddModalBtn').addEventListener('click', () => openStudentModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeStudentModal);
    document.getElementById('cancelFormBtn').addEventListener('click', closeStudentModal);
    studentForm.addEventListener('submit', handleFormSubmit);

    // Delete modal triggers
    document.getElementById('closeDeleteModalBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    // Sorting headers
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (sortColumn === col) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = col;
                sortDirection = 'asc';
            }
            updateSortIndicators();
            sortAndRender();
        });
    });

    // Pagination buttons
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    // Keyboard & backdrop close
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

// --- Theme Engine ---
function initTheme() {
    const savedTheme = localStorage.getItem('sms_theme') || 'light';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const target = current === 'light' ? 'dark' : 'light';
    applyTheme(target);
    localStorage.setItem('sms_theme', target);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

    if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }

    if (deptChartInstance && gpaChartInstance) {
        updateCharts();
    }
}

// --- Data Fetching ---
async function loadStudents() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        students = await response.json();
        filteredStudents = [...students];
        currentPage = 1;
        sortAndRender();
        updateMetrics();
        updateCharts();
    } catch (err) {
        console.error('Fetch error:', err);
        showToast('Failed to load student records.', 'error');
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
            (s.department && s.department.toLowerCase().includes(q)) ||
            (s.phone && s.phone.includes(q)) ||
            (s.status && s.status.toLowerCase().includes(q))
        );
    }
    currentPage = 1;
    sortAndRender();
    updateMetrics();
}

// --- Sorting Engine ---
function updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach(th => {
        const col = th.dataset.sort;
        const indicator = th.querySelector('.sort-indicator');
        if (col === sortColumn) {
            th.classList.add('active');
            indicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
        } else {
            th.classList.remove('active');
            indicator.textContent = '↕';
        }
    });
}

function sortAndRender() {
    filteredStudents.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable();
}

// --- Metrics Calculation ---
function updateMetrics() {
    metricTotal.textContent = students.length;
    metricMatches.textContent = filteredStudents.length;
    tableCountBadge.textContent = `${filteredStudents.length} of ${students.length} students`;

    if (students.length > 0) {
        // Average GPA
        const totalGpa = students.reduce((sum, s) => sum + (s.gpa || 0), 0);
        metricAvgGpa.textContent = (totalGpa / students.length).toFixed(2);

        // Top Department
        const deptCounts = {};
        students.forEach(s => {
            const dept = s.department || 'General';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        let topDept = '—';
        let maxCount = 0;
        for (const [dept, count] of Object.entries(deptCounts)) {
            if (count > maxCount) {
                maxCount = count;
                topDept = dept;
            }
        }
        metricTopDept.textContent = topDept;
    } else {
        metricAvgGpa.textContent = '0.00';
        metricTopDept.textContent = '—';
    }
}

// --- Interactive Charts (Chart.js) ---
function updateCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    // 1. Department Breakdown
    const deptCounts = {};
    students.forEach(s => {
        const d = s.department || 'Other';
        deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    const deptLabels = Object.keys(deptCounts);
    const deptData = Object.values(deptCounts);
    const deptColors = [
        '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
        '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'
    ];

    const ctxDept = document.getElementById('deptChart').getContext('2d');
    if (deptChartInstance) deptChartInstance.destroy();

    deptChartInstance = new Chart(ctxDept, {
        type: 'doughnut',
        data: {
            labels: deptLabels.length ? deptLabels : ['None'],
            datasets: [{
                data: deptData.length ? deptData : [1],
                backgroundColor: deptColors.slice(0, deptLabels.length || 1),
                borderWidth: 2,
                borderColor: isDark ? '#131b2e' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: textColor, font: { family: 'Inter', size: 11 }, boxWidth: 12 }
                }
            }
        }
    });

    // 2. GPA Tiers Bar Chart
    const gpaBrackets = {
        '3.75 - 4.00': 0,
        '3.50 - 3.74': 0,
        '3.00 - 3.49': 0,
        '2.50 - 2.99': 0,
        '< 2.50': 0
    };

    students.forEach(s => {
        const gpa = s.gpa || 0;
        if (gpa >= 3.75) gpaBrackets['3.75 - 4.00']++;
        else if (gpa >= 3.50) gpaBrackets['3.50 - 3.74']++;
        else if (gpa >= 3.00) gpaBrackets['3.00 - 3.49']++;
        else if (gpa >= 2.50) gpaBrackets['2.50 - 2.99']++;
        else gpaBrackets['< 2.50']++;
    });

    const ctxGpa = document.getElementById('gpaChart').getContext('2d');
    if (gpaChartInstance) gpaChartInstance.destroy();

    gpaChartInstance = new Chart(ctxGpa, {
        type: 'bar',
        data: {
            labels: Object.keys(gpaBrackets),
            datasets: [{
                label: 'Students',
                data: Object.values(gpaBrackets),
                backgroundColor: ['#10b981', '#4f46e5', '#06b6d4', '#f59e0b', '#ef4444'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: textColor, font: { family: 'Inter', size: 10 } },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, stepSize: 1, font: { family: 'Inter', size: 10 } },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// --- Safe XSS-Free Table & Pagination Rendering ---
function renderTable() {
    studentTableBody.innerHTML = '';

    if (filteredStudents.length === 0) {
        studentTable.style.display = 'none';
        paginationBar.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    studentTable.style.display = 'table';
    paginationBar.style.display = 'flex';
    emptyState.style.display = 'none';

    // Pagination slicing
    const totalStudents = filteredStudents.length;
    const totalPages = Math.ceil(totalStudents / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalStudents);
    const currentSlice = filteredStudents.slice(startIndex, endIndex);

    // Update Pagination bar info
    paginationInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalStudents} students`;
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    currentSlice.forEach(student => {
        const row = document.createElement('tr');

        // 1. ID
        const idCell = document.createElement('td');
        const idBadge = document.createElement('span');
        idBadge.className = 'student-id-badge';
        idBadge.textContent = `#${student.id}`;
        idCell.appendChild(idBadge);
        row.appendChild(idCell);

        // 2. Student Profile (Avatar + Name)
        const nameCell = document.createElement('td');
        const studentWrapper = document.createElement('div');
        studentWrapper.className = 'student-cell';

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = getInitials(student.name);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'student-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'student-name-text';
        nameSpan.textContent = student.name;

        infoDiv.appendChild(nameSpan);
        studentWrapper.appendChild(avatar);
        studentWrapper.appendChild(infoDiv);
        nameCell.appendChild(studentWrapper);
        row.appendChild(nameCell);

        // 3. Department
        const deptCell = document.createElement('td');
        const deptTag = document.createElement('span');
        deptTag.className = 'dept-tag';
        deptTag.textContent = student.department || 'General';
        deptCell.appendChild(deptTag);
        row.appendChild(deptCell);

        // 4. GPA
        const gpaCell = document.createElement('td');
        const gpaPill = document.createElement('span');
        const gpaVal = typeof student.gpa === 'number' ? student.gpa.toFixed(2) : '—';
        gpaPill.className = `gpa-pill ${getGpaClass(student.gpa)}`;
        gpaPill.textContent = gpaVal;
        gpaCell.appendChild(gpaPill);
        row.appendChild(gpaCell);

        // 5. Academic Status
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        const statusVal = student.status || 'ACTIVE';
        statusBadge.className = `status-badge ${statusVal}`;
        statusBadge.textContent = statusVal;
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // 6. Contact Info
        const contactCell = document.createElement('td');
        const emailDiv = document.createElement('div');
        emailDiv.style.fontWeight = '500';
        emailDiv.textContent = student.email;

        const phoneDiv = document.createElement('div');
        phoneDiv.style.fontSize = '0.8rem';
        phoneDiv.style.color = 'var(--text-muted)';
        phoneDiv.textContent = student.phone;

        contactCell.appendChild(emailDiv);
        contactCell.appendChild(phoneDiv);
        row.appendChild(contactCell);

        // 7. Actions
        const actionsCell = document.createElement('td');
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'actions-cell';

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

function getGpaClass(gpa) {
    if (typeof gpa !== 'number') return '';
    if (gpa >= 3.5) return 'gpa-high';
    if (gpa >= 3.0) return 'gpa-med';
    return 'gpa-low';
}

// --- CSV Exporter ---
function exportToCsv() {
    if (filteredStudents.length === 0) {
        showToast('No students to export.', 'info');
        return;
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Department', 'GPA', 'Status', 'Enrollment Date'];
    const rows = filteredStudents.map(s => [
        s.id,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.phone || '').replace(/"/g, '""')}"`,
        `"${(s.department || '').replace(/"/g, '""')}"`,
        s.gpa != null ? s.gpa.toFixed(2) : '',
        `"${(s.status || '').replace(/"/g, '""')}"`,
        s.enrollmentDate || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredStudents.length} records to CSV.`, 'success');
}

// --- Student Modal Management ---
function openStudentModal(student = null) {
    clearFormErrors();
    studentForm.reset();

    if (student) {
        editingStudentId = student.id;
        modalTitle.textContent = 'Edit Academic Record';
        submitBtnText.textContent = 'Update Record';
        document.getElementById('nameInput').value = student.name || '';
        document.getElementById('emailInput').value = student.email || '';
        document.getElementById('phoneInput').value = student.phone || '';
        document.getElementById('departmentInput').value = student.department || '';
        document.getElementById('gpaInput').value = student.gpa != null ? student.gpa : '';
        document.getElementById('statusInput').value = student.status || 'ACTIVE';
        document.getElementById('enrollmentDateInput').value = student.enrollmentDate || '';
    } else {
        editingStudentId = null;
        modalTitle.textContent = 'Add New Student';
        submitBtnText.textContent = 'Add Student';
        document.getElementById('statusInput').value = 'ACTIVE';
        document.getElementById('enrollmentDateInput').value = new Date().toISOString().split('T')[0];
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
    studentForm.querySelectorAll('.form-group').forEach(group => {
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
    const department = document.getElementById('departmentInput').value.trim();
    const gpaRaw = document.getElementById('gpaInput').value.trim();
    const gpa = gpaRaw !== '' ? parseFloat(gpaRaw) : null;
    const status = document.getElementById('statusInput').value;
    const enrollmentDate = document.getElementById('enrollmentDateInput').value;

    const payload = { name, email, phone, department, gpa, status, enrollmentDate };
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
            showToast(isEdit ? 'Student record updated!' : 'Student enrolled successfully!', 'success');
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
            showToast(errData.message || 'Failed to save record.', 'error');
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
            showToast('Student record deleted.', 'info');
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
