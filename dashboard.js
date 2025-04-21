// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, updateDoc,
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";  // Named import matching firebase-config.js

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let withdrawContext = null;

// UTILITY FUNCTIONS
const formatCurrency = v => `₦${Number(v).toLocaleString()}`;
const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
const enableBtn = (id, ok) => { const btn = document.getElementById(id); if (btn) btn.disabled = !ok; };

// AUTHENTICATION LISTENER
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;
  await loadDashboard();
  bindInvest();
});

// LOAD DASHBOARD DATA
async function loadDashboard() {
  const userRef = doc(db, 'users', currentUser.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const data = snap.data();

  // Header info
  setText('firstName', data.firstName || 'Investor');
  setText('referralCode', data.referralCode || '—');

  // Wallet balances
  setText('bonusBalance', formatCurrency(data.bonusWallet || 0));
  setText('profitBalance', formatCurrency(data.profitWallet || 0));
  setText('personalBalance', formatCurrency(data.personalWallet || 0));

  // Withdrawal button enabling
  const invested = data.hasInvested;
  const lastTs = data.bonusLastUpdated ? data.bonusLastUpdated.toMillis() : 0;
  const elapsed = Date.now() - lastTs;
  enableBtn('withdrawBonusBtn', invested && elapsed >= 24*3600*1000 && (data.bonusWallet || 0) >= 1000);
  enableBtn('withdrawProfitBtn', (data.profitWallet || 0) >= 1000);

  // Bank/USDT form toggle
  const bankSet = data.accountNumber && data.bankName;
  const usdtSet = data.usdtAddress;
  if (bankSet || usdtSet) {
    document.getElementById('bankForm').classList.add('hidden');
    document.getElementById('bankSummary').classList.remove('hidden');
    if (bankSet) {
      setText('sumName', data.accountName);
      setText('sumNumber', data.accountNumber);
      setText('sumBank', data.bankName);
    }
    if (usdtSet) setText('sumUsdt', data.usdtAddress);
  }

  // Start bonus countdown
  if (lastTs) startBonusTimer(lastTs);
}

// BONUS WITHDRAWAL TIMER
let bonusTimerInterval;
function startBonusTimer(ts) {
  clearInterval(bonusTimerInterval);
  bonusTimerInterval = setInterval(() => {
    const rem = 24*3600*1000 - (Date.now() - ts);
    if (rem <= 0) {
      setText('bonusTimer', 'Available');
      enableBtn('withdrawBonusBtn', true);
      clearInterval(bonusTimerInterval);
    } else {
      const s = Math.floor(rem/1000);
      const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
      setText('bonusTimer', `${h}h ${m}m ${sec}s`);
    }
  }, 1000);
}

// INVESTMENT HANDLER
function bindInvest() {
  document.getElementById('investNowBtn').onclick = async () => {
    const plan = document.getElementById('planSelect').value;
    const amounts = { A:180000, B:540000, C:1080000, D:2160000 };
    const amt = amounts[plan];
    const bonusInc = amt * 0.05;

    const userRef = doc(db, 'users', currentUser.uid);
    const snap = await getDoc(userRef);
    const prevBonus = snap.data().bonusWallet || 0;

    // Update bonus and invest flag
    await updateDoc(userRef, {
      bonusWallet: prevBonus + bonusInc,
      bonusLastUpdated: serverTimestamp(),
      hasInvested: true
    });

    // Record investment entry
    await addDoc(collection(userRef, 'investments'), {
      plan, amount: amt, start: serverTimestamp(), active: true
    });

    alert(`Invested ₦${amt.toLocaleString()} — Bonus +₦${bonusInc.toLocaleString()}`);
    loadDashboard();
  };
}

// WITHDRAWAL HANDLERS
function openWithdrawModal(type, field) {
  withdrawContext = { walletType: type, walletField: field };
  const balText = document.getElementById(field==='bonusWallet'?'bonusBalance':'profitBalance').textContent;
  const bal = parseFloat(balText.replace(/[^0-9]/g, ''));
  const fee = bal * 0.03;
  const net = bal - fee;
  setText('modalWalletType', type);
  setText('modalAvailable', formatCurrency(bal));
  setText('modalFee', formatCurrency(fee));
  setText('modalNet', formatCurrency(net));
  document.getElementById('withdrawModal').classList.remove('hidden');
}

function closeWithdrawModal() {
  document.getElementById('withdrawModal').classList.add('hidden');
  document.getElementById('modalPin').value = '';
  withdrawContext = null;
}

document.getElementById('withdrawBonusBtn').onclick = () => openWithdrawModal('Bonus','bonusWallet');
document.getElementById('withdrawProfitBtn').onclick = () => openWithdrawModal('Profit','profitWallet');

document.getElementById('confirmWithdraw').onclick = async () => {
  const pin = document.getElementById('modalPin').value.trim();
  const method = document.querySelector('input[name="withdrawMethod"]:checked').value;
  const userRef = doc(db,'users',currentUser.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  if (!pin || pin !== data.transactionPin) { alert('Invalid PIN'); return; }
  const bal = data[withdrawContext.walletField] || 0;
  if (bal < 1000) { alert('Insufficient balance'); return; }

  const fee = bal * 0.03;
  const net = bal - fee;
  const tx = { type:'withdrawal', wallet:withdrawContext.walletType, method, amount:bal, fee, net, timestamp: serverTimestamp() };

  await updateDoc(userRef, { [withdrawContext.walletField]: 0 });
  await addDoc(collection(userRef,'transactions'), tx);
  alert(`Withdrawal successful: ${formatCurrency(net)}`);
  closeWithdrawModal();
  loadDashboard();
};

// BANK/USDT DETAILS
const bankForm = document.getElementById('bankForm');
bankForm.onsubmit = async e => {
  e.preventDefault();
  const userRef = doc(db,'users',currentUser.uid);
  const name = document.getElementById('acctName').value.trim();
  const num = document.getElementById('acctNumber').value.trim();
  const bank = document.getElementById('bankName').value.trim();
  const usdt = document.getElementById('usdtAddr').value.trim();
  const pin = document.getElementById('bankPin').value.trim();

  if (!pin) { alert('Transaction PIN required'); return; }
  if (!( (name && num && bank) || usdt )) { alert('Enter Bank details or USDT address'); return; }

  const upd = { transactionPin: pin };
  if (name && num && bank) Object.assign(upd, { accountName: name, accountNumber: num, bankName: bank });
  if (usdt) upd.usdtAddress = usdt;

  await updateDoc(userRef, upd);
  alert('Details saved');
  loadDashboard();
};
