const API_URL = window.APP_CONFIG.API_URL;

// Get DOM elements
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const amountInput = document.getElementById('amount');
const displayAmount = document.getElementById('displayAmount');
const categoryInput = document.getElementById('category');
const categorySuggestions = document.getElementById('categorySuggestions');
const expenseBtn = document.getElementById('expenseBtn');
const incomeBtn = document.getElementById('incomeBtn');
const quickAddButtons = document.querySelectorAll('.quick-add-btn');
const transactionList = document.getElementById('transactionList');
const sortBtn = document.getElementById('sortBtn');
const errorMessageDisplay = document.getElementById('errorMessage');

let isReversedOrder = true; // Default to newest on top

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = settingsModal.querySelector('.close-button');
const modalCurrencySelect = document.getElementById('modalCurrency');
const darkModeToggle = document.getElementById('darkModeToggle');

// Functions (moved to top)
function getToken() {
    return localStorage.getItem('accessToken');
}

function setToken(token) {
    localStorage.setItem('accessToken', token);
}

function removeToken() {
    localStorage.removeItem('accessToken');
}

function updateUI() {
    if (getToken()) {
        loginSection.style.display = 'none';
        appSection.style.display = 'block';
        fetchTransactions();
    } else {
        loginSection.style.display = 'block';
        appSection.style.display = 'none';
    }
    applyDarkModePreference();
}

function applyDarkModePreference() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', isDarkMode);
    darkModeToggle.checked = isDarkMode;

    // Update trash can icons
    const trashIcons = document.querySelectorAll('.delete-icon');
    trashIcons.forEach(icon => {
        icon.src = isDarkMode ? 'assets/trash_can_dark.png' : 'assets/trash_can.png';
    });
}

function setErrorMessage(message) {
    errorMessageDisplay.textContent = message;
    errorMessageDisplay.style.display = 'block';
    setTimeout(() => {
        errorMessageDisplay.textContent = '';
        errorMessageDisplay.style.display = 'none';
    }, 3000); // Clear after 3 seconds
}

async function registerUser() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        setErrorMessage('Please enter both username and password.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            setErrorMessage(data.message);
            // Optionally, log in the user immediately after registration
            loginUser();
        } else {
            setErrorMessage(`Registration failed: ${data.error}`);
        }
    } catch (error) {
        console.error('Error during registration:', error);
        setErrorMessage('Registration failed.');
    }
}

async function loginUser() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        setErrorMessage('Please enter both username and password.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            setToken(data.accessToken);
            updateUI();
        } else {
            setErrorMessage(`Login failed: ${data.error}`);
        }
    } catch (error) {
        console.error('Error during login:', error);
        setErrorMessage('Login failed.');
    }
}

function logoutUser() {
    removeToken();
    updateUI();
    transactionList.innerHTML = ''; // Clear transactions on logout
}

async function fetchTransactions() {
    const token = getToken();
    if (!token) {
        updateUI(); // Go back to login if no token
        return;
    }

    try {
        // Pass order param based on isReversedOrder
        const order = isReversedOrder ? 'desc' : 'asc';
        const response = await fetch(`${API_URL}/transactions?order=${order}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const transactions = await response.json();
            displayTransactions(transactions);
        } else if (response.status === 401 || response.status === 403) {
            setErrorMessage('Session expired or unauthorized. Please log in again.');
            logoutUser();
        } else {
            const errorData = await response.json();
            setErrorMessage(`Failed to fetch transactions: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        setErrorMessage('Failed to fetch transactions.');
    }
}

async function addTransaction(type) {
    const token = getToken();
    if (!token) {
        setErrorMessage('Please log in to add transactions.');
        updateUI();
        return;
    }

    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value.trim();
    const currency = localStorage.getItem('selectedCurrency') || 'EUR';

    if (isNaN(amount)) {
        setErrorMessage('Please enter a valid amount.');
        return;
    }

    const finalCategory = category === '' ? 'Misc' : category;
    saveCategory(finalCategory); // Save the category

    const newTransaction = {
        date: new Date().toISOString().split('T')[0],
        amount,
        category: finalCategory,
        type: type,
        currency,
    };

    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(newTransaction),
        });

        if (response.ok) {
            amountInput.value = '';
            displayAmount.textContent = '0.00';
            categoryInput.value = '';
            fetchTransactions(); // Refresh the list
        } else if (response.status === 401 || response.status === 403) {
            setErrorMessage('Session expired or unauthorized. Please log in again.');
            logoutUser();
        } else {
            const errorData = await response.json();
            setErrorMessage(`Failed to add transaction: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        setErrorMessage('Failed to add transaction.');
    }
}

async function deleteTransaction(id) {
    const token = getToken();
    if (!token) {
        setErrorMessage('Please log in to delete transactions.');
        updateUI();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            fetchTransactions(); // Refresh the list
        } else if (response.status === 401 || response.status === 403) {
            setErrorMessage('Session expired or unauthorized. Please log in again.');
            logoutUser();
        } else {
            const errorData = await response.json();
            setErrorMessage(`Failed to delete transaction: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        setErrorMessage('Failed to delete transaction.');
    }
}

