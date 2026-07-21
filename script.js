document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userIdContainer = document.getElementById('userIdContainer');
    const empIdEl = document.getElementById('empId');
    const empNameEl = document.getElementById('empName');
    const cardHeaderEl = document.getElementById('cardHeader');
    const currentTimeEl = document.getElementById('currentTime');
    const entryTimeEl = document.getElementById('entryTime');
    const refreshBtn = document.getElementById('refreshBtn');
    const countdownTimerEl = document.getElementById('countdownTimer');
    const footerTextEl = document.getElementById('footerText');
    
    // Settings Elements
    const bgOverlay = document.getElementById('bgOverlay');

    // Edit User ID Elements
    const editUserModal = document.getElementById('editUserModal');
    const inputEditEmpId = document.getElementById('inputEditEmpId');
    const inputEditEmpName = document.getElementById('inputEditEmpName');
    const btnEditCancel = document.getElementById('btnEditCancel');
    const btnEditSave = document.getElementById('btnEditSave');

    // Default configuration values
    let config = {
        empId: 'N2632049',
        empName: '丁德順',
        headerText: '您的设备已符合安全规范',
        entryTime: '', // Dynamic (default current time - 1 min)
        footerText: '尊敬的員工您好，您已進入訊越涉密区域，出於安全考慮，您的手機攝像頭將被禁止使用，感謝您的配合。',
        useBgImage: true
    };

    // Load configuration from localStorage if available
    const savedConfig = localStorage.getItem('security_verification_config');
    if (savedConfig) {
        try {
            const parsed = JSON.parse(savedConfig);
            // Backward compatibility for single userId field
            if (parsed.userId && !parsed.empId) {
                const match = parsed.userId.match(/^([^(]+)(?:\((.*)\))?$/);
                if (match) {
                    parsed.empId = match[1].trim();
                    parsed.empName = match[2] ? match[2].trim() : '';
                } else {
                    parsed.empId = parsed.userId;
                    parsed.empName = '';
                }
            }
            config = { ...config, ...parsed };
        } catch (e) {
            console.error('Failed to parse saved config', e);
        }
    }

    // Initialize state variables
    let countdownInterval;

    // Helper functions for date formatting
    function formatClockTime(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-indexed
        const day = date.getDate();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}  ${hours}:${minutes}:${seconds}`;
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
        if (totalSeconds >= 3600) {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    // Live clock update
    function updateClock() {
        const now = new Date();
        currentTimeEl.textContent = formatClockTime(now);
    }
    
    // Set initial UI elements based on config
    function applyConfig() {
        if (empIdEl) empIdEl.textContent = config.empId;
        if (empNameEl) empNameEl.textContent = config.empName ? `(${config.empName})` : '';
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

    // Start/Reset Count-up Timer (ticking from 00:00 onwards)
    function startCountdown() {
        clearInterval(countdownInterval);
        
        let startTime = localStorage.getItem('timer_start_time');
        if (!startTime || isNaN(parseInt(startTime, 10))) {
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
                e.preventDefault();
            }
            lastTap = currentTime;
        });
    }

    // Modal Interaction (Hidden trigger: Double click/tap on User ID)
    if (userIdContainer && editUserModal) {
        const openEditUserModal = () => {
            if (inputEditEmpId && inputEditEmpName) {
                inputEditEmpId.value = config.empId;
                inputEditEmpName.value = config.empName;
                editUserModal.classList.add('active');
                setTimeout(() => {
                    inputEditEmpId.focus();
                    inputEditEmpId.select();
                }, 100);
            }
        };

        const closeEditUserModal = () => {
            editUserModal.classList.remove('active');
        };

        const saveEditUserId = () => {
            if (inputEditEmpId && inputEditEmpName) {
                config.empId = inputEditEmpId.value.trim() || 'N2632049';
                config.empName = inputEditEmpName.value.trim() || '丁德順';
                localStorage.setItem('security_verification_config', JSON.stringify(config));
                applyConfig();
                closeEditUserModal();
            }
        };

        if (btnEditCancel) {
            btnEditCancel.addEventListener('click', closeEditUserModal);
        }

        if (btnEditSave) {
            btnEditSave.addEventListener('click', saveEditUserId);
        }

        editUserModal.addEventListener('click', (e) => {
            if (e.target === editUserModal) {
                closeEditUserModal();
            }
        });

        const handleEditKeydown = (e) => {
            if (e.key === 'Enter') {
                saveEditUserId();
            } else if (e.key === 'Escape') {
                closeEditUserModal();
            }
        };

        if (inputEditEmpId) {
            inputEditEmpId.addEventListener('keydown', handleEditKeydown);
        }
        if (inputEditEmpName) {
            inputEditEmpName.addEventListener('keydown', handleEditKeydown);
        }

        // Desktop double click on user ID container to open edit modal
        userIdContainer.addEventListener('dblclick', openEditUserModal);

        // Mobile double tap on user ID container to open edit modal
        let lastHeaderTap = 0;
        userIdContainer.addEventListener('touchend', (e) => {
            const currentTime = Date.now();
            const tapLength = currentTime - lastHeaderTap;
            if (tapLength < 300 && tapLength > 0) {
                openEditUserModal();
                e.preventDefault();
            }
            lastHeaderTap = currentTime;
        });
    }

    // Rubber-band drag/swipe effect to reveal white background
    const phoneContainer = document.getElementById('phoneContainer');
    const phoneContent = document.getElementById('phoneContent');

    if (phoneContainer && phoneContent) {
        let isDragging = false;
        let startY = 0;
        let startScrollTop = 0;
        const resistance = 0.35; // Factor for rubber-band pull

        const handleStart = (clientY) => {
            isDragging = true;
            startY = clientY;
            startScrollTop = phoneContainer.scrollTop;
            phoneContent.classList.remove('snapping');
        };

        const handleMove = (clientY, event) => {
            if (!isDragging) return;

            const deltaY = clientY - startY;
            const maxScroll = phoneContainer.scrollHeight - phoneContainer.clientHeight;

            // Pulling down at the top boundary
            if (deltaY > 0 && phoneContainer.scrollTop <= 0) {
                const overscroll = deltaY - startScrollTop;
                if (overscroll > 0) {
                    const translation = overscroll * resistance;
                    phoneContent.style.transform = `translateY(${translation}px)`;
                    phoneContainer.scrollTop = 0;
                    if (event.cancelable) event.preventDefault();
                }
            } 
            // Pulling up at the bottom boundary
            else if (deltaY < 0 && phoneContainer.scrollTop >= maxScroll - 1) {
                const overscroll = -deltaY - (maxScroll - startScrollTop);
                if (overscroll > 0) {
                    const translation = -overscroll * resistance;
                    phoneContent.style.transform = `translateY(${translation}px)`;
                    phoneContainer.scrollTop = maxScroll;
                    if (event.cancelable) event.preventDefault();
                }
            }
        };

        const handleEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            phoneContent.classList.add('snapping');
            phoneContent.style.transform = 'translateY(0)';
        };

        // Touch Events
        phoneContainer.addEventListener('touchstart', (e) => {
            handleStart(e.touches[0].clientY);
        }, { passive: true });

        phoneContainer.addEventListener('touchmove', (e) => {
            handleMove(e.touches[0].clientY, e);
        }, { passive: false });

        phoneContainer.addEventListener('touchend', handleEnd);
        phoneContainer.addEventListener('touchcancel', handleEnd);

        // Mouse Events
        phoneContainer.addEventListener('mousedown', (e) => {
            handleStart(e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            handleMove(e.clientY, e);
        });

        window.addEventListener('mouseup', handleEnd);
    }
});
