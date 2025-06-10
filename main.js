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
const timerContainer = document.getElementById('timerContainer');
const topicDisplay = document.getElementById('topicDisplay');
const timer = document.getElementById('timer');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const nextBtn = document.getElementById('nextBtn');
const questionBtn = document.getElementById('questionBtn');
const speechBtn = document.getElementById('speechBtn');
const defaultBtn = document.getElementById('defaultBtn'); // Кнопка "Уст. время"
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
const speechSecondsInput = document.getElementById('speechSecondsInput');
const conclusionTimeInput = document.getElementById('conclusionTimeInput');
const conclusionSecondsInput = document.getElementById('conclusionSecondsInput');
const prepTimeInput = document.getElementById('prepTimeInput');
const prepSecondsInput = document.getElementById('prepSecondsInput');
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
    customTime: 5*60, // Теперь храним в секундах
    protectedTime: 0,
    useProtectedTime: false,
    questionTime: 15,
    speechTime: 2*60, // Теперь храним в секундах
    conclusionTime: 0, // Теперь храним в секундах
    prepTime: 20 * 60, // Теперь храним в секундах
    noGadgetTime: 0,
    soundEnabled: false
};

// Initialize from localStorage
const savedTopic = localStorage.getItem('debateTopic');
if (savedTopic) {
    topicDisplay.textContent = savedTopic;
} else {
    topicDisplay.textContent = "Введите тему";
}

// Показываем таймер сразу
timerContainer.style.display = 'flex';

const savedSettings = localStorage.getItem('timerSettings');
if (savedSettings) {
    settings = { ...settings, ...JSON.parse(savedSettings) };
    updateSettingsInputs();
}

// Event listeners
topicDisplay.addEventListener('click', function() {
    // Создаем поле ввода
    const input = document.createElement('input');
    input.type = 'text';
    input.value = topicDisplay.textContent === "Нажмите, чтобы добавить тему" ? "" : topicDisplay.textContent;
    input.placeholder = "Введите тему дебатов";
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.fontSize = '16px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.boxSizing = 'border-box';
    
    // Заменяем отображение темы на поле ввода
    topicDisplay.innerHTML = '';
    topicDisplay.appendChild(input);
    
    // Фокусируемся на поле ввода
    input.focus();
    
    // Обработка ввода темы
    function saveTopic() {
        const topic = input.value.trim();
        if (topic) {
            localStorage.setItem('debateTopic', topic);
            topicDisplay.textContent = topic;
        } else {
            topicDisplay.textContent = savedTopic || "Нажмите, чтобы добавить тему";
        }
    }
    
    // Обработчики событий
    input.addEventListener('blur', saveTopic);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveTopic();
        }
    });
});

startPauseBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
nextBtn.addEventListener('click', nextTimer);
questionBtn.addEventListener('click', startQuestion);
speechBtn.addEventListener('click', () => setMode('speech'));
defaultBtn.addEventListener('click', openSetSpeechTime); // Только открывает настройку времени
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

