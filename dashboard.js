// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, updateDoc,
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let withdrawContext = null;

// UTILS
const formatCurrency = v => `₦${Number(v).toLocaleString()}`;
const setText = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
const enableBtn = (id, ok) => { const b = document.getElementById(id); if (b) b.disabled = !ok; };

// AUTH FLOW
onAuthStateChanged(auth, async user => {
  if (!user) return window.location.href = "login.html";
  currentUser = user;
  await loadDashboard();
  bindInvest();
});

// LOAD DASHBOARD DATA
async function loadDashboard() {
  const uref = doc(db, "users", currentUser.uid);
  const udoc = await getDoc(uref);
  if (!udoc.exists()) return;
  const data = udoc.data();

  setText("firstName", data.firstName || "Investor");
  setText("referralCode", data.referralCode || "—");
  setText("bonusBalance", formatCurrency(data.bonusWallet || 0));
  setText("profitBalance", formatCurrency(data.profitWallet || 0));
  setText("personalBalance", formatCurrency(data.personalWallet || 0));

  // 24h lock & invest flag
  const invested = data.hasInvested;
  const lastTs = data.bonusLastUpdated ? data.bonusLastUpdated.toMillis() : 0;
  const elapsed = Date.now() - lastTs;
  enableBtn("withdrawBonusBtn", invested && elapsed >= 24 * 3600 * 1000 && (data.bonusWallet || 0) >= 1000);
  enableBtn("withdrawProfitBtn", (data.profitWallet || 0) >= 1000);

  // Bank/USDT summary toggle
  const bankSet = data.accountNumber && data.bankName;
  const usdtSet = data.usdtAddress;
  if (bankSet || usdtSet) {
    document.getElementById("bankForm").classList.add("hidden");
    document.getElementById("bankSummary").classList.remove("hidden");
    if (bankSet) {
      setText("sumName", data.accountName);
      setText("sumNumber", data.accountNumber);
      setText("sumBank", data.bankName);
    }
    if (usdtSet) setText("sumUsdt", data.usdtAddress);
  }

  // Bonus timer
  if (lastTs) startBonusTimer(lastTs);
}

// BONUS TIMER
let bonusTimerInterval;
function startBonusTimer(ts) {
  clearInterval(bonusTimerInterval);
  bonusTimerInterval = setInterval(() => {
    const rem = 24 * 3600 * 1000 - (Date.now() - ts);
    if (rem <= 0) {
      setText("bonusTimer", "Available");
      enableBtn("withdrawBonusBtn", true);
      clearInterval(bonusTimerInterval);
    } else {
      const s = Math.floor(rem / 1000);
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      setText("bonusTimer", `${h}h ${m}m ${sec}s`);
    }
  }, 1000);
}

// INVEST LOGIC
function bindInvest() {
  const investBtn = document.getElementById("investNowBtn");
  investBtn.onclick = async () => {
    const plan = document.getElementById("planSelect").value;
    const amounts = { A: 180000, B: 540000, C: 1080000, D: 2160000 };
    const amt = amounts[plan];
    const bonusInc = amt * 0.05;

    const uref = doc(db, "users", currentUser.uid);
    const snap = await getDoc(uref);
    const prev = snap.data().bonusWallet || 0;

    await updateDoc(uref, {
      bonusWallet: prev + bonusInc,
      bonusLastUpdated: serverTimestamp(),
      hasInvested: true
    });

    await addDoc(collection(uref, "investments"), {
      plan,
      amount: amt,
      start: serverTimestamp(),
      active: true
    });

    alert(`Invested ₦${amt.toLocaleString()} — Bonus +₦${bonusInc.toLocaleString()}`);
    loadDashboard();
  };
}

// WITHDRAW HANDLERS
document.getElementById("withdrawBonusBtn").onclick = () => openWithdrawModal("Bonus", "bonusWallet");
document.getElementById("withdrawProfitBtn").onclick = () => openWithdrawModal("Profit", "profitWallet");

document.getElementById("confirmWithdraw").onclick = async () => {
  const pin = document.getElementById("modalPin").value.trim();
  const method = document.querySelector('input[name="withdrawMethod"]:checked').value;
  const uref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(uref);
  const d = snap.data();

  if (!pin || pin !== d.transactionPin) return alert("Invalid PIN");
  const bal = d[withdrawContext.walletField] || 0;
  if (bal < 1000) return alert("Insufficient balance");

  const fee = bal * 0.03;
  const net = bal - fee;
  const tx = { type: "withdrawal", wallet: withdrawContext.walletType, method, amount: bal, fee, net, timestamp: serverTimestamp() };

  await updateDoc(uref, { [withdrawContext.walletField]: 0 });
  await addDoc(collection(uref, "transactions"), tx);

  alert(`Withdrawal successful: ${formatCurrency(net)}`);
  closeWithdrawModal();
  loadDashboard();
};

function openWithdrawModal(type, field) {
  withdrawContext = { walletType: type, walletField: field };
  const balText = document.getElementById(field === 'bonusWallet' ? 'bonusBalance' : 'profitBalance').textContent;
  const bal = parseFloat(balText.replace(/[^0-9]/g, ''));
  const fee = bal * 0.03;
  const net = bal - fee;
  setText("modalWalletType", type);
  setText("modalAvailable", formatCurrency(bal));
  setText("modalFee", formatCurrency(fee));
  setText("modalNet", formatCurrency(net));
  document.getElementById("withdrawModal").classList.remove("hidden");
}

function closeWithdrawModal() {
  document.getElementById("withdrawModal").classList.add("hidden");
  document.getElementById("modalPin").value = "";
  withdrawContext = null;
}

// BANK/USDT FORM
const bankForm = document.getElementById("bankForm");
bankForm.onsubmit = async e => {
  e.preventDefault();
  const uref = doc(db, "users", currentUser.uid);
  const name = document.getElementById("acctName").value.trim();
  const num = document.getElementById("acctNumber").value.trim();
  const bank = document.getElementById("bankName").value.trim();
  const usdt = document.getElementById("usdtAddr").value.trim();
  const pin = document.getElementById("bankPin").value.trim();

  if (!pin) return alert("PIN required");
  if (!( (name && num && bank) || usdt )) return alert("Enter Bank or USDT details");

  const upd = { transactionPin: pin };
  if (name && num && bank) Object.assign(upd, { accountName: name, accountNumber: num, bankName: bank });
  if (usdt) upd.usdtAddress = usdt;

  await updateDoc(uref, upd);
  alert("Details saved");
  loadDashboard();
};
