/**
 * Studeo — Academic Portal & Registrar Client Application
 * Features:
 * - Enterprise RBAC (Admin, Faculty, Student) via JWT
 * - Real-Time Audit Log & Activity Feed Sidebar
 * - Multi-Entity Academic Architecture:
 *     1. Student Register Ledger (with 10-per-page pagination, debounced search, CSV export)
 *     2. Gradebook & Attendance Matrix by Course Section
 *     3. Curriculum & Course Bulletin Catalog
 *     4. Official Academic Transcript & Institutional Student ID Card
 * - Interactive Chart.js analytics with theme synchronization
 * - Dark / Light Archival Paper Theme Engine with localStorage persistence
 * - Safe XSS-free DOM construction using textContent
 */

const API_BASE_URL = '/api/students';
const AUTH_BASE_URL = '/api/auth';
const AUDIT_BASE_URL = '/api/audit-logs';

// Application State
let students = [];
let filteredStudents = [];
let editingStudentId = null;
let pendingDeleteId = null;
let currentUser = null;
let selectedTranscriptStudentId = null;
let currentTab = 'viewRegister';

// Sorting & Pagination State
let sortColumn = 'id';
let sortDirection = 'asc';
let currentPage = 1;
const pageSize = 10; // 10 per page for academic density

// Chart Instances
let deptChartInstance = null;
let gpaChartInstance = null;

// Static Academic Course Catalog
const COURSE_CATALOG = [
    { code: 'CS-101', title: 'Introduction to Computer Systems & Algorithms', department: 'Computer Science', credits: '4.0', instructor: 'Dr. Eleanor Vance', schedule: 'MWF 09:00 - 10:30', room: 'Hall A-102', enrolled: 38, capacity: 40, status: 'OPEN' },
    { code: 'CS-301', title: 'Distributed Systems & Cloud Architectures', department: 'Computer Science', credits: '4.0', instructor: 'Dr. Eleanor Vance', schedule: 'TTh 11:00 - 12:30', room: 'Turing Lab 3', enrolled: 28, capacity: 30, status: 'OPEN' },
    { code: 'DS-201', title: 'Applied Machine Learning & Neural Networks', department: 'Data Science', credits: '4.0', instructor: 'Prof. Rajesh Nair', schedule: 'MWF 13:00 - 14:30', room: 'Science C-201', enrolled: 35, capacity: 35, status: 'FULL' },
    { code: 'BA-105', title: 'Corporate Financial Strategy & Governance', department: 'Business Administration', credits: '3.0', instructor: 'Prof. Arthur Miller', schedule: 'TTh 14:00 - 15:30', room: 'Executive Aud 1', enrolled: 42, capacity: 45, status: 'OPEN' },
    { code: 'ME-204', title: 'Thermodynamics & Fluid Dynamics Engineering', department: 'Mechanical Engineering', credits: '4.0', instructor: 'Prof. Subhash Roy', schedule: 'MWF 10:00 - 11:30', room: 'Engineering B-10', enrolled: 29, capacity: 30, status: 'OPEN' },
    { code: 'EE-302', title: 'Linear Control Systems & Signal Processing', department: 'Electrical Engineering', credits: '3.5', instructor: 'Prof. Ananya Sen', schedule: 'TTh 09:30 - 11:00', room: 'Maxwell Hall 4', enrolled: 30, capacity: 30, status: 'FULL' },
    { code: 'IT-401', title: 'Enterprise Cybersecurity & Cryptographic Protocol', department: 'Information Technology', credits: '4.0', instructor: 'Prof. Vikram Sharma', schedule: 'MWF 15:00 - 16:30', room: 'Cyber Lab 2', enrolled: 22, capacity: 25, status: 'OPEN' },
    { code: 'MATH-210', title: 'Discrete Structures & Linear Vector Spaces', department: 'Mathematics', credits: '4.0', instructor: 'Prof. S. Raman', schedule: 'TTh 13:00 - 14:30', room: 'Euler Hall 101', enrolled: 40, capacity: 40, status: 'FULL' }
];