// Добавляем возможность редактировать время прямо в таймере при паузе
timer.addEventListener('click', function(e) {
    if (!isRunning && !isQuestionMode) {
        // Получаем координаты клика
        const rect = timer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        // Получаем текущие минуты и секунды
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        
        // Создаем контейнер для раздельного ввода минут и секунд
        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.width = '100%';
        inputContainer.style.height = '100%';
        inputContainer.style.alignItems = 'center';
        inputContainer.style.justifyContent = 'center';
        inputContainer.style.gap = '5px';
        
        // Создаем поле ввода для минут (используем text вместо number)
        const minutesInput = document.createElement('input');
        minutesInput.type = 'text';
        minutesInput.value = minutes.toString().padStart(2, '0');
        minutesInput.style.width = '40%';
        minutesInput.style.backgroundColor = 'transparent';
        minutesInput.style.color = 'inherit';
        minutesInput.style.fontSize = 'inherit';
        minutesInput.style.textAlign = 'right';
        minutesInput.style.border = 'none';
        minutesInput.style.outline = 'none';
        minutesInput.style.padding = '0';
        minutesInput.style.margin = '0';
        minutesInput.style.appearance = 'textfield';
        minutesInput.style.MozAppearance = 'textfield';
        minutesInput.style.webkitAppearance = 'textfield';
        
        // Создаем разделитель
        const separator = document.createElement('span');
        separator.textContent = ':';
        separator.style.fontSize = 'inherit';
        
        // Создаем поле ввода для секунд (используем text вместо number)
        const secondsInput = document.createElement('input');
        secondsInput.type = 'text';
        secondsInput.value = seconds.toString().padStart(2, '0');
        secondsInput.style.width = '40%';
        secondsInput.style.backgroundColor = 'transparent';
        secondsInput.style.color = 'inherit';
        secondsInput.style.fontSize = 'inherit';
        secondsInput.style.textAlign = 'left';
        secondsInput.style.border = 'none';
        secondsInput.style.outline = 'none';
        secondsInput.style.padding = '0';
        secondsInput.style.margin = '0';
        secondsInput.style.appearance = 'textfield';
        secondsInput.style.MozAppearance = 'textfield';
        secondsInput.style.webkitAppearance = 'textfield';
        
        // Собираем контейнер
        inputContainer.appendChild(minutesInput);
        inputContainer.appendChild(separator);
        inputContainer.appendChild(secondsInput);
        
        // Очищаем таймер и добавляем контейнер
        timer.innerHTML = '';
        timer.appendChild(inputContainer);
        
        // Определяем, на какое поле установить фокус в зависимости от положения клика
        const timerWidth = rect.width;
        if (clickX > timerWidth / 2) {
            // Клик был справа - фокусируемся на секундах
            secondsInput.focus();
            secondsInput.select();
        } else {
            // Клик был слева - фокусируемся на минутах
            minutesInput.focus();
            minutesInput.select();
        }
        
        // Функция для применения изменений
        function commitTimeChange() {
            // Получаем значения и преобразуем в числа
            let mins = parseInt(minutesInput.value) || 0;
            let secs = parseInt(secondsInput.value) || 0;
            
            // Проверка и корректировка значений
            if (secs >= 60) {
                mins += Math.floor(secs / 60);
                secs = secs % 60;
            }
            
            // Ограничение минут до 99
            mins = Math.min(mins, 99);
            
            // Обновляем время
            currentTime = mins * 60 + secs;
            
            // В режиме custom также обновляем настройки
            if (currentMode === 'custom') {
                settings.customTime = Math.ceil(currentTime / 60);
                localStorage.setItem('timerSettings', JSON.stringify(settings));
            }
            
            // Удаляем контейнер и обновляем таймер
            if (timer.contains(inputContainer)) {
                timer.removeChild(inputContainer);
                updateDisplay();
            }
        }
        
        // Разрешаем только цифры в полях ввода
        function allowOnlyDigits(e) {
            // Разрешаем только цифры, стрелки, Tab, Backspace, Delete
            const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace', 'Delete'];
            if (!allowedKeys.includes(e.key)) {
                e.preventDefault();
            }
        }
        
        minutesInput.addEventListener('keydown', allowOnlyDigits);
        secondsInput.addEventListener('keydown', allowOnlyDigits);
        
        // Обработчики событий
        minutesInput.addEventListener('blur', function(e) {
            // Не применяем изменения, если фокус перешел на secondsInput
            if (e.relatedTarget !== secondsInput) {
                commitTimeChange();
            }
        });
        
        secondsInput.addEventListener('blur', function(e) {
            // Не применяем изменения, если фокус перешел на minutesInput
            if (e.relatedTarget !== minutesInput) {
                commitTimeChange();
            }
        });
        
        minutesInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                secondsInput.focus();
                secondsInput.select();
            }
        });
        
        secondsInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                commitTimeChange();
            }
        });
        
        // При клике вне полей ввода
        document.addEventListener('mousedown', function handleClickOutside(e) {
            if (!inputContainer.contains(e.target) && e.target !== inputContainer) {
                commitTimeChange();
                document.removeEventListener('mousedown', handleClickOutside);
            }
        });
    }
});

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

