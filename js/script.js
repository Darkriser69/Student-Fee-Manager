// IndexedDB setup
let db;
const request = indexedDB.open('StudentFeeDB', 1);

request.onerror = function(event) {
    console.error('Database error:', event.target.error);
};

request.onsuccess = function(event) {
    db = event.target.result;
    loadDashboard();
    loadStudents();
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('students')) {
        db.createObjectStore('students', { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('payments')) {
        db.createObjectStore('payments', { keyPath: 'id', autoIncrement: true });
    }
};

// Navigation
document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById(btn.id.replace('-btn', '')).classList.add('active');
        if (btn.id === 'student-list-btn') loadStudents();
        if (btn.id === 'pending-fees-btn') loadPendingFees();
        if (btn.id === 'payment-entry-btn') loadStudentSelect();
    });
});

// Add Student
document.getElementById('student-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const student = {
        name: document.getElementById('student-name').value,
        room: document.getElementById('room-no').value,
        lunchType: document.getElementById('lunch-type').value
    };
    addStudent(student);
    this.reset();
    alert('Student added!');
});

// Add Payment
document.getElementById('payment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const payment = {
        studentId: parseInt(document.getElementById('student-select').value),
        totalFees: parseFloat(document.getElementById('total-fees').value),
        paidAmount: parseFloat(document.getElementById('paid-amount').value),
        paymentMode: document.getElementById('payment-mode').value,
        date: document.getElementById('payment-date').value,
        balance: parseFloat(document.getElementById('balance').value)
    };
    addPayment(payment);
    this.reset();
    alert('Payment added!');
});

// Auto calculate balance
document.getElementById('total-fees').addEventListener('input', calculateBalance);
document.getElementById('paid-amount').addEventListener('input', calculateBalance);

function calculateBalance() {
    const total = parseFloat(document.getElementById('total-fees').value) || 0;
    const paid = parseFloat(document.getElementById('paid-amount').value) || 0;
    document.getElementById('balance').value = (total - paid).toFixed(2);
}

// Functions
function addStudent(student) {
    const transaction = db.transaction(['students'], 'readwrite');
    const store = transaction.objectStore('students');
    store.add(student);
    transaction.oncomplete = loadDashboard;
}

function addPayment(payment) {
    const transaction = db.transaction(['payments'], 'readwrite');
    const store = transaction.objectStore('payments');
    store.add(payment);
    transaction.oncomplete = loadDashboard;
}

function loadStudents() {
    const transaction = db.transaction(['students'], 'readonly');
    const store = transaction.objectStore('students');
    const request = store.getAll();
    request.onsuccess = function() {
        const students = request.result;
        const ul = document.getElementById('student-ul');
        ul.innerHTML = '';
        students.forEach(student => {
            const li = document.createElement('li');
            li.textContent = `${student.name} - Room: ${student.room} - Lunch: ${student.lunchType}`;
            ul.appendChild(li);
        });
    };
}

function loadStudentSelect() {
    const transaction = db.transaction(['students'], 'readonly');
    const store = transaction.objectStore('students');
    const request = store.getAll();
    request.onsuccess = function() {
        const students = request.result;
        const select = document.getElementById('student-select');
        select.innerHTML = '';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            select.appendChild(option);
        });
    };
}

function loadPendingFees() {
    const transaction = db.transaction(['students', 'payments'], 'readonly');
    const studentStore = transaction.objectStore('students');
    const paymentStore = transaction.objectStore('payments');
    const studentRequest = studentStore.getAll();
    const paymentRequest = paymentStore.getAll();
    transaction.oncomplete = function() {
        const students = studentRequest.result;
        const payments = paymentRequest.result;
        const ul = document.getElementById('pending-ul');
        ul.innerHTML = '';
        students.forEach(student => {
            const studentPayments = payments.filter(p => p.studentId === student.id);
            const totalBalance = studentPayments.reduce((sum, p) => sum + p.balance, 0);
            if (totalBalance > 0) {
                const li = document.createElement('li');
                li.textContent = `${student.name} - Pending: ₹${totalBalance.toFixed(2)}`;
                ul.appendChild(li);
            }
        });
    };
}

function loadDashboard() {
    const transaction = db.transaction(['students', 'payments'], 'readonly');
    const studentStore = transaction.objectStore('students');
    const paymentStore = transaction.objectStore('payments');
    const studentRequest = studentStore.count();
    const paymentRequest = paymentStore.getAll();
    transaction.oncomplete = function() {
        document.getElementById('total-students').textContent = studentRequest.result;
        const payments = paymentRequest.result;
        document.getElementById('total-payments').textContent = payments.length;
        const totalPending = payments.reduce((sum, p) => sum + p.balance, 0);
        document.getElementById('pending-balances').textContent = totalPending.toFixed(2);
    };
}