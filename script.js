// --- Hilfsfunktionen für komplexe Regeln ---

// Prüft auf Primzahlen
function isPrime(num) {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

// Validiert mathematische Gleichungen wie "2+3=5" oder "10-2=8"
function checkMathEquation(str) {
    const mathRegex = /(\d+)[\+\-\*](\d+)=(\d+)/;
    const match = str.match(mathRegex);
    if (!match) return false;

    const num1 = parseInt(match[1], 10);
    const num2 = parseInt(match[2], 10);
    const expectedResult = parseInt(match[3], 10);
    
    // Ermittle den Operator aus dem Original-Match
    const operatorMatch = str.match(/[\+\-\*]/);
    if (!operatorMatch) return false;
    const operator = operatorMatch[0];

    if (operator === '+') return num1 + num2 === expectedResult;
    if (operator === '-') return num1 - num2 === expectedResult;
    if (operator === '*') return num1 * num2 === expectedResult;
    
    return false;
}

// --- Regel-Engine Definition ---
const ALL_RULES = [
    {
        id: 1,
        description: "Dein Passwort muss mindestens 5 Zeichen lang sein.",
        check: (val) => val.length >= 5
    },
    {
        id: 2,
        description: "Dein Passwort muss mindestens eine Zahl enthalten.",
        check: (val) => /\d/.test(val)
    },
    {
        id: 3,
        description: "Dein Passwort muss mindestens einen Großbuchstaben enthalten.",
        check: (val) => /[A-Z]/.test(val)
    },
    {
        id: 4,
        description: "Dein Passwort muss ein Sonderzeichen enthalten (z.B. !, @, #, $).",
        check: (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val)
    },
    {
        id: 5,
        description: "Dein Passwort muss das geheime Wort „cat“ enthalten.",
        check: (val) => /cat/i.test(val)
    },
    {
        id: 6,
        description: "Dein Passwort muss eine römische Zahl enthalten (I, V, X, L, C, D, M).",
        check: (val) => /[IVXLCDM]/.test(val)
    },
    {
        id: 7,
        description: "Dein Passwort muss die aktuelle Jahreszahl (2026) enthalten.",
        check: (val) => /2026/.test(val)
    },
    {
        id: 8,
        description: "Die Gesamtlänge deines Passworts muss eine Primzahl sein.",
        check: (val) => isPrime(val.length)
    },
    {
        id: 9,
        description: "Dein Passwort darf keine Leerzeichen enthalten.",
        check: (val) => !/\s/.test(val)
    },
    {
        id: 10,
        description: "Dein Passwort muss mindestens ein Emoji enthalten.",
        check: (val) => /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(val)
    },
    {
        id: 11,
        description: "Dein Passwort muss eine korrekte mathematische Gleichung enthalten (z. B. „5+5=10“ oder „3*4=12“).",
        check: (val) => checkMathEquation(val)
    }
];

// --- Spiel-Status ---
let unlockedRulesCount = 1;

// DOM Elemente
const passwordInput = document.getElementById("password-input");
const charCounter = document.getElementById("char-counter");
const rulesList = document.getElementById("rules-list");
const rulesProgress = document.getElementById("rules-progress");
const victoryCard = document.getElementById("victory-card");
const finalPassword = document.getElementById("final-password");
const resetBtn = document.getElementById("reset-btn");

// --- Game Logic ---

function initGame() {
    // Spielstand aus localStorage laden, falls vorhanden
    const savedProgress = localStorage.getItem("passwordGame_progress");
    if (savedProgress) {
        unlockedRulesCount = parseInt(savedProgress, 10);
    } else {
        unlockedRulesCount = 1;
    }
    
    passwordInput.value = "";
    victoryCard.classList.add("hidden");
    evaluateRules();
}

function evaluateRules() {
    const password = passwordInput.value;
    charCounter.textContent = password.length;

    let allCurrentValid = true;
    let htmlContent = "";

    // Iteriere durch alle bisher freigeschalteten Regeln
    for (let i = 0; i < unlockedRulesCount; i++) {
        const rule = ALL_RULES[i];
        const isValid = rule.check(password);
        
        if (!isValid) {
            allCurrentValid = false;
        }

        const statusClass = isValid ? "valid" : "invalid";
        const icon = isValid ? "✅" : "❌";

        htmlContent += `
            <li class="rule-item ${statusClass}" id="rule-${rule.id}">
                <span class="status-icon">${icon}</span>
                <span class="rule-text"><strong>Regel ${rule.id}:</strong> ${rule.description}</span>
            </li>
        `;
    }

    rulesList.innerHTML = htmlContent;
    rulesProgress.textContent = `${unlockedRulesCount}/${ALL_RULES.length}`;

    // Logik für das Freischalten der nächsten Regel
    if (allCurrentValid && unlockedRulesCount < ALL_RULES.length) {
        unlockedRulesCount++;
        localStorage.setItem("passwordGame_progress", unlockedRulesCount);
        
        // Erneute Evaluierung triggern, um die neue Regel anzuzeigen
        evaluateRules();
        
        // Animation auf die neueste Regel anwenden
        const newRuleElement = document.getElementById(`rule-${ALL_RULES[unlockedRulesCount - 1].id}`);
        if (newRuleElement) {
            newRuleElement.classList.add("animated");
        }
    } 
    // Gewinn-Zustand überprüfen
    else if (allCurrentValid && unlockedRulesCount === ALL_RULES.length) {
        victoryCard.classList.remove("hidden");
        finalPassword.textContent = password;
    }
}

// --- Event Listener ---

passwordInput.addEventListener("input", evaluateRules);

resetBtn.addEventListener("click", () => {
    if (confirm("Möchtest du das Spiel wirklich zurücksetzen? Dein Fortschritt geht verloren.")) {
        localStorage.removeItem("passwordGame_progress");
        initGame();
    }
});

// Spiel beim Laden initialisieren
window.addEventListener("DOMContentLoaded", initGame);