// Функция для кнопки "Следующий"
function nextTimer() {
    // Проверяем, есть ли оставшееся время
    if (currentTime > 0) {
        // Добавляем основное время к оставшемуся
        switch (currentMode) {
            case 'speech':
                currentTime += settings.speechTime;
                break;
            case 'prep':
                currentTime += settings.prepTime;
                break;
            case 'custom':
                currentTime += settings.customTime;
                break;
        }
        
        // Обновляем отображение
        updateDisplay();
        
        // Если таймер был на паузе, запускаем его
        if (!isRunning) {
            startTimer();
            startPauseBtn.textContent = '⏸';
        }
    } else {
        // Если время закончилось, просто запускаем таймер заново
        resetTimer();
        startTimer();
        startPauseBtn.textContent = '⏸';
    }
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
    defaultBtn.classList.remove('active');
    prepBtn.classList.remove('active');
    customBtn.classList.remove('active');

    switch (currentMode) {
        case 'speech':
            speechBtn.classList.add('active');
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
            totalTime = settings.speechTime;
            break;
        case 'prep':
            totalTime = settings.prepTime;
            break;
        case 'custom':
            totalTime = settings.customTime;
            break;
    }
    currentTime = totalTime;
    hasStarted = false;
    updateDisplay();
}

// Функция для установки времени речи
function openSetSpeechTime() {
    // Получаем текущие значения минут и секунд
    const currentMinutes = Math.floor(settings.speechTime / 60);
    const currentSeconds = settings.speechTime % 60;
    
    // Создаем контейнер для раздельного ввода минут и секунд
    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.alignItems = 'center';
    inputContainer.style.justifyContent = 'center';
    inputContainer.style.gap = '10px';
    inputContainer.style.width = '100%';
    
    // Создаем поле ввода для минут
    const minutesInput = document.createElement('input');
    minutesInput.type = 'number';
    minutesInput.value = currentMinutes;
    minutesInput.min = '0';
    minutesInput.max = '60';
    minutesInput.style.width = '60px';
    minutesInput.style.padding = '5px';
    minutesInput.style.textAlign = 'center';
    
    // Создаем поле ввода для секунд
    const secondsInput = document.createElement('input');
    secondsInput.type = 'number';
    secondsInput.value = currentSeconds;
    secondsInput.min = '0';
    secondsInput.max = '59';
    secondsInput.style.width = '60px';
    secondsInput.style.padding = '5px';
    secondsInput.style.textAlign = 'center';
    
    // Добавляем метки
    const minutesLabel = document.createElement('span');
    minutesLabel.textContent = 'мин';
    
    const secondsLabel = document.createElement('span');
    secondsLabel.textContent = 'сек';
    
    // Собираем контейнер
    inputContainer.appendChild(minutesInput);
    inputContainer.appendChild(minutesLabel);
    inputContainer.appendChild(secondsInput);
    inputContainer.appendChild(secondsLabel);
    
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    
    const content = document.createElement('div');
    content.style.backgroundColor = '#fff';
    content.style.padding = '20px';
    content.style.borderRadius = '5px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '15px';
    
    const title = document.createElement('h3');
    title.textContent = 'Установить время речи';
    title.style.margin = '0';
    title.style.textAlign = 'center';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'center';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Сохранить';
    saveButton.classList.add('settings-btn');
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Отмена';
    cancelButton.classList.add('settings-btn');
    
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    
    content.appendChild(title);
    content.appendChild(inputContainer);
    content.appendChild(buttonContainer);
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    minutesInput.focus();
    
    saveButton.addEventListener('click', function() {
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        
        // Проверка и корректировка значений
        let totalSeconds = minutes * 60 + seconds;
        if (totalSeconds <= 0) {
            totalSeconds = 60; // Минимум 1 минута
        }
        
        settings.speechTime = totalSeconds;
        localStorage.setItem('timerSettings', JSON.stringify(settings));
        
        if (currentMode === 'speech') {
            setMode('speech');
        }
        
        document.body.removeChild(modal);
    });
    
    cancelButton.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
}

