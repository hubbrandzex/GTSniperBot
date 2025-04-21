// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// UTILITIES
function formatCurrency(value) {
  return `₦${Number(value).toLocaleString()}`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function enableBtn(id, enabled) {
  const btn = document.getElementById(id);
  if (btn) btn.disabled = !enabled;
}

// AUTHENTICATION
onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser = user;
    await loadDashboard();
  } else {
    window.location.href = 'login.html';
  }
});

async function loadDashboard() {
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  if (!userDoc.exists()) return;
  const data = userDoc.data();

  setText("firstName", data.firstName || "Investor");
  setText("referralCode", data.referralCode || "");
  setText("bonusBalance", formatCurrency(data.bonusWallet || 0));
  setText("profitBalance", formatCurrency(data.profitWallet || 0));
  setText("personalBalance", formatCurrency(data.personalWallet || 0));

  // Enable withdrawal button if balance is sufficient and the user has invested
  enableBtn("withdrawBonusBtn", (data.bonusWallet || 0) >= 1000 && data.hasInvested);
  enableBtn("withdrawProfitBtn", (data.profitWallet || 0) >= 1000);
}

// EVENT LISTENERS
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
});

document.getElementById("withdrawBonusBtn").addEventListener("click", () => {
  openWithdrawModal("Bonus", "bonusWallet");
});

document.getElementById("withdrawProfitBtn").addEventListener("click", () => {
  openWithdrawModal("Profit", "profitWallet");
});

document.getElementById("confirmWithdraw").addEventListener("click", async () => {
  const pin = document.getElementById("modalPin").value.trim();
  const method = document.querySelector('input[name="withdrawMethod"]:checked').value;
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  const data = userDoc.data();

  if (!pin || pin !== data.transactionPin) return alert("Invalid PIN");
  if (!withdrawContext) return alert("Invalid context");

  const balance = data[withdrawContext.walletField] || 0;
  if (balance < 1000) return alert("Insufficient balance");

  const fee = balance * 0.03;  // 3% admin fee
  const net = balance - fee;

  const tx = {
    type: "withdrawal",
    wallet: withdrawContext.walletType,
    method,
    amount: balance,
    fee,
    net,
    createdAt: new Date().toISOString()
  };

  await updateDoc(doc(db, "users", currentUser.uid), {
    [withdrawContext.walletField]: 0,
    withdrawalHistory: (data.withdrawalHistory || []).concat(tx)  // Append to withdrawal history
  });

  await addDoc(collection(db, `users/${currentUser.uid}/transactions`), tx);

  alert(`Withdrawal successful: ${formatCurrency(net)}`);
  closeWithdrawModal();
  loadDashboard();
});

let withdrawContext = null;

function openWithdrawModal(walletType, walletField) {
  withdrawContext = { walletType, walletField };
  const balance = document.getElementById(walletField === 'bonusWallet' ? 'bonusBalance' : 'profitBalance').textContent.replace(/[^\d.]/g, '');
  const amount = parseFloat(balance);
  const fee = amount * 0.03;
  const net = amount - fee;

  setText("modalWalletType", walletType);
  setText("modalAvailable", formatCurrency(amount));
  setText("modalFee", formatCurrency(fee));
  setText("modalNet", formatCurrency(net));

  document.getElementById("withdrawModal").classList.remove("hidden");
}

function closeWithdrawModal() {
  document.getElementById("withdrawModal").classList.add("hidden");
  document.getElementById("modalPin").value = "";
  withdrawContext = null;
}

document.getElementById("bankForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const acctName = document.getElementById("acctName").value.trim();
  const acctNumber = document.getElementById("acctNumber").value.trim();
  const bankName = document.getElementById("bankName").value.trim();
  const usdtAddr = document.getElementById("usdtAddr").value.trim();
  const bankPin = document.getElementById("bankPin").value.trim();

  if (!acctName || !acctNumber || !bankName || !usdtAddr || !bankPin) {
    return alert("All fields are required.");
  }

  await updateDoc(doc(db, "users", currentUser.uid), {
    accountName: acctName,
    accountNumber: acctNumber,
    bankName,
    usdtAddress: usdtAddr,
    transactionPin: bankPin
  });

  alert("Bank details saved successfully.");
});
