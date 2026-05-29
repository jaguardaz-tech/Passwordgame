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
    
    const operatorMatch = str.match(/[\+\-\*]/);
    if (!operatorMatch) return false;
    const operator = operatorMatch[0];

    if (operator === '+') return num1 + num2 === expectedResult;
    if (operator === '-') return num1 - num2 === expectedResult;
    if (operator === '*') return num1 * num2 === expectedResult;
    
    return false;
}

// --- Der gesamte Regel-Pool ---
const MASTER_RULES = [
    { id: 1, description: "Dein Passwort muss mindestens 5 Zeichen lang sein.", check: (val) => val.length >= 5 },
    { id: 2, description: "Dein Passwort muss mindestens eine Zahl enthalten.", check: (val) => /\d/.test(val) },
    { id: 3, description: "Dein Passwort muss mindestens einen Großbuchstaben enthalten.", check: (val) => /[A-Z]/.test(val) },
    { id: 4, description: "Dein Passwort muss ein Sonderzeichen enthalten (z.B. !, @, #, $).", check: (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val) },
    { id: 5, description: "Dein Passwort muss das geheime Wort „cat“ enthalten.", check: (val) => /cat/i.test(val) },
    { id: 6, description: "Dein Passwort muss eine römische Zahl enthalten (I, V, X, L, C, D, M).", check: (val) => /[IVXLCDM]/.test(val) },
    { id: 7, description: "Dein Passwort muss die aktuelle Jahreszahl (2026) enthalten.", check: (val) => /2026/.test(val) },
    { id: 8, description: "Die Gesamtlänge deines Passworts muss eine Primzahl sein.", check: (val) => isPrime(val.length) },
    { id: 9, description: "Dein Passwort darf keine Leerzeichen enthalten.", check: (val) => !/\s/.test(val) },
    { id: 10, description: "Dein Passwort muss mindestens ein Emoji enthalten.", check: (val) => /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(val) },
    { id: 11, description: "Dein Passwort muss eine korrekte mathematische Gleichung enthalten (z. B. „5+5=10“).", check: (val) => checkMathEquation(val) }
];

// --- Spiel-Status ---
let currentGameRules = []; // Hier landet die gemischte Reihenfolge für die aktuelle Runde
let unlockedRulesCount = 1;

// DOM Elemente
const passwordInput = document.getElementById("password-input");
const charCounter = document.getElementById("char-counter");
const rulesList = document.getElementById("rules-list");
const rulesProgress = document.getElementById("rules-progress");
const victoryCard = document.getElementById("victory-card");
const finalPassword = document.getElementById("final-password");
const resetBtn = document.getElementById("reset-btn");

// --- Hilfsfunktion zum Mischen (Fisher-Yates Shuffle) ---
function shuffleRules(rulesArray) {
    // Wir behalten die erste Regel (Länge) fix als Einstieg, und mischen den Rest
    const firstRule = rulesArray[0];
    const restOfRules = rulesArray.slice(1);
    
    for (let i = restOfRules.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [restOfRules[i], restOfRules[j]] = [restOfRules[j], restOfRules[i]];
    }
    
    return [firstRule, ...restOfRules];
}

// --- Game Logic ---

function initGame() {
    passwordInput.value = "";
    victoryCard.classList.add("hidden");

    const savedProgress = localStorage.getItem("passwordGame_progress");
    const savedOrder = localStorage.getItem("passwordGame_rulesOrder");

    if (savedProgress && savedOrder) {
        unlockedRulesCount = parseInt(savedProgress, 10);
        // Geladene IDs wieder in die entsprechenden Regel-Objekte umwandeln
        const orderIds = JSON.parse(savedOrder);
        currentGameRules = orderIds.map(id => MASTER_RULES.find(r => r.id === id));
    } else {
        // Komplett neues Spiel: Regeln mischen und Reihenfolge speichern
        unlockedRulesCount = 1;
        currentGameRules = shuffleRules([...MASTER_RULES]);
        
        const orderIds = currentGameRules.map(r => r.id);
        localStorage.setItem("passwordGame_rulesOrder", JSON.stringify(orderIds));
        localStorage.setItem("passwordGame_progress", unlockedRulesCount);
    }
    
    evaluateRules();
}

function evaluateRules() {
    const password = passwordInput.value;
    charCounter.textContent = password.length;

    let allCurrentValid = true;
    let htmlContent = "";

    // Zeige alle aktuell freigeschalteten Regeln an
    for (let i = 0; i < unlockedRulesCount; i++) {
        const rule = currentGameRules[i];
        if (!rule) continue;
        
        const isValid = rule.check(password);
        
        if (!isValid) {
            allCurrentValid = false;
        }

        const statusClass = isValid ? "valid" : "invalid";
        const icon = isValid ? "✅" : "❌";

        // Wir zeigen eine fortlaufende Nummer an (1, 2, 3...), behalten aber die interne Logik bei
        htmlContent += `
            <li class="rule-item ${statusClass}" id="rule-${rule.id}">
                <span class="status-icon">${icon}</span>
                <span class="rule-text"><strong>Regel ${i + 1}:</strong> ${rule.description}</span>
            </li>
        `;
    }

    rulesList.innerHTML = htmlContent;
    rulesProgress.textContent = `${unlockedRulesCount}/${MASTER_RULES.length}`;

    // Nächste Regel freischalten, falls alles erfüllt ist
    if (allCurrentValid && unlockedRulesCount < MASTER_RULES.length) {
        unlockedRulesCount++;
        localStorage.setItem("passwordGame_progress", unlockedRulesCount);
        
        evaluateRules();
        
        // Animation auf das neueste Element anwenden
        const nextRule = currentGameRules[unlockedRulesCount - 1];
        const newRuleElement = document.getElementById(`rule-${nextRule.id}`);
        if (newRuleElement) {
            newRuleElement.classList.add("animated");
        }
    } 
    // Siegbedingung
    else if (allCurrentValid && unlockedRulesCount === MASTER_RULES.length) {
        victoryCard.classList.remove("hidden");
        finalPassword.textContent = password;
    }
}

// --- Event Listener ---

passwordInput.addEventListener("input", evaluateRules);

resetBtn.addEventListener("click", () => {
    if (confirm("Möchtest du das Spiel wirklich zurücksetzen? Dadurch werden die Regeln komplett neu gewürfelt!")) {
        localStorage.removeItem("passwordGame_progress");
        localStorage.removeItem("passwordGame_rulesOrder");
        initGame();
    }
});

// Start des Spiels
window.addEventListener("DOMContentLoaded", initGame);
