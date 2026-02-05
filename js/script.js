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
        if (btn.id === 'payment-history-btn') loadHistoryStudentSelect();
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
            const nameSpan = document.createElement('span');
            nameSpan.textContent = `${student.name} - Room: ${student.room} - Lunch: ${student.lunchType}`;
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteStudent(student.id));
            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
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

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student and all their payments?')) {
        const transaction = db.transaction(['students', 'payments'], 'readwrite');
        const studentStore = transaction.objectStore('students');
        const paymentStore = transaction.objectStore('payments');
        studentStore.delete(studentId);
        const paymentRequest = paymentStore.getAll();
        paymentRequest.onsuccess = function() {
            const payments = paymentRequest.result;
            payments.forEach(payment => {
                if (payment.studentId === studentId) {
                    paymentStore.delete(payment.id);
                }
            });
        };
        transaction.oncomplete = () => {
            loadStudents();
            loadDashboard();
            loadPendingFees();
        };
    }
}

function loadHistoryStudentSelect() {
    const transaction = db.transaction(['students'], 'readonly');
    const store = transaction.objectStore('students');
    const request = store.getAll();
    request.onsuccess = function() {
        const students = request.result;
        const select = document.getElementById('history-student-select');
        select.innerHTML = '<option value="">Select a student</option>';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            select.appendChild(option);
        });
        select.addEventListener('change', loadPaymentHistory);
    };
}

function loadPaymentHistory() {
    const studentId = parseInt(document.getElementById('history-student-select').value);
    if (!studentId) {
        document.getElementById('history-ul').innerHTML = '';
        return;
    }
    const transaction = db.transaction(['payments'], 'readonly');
    const store = transaction.objectStore('payments');
    const request = store.getAll();
    request.onsuccess = function() {
        const payments = request.result.filter(p => p.studentId === studentId);
        const ul = document.getElementById('history-ul');
        ul.innerHTML = '';
        payments.forEach(payment => {
            const li = document.createElement('li');
            li.textContent = `Date: ${payment.date} | Total Fees: ₹${payment.totalFees.toFixed(2)} | Paid: ₹${payment.paidAmount.toFixed(2)} | Balance: ₹${payment.balance.toFixed(2)} | Mode: ${payment.paymentMode}`;
            ul.appendChild(li);
        });
    };
}