// Firebase-based Dashboard with Modals
let allStudents = [];
let allPayments = [];

async function initializeApp() {
    let attempts = 0;
    while (!window.db && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.db) {
        console.error('Firebase failed to initialize!');
        return;
    }
    
    console.log('Firebase is ready! Starting app...');
    setupModals();
    setupFormListeners();
    setupSearchListener();
    setupFirebaseListeners();
    loadDashboard();
}

function setupModals() {
    const studentBtn = document.getElementById('add-student-modal-btn');
    const paymentBtn = document.getElementById('add-payment-modal-btn');
    const studentModal = document.getElementById('student-modal');
    const paymentModal = document.getElementById('payment-modal');
    const closeButtons = document.querySelectorAll('.close-btn');

    studentBtn.addEventListener('click', () => {
        studentModal.classList.add('show');
    });

    paymentBtn.addEventListener('click', () => {
        paymentModal.classList.add('show');
        loadStudentSelectForModal();
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.getAttribute('data-modal');
            document.getElementById(modalId).classList.remove('show');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function setupFormListeners() {
    document.getElementById('student-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const student = {
            name: document.getElementById('student-name').value,
            room: document.getElementById('room-no').value,
            phone: document.getElementById('phone-no').value,
            lunchType: document.getElementById('lunch-type').value
        };
        await window.addDoc(window.collection(window.db, 'students'), student);
        this.reset();
        alert('Student added!');
        closeModal('student-modal');
        loadDashboard();
    });

    document.getElementById('payment-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const payment = {
            studentId: document.getElementById('student-select').value,
            totalFees: parseFloat(document.getElementById('total-fees').value) || 0,
            paidAmount: parseFloat(document.getElementById('paid-amount').value) || 0,
            paymentMode: document.getElementById('payment-mode').value,
            date: document.getElementById('payment-date').value,
            balance: parseFloat(document.getElementById('balance').value) || 0
        };
        await window.addDoc(window.collection(window.db, 'payments'), payment);
        this.reset();
        alert('Payment added!');
        closeModal('payment-modal');
        loadDashboard();
    });

    document.getElementById('total-fees').addEventListener('input', calculateBalance);
    document.getElementById('paid-amount').addEventListener('input', calculateBalance);
}

function calculateBalance() {
    const total = parseFloat(document.getElementById('total-fees').value) || 0;
    const paid = parseFloat(document.getElementById('paid-amount').value) || 0;
    document.getElementById('balance').value = (total - paid).toFixed(2);
}

function loadStudentSelectForModal() {
    const select = document.getElementById('student-select');
    select.innerHTML = '<option value="">Select Student</option>';
    allStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        select.appendChild(option);
    });
}

function setupSearchListener() {
    const searchBox = document.getElementById('search-box');
    searchBox.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        displayStudents(query);
    });
}

async function loadDashboard() {
    try {
        console.log('loadDashboard: refreshing...');
        const studentsSnap = await window.getDocs(window.collection(window.db, 'students'));
        const paymentsSnap = await window.getDocs(window.collection(window.db, 'payments'));

        allStudents = [];
        allPayments = [];

        studentsSnap.forEach(docSnap => {
            allStudents.push({ id: docSnap.id, ...docSnap.data() });
        });

        paymentsSnap.forEach(docSnap => {
            allPayments.push({ id: docSnap.id, ...docSnap.data() });
        });

        document.getElementById('total-students').textContent = allStudents.length;
        document.getElementById('total-payments').textContent = allPayments.length;

        let totalPending = 0;
        allPayments.forEach(p => {
            totalPending += (p.balance || 0);
        });
        document.getElementById('pending-balances').textContent = totalPending.toFixed(2);

        displayStudents('');
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function displayStudents(searchQuery = '') {
    const tbody = document.getElementById('students-tbody');
    tbody.innerHTML = '';

    const filtered = allStudents.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No students found</td></tr>';
        return;
    }

    filtered.forEach(student => {
        const studentPayments = allPayments.filter(p => p.studentId === student.id);
        const totalBalance = studentPayments.reduce((sum, p) => sum + (p.balance || 0), 0);
        const totalPaid = studentPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
        
        const lastPayment = studentPayments.length > 0 
            ? new Date(studentPayments[studentPayments.length - 1].date).toLocaleDateString()
            : 'No payment';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.room}</td>
            <td>${student.phone}</td>
            <td>${student.lunchType}</td>
            <td>₹${totalPaid.toFixed(2)}</td>
            <td>₹${totalBalance.toFixed(2)}</td>
            <td>${lastPayment}</td>
            <td><button class="delete-btn" onclick="deleteStudent('${student.id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student and all their payments?')) return;
    
    try {
        await window.deleteDoc(window.doc(window.db, 'students', studentId));
        const paymentsToDelete = allPayments.filter(p => p.studentId === studentId);
        for (let payment of paymentsToDelete) {
            await window.deleteDoc(window.doc(window.db, 'payments', payment.id));
        }
        loadDashboard();
    } catch (error) {
        console.error('Error deleting student:', error);
    }
}

function setupFirebaseListeners() {
    console.log('Setting up real-time listeners...');
    window.onSnapshot(window.collection(window.db, 'students'), () => {
        console.log('Students changed');
        loadDashboard();
    });

    window.onSnapshot(window.collection(window.db, 'payments'), () => {
        console.log('Payments changed');
        loadDashboard();
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);
