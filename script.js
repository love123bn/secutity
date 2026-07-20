document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userIdEl = document.getElementById('userId');
    const cardHeaderEl = document.getElementById('cardHeader');
    const currentTimeEl = document.getElementById('currentTime');
    const entryTimeEl = document.getElementById('entryTime');
    const refreshBtn = document.getElementById('refreshBtn');
    const countdownTimerEl = document.getElementById('countdownTimer');
    const footerTextEl = document.getElementById('footerText');
    
    // Settings Elements
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsModal = document.getElementById('settingsModal');
    const btnCancel = document.getElementById('btnCancel');
    const btnSave = document.getElementById('btnSave');
    const bgOverlay = document.getElementById('bgOverlay');
    
    // Settings Input Elements
    const inputUserId = document.getElementById('inputUserId');
    const inputHeader = document.getElementById('inputHeader');
    const inputEntryTime = document.getElementById('inputEntryTime');
    const inputCountdown = document.getElementById('inputCountdown');
    const inputFooter = document.getElementById('inputFooter');
    const toggleBg = document.getElementById('toggleBg');

    // Default configuration values
    let config = {
        userId: 'N2632049(丁德順)',
        headerText: '您的设备已符合安全规范',
        entryTime: '', // Dynamic (default current time - 1 min)
        countdownSeconds: 60,
        footerText: '尊敬的員工您好，您已進入訊越涉密區域，出於安全考慮，您的手機攝像頭將被禁止使用，感謝您的配合。',
        useBgImage: true
    };

    // Load configuration from localStorage if available
    const savedConfig = localStorage.getItem('security_verification_config');
    if (savedConfig) {
        try {
            config = { ...config, ...JSON.parse(savedConfig) };
        } catch (e) {
            console.error('Failed to parse saved config', e);
        }
    }

    // Initialize state variables
    let countdownInterval;
    let elapsedSeconds = 0;

    // Helper functions for date formatting
    function formatClockTime(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-indexed
        const day = date.getDate();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    function formatEntryTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    function formatCountdown(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // Live clock update
    function updateClock() {
        const now = new Date();
        currentTimeEl.textContent = formatClockTime(now);
    }
    
    // Set initial UI elements based on config
    function applyConfig() {
        userIdEl.textContent = config.userId;
        cardHeaderEl.textContent = config.headerText;
        footerTextEl.textContent = config.footerText;
        
        // Background toggle
        if (config.useBgImage) {
            bgOverlay.style.display = 'block';
        } else {
            bgOverlay.style.display = 'none';
        }

        // Apply entry time
        if (config.entryTime) {
            entryTimeEl.textContent = config.entryTime;
        } else {
            // Default dynamic entry time: current time minus 1 minute
            const defaultEntry = new Date(Date.now() - 60000);
            entryTimeEl.textContent = formatEntryTime(defaultEntry);
        }
    }

    // Start/Reset Count-up Timer
    function startCountdown() {
        clearInterval(countdownInterval);
        
        let startTime = localStorage.getItem('timer_start_time');
        if (!startTime) {
            startTime = Date.now();
            localStorage.setItem('timer_start_time', startTime);
        } else {
            startTime = parseInt(startTime, 10);
        }

        const updateTimerDisplay = () => {
            const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
            countdownTimerEl.textContent = formatCountdown(elapsed);
        };

        updateTimerDisplay();

        countdownInterval = setInterval(() => {
            updateTimerDisplay();
        }, 1000);
    }

    // Initialize Page
    updateClock();
    setInterval(updateClock, 1000);
    applyConfig();
    startCountdown();

    // Refresh button event listener
    refreshBtn.addEventListener('click', () => {
        // Flash animation to visual cue success
        const bodyEl = document.querySelector('.card-body');
        bodyEl.style.transition = 'none';
        bodyEl.style.opacity = '0.5';
        setTimeout(() => {
            bodyEl.style.transition = 'opacity 0.4s ease';
            bodyEl.style.opacity = '1';
        }, 50);

        // Update entry time dynamically (current time - 1 min)
        if (!config.entryTime) {
            const defaultEntry = new Date(Date.now() - 60000);
            entryTimeEl.textContent = formatEntryTime(defaultEntry);
        }

        startCountdown();
    });

    // Double click or double tap on checkmark icon to reset start time to 0
    const checkmarkWrapper = document.querySelector('.icon-wrapper');
    if (checkmarkWrapper) {
        const resetTimer = () => {
            localStorage.setItem('timer_start_time', Date.now());

            // Flash animation to visual cue reset
            const bodyEl = document.querySelector('.card-body');
            bodyEl.style.transition = 'none';
            bodyEl.style.opacity = '0.5';
            setTimeout(() => {
                bodyEl.style.transition = 'opacity 0.4s ease';
                bodyEl.style.opacity = '1';
            }, 50);

            startCountdown();
        };

        // For desktop double click
        checkmarkWrapper.addEventListener('dblclick', resetTimer);

        // For mobile double tap (touchscreen support)
        let lastTap = 0;
        checkmarkWrapper.addEventListener('touchend', (e) => {
            const currentTime = Date.now();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                resetTimer();
                e.preventDefault(); // Prevent zoom on tap
            }
            lastTap = currentTime;
        });
    }

    // Modal Interaction
    if (settingsToggle) {
        settingsToggle.addEventListener('click', () => {
            // Load config into inputs
            inputUserId.value = config.userId;
            inputHeader.value = config.headerText;
            
            // If entryTime is blank, show empty to imply dynamic "Current time - 1 min"
            inputEntryTime.value = config.entryTime;
            inputEntryTime.placeholder = formatEntryTime(new Date(Date.now() - 60000));
            
            inputCountdown.value = config.countdownSeconds;
            inputFooter.value = config.footerText;
            toggleBg.checked = config.useBgImage;

            settingsModal.classList.add('active');
        });

        btnCancel.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });

        // Close on background click
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('active');
            }
        });

        btnSave.addEventListener('click', () => {
            // Save values from inputs
            config.userId = inputUserId.value.trim() || 'N2632049(丁德順)';
            config.headerText = inputHeader.value.trim() || '您的设备已符合安全规范';
            config.entryTime = inputEntryTime.value.trim();
            config.countdownSeconds = parseInt(inputCountdown.value, 10) || 60;
            config.footerText = inputFooter.value.trim() || '尊敬的員工您好，您已進入訊越涉密區域，出於安全考慮，您的手機攝像頭將被禁止使用，感謝您的配合。';
            config.useBgImage = toggleBg.checked;

            // Save to LocalStorage
            localStorage.setItem('security_verification_config', JSON.stringify(config));

            // Apply changes
            applyConfig();
            startCountdown();

            // Close modal
            settingsModal.classList.remove('active');
        });
    }
});
