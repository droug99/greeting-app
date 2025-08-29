/**
 * James Bond Greeting App
 * A modern greeting app with fireworks, confetti, and self-destruct countdown
 */

// ===== CONFIGURATION CONSTANTS =====
const CONFIG = {
    BUTTON_DISABLE_DURATION: 9000,
    SELF_DESTRUCT_DELAY: 2000,
    COUNTDOWN_DURATION: 5,
    FIREWORKS: {
        COUNT: 15,
        STAGGER_DELAY: 100,
        CLEANUP_DELAY: 4000,
        COLORS: ['red', 'blue', 'green', 'yellow', 'purple', 'pink']
    },
    CONFETTI: {
        COUNT: 150,
        CLEANUP_DELAY: 6000,
        COLORS: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6']
    }
};

const GREETINGS = {
    morning: [
        "Good morning, {name}! Let's have a great day.",
        "Top of the morning to you, {name}!",
        "Hello {name}, you're starting your day off right!"
    ],
    afternoon: [
        "Good afternoon, {name}! Hope you're having a productive day.",
        "Hey there, {name}! Taking a well-deserved break?",
        "Hello, {name}! The afternoon is full of possibilities."
    ],
    evening: [
        "Good evening, {name}! Time to unwind.",
        "Hello, {name}! Hope you had a wonderful day.",
        "Welcome, {name}! Enjoy your evening."
    ]
};

// ===== GLOBAL STATE =====
let audioContext = null;
let isProcessing = false;

// ===== LOCAL STORAGE UTILITIES =====

/**
 * Local storage key constants
 */
const STORAGE_KEYS = {
    USER_NAME: 'greetingApp_userName',
    EFFECT_PREFERENCE: 'greetingApp_effectPreference',
    VISIT_COUNT: 'greetingApp_visitCount',
    LAST_VISIT: 'greetingApp_lastVisit'
};

/**
 * Save user data to local storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
    }
}

/**
 * Load user data from local storage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Stored value or default
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Save user preferences
 * @param {string} name - User's name
 * @param {boolean} effectPreference - True for confetti, false for fireworks
 */
function saveUserPreferences(name, effectPreference) {
    saveToStorage(STORAGE_KEYS.USER_NAME, name);
    saveToStorage(STORAGE_KEYS.EFFECT_PREFERENCE, effectPreference);
    
    // Update visit tracking
    const visitCount = loadFromStorage(STORAGE_KEYS.VISIT_COUNT, 0) + 1;
    saveToStorage(STORAGE_KEYS.VISIT_COUNT, visitCount);
    saveToStorage(STORAGE_KEYS.LAST_VISIT, new Date().toISOString());
}

/**
 * Check if user is returning
 * @returns {boolean} True if user has visited before
 */
function isReturningUser() {
    return loadFromStorage(STORAGE_KEYS.USER_NAME) !== null;
}

/**
 * Get stored user data
 * @returns {Object} User data object
 */
function getStoredUserData() {
    return {
        name: loadFromStorage(STORAGE_KEYS.USER_NAME),
        effectPreference: loadFromStorage(STORAGE_KEYS.EFFECT_PREFERENCE, false),
        visitCount: loadFromStorage(STORAGE_KEYS.VISIT_COUNT, 0),
        lastVisit: loadFromStorage(STORAGE_KEYS.LAST_VISIT)
    };
}

// ===== API INTEGRATION =====

/**
 * Multi-language translations for "Hello"
 */