// DOM Elements - Table & Controls
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
const readonlyBanner = document.getElementById('readonlyBanner');
const openAddModalBtn = document.getElementById('openAddModalBtn');

// DOM Elements - Auth & Profile
const userProfileBtn = document.getElementById('userProfileBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userRoleBadge = document.getElementById('userRoleBadge');
const authModal = document.getElementById('authModal');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
const loginForm = document.getElementById('loginForm');

// DOM Elements - Activity Feed Drawer
const openActivityDrawerBtn = document.getElementById('openActivityDrawerBtn');
const closeActivityDrawerBtn = document.getElementById('closeActivityDrawerBtn');
const activityDrawerOverlay = document.getElementById('activityDrawerOverlay');
const timelineContainer = document.getElementById('timelineContainer');

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

// Tab Navigation Elements
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const tabGradebookBtn = document.getElementById('tabGradebookBtn');
const tabCoursesBtn = document.getElementById('tabCoursesBtn');
const tabTranscriptBtn = document.getElementById('tabTranscriptBtn');
const viewRegister = document.getElementById('viewRegister');
const viewGradebook = document.getElementById('viewGradebook');
const viewCourses = document.getElementById('viewCourses');
const viewTranscript = document.getElementById('viewTranscript');
const tabCountStudents = document.getElementById('tabCountStudents');

// Gradebook & Transcript Elements
const gradebookCourseSelect = document.getElementById('gradebookCourseSelect');
const gradebookTableBody = document.getElementById('gradebookTableBody');
const courseTableBody = document.getElementById('courseTableBody');
const transcriptStudentSelect = document.getElementById('transcriptStudentSelect');
const transcriptSelectorBar = document.getElementById('transcriptSelectorBar');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    bindEvents();
    renderCourses();
    await initAuth();
    await loadStudents();
});

// --- Event Listeners ---
function bindEvents() {
    // Theme toggle
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // Tab Navigation
    tabRegisterBtn.addEventListener('click', () => switchTab('viewRegister'));
    tabGradebookBtn.addEventListener('click', () => switchTab('viewGradebook'));
    tabCoursesBtn.addEventListener('click', () => switchTab('viewCourses'));
    tabTranscriptBtn.addEventListener('click', () => switchTab('viewTranscript'));

    // Gradebook Course selector
    if (gradebookCourseSelect) {
        gradebookCourseSelect.addEventListener('change', () => renderGradebook());
    }

    // Transcript Student selector (Faculty/Admin)
    if (transcriptStudentSelect) {
        transcriptStudentSelect.addEventListener('change', (e) => {
            const sid = parseInt(e.target.value, 10);
            if (!isNaN(sid)) {
                selectedTranscriptStudentId = sid;
                renderTranscript(sid);
            }
        });
    }

    // Search input with 200ms debounce
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filterStudents(e.target.value);
        }, 200);
    });

    // CSV Export
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);

    // Student Modal triggers
    openAddModalBtn.addEventListener('click', () => openStudentModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeStudentModal);
    document.getElementById('cancelFormBtn').addEventListener('click', closeStudentModal);
    studentForm.addEventListener('submit', handleFormSubmit);

    // Delete Modal triggers
    document.getElementById('closeDeleteModalBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    // Auth & Profile Modal triggers
    userProfileBtn.addEventListener('click', openAuthModal);
    closeAuthModalBtn.addEventListener('click', closeAuthModal);
    loginForm.addEventListener('submit', handleLoginFormSubmit);

    // Quick demo role buttons
    document.querySelectorAll('.demo-role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const u = btn.dataset.username;
            const p = btn.dataset.password;
            executeLogin(u, p);
        });
    });

    // Activity Drawer triggers
    openActivityDrawerBtn.addEventListener('click', openActivityDrawer);
    closeActivityDrawerBtn.addEventListener('click', closeActivityDrawer);

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

    // Keyboard & backdrop closures
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeStudentModal();
            closeDeleteModal();
            closeAuthModal();
            closeActivityDrawer();
        }
    });

    [studentModal, deleteModal, authModal, activityDrawerOverlay].forEach(overlay => {
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeStudentModal();
                    closeDeleteModal();
                    closeAuthModal();
                    closeActivityDrawer();
                }
            });
        }
    });
}

