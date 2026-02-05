// Firestore-based implementation (uses globals exported from index.html)

// Wait for Firestore to be ready
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
    setupNavigationListeners();
    setupFormListeners();
    setupFirebaseListeners();
    loadDashboard();
}

// Navigation setup
function setupNavigationListeners() {
    document.querySelectorAll('nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
            document.getElementById(btn.id.replace('-btn', '')).classList.add('active');
            if (btn.id === 'student-list-btn') loadStudents();
            if (btn.id === 'pending-fees-btn') loadPendingFees();
            if (btn.id === 'payment-entry-btn') loadStudentSelect();
            if (btn.id === 'payment-history-btn') loadHistoryStudentSelect();
        });
    });
}

// Form listeners setup
function setupFormListeners() {
    // Add Student
    document.getElementById('student-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const student = {
            name: document.getElementById('student-name').value,
            room: document.getElementById('room-no').value,
            lunchType: document.getElementById('lunch-type').value
        };
        await window.addDoc(window.collection(window.db, 'students'), student);
        this.reset();
        alert('Student added!');
        console.log('Student added, dashboard will refresh via listener');
    });

    // Add Payment
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
        console.log('Payment added, dashboard will refresh via listener');
    });

    // Auto calculate balance
    document.getElementById('total-fees').addEventListener('input', calculateBalance);
    document.getElementById('paid-amount').addEventListener('input', calculateBalance);
}

function calculateBalance() {
    const total = parseFloat(document.getElementById('total-fees').value) || 0;
    const paid = parseFloat(document.getElementById('paid-amount').value) || 0;
    document.getElementById('balance').value = (total - paid).toFixed(2);
}

// Load Students
async function loadStudents() {
    const ul = document.getElementById('student-ul');
    ul.innerHTML = '';
    const snapshot = await window.getDocs(window.collection(window.db, 'students'));
    snapshot.forEach(docSnap => {
        const student = docSnap.data();
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${student.name} - Room: ${student.room} - Lunch: ${student.lunchType}`;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteStudent(docSnap.id));
        li.appendChild(nameSpan);
        li.appendChild(deleteBtn);
        ul.appendChild(li);
    });
}

// Load Student Select
async function loadStudentSelect() {
    const select = document.getElementById('student-select');
    select.innerHTML = '';
    const snapshot = await window.getDocs(window.collection(window.db, 'students'));
    snapshot.forEach(docSnap => {
        const student = docSnap.data();
        const option = document.createElement('option');
        option.value = docSnap.id;
        option.textContent = student.name;
        select.appendChild(option);
    });
}

// Load History Student Select
async function loadHistoryStudentSelect() {
    const select = document.getElementById('history-student-select');
    select.innerHTML = '<option value="">Select a student</option>';
    const snapshot = await window.getDocs(window.collection(window.db, 'students'));
    snapshot.forEach(docSnap => {
        const student = docSnap.data();
        const option = document.createElement('option');
        option.value = docSnap.id;
        option.textContent = student.name;
        select.appendChild(option);
    });
    select.addEventListener('change', loadPaymentHistory);
}

// Load Payment History
async function loadPaymentHistory() {
    const studentId = document.getElementById('history-student-select').value;
    if (!studentId) {
        document.getElementById('history-ul').innerHTML = '';
        return;
    }
    const ul = document.getElementById('history-ul');
    ul.innerHTML = '';
    const q = window.query(window.collection(window.db, 'payments'), window.where('studentId', '==', studentId));
    const snapshot = await window.getDocs(q);
    snapshot.forEach(docSnap => {
        const payment = docSnap.data();
        const li = document.createElement('li');
        li.textContent = `Date: ${payment.date} | Total Fees: ₹${payment.totalFees.toFixed(2)} | Paid: ₹${payment.paidAmount.toFixed(2)} | Balance: ₹${payment.balance.toFixed(2)} | Mode: ${payment.paymentMode}`;
        ul.appendChild(li);
    });
}

// Load Pending Fees
async function loadPendingFees() {
    const ul = document.getElementById('pending-ul');
    ul.innerHTML = '';
    const studentsSnap = await window.getDocs(window.collection(window.db, 'students'));
    const paymentsSnap = await window.getDocs(window.collection(window.db, 'payments'));
    const payments = {};
    paymentsSnap.forEach(p => {
        const data = p.data();
        if (!payments[data.studentId]) payments[data.studentId] = [];
        payments[data.studentId].push(data);
    });
    studentsSnap.forEach(s => {
        const student = s.data();
        const studentPayments = payments[s.id] || [];
        const totalBalance = studentPayments.reduce((sum, p) => sum + p.balance, 0);
        if (totalBalance > 0) {
            const li = document.createElement('li');
            li.textContent = `${student.name} - Pending: ₹${totalBalance.toFixed(2)}`;
            ul.appendChild(li);
        }
    });
}

// Delete Student and their payments
async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student and all their payments?')) return;
    await window.deleteDoc(window.doc(window.db, 'students', studentId));
    const q = window.query(window.collection(window.db, 'payments'), window.where('studentId', '==', studentId));
    const snapshot = await window.getDocs(q);
    const deletes = [];
    snapshot.forEach(snap => deletes.push(window.deleteDoc(snap.ref)));
    await Promise.all(deletes);
    loadStudents();
    loadDashboard();
    loadPendingFees();
}

// Load Dashboard
async function loadDashboard() {
    try {
        console.log('loadDashboard: refreshing...');
        const studentsSnap = await window.getDocs(window.collection(window.db, 'students'));
        const paymentsSnap = await window.getDocs(window.collection(window.db, 'payments'));
        console.log('Dashboard: students =', studentsSnap.size, 'payments =', paymentsSnap.size);
        document.getElementById('total-students').textContent = studentsSnap.size;
        document.getElementById('total-payments').textContent = paymentsSnap.size;
        let totalPending = 0;
        paymentsSnap.forEach(p => {
            const balance = p.data().balance || 0;
            totalPending += balance;
        });
        console.log('Dashboard: pending balance =', totalPending.toFixed(2));
        document.getElementById('pending-balances').textContent = totalPending.toFixed(2);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Setup real-time listeners
function setupFirebaseListeners() {
    console.log('Setting up real-time listeners...');
    window.onSnapshot(window.collection(window.db, 'students'), (snapshot) => {
        console.log('Students changed:', snapshot.docs.length, 'docs');
        loadDashboard();
        if (document.getElementById('student-list').classList.contains('active')) loadStudents();
        if (document.getElementById('payment-entry').classList.contains('active')) loadStudentSelect();
        if (document.getElementById('payment-history').classList.contains('active')) loadHistoryStudentSelect();
    });

    window.onSnapshot(window.collection(window.db, 'payments'), (snapshot) => {
        console.log('Payments changed:', snapshot.docs.length, 'docs');
        loadDashboard();
        if (document.getElementById('pending-fees').classList.contains('active')) loadPendingFees();
    });
}

// Start app when page loads
document.addEventListener('DOMContentLoaded', initializeApp);