const HELLO_TRANSLATIONS = [
    { language: 'English', greeting: 'Hello' },
    { language: 'Spanish', greeting: 'Hola' },
    { language: 'French', greeting: 'Bonjour' },
    { language: 'German', greeting: 'Hallo' },
    { language: 'Italian', greeting: 'Ciao' },
    { language: 'Portuguese', greeting: 'Olá' },
    { language: 'Russian', greeting: 'Привет' },
    { language: 'Japanese', greeting: 'こんにちは' },
    { language: 'Korean', greeting: '안녕하세요' },
    { language: 'Chinese', greeting: '你好' },
    { language: 'Arabic', greeting: 'مرحبا' },
    { language: 'Hindi', greeting: 'नमस्ते' },
    { language: 'Dutch', greeting: 'Hallo' },
    { language: 'Swedish', greeting: 'Hej' },
    { language: 'Norwegian', greeting: 'Hei' },
    { language: 'Finnish', greeting: 'Hei' },
    { language: 'Greek', greeting: 'Γεια σας' },
    { language: 'Turkish', greeting: 'Merhaba' },
    { language: 'Polish', greeting: 'Cześć' },
    { language: 'Czech', greeting: 'Ahoj' }
];

/**
 * Fetch quote of the day from API
 * @returns {Promise<Object>} Quote object with text and author
 */
