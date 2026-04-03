document.addEventListener('DOMContentLoaded', () => {
    // ===========================================
    // CONFIGURATION & STATE MANAGEMENT
    // ===========================================

    let isUnlocked = false;
    let isListening = false;
    let chatMessages = [];
    let systemMetrics = {
        cpu: 24,
        memory: 67,
        network: 'ACTIVE'
    };

    // DOM Elements
    const elements = {
        talkBtn: document.getElementById('talk-btn'),
        subtitle: document.getElementById('subtitle'),
        aiStatus: document.getElementById('ai-status'),
        chatMessages: document.getElementById('chat-messages'),
        voiceIndicator: document.getElementById('voice-indicator'),
        loadingOverlay: document.getElementById('loading-overlay'),
        cpuUsage: document.getElementById('cpu-usage'),
        memUsage: document.getElementById('mem-usage'),
        netStatus: document.getElementById('net-status')
    };

    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================

    // Show loading overlay
    function showLoading(message = 'Processing...') {
        elements.loadingOverlay.querySelector('.loading-text').textContent = message;
        elements.loadingOverlay.classList.add('active');
    }

    // Hide loading overlay
    function hideLoading() {
        elements.loadingOverlay.classList.remove('active');
    }

    // Add message to chat
    function addMessage(type, content, avatar = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';

        if (avatar) {
            avatarDiv.innerHTML = avatar;
        } else {
            avatarDiv.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = content;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timeDiv);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        elements.chatMessages.appendChild(messageDiv);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

        chatMessages.push({ type, content, timestamp: new Date() });
    }

    // Update system metrics
    function updateSystemMetrics() {
        // Simulate dynamic metrics
        systemMetrics.cpu = Math.max(10, Math.min(90, systemMetrics.cpu + (Math.random() - 0.5) * 10));
        systemMetrics.memory = Math.max(30, Math.min(95, systemMetrics.memory + (Math.random() - 0.5) * 5));

        elements.cpuUsage.textContent = Math.round(systemMetrics.cpu) + '%';
        elements.memUsage.textContent = Math.round(systemMetrics.memory) + '%';
        elements.netStatus.textContent = systemMetrics.network;
    }

    // ===========================================
    // VOICE ENGINE (Enhanced)
    // ===========================================

    function speak(text, options = {}) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Enhanced voice selection
        const getBestVoice = () => {
            const voices = window.speechSynthesis.getVoices();

            if (voices.length > 0) {
                // Priority: English voices with male/deep characteristics
                const preferredVoices = voices.filter(v =>
                    v.lang.startsWith('en') && (
                        v.name.includes('Male') ||
                        v.name.includes('David') ||
                        v.name.includes('Google UK English Male') ||
                        v.name.includes('Microsoft David') ||
                        v.name.includes('en-IN') ||
                        v.name.includes('en-US')
                    )
                );

                utterance.voice = preferredVoices[0] || voices.find(v => v.lang.startsWith('en')) || voices[0];

                // Voice settings
                utterance.pitch = options.pitch || 0.85; // Deeper tone
                utterance.rate = options.rate || 0.9; // Slightly slower
                utterance.volume = options.volume || 1.0;

                // Event handlers
                utterance.onstart = () => {
                    console.log('Speech started:', text.substring(0, 50) + '...');
                    elements.subtitle.textContent = text;
                    elements.voiceIndicator.style.display = 'none';
                };

                utterance.onend = () => {
                    console.log('Speech ended');
                    if (!isListening) {
                        startListening();
                    }
                };

                utterance.onerror = (error) => {
                    console.error('Speech error:', error);
                    if (!isListening) {
                        startListening();
                    }
                };

                window.speechSynthesis.speak(utterance);
            } else {
                // Retry if voices aren't loaded yet
                setTimeout(getBestVoice, 100);
            }
        };

        getBestVoice();
    }

    // ===========================================
    // VOICE RECOGNITION ENGINE
    // ===========================================

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    // Enhanced recognition settings
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        console.log('Voice recognition started');
        isListening = true;
        elements.voiceIndicator.style.display = 'flex';
        elements.talkBtn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Listening...</span>';
        elements.talkBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
    };

    recognition.onresult = async (event) => {
        const input = event.results[0][0].transcript.toLowerCase().trim();
        console.log("User said:", input);

        // Stop listening indicator
        isListening = false;
        elements.voiceIndicator.style.display = 'none';
        elements.talkBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Initialize Voice Link</span>';
        elements.talkBtn.style.background = '';

        // Add user message to chat
        addMessage('user', event.results[0][0].transcript);

        // Process commands
        await processVoiceCommand(input);
    };

    recognition.onerror = (error) => {
        console.error('Recognition error:', error);
        isListening = false;
        elements.voiceIndicator.style.display = 'none';
        elements.talkBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Initialize Voice Link</span>';
        elements.talkBtn.style.background = '';

        if (error.error === 'not-allowed') {
            speak("Microphone access denied. Please enable microphone permissions and try again.");
        } else {
            speak("Voice recognition error. Please try again.");
        }
    };

    recognition.onend = () => {
        console.log('Voice recognition ended');
        isListening = false;
        elements.voiceIndicator.style.display = 'none';
        elements.talkBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Initialize Voice Link</span>';
        elements.talkBtn.style.background = '';
    };

    // ===========================================
    // VOICE COMMAND PROCESSING
    // ===========================================

    async function processVoiceCommand(input) {
        // Security triggers
        if (input.includes("unlock my world")) {
            if (!isUnlocked) {
                isUnlocked = true;
                document.body.className = 'unlocked-theme';
                elements.aiStatus.textContent = "ACCESS: GRANTED";
                addMessage('system', 'Biometric override confirmed. Welcome back, Karan. Private archives are now online.', '<i class="fas fa-shield-alt"></i>');
                speak("Biometric override confirmed. Welcome back, Karan. Private archives are now online.");
            } else {
                speak("System is already unlocked.");
            }
            return;
        }

        if (input.includes("lock my world")) {
            if (isUnlocked) {
                isUnlocked = false;
                document.body.className = 'locked-theme';
                elements.aiStatus.textContent = "ACCESS: RESTRICTED";
                addMessage('system', 'Security protocols re-engaged. System is now encrypted.', '<i class="fas fa-lock"></i>');
                speak("Security protocols re-engaged. System is now encrypted.");
            } else {
                speak("System is already locked.");
            }
            return;
        }

        // Show thinking state
        showLoading('Processing neural request...');

        try {
            // Prepare API request
            const statusLabel = isUnlocked ? "UNLOCKED/PERSONAL" : "LOCKED/PROFESSIONAL";
            const prompt = `You are the AI Digital Twin of Karan Bhati.
College: GEC Jaipur (2nd Year CSE).
Projects: Pardarshi, Dariyav Grih Udyog.
Tone: Professional, helpful, and tech-savvy.
SECURITY_STATUS: ${statusLabel}
User: ${input}
AI:`;

            // Make API call
            const response = await fetch(`http://127.0.0.1:8000/chat?user_msg=${encodeURIComponent(input)}&unlocked=${isUnlocked}`);
            const data = await response.json();

            hideLoading();

            // Add AI response to chat
            addMessage('ai', data.reply);

            // Speak response
            speak(data.reply);

        } catch (error) {
            console.error("Backend Error:", error);
            hideLoading();

            const errorMessage = "Connection lost with the neural core. Please check the Python server.";
            addMessage('system', errorMessage, '<i class="fas fa-exclamation-triangle"></i>');
            speak(errorMessage);
        }
    }

    // ===========================================
    // VOICE CONTROL FUNCTIONS
    // ===========================================

    function startListening() {
        if (!isListening) {
            try {
                recognition.start();
            } catch (error) {
                console.log("Cannot start listening:", error);
                speak("Voice recognition is not ready. Please click the voice button to initialize.");
            }
        }
    }

    function stopListening() {
        if (isListening) {
            recognition.stop();
        }
    }

    // ===========================================
    // EVENT LISTENERS
    // ===========================================

    // Voice button click
    elements.talkBtn.addEventListener('click', () => {
        console.log("Initializing voice link...");

        // Play startup sound
        const startupSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        startupSound.play().catch(() => console.log("Sound interaction required."));

        // Show loading
        showLoading('Initializing Neural Link...');

        setTimeout(() => {
            hideLoading();
            elements.aiStatus.textContent = "SYSTEM: ONLINE";
            addMessage('system', 'System handshake complete. Voice interface activated.', '<i class="fas fa-power-off"></i>');
            speak("System Handshake Complete. I am the AI Twin of Karan Bhati. How can I help you?");

            // Auto-start listening after initialization
            setTimeout(() => {
                startListening();
            }, 1000);
        }, 1500);
    });

    // Quick action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;

            switch (action) {
                case 'help':
                    addMessage('system', 'Available commands: "unlock my world", "lock my world", or ask questions about Karan.', '<i class="fas fa-info-circle"></i>');
                    speak("Here are some commands you can try: unlock my world, lock my world, or ask me questions about Karan.");
                    break;
                case 'settings':
                    addMessage('system', 'Settings panel not implemented yet. Voice commands are the primary interface.', '<i class="fas fa-cog"></i>');
                    speak("Settings panel is not available in this version. Please use voice commands.");
                    break;
                case 'reset':
                    if (confirm('Reset the system? This will clear chat history and reset to locked mode.')) {
                        isUnlocked = false;
                        document.body.className = 'locked-theme';
                        elements.aiStatus.textContent = "ACCESS: RESTRICTED";
                        elements.chatMessages.innerHTML = '';
                        chatMessages = [];
                        addMessage('system', 'System reset complete. All data cleared.', '<i class="fas fa-redo"></i>');
                        speak("System has been reset. Starting fresh.");
                    }
                    break;
            }
        });
    });

    // ===========================================
    // INITIALIZATION
    // ===========================================

    // Initialize system metrics updates
    setInterval(updateSystemMetrics, 3000);

    // Add welcome message
    addMessage('system', 'AI Digital Twin System initialized. Click "Initialize Voice Link" to begin.', '<i class="fas fa-robot"></i>');

    // Preload voices
    window.speechSynthesis.getVoices();

    console.log('Karan Bhati AI OS initialized successfully');
});