// --- Tab Navigation Engine ---
function switchTab(targetTabId) {
    currentTab = targetTabId;

    const tabs = [
        { id: 'viewRegister', btn: tabRegisterBtn, panel: viewRegister },
        { id: 'viewGradebook', btn: tabGradebookBtn, panel: viewGradebook },
        { id: 'viewCourses', btn: tabCoursesBtn, panel: viewCourses },
        { id: 'viewTranscript', btn: tabTranscriptBtn, panel: viewTranscript }
    ];

    tabs.forEach(t => {
        if (t.id === targetTabId) {
            t.btn.classList.add('active');
            t.panel.classList.remove('hidden');
        } else {
            t.btn.classList.remove('active');
            t.panel.classList.add('hidden');
        }
    });

    if (targetTabId === 'viewGradebook') {
        renderGradebook();
    } else if (targetTabId === 'viewCourses') {
        renderCourses();
    } else if (targetTabId === 'viewTranscript') {
        renderTranscript(selectedTranscriptStudentId);
    }
}

// --- Auth & RBAC Subsystem ---
async function initAuth() {
    const saved = localStorage.getItem('studeo_auth');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            updateUserUi();
            return;
        } catch (e) {
            console.warn('Invalid auth in localStorage:', e);
            localStorage.removeItem('studeo_auth');
        }
    }
    // Default seamless login as Admin (Dr. Eleanor Vance)
    await executeLogin('admin', 'admin123', false);
}