async function fetchQuoteOfTheDay() {
    try {
        const response = await fetch('https://api.quotable.io/random?minLength=50&maxLength=150');
        if (!response.ok) {
            throw new Error('Quote API request failed');
        }
        const data = await response.json();
        return {
            text: data.content,
            author: data.author
        };
    } catch (error) {
        console.warn('Failed to fetch quote:', error);
        // Fallback quotes
        const fallbackQuotes = [
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
            { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
            { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
            { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" }
        ];
        const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
        return fallbackQuotes[randomIndex];
    }
}

/**
 * Get a random "Hello" translation
 * @returns {Object} Translation object with language and greeting
 */
function getRandomHelloTranslation() {
    const randomIndex = Math.floor(Math.random() * HELLO_TRANSLATIONS.length);
    return HELLO_TRANSLATIONS[randomIndex];
}

/**
 * Create enhanced greeting with translation and quote
 * @param {string} name - User's name
 * @param {Object} translation - Translation object
 * @param {Object} quote - Quote object
 * @returns {string} Enhanced greeting HTML
 */
function createEnhancedGreeting(name, translation, quote) {
    const userData = getStoredUserData();
    const isReturning = isReturningUser() && userData.visitCount > 1;
    
    let mainGreeting;
    
    if (isReturning) {
        const welcomeBackMessages = [
            `${translation.greeting}, ${name}! Welcome back! Great to see you again! 🎉`,
            `${translation.greeting}, ${name}! You're back! Hope you're having an amazing day! ✨`,
            `${translation.greeting}, ${name}! Welcome back to the party! 🎊`,
            `${translation.greeting}, ${name}! So good to see you return! Ready for more fun? 🚀`
        ];
        const randomIndex = Math.floor(Math.random() * welcomeBackMessages.length);
        mainGreeting = welcomeBackMessages[randomIndex];
    } else {
        // Use translation in regular greetings
        const currentHour = new Date().getHours();
        let timeGreeting;
        
        if (currentHour < 12) {
            timeGreeting = `Good morning, ${name}! Let's have a great day.`;
        } else if (currentHour < 18) {
            timeGreeting = `Good afternoon, ${name}! Hope you're having a productive day.`;
        } else {
            timeGreeting = `Good evening, ${name}! Time to unwind.`;
        }
        
        mainGreeting = `${translation.greeting}, ${name}! ${timeGreeting.split('!')[1]}`;
    }
    
    return `
        <div class="enhanced-greeting">
            <div class="main-greeting">${mainGreeting}</div>
            <div class="translation-info">That's "Hello" in ${translation.language}! 🌍</div>
            <div class="quote-section">
                <div class="quote-text">"${quote.text}"</div>
                <div class="quote-author">— ${quote.author}</div>
            </div>
        </div>
    `;
}

// ===== MAIN FUNCTIONS =====

/**
 * Main greeting function that handles user interaction
 */
async function greetUser() {
    if (isProcessing) return; // Prevent multiple simultaneous executions
    
    isProcessing = true;
    try {
        const elements = getElements();
        const name = elements.nameInput.value.trim();

        if (!validateInput(name)) {
            isProcessing = false;
            return;
        }

        setButtonLoading(elements.greetButton, true);
        
        // Save user preferences before generating greeting
        saveUserPreferences(name, elements.effectToggle.checked);
        
        // Show loading message while fetching data
        showMessage('🌍 Connecting to the world...', 'loading');
        
        // Fetch quote and translation simultaneously
        const [quote, translation] = await Promise.all([
            fetchQuoteOfTheDay(),
            Promise.resolve(getRandomHelloTranslation())
        ]);
        
        const enhancedGreeting = createEnhancedGreeting(name, translation, quote);
        
        showEnhancedMessage(enhancedGreeting, 'success');
        triggerEffect(elements.effectToggle.checked);
        startSelfDestruct();
        
        elements.nameInput.value = '';

        setTimeout(() => {
            setButtonLoading(elements.greetButton, false);
            isProcessing = false;
        }, CONFIG.BUTTON_DISABLE_DURATION);
        
    } catch (error) {
        console.error('Error in greetUser:', error);
        showMessage('Something went wrong! Please try again.', 'error');
        isProcessing = false;
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        greetUser();
    }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get all required DOM elements
 * @returns {Object} Object containing all DOM elements
 */
function getElements() {
    return {
        nameInput: document.getElementById('nameInput'),
        greetButton: document.getElementById('greetButton'),
        effectToggle: document.getElementById('effectToggle'),
        greetingMessage: document.getElementById('greetingMessage')
    };
}

/**
 * Validate user input
 * @param {string} name - The name to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateInput(name) {
    if (name === '') {
        showMessage('Please enter your name!', 'error');
        return false;
    }
    return true;
}

/**
 * Set button loading state
 * @param {HTMLElement} button - The button element
 * @param {boolean} isLoading - Whether to show loading state
 */
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<div class="spinner"></div>';
    } else {
        button.disabled = false;
        button.innerHTML = 'Greet Me!';
    }
}

/**
 * Generate a time-appropriate greeting
 * @param {string} name - The user's name
 * @returns {string} The personalized greeting
 */
function generateGreeting(name) {
    const userData = getStoredUserData();
    const isReturning = isReturningUser() && userData.visitCount > 1;
    
    // Special welcome back message for returning users
    if (isReturning) {
        const welcomeBackMessages = [
            `Welcome back, ${name}! Great to see you again! 🎉`,
            `${name}! You're back! Hope you're having an amazing day! ✨`,
            `Hey ${name}! Welcome back to the party! 🎊`,
            `${name}! So good to see you return! Ready for more fun? 🚀`
        ];
        const randomIndex = Math.floor(Math.random() * welcomeBackMessages.length);
        return welcomeBackMessages[randomIndex];
    }
    
    // Regular time-based greeting for new users or first-time visits
    const currentHour = new Date().getHours();
    let greetingArray;
    
    if (currentHour < 12) {
        greetingArray = GREETINGS.morning;
    } else if (currentHour < 18) {
        greetingArray = GREETINGS.afternoon;
    } else {
        greetingArray = GREETINGS.evening;
    }
    
    const randomIndex = Math.floor(Math.random() * greetingArray.length);
    return greetingArray[randomIndex].replace('{name}', name);
}

/**
 * Trigger the selected visual effect
 * @param {boolean} useConfetti - True for confetti, false for fireworks
 */
function triggerEffect(useConfetti) {
    if (useConfetti) {
        triggerConfetti();
    } else {
        triggerFireworks();
    }
}

/**
 * Display a message to the user
 * @param {string} message - The message to display
 * @param {string} type - The message type ('success', 'error', or 'loading')
 */
function showMessage(message, type = 'success') {
    const messageElement = document.getElementById('greetingMessage');
    messageElement.textContent = message;
    messageElement.className = `message visible ${type}`;
    
    // Reset animation by briefly removing and re-adding the class
    setTimeout(() => {
        messageElement.classList.remove('visible');
        setTimeout(() => {
            messageElement.classList.add('visible');
        }, 10);
    }, 0);
}

/**
 * Display enhanced message with HTML content
 * @param {string} htmlContent - The HTML content to display
 * @param {string} type - The message type
 */
function showEnhancedMessage(htmlContent, type = 'success') {
    const messageElement = document.getElementById('greetingMessage');
    messageElement.innerHTML = htmlContent;
    messageElement.className = `message visible ${type} enhanced`;
    
    // Reset animation by briefly removing and re-adding the class
    setTimeout(() => {
        messageElement.classList.remove('visible');
        setTimeout(() => {
            messageElement.classList.add('visible');
        }, 10);
    }, 0);
}

// ===== VISUAL EFFECTS =====

/**
 * Create and animate confetti particles
 */
function triggerConfetti() {
    playConfettiSound();

    let confettiContainer = getOrCreateContainer('confetti-container');
    
    for (let i = 0; i < CONFIG.CONFETTI.COUNT; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        // Randomize properties
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = CONFIG.CONFETTI.COLORS[Math.floor(Math.random() * CONFIG.CONFETTI.COLORS.length)];
        confetti.style.transform = `rotate3d(${Math.random() * 2 - 1}, ${Math.random() * 2 - 1}, ${Math.random() * 2 - 1}, ${Math.random() * 360}deg)`;

        confettiContainer.appendChild(confetti);
    }

    // Clean up after animation
    setTimeout(() => {
        cleanupContainer(confettiContainer);
    }, CONFIG.CONFETTI.CLEANUP_DELAY);
}
/**
 * Create and animate fireworks
 */
function triggerFireworks() {
    let fireworksContainer = getOrCreateContainer('fireworks-container');
    
    for (let i = 0; i < CONFIG.FIREWORKS.COUNT; i++) {
        setTimeout(() => {
            createFirework(fireworksContainer, CONFIG.FIREWORKS.COLORS);
        }, i * CONFIG.FIREWORKS.STAGGER_DELAY);
    }
    
    // Clean up after animation completes
    setTimeout(() => {
        cleanupContainer(fireworksContainer);
    }, CONFIG.FIREWORKS.CLEANUP_DELAY);
}

/**
 * Get or create a container element
 * @param {string} className - The container class name
 * @returns {HTMLElement} The container element
 */
function getOrCreateContainer(className) {
    let container = document.querySelector(`.${className}`);
    if (!container) {
        container = document.createElement('div');
        container.className = className;
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Clean up container by removing all children
 * @param {HTMLElement} container - The container to clean
 */
function cleanupContainer(container) {
    if (container && container.parentNode) {
        container.innerHTML = '';
    }
}

function createFirework(container, colors) {
    const firework = document.createElement('div');
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    firework.className = `firework ${randomColor}`;
    
    // Random horizontal position
    const randomX = Math.random() * window.innerWidth;
    firework.style.left = randomX + 'px';
    
    container.appendChild(firework);
    
    // Create sparks when firework explodes
    setTimeout(() => {
        createSparks(container, randomX, window.innerHeight * 0.2, randomColor);
        playExplosionSound(); // Add explosion sound
    }, 225); // Timing matches the firework explosion
    
    // Remove firework element after animation
    setTimeout(() => {
        if (firework.parentNode) {
            firework.parentNode.removeChild(firework);
        }
    }, 1500);
}

function createSparks(container, x, y, color) {
    const numberOfSparks = 25; // Much more sparks for dramatic explosion
    
    for (let i = 0; i < numberOfSparks; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.backgroundColor = getColorValue(color);
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';
        
        // Random direction for each spark with more variation
        const angle = (i / numberOfSparks) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
        const distance = 80 + Math.random() * 200; // Much larger explosion radius
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        
        spark.style.setProperty('--spark-dx', dx + 'px');
        spark.style.setProperty('--spark-dy', dy + 'px');
        
        container.appendChild(spark);
        
        // Remove spark after animation
        setTimeout(() => {
            if (spark.parentNode) {
                spark.parentNode.removeChild(spark);
            }
        }, 1500);
    }
    
    // Add secondary explosion layer for more dramatic effect
    setTimeout(() => {
        createSecondaryExplosion(container, x, y, color);
    }, 200);
}

function createSecondaryExplosion(container, x, y, color) {
    const numberOfSecondaryParticles = 15;
    
    for (let i = 0; i < numberOfSecondaryParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'spark';
        particle.style.backgroundColor = getColorValue(color);
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = '0.7';
        
        // Smaller, faster particles for secondary explosion
        const angle = Math.random() * 2 * Math.PI;
        const distance = 40 + Math.random() * 120;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        
        particle.style.setProperty('--spark-dx', dx + 'px');
        particle.style.setProperty('--spark-dy', dy + 'px');
        
        container.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1200);
    }
}

function getColorValue(colorName) {
    const colorMap = {
        red: '#ff3030',
        blue: '#3074ff',
        green: '#30ff30',
        yellow: '#ffff30',
        purple: '#a030ff',
        pink: '#ff30a0'
    };
    return colorMap[colorName] || '#ff3030';
}

// In app.js, add this new function

function playConfettiSound() {
    try {
        const ctx = initAudioContext();
        if (!ctx) return;

        // --- Part 1: The "Pop" Sound ---
        const popOscillator = ctx.createOscillator();
        const popGain = ctx.createGain();
        popOscillator.connect(popGain);
        popGain.connect(ctx.destination);

        popOscillator.type = 'sine';
        popOscillator.frequency.setValueAtTime(440, ctx.currentTime); // A nice clean pitch
        popGain.gain.setValueAtTime(0.2, ctx.currentTime); // Start with some volume
        popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); // Fade out quickly

        popOscillator.start(ctx.currentTime);
        popOscillator.stop(ctx.currentTime + 0.3);

        // --- Part 2: The "Rustle" Sound ---
        const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of noise
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const rustleSource = ctx.createBufferSource();
        rustleSource.buffer = buffer;

        const rustleGain = ctx.createGain();
        const rustleFilter = ctx.createBiquadFilter();

        rustleSource.connect(rustleFilter);
        rustleFilter.connect(rustleGain);
        rustleGain.connect(ctx.destination);

        // Use a high-pass filter to make it sound like a "shhh"
        rustleFilter.type = 'highpass';
        rustleFilter.frequency.setValueAtTime(1500, ctx.currentTime);

        // Fade the rustle in and out
        rustleGain.gain.setValueAtTime(0, ctx.currentTime);
        rustleGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1); // Quick fade in
        rustleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5); // Slow fade out

        rustleSource.start(ctx.currentTime);
        rustleSource.stop(ctx.currentTime + 1.5);

    } catch (error) {
        console.log('Confetti sound failed', error);
    }
}
// ===== AUDIO SYSTEM =====

