// Sound file paths
const SOUND_PATHS = {
    START: 'sounds/gong.wav',
    STOP_POINT: 'sounds/gong.wav',
    END_SHORT: 'sounds/short.wav',
    END: 'sounds/gong.wav'
};

// Audio elements
const startSignal = new Audio(SOUND_PATHS.START);
const stopPoint = new Audio(SOUND_PATHS.STOP_POINT);
const endShortSignal = new Audio(SOUND_PATHS.END_SHORT);
const endSignal = new Audio(SOUND_PATHS.END);

// DOM elements
const topicInput = document.getElementById('topicInput');
const timerContainer = document.getElementById('timerContainer');
const topicDisplay = document.getElementById('topicDisplay');
const timer = document.getElementById('timer');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const questionBtn = document.getElementById('questionBtn');
const speechBtn = document.getElementById('speechBtn');
const conclusionBtn = document.getElementById('conclusionBtn');
const prepBtn = document.getElementById('prepBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsTopicInput = document.getElementById('settingsTopicInput');
const customTimeInput = document.getElementById('customTimeInput');
const protectedTimeInput = document.getElementById('protectedTimeInput');
const protectedTimeCheckbox = document.getElementById('protectedTimeCheckbox');
const questionTimeInput = document.getElementById('questionTimeInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const backBtn = document.getElementById('backBtn');
const customBtn = document.getElementById('customBtn');
const advancedSettingsBtn = document.getElementById('advancedSettingsBtn');
const advancedSettingsModal = document.getElementById('advancedSettingsModal');
const speechTimeInput = document.getElementById('speechTimeInput');
const conclusionTimeInput = document.getElementById('conclusionTimeInput');
const prepTimeInput = document.getElementById('prepTimeInput');
const noGadgetTimeInput = document.getElementById('noGadgetTimeInput');
const saveAdvancedSettingsBtn = document.getElementById('saveAdvancedSettingsBtn');
const backAdvancedBtn = document.getElementById('backAdvancedBtn');
const soundEnabledCheckbox = document.getElementById('soundEnabledCheckbox');

// State variables
let currentTime = 0;
let totalTime = 0;
let isRunning = false;
let isQuestionMode = false;
let timerInterval;
let questionInterval;
let currentMode = 'speech';
let hasStarted = false;
let settings = {
    customTime: 4,
    protectedTime: 30,
    useProtectedTime: true,
    questionTime: 10,
    speechTime: 4,
    conclusionTime: 2,
    prepTime: 10,
    noGadgetTime: 3,
    soundEnabled: true
};

// Initialize from localStorage
const savedTopic = localStorage.getItem('debateTopic');
if (savedTopic) {
    topicInput.value = savedTopic;
    topicDisplay.textContent = savedTopic;
    timerContainer.style.display = 'flex';
    topicInput.style.display = 'none';
}

const savedSettings = localStorage.getItem('timerSettings');
if (savedSettings) {
    settings = { ...settings, ...JSON.parse(savedSettings) };
    updateSettingsInputs();
}

// Event listeners
topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && topicInput.value.trim()) {
        const topic = topicInput.value.trim();
        localStorage.setItem('debateTopic', topic);
        topicDisplay.textContent = topic;
        timerContainer.style.display = 'flex';
        topicInput.style.display = 'none';
    }
});

startPauseBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
questionBtn.addEventListener('click', startQuestion);
speechBtn.addEventListener('click', () => setMode('speech'));
conclusionBtn.addEventListener('click', () => setMode('conclusion'));
prepBtn.addEventListener('click', () => setMode('prep'));
customBtn.addEventListener('click', () => setMode('custom'));
settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
saveSettingsBtn.addEventListener('click', saveSettings);
backBtn.addEventListener('click', () => settingsModal.style.display = 'none');
advancedSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
    advancedSettingsModal.style.display = 'flex';
});
backAdvancedBtn.addEventListener('click', () => {
    advancedSettingsModal.style.display = 'none';
    settingsModal.style.display = 'flex';
});
saveAdvancedSettingsBtn.addEventListener('click', saveAdvancedSettings);

// Functions
function toggleTimer() {
    if (isQuestionMode) {
        // If in question mode, skip to the end of question immediately
        clearInterval(questionInterval);
        isQuestionMode = false;
        timer.classList.remove('success');

        // Restore main timer state without playing sound
        currentTime = currentTime + 3;
        updateDisplay();
        return;
    }

    if (isRunning) {
        pauseTimer();
        startPauseBtn.textContent = '▶';
    } else {
        startTimer();
        startPauseBtn.textContent = '⏸';
    }
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        if (!hasStarted) {
            playSound(startSignal);
            hasStarted = true;
        }
        timerInterval = setInterval(updateTimer, 1000);
    }
}

function pauseTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
    }
}

function resetTimer() {
    pauseTimer();
    currentTime = totalTime;
    updateDisplay();
    startPauseBtn.textContent = '▶';
    hasStarted = false;
}

