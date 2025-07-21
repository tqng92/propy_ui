document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    const state = {
        currentView: 'home', // 'home', 'chat', or 'listings'
        chatHistory: [],     // Array of { sender: 'user'/'bot', text: '...' }
        searchQuery: '',
        isLoading: false,
    };

    // --- DOM ELEMENT REFERENCES ---
    const views = {
        home: document.getElementById('home-view'),
        chat: document.getElementById('chat-view'),
        listings: document.getElementById('listing-view'),
    };
    const homeForm = document.getElementById('home-search-form');
    const homeInput = document.getElementById('home-search-input');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistoryContainer = document.getElementById('chat-history');
    const initialQueryContainer = document.getElementById('initial-query');
    const searchSummaryContainer = document.getElementById('search-summary');
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- CORE LOGIC ---

    /**
     * The mock webhook. In a real app, this would be a fetch() call to your LLM backend.
     * @param {string} messageText - The user's input.
     * @returns {Promise<object>} - A promise that resolves with the action.
     */
    const callDemoWebhook = (messageText) => {
        console.log(`Sending to webhook: "${messageText}"`);

        return new Promise(resolve => {
            setTimeout(() => { // Simulate network delay
                if (messageText.toLowerCase().includes('search_properties')) {
                    resolve({
                        action: 'search_properties',
                        query: messageText
                    });
                } else {
                    resolve({
                        action: 'chatbot',
                        reply: 'Hi' // Simple demo reply
                    });
                }
            }, 1000); // 1-second delay
        });
    };

    /**
     * Handles all user submissions from any form.
     * @param {string} text - The text submitted by the user.
     */
    const handleUserSubmit = async (text) => {
        if (!text || state.isLoading) return;

        // 1. Update state to reflect user's action
        state.isLoading = true;
        if (state.currentView === 'home') {
            // For the first message, it populates the special "initial query" spot
            state.chatHistory.push({ sender: 'user', text: text, isInitial: true });
        } else {
            state.chatHistory.push({ sender: 'user', text: text });
        }
        
        // 2. Render the immediate changes (user message, loading indicator)
        render();

        // 3. Call the webhook and wait for the response
        const response = await callDemoWebhook(text);
        
        // 4. Process the response from the webhook
        if (response.action === 'search_properties') {
            state.currentView = 'listings';
            state.searchQuery = response.query;
        } else { // action is 'chatbot'
            state.currentView = 'chat';
            state.chatHistory.push({ sender: 'bot', text: response.reply });
        }

        // 5. Final state update and re-render
        state.isLoading = false;
        render();
    };

    // --- UI RENDERING ---

    /**
     * Renders the entire application based on the current state.
     */
    const render = () => {
        // Show/hide loading indicator
        loadingIndicator.style.display = state.isLoading ? 'block' : 'none';

        // Switch between views
        Object.values(views).forEach(view => view.classList.remove('active'));
        views[state.currentView].classList.add('active');

        // Render content for the active view
        if (state.currentView === 'chat') {
            renderChatView();
        } else if (state.currentView === 'listings') {
            renderListingsView();
        }
    };

    const renderChatView = () => {
        chatHistoryContainer.innerHTML = ''; // Clear previous messages
        
        state.chatHistory.forEach(message => {
            if (message.isInitial) {
                // The first message goes to the top right header
                initialQueryContainer.textContent = message.text;
            } else {
                // Subsequent messages go in the main chat history
                const messageEl = document.createElement('div');
                messageEl.classList.add('message', `${message.sender}-message`);
                messageEl.textContent = message.text;
                chatHistoryContainer.appendChild(messageEl);
            }
        });

        // Scroll to the bottom of the chat history
        chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
    };

    const renderListingsView = () => {
        searchSummaryContainer.textContent = state.searchQuery;
    };

    // --- EVENT LISTENERS ---
    homeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = homeInput.value.trim();
        handleUserSubmit(text);
        homeInput.value = '';
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        handleUserSubmit(text);
        chatInput.value = '';
    });

    // --- INITIAL RENDER ---
    render();
});