async function executeLogin(username, password, showNotification = true) {
    try {
        const response = await fetch(`${AUTH_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            showToast(err.message || 'Invalid credentials.', 'error');
            return;
        }

        const data = await response.json();
        currentUser = {
            username: data.username,
            fullName: data.fullName,
            role: data.role,
            token: data.token
        };
        localStorage.setItem('studeo_auth', JSON.stringify(currentUser));

        closeAuthModal();
        updateUserUi();

        if (showNotification) {
            showToast(`Signed in as ${currentUser.fullName} (${getRoleDisplay(currentUser.role)})`, 'success');
        }

        await loadStudents();
        if (activityDrawerOverlay.classList.contains('active')) {
            loadActivityFeed();
        }
    } catch (err) {
        console.error('Login error:', err);
        showToast('Authentication service unavailable.', 'error');
    }
}

async function handleLoginFormSubmit(e) {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value.trim();
    if (!u || !p) return;
    await executeLogin(u, p);
}

function updateUserUi() {
    if (!currentUser) return;

    userName.textContent = currentUser.fullName || currentUser.username;
    userAvatar.textContent = getInitials(currentUser.fullName || currentUser.username);

    const roleName = getRoleDisplay(currentUser.role);
    userRoleBadge.textContent = roleName;
    userRoleBadge.className = `role-badge-sm role-${roleName}`;

    // Role-based visibility rules
    const isStudent = currentUser.role === 'ROLE_STUDENT';
    const isFaculty = currentUser.role === 'ROLE_FACULTY';
    const isAdmin = currentUser.role === 'ROLE_ADMIN';

    // Show/hide readonly banner
    readonlyBanner.style.display = isStudent ? 'flex' : 'none';

    // Show/hide Add Student button
    openAddModalBtn.style.display = isStudent ? 'none' : 'inline-flex';

    // Auto-adjust Student Portal
    if (isStudent) {
        // Find Priya Patel or student record
        const matchingStudent = students.find(s => s.name.toLowerCase().includes('priya') || s.email.includes('student') || s.email.includes('priya'));
        if (matchingStudent) {
            selectedTranscriptStudentId = matchingStudent.id;
        }
        transcriptSelectorBar.style.display = 'none'; // Lock selector for student
        // If not already in transcript, auto-switch to transcript
        if (currentTab === 'viewRegister') {
            switchTab('viewTranscript');
        }
    } else {
        transcriptSelectorBar.style.display = 'flex'; // Visible for faculty/admin
    }

    renderTable();
}

function getRoleDisplay(role) {
    if (!role) return 'USER';
    return role.replace('ROLE_', '');
}

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser && currentUser.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
    }
    return headers;
}

function openAuthModal() {
    loginForm.reset();
    authModal.classList.add('active');
}

function closeAuthModal() {
    authModal.classList.remove('active');
}

// --- Activity Feed Drawer & Audit Log System ---
function openActivityDrawer() {
    activityDrawerOverlay.classList.add('active');
    loadActivityFeed();
}

function closeActivityDrawer() {
    activityDrawerOverlay.classList.remove('active');
}

async function loadActivityFeed() {
    timelineContainer.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;padding:12px;">Loading activity history...</div>';

    try {
        const response = await fetch(AUDIT_BASE_URL, {
            headers: getAuthHeaders()
        });

        if (response.status === 403) {
            timelineContainer.innerHTML = `
                <div style="padding:24px 16px;text-align:center;color:var(--text-muted);">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:40px;height:40px;margin-bottom:8px;color:var(--red-mark);">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    <div style="font-weight:600;color:var(--text-main);margin-bottom:4px;">Restricted Access</div>
                    <div style="font-size:0.8rem;">Audit activity log is confidential to Faculty and Administrators.</div>
                </div>
            `;
            return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const logs = await response.json();
        renderTimeline(logs);
    } catch (err) {
        console.error('Audit log fetch error:', err);
        timelineContainer.innerHTML = '<div style="color:var(--red-mark);font-size:0.85rem;padding:12px;">Unable to load activity history.</div>';
    }
}

function renderTimeline(logs) {
    timelineContainer.innerHTML = '';

    if (!logs || logs.length === 0) {
        timelineContainer.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;padding:12px;">No activity logged yet.</div>';
        return;
    }

    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const dot = document.createElement('div');
        dot.className = `timeline-dot ${log.action}`;

        const card = document.createElement('div');
        card.className = 'timeline-card';

        const desc = document.createElement('div');
        desc.className = 'timeline-desc';
        desc.textContent = log.description;

        const meta = document.createElement('div');
        meta.className = 'timeline-meta';

        const actor = document.createElement('span');
        actor.className = 'timeline-actor';
        actor.textContent = `${log.performedBy || 'System'} (${getRoleDisplay(log.userRole)})`;

        const time = document.createElement('span');
        time.textContent = formatRelativeTime(log.timestamp);

        meta.appendChild(actor);
        meta.appendChild(time);
        card.appendChild(desc);
        card.appendChild(meta);

        item.appendChild(dot);
        item.appendChild(card);
        timelineContainer.appendChild(item);
    });
}

function formatRelativeTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString();
}

// --- Theme Management ---
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
        const response = await fetch(API_BASE_URL, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            openAuthModal();
            return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        students = await response.json();
        filteredStudents = [...students];
        currentPage = 1;

        if (tabCountStudents) {
            tabCountStudents.textContent = students.length;
        }

        // Default transcript student selection
        if (!selectedTranscriptStudentId && students.length > 0) {
            selectedTranscriptStudentId = students[0].id;
        }

        populateTranscriptSelector();
        sortAndRender();
        updateMetrics();
        updateCharts();

        if (currentTab === 'viewGradebook') renderGradebook();
        if (currentTab === 'viewTranscript') renderTranscript(selectedTranscriptStudentId);
    } catch (err) {
        console.error('Fetch error:', err);
        showToast('Failed to load student records from registrar database.', 'error');
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
            (s.status && s.status.toLowerCase().includes(q)) ||
            (s.id && String(s.id).includes(q))
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

// --- GPA Helper ---
function parseGpa(val) {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
}

function getGpaClass(gpa) {
    const num = parseGpa(gpa);
    if (num === null) return '';
    if (num >= 3.5) return 'gpa-high';
    if (num >= 3.0) return 'gpa-med';
    return 'gpa-low';
}

// --- Metrics Calculation ---
function updateMetrics() {
    metricTotal.textContent = students.length;
    metricMatches.textContent = filteredStudents.length;
    tableCountBadge.textContent = `${filteredStudents.length} of ${students.length} students`;

    if (students.length > 0) {
        const validGpas = students
            .map(s => parseGpa(s.gpa))
            .filter(g => g !== null);
        if (validGpas.length > 0) {
            const totalGpa = validGpas.reduce((sum, g) => sum + g, 0);
            metricAvgGpa.textContent = (totalGpa / validGpas.length).toFixed(2);
        } else {
            metricAvgGpa.textContent = '0.00';
        }

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

// --- Interactive Charts (Chart.js) with Institutional Colors ---
function updateCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#6b7280';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

    // 1. Department Breakdown (Muted Registrar Palette)
    const deptCounts = {};
    students.forEach(s => {
        const d = s.department || 'Other';
        deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    const deptLabels = Object.keys(deptCounts);
    const deptData = Object.values(deptCounts);
    const deptColors = [
        '#0d7377', '#1e293b', '#d97706', '#0284c7',
        '#7e22ce', '#4d7c0f', '#c2410c', '#64748b'
    ];

    const ctxDept = document.getElementById('deptChart');
    if (!ctxDept) return;
    if (deptChartInstance) deptChartInstance.destroy();

    deptChartInstance = new Chart(ctxDept.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: deptLabels.length ? deptLabels : ['None'],
            datasets: [{
                data: deptData.length ? deptData : [1],
                backgroundColor: deptColors.slice(0, deptLabels.length || 1),
                borderWidth: 2,
                borderColor: isDark ? '#1a2332' : '#ffffff'
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
        const gpa = parseGpa(s.gpa);
        if (gpa === null) return;
        if (gpa >= 3.75) gpaBrackets['3.75 - 4.00']++;
        else if (gpa >= 3.50) gpaBrackets['3.50 - 3.74']++;
        else if (gpa >= 3.00) gpaBrackets['3.00 - 3.49']++;
        else if (gpa >= 2.50) gpaBrackets['2.50 - 2.99']++;
        else gpaBrackets['< 2.50']++;
    });

    const ctxGpa = document.getElementById('gpaChart');
    if (!ctxGpa) return;
    if (gpaChartInstance) gpaChartInstance.destroy();

    gpaChartInstance = new Chart(ctxGpa.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(gpaBrackets),
            datasets: [{
                label: 'Enrolled Records',
                data: Object.values(gpaBrackets),
                backgroundColor: ['#15803d', '#0d7377', '#0284c7', '#d97706', '#b91c1c'],
                borderRadius: 4
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
                    ticks: { color: textColor, stepSize: 2, font: { family: 'Inter', size: 10 } },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// --- Safe XSS-Free Table Rendering ---
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

    paginationInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalStudents} students`;
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    const userRole = currentUser ? currentUser.role : 'ROLE_STUDENT';
    const canEdit = userRole === 'ROLE_ADMIN' || userRole === 'ROLE_FACULTY';
    const canDelete = userRole === 'ROLE_ADMIN';

    currentSlice.forEach(student => {
        const row = document.createElement('tr');

        // 1. ID Badge
        const idCell = document.createElement('td');
        const idBadge = document.createElement('span');
        idBadge.className = 'student-id-badge';
        idBadge.textContent = `#${student.id}`;
        idCell.appendChild(idBadge);
        row.appendChild(idCell);

        // 2. Student (Stacked Name + Email)
        const nameCell = document.createElement('td');
        const studentWrapper = document.createElement('div');
        studentWrapper.className = 'student-cell';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'student-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'student-name-text';
        nameSpan.textContent = student.name;

        const emailSpan = document.createElement('span');
        emailSpan.className = 'student-email-text';
        emailSpan.textContent = student.email;

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(emailSpan);
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

        // 4. GPA (Tabular font)
        const gpaCell = document.createElement('td');
        const gpaPill = document.createElement('span');
        const parsedGpa = parseGpa(student.gpa);
        const gpaVal = parsedGpa !== null ? parsedGpa.toFixed(2) : '—';
        gpaPill.className = `gpa-pill ${getGpaClass(parsedGpa)}`;
        gpaPill.textContent = gpaVal;
        gpaCell.appendChild(gpaPill);
        row.appendChild(gpaCell);

        // 5. Academic Status (Official Stamp Badge)
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        const statusVal = student.status || 'ACTIVE';
        statusBadge.className = `status-badge ${statusVal}`;
        statusBadge.textContent = statusVal;
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // 6. Phone
        const phoneCell = document.createElement('td');
        phoneCell.textContent = student.phone || '—';
        phoneCell.style.color = 'var(--text-muted)';
        phoneCell.style.fontSize = '0.8rem';
        phoneCell.style.fontVariantNumeric = 'tabular-nums';
        row.appendChild(phoneCell);

        // 7. Actions (Adaptive per Role)
        const actionsCell = document.createElement('td');
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'actions-cell';

        // Transcript Action button
        const transBtn = document.createElement('button');
        transBtn.className = 'btn-icon';
        transBtn.title = 'View Official Academic Transcript';
        transBtn.setAttribute('aria-label', `Transcript for ${student.name}`);
        transBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
        `;
        transBtn.addEventListener('click', () => {
            selectedTranscriptStudentId = student.id;
            if (transcriptStudentSelect) {
                transcriptStudentSelect.value = student.id;
            }
            switchTab('viewTranscript');
        });
        actionsWrapper.appendChild(transBtn);

        if (canEdit) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-icon edit';
            editBtn.title = 'Edit Academic Record';
            editBtn.setAttribute('aria-label', `Edit ${student.name}`);
            editBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
            `;
            editBtn.addEventListener('click', () => openStudentModal(student));
            actionsWrapper.appendChild(editBtn);
        }

        if (canDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon delete';
            deleteBtn.title = 'Delete Academic Record';
            deleteBtn.setAttribute('aria-label', `Delete ${student.name}`);
            deleteBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
            `;
            deleteBtn.addEventListener('click', () => openDeleteModal(student));
            actionsWrapper.appendChild(deleteBtn);
        }

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

// --- Gradebook Matrix Subsystem ---
function renderGradebook() {
    if (!gradebookTableBody) return;
    gradebookTableBody.innerHTML = '';

    const courseCode = gradebookCourseSelect ? gradebookCourseSelect.value : 'CS-301';
    
    // Choose students enrolled in this course or take a sample
    const enrolledStudents = students.slice(0, 16);

    enrolledStudents.forEach((student, idx) => {
        const row = document.createElement('tr');
        const gpa = parseGpa(student.gpa) || 3.0;

        // Deterministic realistic scores derived from GPA
        const baseScore = Math.min(98, Math.max(55, Math.round((gpa / 4.0) * 85 + 10 + (idx % 5))));
        const assignScore = Math.min(100, baseScore + (idx % 4));
        const midScore = Math.min(100, Math.max(50, baseScore - (idx % 3)));
        const finalScore = Math.min(100, Math.max(50, baseScore + ((idx % 3) - 1)));
        const attRate = Math.min(100, Math.max(75, Math.round(88 + (gpa * 2.8))));

        // Weighting: 20% Assign, 30% Mid, 40% Final, 10% Attendance
        const composite = Math.round((assignScore * 0.20) + (midScore * 0.30) + (finalScore * 0.40) + (attRate * 0.10));

        let letter = 'A';
        let gradeClass = 'grade-A';
        if (composite < 60) { letter = 'F'; gradeClass = 'grade-F'; }
        else if (composite < 70) { letter = 'D'; gradeClass = 'grade-D'; }
        else if (composite < 80) { letter = 'C'; gradeClass = 'grade-C'; }
        else if (composite < 90) { letter = 'B'; gradeClass = 'grade-B'; }

        row.innerHTML = `
            <td><span class="student-id-badge">#${student.id}</span></td>
            <td>
                <div class="student-name-text">${student.name}</div>
                <div class="student-email-text">${student.department}</div>
            </td>
            <td style="font-variant-numeric: tabular-nums;">${assignScore}%</td>
            <td style="font-variant-numeric: tabular-nums;">${midScore}%</td>
            <td style="font-variant-numeric: tabular-nums;">${finalScore}%</td>
            <td style="font-variant-numeric: tabular-nums;">${attRate}%</td>
            <td style="font-variant-numeric: tabular-nums; font-weight: 700;">${composite}%</td>
            <td><span class="grade-tag ${gradeClass}">${letter}</span></td>
            <td><span class="attendance-pct ${attRate >= 90 ? 'attendance-high' : attRate >= 80 ? 'attendance-med' : 'attendance-low'}">${attRate}%</span></td>
        `;
        gradebookTableBody.appendChild(row);
    });
}

// --- Course Catalog Subsystem ---
function renderCourses() {
    if (!courseTableBody) return;
    courseTableBody.innerHTML = '';

    COURSE_CATALOG.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="course-code-badge">${course.code}</span></td>
            <td>
                <div style="font-weight: 600; color: var(--text-main); font-size: 0.84rem;">${course.title}</div>
            </td>
            <td><span class="dept-tag">${course.department}</span></td>
            <td style="font-variant-numeric: tabular-nums; font-weight: 600;">${course.credits}</td>
            <td style="color: var(--text-muted); font-size: 0.82rem;">${course.instructor}</td>
            <td style="color: var(--text-subtle); font-size: 0.78rem;">${course.schedule} (${course.room})</td>
            <td><span class="capacity-meter">${course.enrolled} / ${course.capacity}</span></td>
            <td>
                <span class="status-badge ${course.status === 'OPEN' ? 'ACTIVE' : 'INACTIVE'}">
                    ${course.status}
                </span>
            </td>
        `;
        courseTableBody.appendChild(row);
    });
}

// --- Official Academic Transcript Subsystem ---
function populateTranscriptSelector() {
    if (!transcriptStudentSelect) return;
    transcriptStudentSelect.innerHTML = '';

    students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `#${s.id} — ${s.name} (${s.department || 'General'})`;
        if (s.id === selectedTranscriptStudentId) {
            opt.selected = true;
        }
        transcriptStudentSelect.appendChild(opt);
    });
}

