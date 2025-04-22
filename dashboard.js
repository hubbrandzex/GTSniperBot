import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
    getFirestore, doc, getDoc, updateDoc,
    collection, addDoc, serverTimestamp,
    arrayUnion, increment, onSnapshot, query, getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let withdrawContext = null;
let earningsChart = null;

// Utility Functions
const formatCurrency = v => `₦${Number(v).toLocaleString()}`;
const setText = (id, txt) => { 
    const el = document.getElementById(id); 
    if(el) el.textContent = txt; 
};
const enableBtn = (id, ok) => { 
    const btn = document.getElementById(id); 
    if(btn) btn.disabled = !ok; 
};
const showLoader = (show) => { 
    document.getElementById('loader').style.display = show ? 'grid' : 'none'; 
};

// Authentication Listener
onAuthStateChanged(auth, async user => {
    showLoader(true);
    try {
        if (!user) window.location.href = 'login.html';
        currentUser = user;
        await loadDashboard();
        bindInvest();
        initChart();
        setupSecurity();
        await checkAdminStatus();
    } finally {
        showLoader(false);
    }
});

// Dashboard Loader
async function loadDashboard() {
    const userRef = doc(db, 'users', currentUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const data = snap.data();

    // Header Info
    setText('firstName', data.firstName || 'Investor');
    setText('referralCode', data.referralCode || '—');

    // Wallet Balances
    setText('bonusBalance', formatCurrency(data.bonusWallet || 0));
    setText('profitBalance', formatCurrency(data.profitWallet || 0));
    setText('personalBalance', formatCurrency(data.personalWallet || 0));

    // Withdrawal Rules
    const invested = data.hasInvested;
    const lastTs = data.bonusLastUpdated?.toMillis() || 0;
    const elapsed = Date.now() - lastTs;
    enableBtn('withdrawBonusBtn', invested && elapsed >= 86400000 && (data.bonusWallet || 0) >= 1000);
    enableBtn('withdrawProfitBtn', (data.profitWallet || 0) >= 1000);

    // Transaction History
    const transactions = await getDocs(collection(userRef, 'transactions'));
    updateTransactionList(transactions.docs);
}

// Investment Handler
function bindInvest() {
    document.querySelectorAll('.invest-button').forEach(btn => {
        btn.onclick = async () => {
            const plan = btn.dataset.plan;
            const amounts = { A:180000, B:540000, C:1080000, D:2160000 };
            const amt = amounts[plan];
            
            const handler = PaystackPop.setup({
                key: 'pk_live_a2e3b62d1ece2cc1bbffab35afa3819647c5a848',
                email: currentUser.email,
                amount: amt * 100,
                currency: 'NGN',
                metadata: { plan, userId: currentUser.uid },
                callback: async (response) => {
                    if (response.status === 'success') {
                        const userRef = doc(db, 'users', currentUser.uid);
                        await updateDoc(userRef, {
                            personalWallet: increment(amt),
                            bonusWallet: increment(amt * 0.05),
                            hasInvested: true,
                            investments: arrayUnion({
                                plan, 
                                amount: amt, 
                                start: serverTimestamp(),
                                active: true
                            })
                        });
                        loadDashboard();
                    }
                },
                onClose: () => console.log('Payment closed')
            });
            handler.openIframe();
        };
    });
}

// Withdrawal Handlers
document.getElementById('withdrawBonusBtn').onclick = () => openWithdrawModal('Bonus','bonusWallet');
document.getElementById('withdrawProfitBtn').onclick = () => openWithdrawModal('Profit','profitWallet');

document.getElementById('confirmWithdraw').onclick = async () => {
    const pin = document.getElementById('modalPin').value.trim();
    const method = document.querySelector('input[name="withdrawMethod"]:checked').value;
    const userRef = doc(db, 'users', currentUser.uid);
    const snap = await getDoc(userRef);
    const data = snap.data();

    if (pin !== data.transactionPin) return alert('Invalid PIN');
    const bal = data[withdrawContext.walletField] || 0;
    if (bal < 1000) return alert('Insufficient balance');

    const fee = bal * 0.03;
    const net = bal - fee;
    
    await updateDoc(userRef, { [withdrawContext.walletField]: 0 });
    await addDoc(collection(userRef, 'transactions'), {
        type: 'withdrawal',
        wallet: withdrawContext.walletType,
        method,
        amount: bal,
        fee,
        net,
        timestamp: serverTimestamp()
    });
    
    closeWithdrawModal();
    loadDashboard();
};

// Security Features
function setupSecurity() {
    // Inactivity Timer (15min)
    let timeout;
    const resetTimer = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => signOut(auth), 900000);
    };
    ['mousemove', 'keydown', 'click'].forEach(e => 
        document.addEventListener(e, resetTimer)
    );
    resetTimer();

    // IP Logging
    fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(({ ip }) => updateDoc(doc(db, 'users', currentUser.uid), {
            lastLoginIP: ip,
            lastLogin: serverTimestamp()
        }))
        .catch(error => console.error('IP logging failed:', error));
}

