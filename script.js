document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userIdContainer = document.getElementById('userIdContainer');
    const empIdEl = document.getElementById('empId');
    const empNameEl = document.getElementById('empName');
    const complianceCard = document.getElementById('complianceCard');
    const cardHeaderEl = document.getElementById('cardHeader');
    const qrWrapper = document.getElementById('qrWrapper');
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
        qrHeaderText: '将二维码对准扫描器刷码出场',
        entryTime: '', // Dynamic (default current time - 1 min)
        footerText: '尊敬的員工您好，您已進入訊越涉密區域，出於安全考慮，您的手機攝像頭將被禁止使用，感謝您的配合。',
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

    // Toggle between Entry mode ("您的设备已符合安全规范") and QR mode ("将二维码对准扫描器刷码出场")
    function setCardMode(isQr, animate = true) {
        if (!complianceCard) return;

        if (animate) {
            const bodyEl = document.querySelector('.card-body');
            if (bodyEl) {
                bodyEl.style.transition = 'none';
                bodyEl.style.opacity = '0.5';
                setTimeout(() => {
                    bodyEl.style.transition = 'opacity 0.35s ease';
                    bodyEl.style.opacity = '1';
                }, 40);
            }
        }

        if (isQr) {
            complianceCard.classList.add('qr-mode');
            cardHeaderEl.textContent = config.qrHeaderText || '将二维码对准扫描器刷码出场';
            localStorage.setItem('security_card_mode', 'qr');
        } else {
            complianceCard.classList.remove('qr-mode');
            cardHeaderEl.textContent = config.headerText || '您的设备已符合安全规范';
            localStorage.setItem('security_card_mode', 'entry');
        }
    }

    function toggleCardMode() {
        const isQr = complianceCard.classList.contains('qr-mode');
        setCardMode(!isQr, true);
    }
    
    // Set initial UI elements based on config
    function applyConfig() {
        if (empIdEl) empIdEl.textContent = config.empId;
        if (empNameEl) empNameEl.textContent = config.empName ? `(${config.empName})` : '';
        footerTextEl.textContent = config.footerText;
        
        // Background toggle
        if (config.useBgImage) {
            bgOverlay.style.display = 'block';
        } else {
            bgOverlay.style.display = 'none';
        }

        // Apply saved or default card mode (entry vs QR)
        const savedMode = localStorage.getItem('security_card_mode');
        setCardMode(savedMode === 'qr', false);

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

    /**
     * Unified double-tap and double-click handler for iOS Safari and Desktop
     * - Prevents iOS native double-tap to zoom
     * - Prevents synthetic dblclick double-triggering (revert bug)
     * - Filters out touch drags/scrolls
     */
    function attachDoubleTapHandler(element, callback, maxDelay = 380) {
        if (!element) return;

        let lastTapTime = 0;
        let lastTriggerTime = 0;
        let startX = 0;
        let startY = 0;
        let isTouchMove = false;

        const executeAction = (e) => {
            const now = Date.now();
            // Debounce: prevent executing again within 450ms (kills synthetic dblclick after touchend on iOS)
            if (now - lastTriggerTime < 450) {
                if (e && e.preventDefault) e.preventDefault();
                if (e && e.stopPropagation) e.stopPropagation();
                return;
            }
            lastTriggerTime = now;
            if (e && e.preventDefault) e.preventDefault();
            if (e && e.stopPropagation) e.stopPropagation();
            callback(e);
        };

        // Mobile touch handling
        element.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isTouchMove = false;
            }
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches.length === 1) {
                const diffX = Math.abs(e.touches[0].clientX - startX);
                const diffY = Math.abs(e.touches[0].clientY - startY);
                if (diffX > 10 || diffY > 10) {
                    isTouchMove = true;
                }
            }
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            if (isTouchMove) {
                lastTapTime = 0;
                return;
            }

            const now = Date.now();
            const tapLength = now - lastTapTime;

            if (tapLength > 40 && tapLength < maxDelay) {
                // Double tap detected!
                lastTapTime = 0;
                executeAction(e);
                return;
            }

            lastTapTime = now;
        }, { passive: false });

        // Desktop double click listener (and fallback for mouse users)
        element.addEventListener('dblclick', (e) => {
            executeAction(e);
        });
    }

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

        attachDoubleTapHandler(checkmarkWrapper, resetTimer);
    }

    // Double click or double tap on card header ("您的设备已符合安全规范") to toggle between Entry mode and QR mode
    if (cardHeaderEl) {
        attachDoubleTapHandler(cardHeaderEl, () => {
            toggleCardMode();
        });
    }

    // Also allow double click or double tap on QR code to toggle back
    if (qrWrapper) {
        attachDoubleTapHandler(qrWrapper, () => {
            toggleCardMode();
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

        attachDoubleTapHandler(userIdContainer, openEditUserModal);
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

    // Global prevention of iOS Safari double-tap to zoom
    let lastGlobalTouch = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastGlobalTouch <= 350) {
            const targetTag = e.target ? e.target.tagName : '';
            if (targetTag !== 'INPUT' && targetTag !== 'TEXTAREA') {
                e.preventDefault();
            }
        }
        lastGlobalTouch = now;
    }, { passive: false });

    // Prevent multi-touch gesture zooming (pinch-to-zoom) on iOS Safari
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());
});