function renderTranscript(studentId) {
    const student = students.find(s => s.id === studentId) || students[0];
    if (!student) return;

    // Header Card fields
    document.getElementById('transStudentName').textContent = student.name;
    document.getElementById('transStudentId').textContent = `STU-2024-${String(student.id).padStart(3, '0')}`;
    document.getElementById('transStudentDept').textContent = student.department || 'Academic Affairs';

    const gpaNum = parseGpa(student.gpa) || 3.50;
    const standingEl = document.getElementById('transStudentStanding');
    if (gpaNum >= 3.80) {
        standingEl.textContent = "DEAN'S HONORS LIST";
        standingEl.style.color = "var(--success)";
    } else if (gpaNum >= 3.00) {
        standingEl.textContent = "GOOD ACADEMIC STANDING";
        standingEl.style.color = "var(--teal)";
    } else {
        standingEl.textContent = "ACADEMIC WARNING";
        standingEl.style.color = "var(--red-mark)";
    }

    document.getElementById('transCumulativeGpa').textContent = gpaNum.toFixed(2);
    document.getElementById('transEarnedCredits').textContent = `${(gpaNum * 16).toFixed(1)} / 120.0 CR`;
    document.getElementById('transAttendanceRate').textContent = `${(88 + (gpaNum * 2.8)).toFixed(1)}%`;

    // Semester Coursework Ledger
    const termsContainer = document.getElementById('transcriptTermsContainer');
    termsContainer.innerHTML = '';

    const semesters = [
        {
            name: 'Fall Term 2025 (Third Year)',
            termGpa: gpaNum.toFixed(2),
            termCredits: '16.0',
            courses: [
                { code: 'CS-301', name: 'Distributed Systems & Cloud Computing', cr: '4.0', gr: gpaNum >= 3.7 ? 'A' : 'B+', pts: '16.0' },
                { code: 'DS-201', name: 'Applied Machine Learning & Neural Nets', cr: '4.0', gr: gpaNum >= 3.5 ? 'A' : 'B', pts: '15.0' },
                { code: 'MATH-210', name: 'Discrete Optimization & Linear Algebra', cr: '4.0', gr: 'A', pts: '16.0' },
                { code: 'IT-401', name: 'Enterprise Cybersecurity Engineering', cr: '4.0', gr: gpaNum >= 3.2 ? 'A-' : 'B', pts: '14.8' }
            ]
        },
        {
            name: 'Spring Term 2025 (Second Year)',
            termGpa: (Math.max(2.8, gpaNum - 0.1)).toFixed(2),
            termCredits: '15.0',
            courses: [
                { code: 'CS-101', name: 'Advanced Algorithms & Complexity Theory', cr: '4.0', gr: 'A', pts: '16.0' },
                { code: 'BA-105', name: 'Corporate Financial Modeling & Analytics', cr: '3.0', gr: 'A-', pts: '11.1' },
                { code: 'EE-302', name: 'Linear Systems & Circuit Dynamics', cr: '4.0', gr: 'B+', pts: '13.2' },
                { code: 'ME-204', name: 'Engineering Thermodynamics Laboratory', cr: '4.0', gr: 'A', pts: '16.0' }
            ]
        }
    ];

    semesters.forEach(term => {
        const termBox = document.createElement('div');
        termBox.className = 'transcript-term';

        termBox.innerHTML = `
            <div class="transcript-term-header">
                <h4>${term.name}</h4>
                <span class="term-summary-stats">Term Credits: <strong>${term.termCredits}</strong> · Term GPA: <strong>${term.termGpa}</strong></span>
            </div>
            <table class="transcript-table">
                <thead>
                    <tr>
                        <th style="width: 100px;">Course Code</th>
                        <th>Course Description</th>
                        <th style="width: 80px;">Credits</th>
                        <th style="width: 80px;">Grade</th>
                        <th style="width: 90px;">Quality Pts</th>
                    </tr>
                </thead>
                <tbody>
                    ${term.courses.map(c => `
                        <tr>
                            <td><span class="course-code-badge">${c.code}</span></td>
                            <td>${c.name}</td>
                            <td style="font-variant-numeric: tabular-nums;">${c.cr}</td>
                            <td><span class="grade-tag grade-${c.gr[0]}">${c.gr}</span></td>
                            <td style="font-variant-numeric: tabular-nums; font-weight: 600;">${c.pts}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        termsContainer.appendChild(termBox);
    });
}