function updateTimer() {
    if (currentTime > 0) {
        currentTime--;
        updateDisplay();

        if (currentTime <= 10 && !isQuestionMode) {
            timer.classList.add('warning');
            playSound(endShortSignal);
        }

        if (currentTime === 0) {
            endTimer();
        }
    }
}

function updateDisplay() {
    if (isQuestionMode) {
        return; // Don't update display during question mode
    }

    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Remove all classes first
    timer.classList.remove('protected', 'warning', 'success');

    if (currentMode === 'speech' && settings.useProtectedTime) {
        if (currentTime <= settings.protectedTime ||
            currentTime >= totalTime - settings.protectedTime) {
            timer.classList.add('protected');
        }
    } else if (currentMode === 'prep') {
        if (currentTime <= settings.noGadgetTime * 60) {
            timer.classList.add('warning');
        }
    }

    // Update button styles
    speechBtn.classList.remove('active');
    conclusionBtn.classList.remove('active');
    prepBtn.classList.remove('active');
    customBtn.classList.remove('active');

    switch (currentMode) {
        case 'speech':
            speechBtn.classList.add('active');
            break;
        case 'conclusion':
            conclusionBtn.classList.add('active');
            break;
        case 'prep':
            prepBtn.classList.add('active');
            break;
        case 'custom':
            customBtn.classList.add('active');
            break;
    }
}

function endTimer() {
    pauseTimer();
    timer.classList.add('warning');
    playSound(endSignal);
}

function startQuestion() {
    if (isQuestionMode) return;

    isQuestionMode = true;
    const questionTime = settings.questionTime;
    const mainTime = currentTime;

    // Start question countdown immediately
    let questionCountdown = questionTime;
    timer.classList.remove('warning', 'protected');
    timer.classList.add('success');

    function updateQuestionDisplay() {
        timer.textContent = `00:${questionCountdown.toString().padStart(2, '0')}`;
    }

    updateQuestionDisplay();

    questionInterval = setInterval(() => {
        if (questionCountdown > 0) {
            questionCountdown--;
            updateQuestionDisplay();
        } else {
            clearInterval(questionInterval);
            isQuestionMode = false;
            timer.classList.remove('success');
            playSound(stopPoint);

            // Add 3 seconds to the main timer
            currentTime = mainTime + 3;
            updateDisplay();
        }
    }, 1000);
}

function setMode(mode) {
    currentMode = mode;
    switch (mode) {
        case 'speech':
            totalTime = settings.speechTime * 60;
            break;
        case 'conclusion':
            totalTime = settings.conclusionTime * 60;
            break;
        case 'prep':
            totalTime = settings.prepTime * 60;
            break;
        case 'custom':
            totalTime = settings.customTime * 60;
            break;
    }
    currentTime = totalTime;
    hasStarted = false;
    updateDisplay();
}

function updateSettingsInputs() {
    settingsTopicInput.value = topicDisplay.textContent;
    customTimeInput.value = settings.customTime;
    speechTimeInput.value = settings.speechTime;
    conclusionTimeInput.value = settings.conclusionTime;
    prepTimeInput.value = settings.prepTime;
    noGadgetTimeInput.value = settings.noGadgetTime;
    protectedTimeInput.value = settings.protectedTime;
    protectedTimeCheckbox.checked = settings.useProtectedTime;
    questionTimeInput.value = settings.questionTime;
    soundEnabledCheckbox.checked = settings.soundEnabled;
}

function saveSettings() {
    settings.customTime = parseInt(customTimeInput.value) || 5;
    settings.soundEnabled = soundEnabledCheckbox.checked;

    const newTopic = settingsTopicInput.value.trim();
    if (newTopic) {
        localStorage.setItem('debateTopic', newTopic);
        topicDisplay.textContent = newTopic;
    }

    localStorage.setItem('timerSettings', JSON.stringify(settings));
    settingsModal.style.display = 'none';

    // Update timer if we're in custom mode
    if (currentMode === 'custom') {
        setMode('custom');
    }
}

function saveAdvancedSettings() {
    settings.speechTime = parseInt(speechTimeInput.value) || 4;
    settings.conclusionTime = parseInt(conclusionTimeInput.value) || 2;
    settings.prepTime = parseInt(prepTimeInput.value) || 10;
    settings.noGadgetTime = parseInt(noGadgetTimeInput.value) || 3;
    settings.protectedTime = parseInt(protectedTimeInput.value) || 30;
    settings.useProtectedTime = protectedTimeCheckbox.checked;
    settings.questionTime = parseInt(questionTimeInput.value) || 10;

    localStorage.setItem('timerSettings', JSON.stringify(settings));
    advancedSettingsModal.style.display = 'none';
    settingsModal.style.display = 'flex';

    // Update timer if we're in a relevant mode
    if (currentMode !== 'custom') {
        setMode(currentMode);
    }
}

// Function to play sound if enabled
function playSound(sound) {
    if (settings.soundEnabled) {
        sound.play();
    }
}

// Add styles for active button state
const style = document.createElement('style');
style.textContent = `
    .btn.mode.active {
        background-color: var(--success-color);
    }
`;
document.head.appendChild(style);

// Initial setup
setMode('speech');