function updateSettingsInputs() {
    settingsTopicInput.value = topicDisplay.textContent;
    
    // Обновляем поля ввода минут и секунд
    customTimeInput.value = Math.floor(settings.customTime / 60);
    
    speechTimeInput.value = Math.floor(settings.speechTime / 60);
    speechSecondsInput.value = settings.speechTime % 60;
    
    conclusionTimeInput.value = Math.floor(settings.conclusionTime / 60);
    conclusionSecondsInput.value = settings.conclusionTime % 60;
    
    prepTimeInput.value = Math.floor(settings.prepTime / 60);
    prepSecondsInput.value = settings.prepTime % 60;
    
//    noGadgetTimeInput.value = settings.noGadgetTime;
//    protectedTimeInput.value = settings.protectedTime;
//    protectedTimeCheckbox.checked = settings.useProtectedTime;
    questionTimeInput.value = settings.questionTime;
    soundEnabledCheckbox.checked = settings.soundEnabled;
}

function saveSettings() {
    // Преобразуем минуты в секунды для хранения
    settings.customTime = (parseInt(customTimeInput.value) || 1) * 60;
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
    // Преобразуем минуты и секунды в общее количество секунд
    const speechMinutes = parseInt(speechTimeInput.value) || 0;
    const speechSeconds = parseInt(speechSecondsInput.value) || 0;
    settings.speechTime = speechMinutes * 60 + speechSeconds;
    if (settings.speechTime < 1) settings.speechTime = 60; // Минимум 1 минута
    
    const conclusionMinutes = parseInt(conclusionTimeInput.value) || 0;
    const conclusionSeconds = parseInt(conclusionSecondsInput.value) || 0;
    settings.conclusionTime = conclusionMinutes * 60 + conclusionSeconds;
    if (settings.conclusionTime < 1) settings.conclusionTime = 60; // Минимум 1 минута
    
    const prepMinutes = parseInt(prepTimeInput.value) || 0;
    const prepSeconds = parseInt(prepSecondsInput.value) || 0;
    settings.prepTime = prepMinutes * 60 + prepSeconds;
    if (settings.prepTime < 1) settings.prepTime = 60; // Минимум 1 минута
    
//    settings.noGadgetTime = parseInt(noGadgetTimeInput.value) || 0;
//    settings.protectedTime = parseInt(protectedTimeInput.value) || 0;
//    settings.useProtectedTime = protectedTimeCheckbox.checked;
    settings.questionTime = parseInt(questionTimeInput.value) || 20;

    localStorage.setItem('timerSettings', JSON.stringify(settings));
    advancedSettingsModal.style.display = 'none';
    settingsModal.style.display = 'flex';

    // Update timer if we're in a relevant mode
    if (currentMode !== 'custom') {
        setMode(currentMode);
    }
}'none';
   // settingsModal.style.display = 'flex';

    // Update timer if we're in a relevant mode
    if (currentMode !== 'custom') {
        setMode(currentMode);
    }


// Function to play sound if enabled
function playSound(sound) {
    if (settings.soundEnabled) {
        sound.play();
    }
}

const style = document.createElement('style');
style.textContent = `
    .btn.mode.active {
        background-color: var(--success-color);
    }
    
    .timer {
        cursor: pointer;
        font-size: 14rem; /* Увеличиваем размер таймера */
        font-weight: bold;
        margin: 1rem 0; /* Уменьшаем отступы сверху и снизу */
    }
    
    #topicDisplay {
        background: none !important;
        cursor: pointer;
        padding: 8px;
        text-align: center;
        border-radius: 4px;
        transition: background-color 0.2s;
        margin-bottom: 0; /* Уменьшаем отступ снизу */
    }
    
    #topicDisplay:hover {
        background-color: rgba(0, 0, 0, 0.05) !important;
    }
    
    /* Уменьшаем расстояние между элементами */
    .main-container {
        gap: 0.5rem !important; /* Уменьшаем расстояние между блоками */
    }
    
    .timer-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem !important; /* Уменьшаем расстояние между элементами внутри контейнера */
    }
    
    .logos {
        margin-bottom: 0.5rem; /* Уменьшаем отступ снизу у логотипов */
    }
    
    /* Скрываем стрелки в числовых полях ввода */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    input[type="number"] {
        -moz-appearance: textfield;
    }
`;
document.head.appendChild(style);



// Initial setup
setMode('speech');