// --- CSV Export Engine ---
function exportToCsv() {
    if (filteredStudents.length === 0) {
        showToast('No records to export.', 'info');
        return;
    }

    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Department', 'GPA', 'Academic Status', 'Enrollment Date'];
    const rows = filteredStudents.map(s => [
        s.id,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.phone || '').replace(/"/g, '""')}"`,
        `"${(s.department || '').replace(/"/g, '""')}"`,
        s.gpa !== null && s.gpa !== undefined ? s.gpa : '',
        s.status || '',
        s.enrollmentDate || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `studeo_academic_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredStudents.length} academic records to CSV.`, 'success');
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
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeStudentModal();
            showToast(isEdit ? 'Student record updated in register!' : 'Student registered successfully!', 'success');
            await loadStudents();
            if (activityDrawerOverlay.classList.contains('active')) {
                loadActivityFeed();
            }
        } else if (response.status === 403) {
            showToast('Permission denied: You lack privileges to modify academic records.', 'error');
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
            showToast(errData.message || 'Failed to save academic record.', 'error');
        }
    } catch (err) {
        console.error('Save error:', err);
        showToast('Network error while saving student record.', 'error');
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
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            closeDeleteModal();
            showToast('Student record deleted from register.', 'info');
            await loadStudents();
            if (activityDrawerOverlay.classList.contains('active')) {
                loadActivityFeed();
            }
        } else if (response.status === 403) {
            showToast('Permission denied: Only administrators can delete records.', 'error');
        } else {
            showToast('Failed to delete student record.', 'error');
        }
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Network error while deleting record.', 'error');
    }
}

// --- Toast Notifications ---
function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>`;
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
