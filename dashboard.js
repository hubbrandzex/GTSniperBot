// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  collection, addDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser, withdrawContext = null;

// UTILS
const formatCurrency = v => `₦${Number(v).toLocaleString()}`;
const setText = (id, txt) => { const e = document.getElementById(id); if(e) e.textContent = txt; };
const enableBtn = (id, yes) => { const b=document.getElementById(id); if(b) b.disabled = !yes; };

// AUTH FLOW
onAuthStateChanged(auth, async user => {
  if(!user) return window.location.href = "login.html";
  currentUser = user;
  await loadDashboard();
  bindInvest();
});

// LOAD DASHBOARD DATA
async function loadDashboard() {
  const uref = doc(db,"users",currentUser.uid);
  const udoc = await getDoc(uref);
  if(!udoc.exists()) return;

  const data = udoc.data();

  // display basics
  setText("firstName", data.firstName || "Investor");
  setText("referralCode", data.referralCode || "—");
  setText("bonusBalance", formatCurrency(data.bonusWallet||0));
  setText("profitBalance",formatCurrency(data.profitWallet||0));
  setText("personalBalance",formatCurrency(data.personalWallet||0));

  // enable withdraw only after invest & 24h lock
  const invested = data.hasInvested;
  const bonusAge = data.bonusLastUpdated ? (Date.now() - data.bonusLastUpdated.toMillis()) : 0;
  enableBtn("withdrawBonusBtn", invested && bonusAge >= 24*3600*1000 && (data.bonusWallet||0)>=1000);
  enableBtn("withdrawProfitBtn",(data.profitWallet||0)>=1000);

  // Bank/USDT details – show or hide form
  const bankSet = data.accountNumber && data.bankName;
  const usdtSet = data.usdtAddress;
  if(bankSet||usdtSet) {
    document.getElementById("bankForm").classList.add("hidden");
    document.getElementById("bankSummary").classList.remove("hidden");
    if(bankSet) {
      setText("sumName", data.accountName);
      setText("sumNumber", data.accountNumber);
      setText("sumBank", data.bankName);
    }
    if(usdtSet) setText("sumUsdt", data.usdtAddress);
  }

  // Bonus timer countdown
  if(data.bonusLastUpdated) startBonusTimer(data.bonusLastUpdated.toMillis());
}

// BONUS TIMER
let bonusTimerInterval;
function startBonusTimer(ts) {
  clearInterval(bonusTimerInterval);
  bonusTimerInterval = setInterval(() => {
    const elapsed = Date.now() - ts;
    if(elapsed>=24*3600*1000) {
      setText("bonusTimer","Available");
      enableBtn("withdrawBonusBtn", true);
      clearInterval(bonusTimerInterval);
    } else {
      const s = Math.floor((24*3600*1000 - elapsed)/1000);
      const h = Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
      setText("bonusTimer",`${h}h ${m}m ${sec}s`);
    }
  },1000);
}

// INVEST TAB LOGIC
function bindInvest() {
  const investBtn = document.getElementById("investNowBtn");
  investBtn.onclick = async () => {
    const plan = document.getElementById("planSelect").value;
    const amounts = { A:180000, B:540000, C:1080000, D:2160000 };
    const amt = amounts[plan];
    // credit 5% bonus
    const bonusInc = amt * 0.05;
    const uref = doc(db,"users", currentUser.uid);
    await updateDoc(uref, {
      bonusWallet: (await getDoc(uref)).data().bonusWallet + bonusInc,
      bonusLastUpdated: new Date(),
      hasInvested: true
    });
    // record investment
    await addDoc(collection(uref,"investments"), {
      plan, amount:amt, start: new Date(), active:true
    });
    alert(`Invested ₦${amt.toLocaleString()} — Bonus +${formatCurrency(bonusInc)}`);
    loadDashboard();
  };
}

// WITHDRAW HANDLERS
document.getElementById("withdrawBonusBtn").onclick = ()=>openWithdrawModal("Bonus","bonusWallet");
document.getElementById("withdrawProfitBtn").onclick = ()=>openWithdrawModal("Profit","profitWallet");

document.getElementById("confirmWithdraw").onclick = async ()=>{
  const pin = document.getElementById("modalPin").value.trim();
  const m = document.querySelector('input[name="withdrawMethod"]:checked').value;
  const uref=doc(db,"users",currentUser.uid), udoc=await getDoc(uref), d=udoc.data();
  if(pin!==d.transactionPin) return alert("Invalid PIN");
  const bal = d[withdrawContext.walletField]||0;
  if(bal<1000) return alert("Insufficient");
  const fee=bal*0.03, net=bal-fee;
  const tx={ type:"withdrawal", wallet:withdrawContext.walletType, method:m,
    amount:bal, fee, net, timestamp:new Date() };
  await updateDoc(uref, { [withdrawContext.walletField]:0 });
  await addDoc(collection(uref,"transactions"),tx);
  alert(`Withdrawn ${formatCurrency(net)}`);
  closeWithdrawModal(); loadDashboard();
};

let withdrawContext=null;
function openWithdrawModal(type, field){
  withdrawContext={walletType:type,walletField:field};
  const bal=parseFloat(document.getElementById(field==="bonusWallet"?"bonusBalance":"profitBalance").textContent.replace(/[^0-9]/g,""));
  const fee=bal*0.03, net=bal-fee;
  setText("modalWalletType",type);
  setText("modalAvailable",formatCurrency(bal));
  setText("modalFee",formatCurrency(fee));
  setText("modalNet",formatCurrency(net));
  document.getElementById("withdrawModal").classList.remove("hidden");
}
function closeWithdrawModal(){
  document.getElementById("withdrawModal").classList.add("hidden");
  document.getElementById("modalPin").value="";
  withdrawContext=null;
}

// BANK/USDT FORM
document.getElementById("bankForm").onsubmit = async e => {
  e.preventDefault();
  const uref=doc(db,"users",currentUser.uid);
  const name=document.getElementById("acctName").value.trim();
  const num=document.getElementById("acctNumber").value.trim();
  const bank=document.getElementById("bankName").value.trim();
  const usdt=document.getElementById("usdtAddr").value.trim();
  const pin=document.getElementById("bankPin").value.trim();
  if(!pin) return alert("PIN required");
  // require at least one of bank or usdt
  if(!( (name&&num&&bank) || usdt )) return alert("Enter Bank or USDT");
  const upd={ transactionPin:pin };
  if(name&&num&&bank) Object.assign(upd,{accountName:name,accountNumber:num,bankName:bank});
  if(usdt) upd.usdtAddress=usdt;
  await updateDoc(uref,upd);
  alert("Details saved");
  loadDashboard();
};