/**
 * Initialize audio context with error handling
 * @returns {AudioContext|null} The audio context or null if unavailable
 */
function initAudioContext() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    } catch (error) {
        console.warn('Audio context not supported:', error);
        return null;
    }
}

/**
 * Play explosion sound effect
 */
function playExplosionSound() {
    try {
        const ctx = initAudioContext();
        if (!ctx) return;
        
        // Create explosion sound using Web Audio API
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        // Connect audio nodes
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Configure explosion sound characteristics
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
        
        // Add low-pass filter for realistic boom
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
        
        // Volume envelope for explosion effect
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        
        // Start and stop the sound
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        
        // Add crackling effect
        setTimeout(() => {
            playCrackleSound();
        }, 100);
        
    } catch (error) {
        console.warn('Audio not supported or blocked:', error);
    }
}

function playCrackleSound() {
    try {
        const ctx = audioContext;
        if (!ctx) return;
        
        // Create crackling/sparkling sound
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise for crackling
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1;
        }
        
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // High-pass filter for crackling effect
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
        
        // Quick fade in/out
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        
        source.start(ctx.currentTime);
        source.stop(ctx.currentTime + 0.3);
        
    } catch (error) {
        console.log('Crackle sound failed');
    }
}

// ===== JAMES BOND SELF-DESTRUCT SYSTEM =====