function displayTransactions(transactions) {
    transactionList.innerHTML = ''; // Clear existing list
    if (transactions.length === 0) {
        transactionList.innerHTML = '<p style="text-align: center;">No transactions yet. Add one!</p>';
        return;
    }

    const sortedTransactions = isReversedOrder ? [...transactions].reverse() : transactions;
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    const trashIcon = isDarkMode ? 'assets/trash_can_dark.png' : 'assets/trash_can.png';

    sortedTransactions.forEach(transaction => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${transaction.date}</span>
            <span>${transaction.category}</span>
            <span class="${transaction.type}">
                ${transaction.type === 'expense' ? '-' : '+'}${transaction.currency}${transaction.amount.toFixed(2)}
            </span>
            <button class="delete-btn" data-id="${transaction.id}"><img src="${document.body.classList.contains('dark-mode') ? 'assets/trash_can_dark.png' : 'assets/trash_can.png'}" alt="Delete" class="delete-icon"></button>
        `;
        transactionList.appendChild(listItem);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const id = event.currentTarget.dataset.id;
            deleteTransaction(id);
        });
    });
}

function getCategories() {
    return JSON.parse(localStorage.getItem('categories') || '[]');
}

function saveCategory(category) {
    const categories = getCategories();
    if (!categories.includes(category)) {
        categories.push(category);
        localStorage.setItem('categories', JSON.stringify(categories));
    }
}

function showSuggestions() {
    const input = categoryInput.value.toLowerCase();
    const categories = getCategories();
    const filteredCategories = categories.filter(cat => cat.toLowerCase().includes(input));

    categorySuggestions.innerHTML = '';
    if (input === '' || filteredCategories.length === 0) {
        categorySuggestions.style.display = 'none';
        return;
    }

    filteredCategories.forEach(category => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.textContent = category;
        suggestionItem.addEventListener('click', () => {
            categoryInput.value = category;
            categorySuggestions.style.display = 'none';
        });
        categorySuggestions.appendChild(suggestionItem);
    });
    categorySuggestions.style.display = 'block';
}

// Event Listeners (moved to bottom)
registerBtn.addEventListener('click', registerUser);
loginBtn.addEventListener('click', loginUser);
logoutBtn.addEventListener('click', logoutUser);

settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
    modalCurrencySelect.value = localStorage.getItem('selectedCurrency') || 'EUR';
});

closeModalBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == settingsModal) {
        settingsModal.style.display = 'none';
    }
});

modalCurrencySelect.addEventListener('change', (event) => {
    localStorage.setItem('selectedCurrency', event.target.value);
});

darkModeToggle.addEventListener('change', (event) => {
    const isDarkMode = event.target.checked;
    localStorage.setItem('darkMode', isDarkMode);
    applyDarkModePreference();
});

sortBtn.addEventListener('click', () => {
    isReversedOrder = !isReversedOrder;
    sortBtn.textContent = `${isReversedOrder ? 'Newest First' : 'Oldest First'}`;
    fetchTransactions();
});

expenseBtn.addEventListener('click', () => {
    addTransaction('expense');
});

incomeBtn.addEventListener('click', () => {
    addTransaction('income');
});

displayAmount.addEventListener('click', () => {
    displayAmount.contentEditable = true;
    displayAmount.focus();
    // Select all text when focused
    const range = document.createRange();
    range.selectNodeContents(displayAmount);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
});

displayAmount.addEventListener('blur', () => {
    displayAmount.contentEditable = false;
    let value = parseFloat(displayAmount.textContent || '0');
    if (isNaN(value)) {
        value = 0;
    }
    amountInput.value = value.toString();
    displayAmount.textContent = value.toFixed(2);
});

displayAmount.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent new line
        displayAmount.blur(); // Trigger blur to save value
    }
});

quickAddButtons.forEach(button => {
    button.addEventListener('click', () => {
        const currentAmount = parseFloat(amountInput.value || '0');
        const addedAmount = parseFloat(button.dataset.value);
        amountInput.value = (currentAmount + addedAmount).toString();
        displayAmount.textContent = parseFloat(amountInput.value).toFixed(2);
    });
});

categoryInput.addEventListener('input', showSuggestions);
categoryInput.addEventListener('focus', showSuggestions);

// Hide suggestions when clicking outside
document.addEventListener('click', (event) => {
    if (!categoryInput.contains(event.target) && !categorySuggestions.contains(event.target)) {
        categorySuggestions.style.display = 'none';
    }
});

// Initial UI update on page load
applyDarkModePreference();
updateUI();