// Admin Features
async function checkAdminStatus() {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.data().isAdmin) {
        document.getElementById('adminDashboard').classList.remove('hidden');
        setupAdminListeners();
    }
}

function setupAdminListeners() {
    const usersRef = collection(db, 'users');
    onSnapshot(usersRef, (snapshot) => {
        const users = snapshot.docs.map(d => d.data());
        updateAdminUserList(users);
    });
}

function updateAdminUserList(users) {
    const tbody = document.querySelector('#adminUsers table tbody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.email}</td>
            <td>${user.firstName}</td>
            <td>₦${user.bonusWallet || 0}</td>
        </tr>
    `).join('');
}

// Utility Functions
function openWithdrawModal(type, field) {
    withdrawContext = { walletType: type, walletField: field };
    const bal = parseFloat(document.getElementById(field === 'bonusWallet' ? 
        'bonusBalance' : 'profitBalance').textContent.replace(/[^0-9]/g, ''));
    
    document.getElementById('modalWalletType').textContent = type;
    document.getElementById('modalAvailable').textContent = formatCurrency(bal);
    document.getElementById('withdrawModal').classList.remove('hidden');
}

function closeWithdrawModal() {
    document.getElementById('withdrawModal').classList.add('hidden');
    document.getElementById('modalPin').value = '';
    withdrawContext = null;
}

function updateTransactionList(transactions) {
    const tbody = document.getElementById('transactionList');
    tbody.innerHTML = transactions.map(t => {
        const data = t.data();
        return `
            <tr>
                <td>${data.timestamp?.toDate()?.toLocaleDateString() || 'N/A'}</td>
                <td>${data.type}</td>
                <td>${formatCurrency(data.amount)}</td>
                <td>Completed</td>
            </tr>
        `;
    }).join('');
}

// Chart Initialization
function initChart() {
    const ctx = document.getElementById('earningsChart').getContext('2d');
    earningsChart = new Chart(ctx, {
        type: 'line',
        data: { 
            labels: [], 
            datasets: [{
                label: 'Daily Earnings',
                data: [],
                borderColor: '#2A5C8A',
                tension: 0.1
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false 
        }
    });
    
    const transactionsRef = collection(db, 'users', currentUser.uid, 'transactions');
    onSnapshot(query(transactionsRef), (snapshot) => {
        const earningsData = snapshot.docs
            .filter(d => d.data().type === 'profit')
            .map(d => ({ 
                x: d.data().timestamp.toDate(), 
                y: d.data().amount 
            }));
        
        earningsChart.data.labels = earningsData.map(d => d.x.toLocaleDateString());
        earningsChart.data.datasets[0].data = earningsData.map(d => d.y);
        earningsChart.update();
    });
}