/**
 * Start the self-destruct countdown sequence
 */
function startSelfDestruct() {
    setTimeout(() => {
        showCountdown();
    }, CONFIG.SELF_DESTRUCT_DELAY);
}

/**
 * Display countdown with original message
 */
function showCountdown() {
    const messageElement = document.getElementById('greetingMessage');
    let countdown = CONFIG.COUNTDOWN_DURATION;
    
    // Store original greeting message HTML to preserve formatting
    const originalMessageHTML = messageElement.innerHTML;
    
    const countdownInterval = setInterval(() => {
        // Keep original greeting HTML and add countdown below it
        messageElement.innerHTML = `${originalMessageHTML}<div class="countdown-text">This message will self-destruct in ${countdown}...</div>`;
        messageElement.className = 'message visible countdown enhanced';
        
        countdown--;
        
        if (countdown < 0) {
            clearInterval(countdownInterval);
            destroyMessage();
        }
    }, 1000);
}

/**
 * Execute message destruction sequence
 */
function destroyMessage() {
    const messageElement = document.getElementById('greetingMessage');
    
    // Add destruction animation
    messageElement.textContent = '💥 DESTROYED 💥';
    messageElement.className = 'message visible destroyed';
    
    // Play destruction sound
    playDestructionSound();
    
    // Clear message after destruction animation
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 2000);
}

