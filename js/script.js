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
document.getElementById('student-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const student = {
        name: document.getElementById('student-name').value,
        room: document.getElementById('room-no').value,
        lunchType: document.getElementById('lunch-type').value
    };
    const response = await fetch('/.netlify/functions/addStudent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
    });
    if (response.ok) {
        alert('Student added!');
        this.reset();
        loadDashboard();
    } else {
        alert('Error adding student');
    }
});

// Add Payment
document.getElementById('payment-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const payment = {
        studentId: parseInt(document.getElementById('student-select').value),
        totalFees: parseFloat(document.getElementById('total-fees').value),
        paidAmount: parseFloat(document.getElementById('paid-amount').value),
        paymentMode: document.getElementById('payment-mode').value,
        date: document.getElementById('payment-date').value,
        balance: parseFloat(document.getElementById('balance').value)
    };
    const response = await fetch('/.netlify/functions/addPayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
    });
    if (response.ok) {
        alert('Payment added!');
        this.reset();
        loadDashboard();
    } else {
        alert('Error adding payment');
    }
});

// Auto calculate balance
document.getElementById('total-fees').addEventListener('input', calculateBalance);
document.getElementById('paid-amount').addEventListener('input', calculateBalance);

function calculateBalance() {
    const total = parseFloat(document.getElementById('total-fees').value) || 0;
    const paid = parseFloat(document.getElementById('paid-amount').value) || 0;
    document.getElementById('balance').value = (total - paid).toFixed(2);
}

// Load Students
async function loadStudents() {
    const response = await fetch('/.netlify/functions/getStudents');
    const students = await response.json();
    const ul = document.getElementById('student-ul');
    ul.innerHTML = '';
    students.forEach(student => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${student.name} - Room: ${student.room} - Lunch: ${student.lunch_type}`;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteStudent(student.id));
        li.appendChild(nameSpan);
        li.appendChild(deleteBtn);
        ul.appendChild(li);
    });
}

// Load Student Select
async function loadStudentSelect() {
    const response = await fetch('/.netlify/functions/getStudents');
    const students = await response.json();
    const select = document.getElementById('student-select');
    select.innerHTML = '';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        select.appendChild(option);
    });
}

// Load History Student Select
async function loadHistoryStudentSelect() {
    const response = await fetch('/.netlify/functions/getStudents');
    const students = await response.json();
    const select = document.getElementById('history-student-select');
    select.innerHTML = '<option value="">Select a student</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
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
    const response = await fetch(`/.netlify/functions/getPaymentsByStudent?studentId=${studentId}`);
    const payments = await response.json();
    const ul = document.getElementById('history-ul');
    ul.innerHTML = '';
    payments.forEach(payment => {
        const li = document.createElement('li');
        li.textContent = `Date: ${payment.date} | Total Fees: ₹${payment.total_fees.toFixed(2)} | Paid: ₹${payment.paid_amount.toFixed(2)} | Balance: ₹${payment.balance.toFixed(2)} | Mode: ${payment.payment_mode}`;
        ul.appendChild(li);
    });
}

// Load Pending Fees
async function loadPendingFees() {
    const studentsResponse = await fetch('/.netlify/functions/getStudents');
    const students = await studentsResponse.json();
    const paymentsResponse = await fetch('/.netlify/functions/getPayments');
    const payments = await paymentsResponse.json();
    const ul = document.getElementById('pending-ul');
    ul.innerHTML = '';
    const paymentsByStudent = {};
    payments.forEach(payment => {
        if (!paymentsByStudent[payment.student_id]) paymentsByStudent[payment.student_id] = [];
        paymentsByStudent[payment.student_id].push(payment);
    });
    students.forEach(student => {
        const studentPayments = paymentsByStudent[student.id] || [];
        const totalBalance = studentPayments.reduce((sum, p) => sum + p.balance, 0);
        if (totalBalance > 0) {
            const li = document.createElement('li');
            li.textContent = `${student.name} - Pending: ₹${totalBalance.toFixed(2)}`;
            ul.appendChild(li);
        }
    });
}

// Delete Student
async function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student and all their payments?')) {
        const response = await fetch(`/.netlify/functions/deleteStudent?id=${studentId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            loadStudents();
            loadDashboard();
            loadPendingFees();
        } else {
            alert('Error deleting student');
        }
    }
}

// Load Dashboard
async function loadDashboard() {
    const studentsResponse = await fetch('/.netlify/functions/getStudents');
    const students = await studentsResponse.json();
    const paymentsResponse = await fetch('/.netlify/functions/getPayments');
    const payments = await paymentsResponse.json();
    document.getElementById('total-students').textContent = students.length;
    document.getElementById('total-payments').textContent = payments.length;
    let totalPending = 0;
    payments.forEach(payment => {
        totalPending += payment.balance;
    });
    document.getElementById('pending-balances').textContent = totalPending.toFixed(2);
}

// Initial load
loadDashboard();