/**
 * Play dramatic destruction sound effect
 */
function playDestructionSound() {
    try {
        const ctx = initAudioContext();
        if (!ctx) return;
        
        // Create destruction sound - more intense than fireworks
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Deep explosive sound
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.8);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);
        
        // Longer, more dramatic explosion
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
        
    } catch (error) {
        console.warn('Destruction sound failed:', error);
    }
}

// ===== INITIALIZATION =====

/**
 * Initialize user preferences from local storage
 */
function initializeUserPreferences() {
    const elements = getElements();
    const userData = getStoredUserData();
    
    // Pre-fill name input for returning users
    if (userData.name && isReturningUser()) {
        elements.nameInput.value = userData.name;
        elements.nameInput.placeholder = `Welcome back, ${userData.name}!`;
    }
    
    // Restore effect preference
    elements.effectToggle.checked = userData.effectPreference;
    
    // Show a subtle welcome back indicator
    if (isReturningUser() && userData.visitCount > 1) {
        const welcomeIndicator = document.createElement('div');
        welcomeIndicator.className = 'welcome-back-indicator';
        welcomeIndicator.textContent = `Visit #${userData.visitCount} 🎉`;
        welcomeIndicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            opacity: 0.8;
            z-index: 1000;
        `;
        document.body.appendChild(welcomeIndicator);
        
        // Remove indicator after 5 seconds
        setTimeout(() => {
            if (welcomeIndicator.parentNode) {
                welcomeIndicator.parentNode.removeChild(welcomeIndicator);
            }
        }, 5000);
    }
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        const elements = getElements();
        
        // Add event listeners
        elements.greetButton.addEventListener('click', greetUser);
        elements.nameInput.addEventListener('keypress', handleKeyPress);
        
        // Initialize user preferences from local storage
        initializeUserPreferences();
        
        console.log('James Bond Greeting App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});