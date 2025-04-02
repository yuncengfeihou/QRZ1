// ui.js
import * as Constants from './constants.js';
import { fetchQuickReplies } from './api.js';
import { sharedState } from './state.js';
import { handleQuickReplyClick } from './events.js';

/**
 * Creates the rocket button to be placed next to the send button.
 * @returns {HTMLElement} The created rocket button element.
 */
export function createRocketButton() {
    const button = document.createElement('div');
    button.id = Constants.ID_ROCKET_BUTTON;
    button.className = 'fa-solid fa-rocket interactable secondary-button';
    button.title = '打开快速回复菜单';
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', Constants.ID_MENU);
    return button;
}

/**
 * Creates the menu element.
 * @returns {HTMLElement} The created menu element.
 */
export function createMenuElement() {
    // Create main menu container
    const menu = document.createElement('div');
    menu.id = Constants.ID_MENU;
    menu.style.display = 'none';
    menu.setAttribute('role', Constants.ARIA_ROLE_MENU);

    // Create menu inner container (for flex layout)
    const menuContainer = document.createElement('div');
    menuContainer.className = Constants.CLASS_MENU_CONTAINER;
    menu.appendChild(menuContainer);

    // Create chat replies column
    const chatReplies = document.createElement('div');
    chatReplies.id = Constants.ID_CHAT_LIST_CONTAINER;
    chatReplies.className = Constants.CLASS_LIST;
    chatReplies.setAttribute('role', Constants.ARIA_ROLE_GROUP);

    // Add title to chat replies
    const chatTitle = document.createElement('div');
    chatTitle.className = Constants.CLASS_LIST_TITLE;
    chatTitle.textContent = '聊天回复';
    chatReplies.appendChild(chatTitle);

    // Container for chat quick reply items
    const chatItems = document.createElement('div');
    chatItems.id = Constants.ID_CHAT_ITEMS;
    chatReplies.appendChild(chatItems);

    // Create global replies column
    const globalReplies = document.createElement('div');
    globalReplies.id = Constants.ID_GLOBAL_LIST_CONTAINER;
    globalReplies.className = Constants.CLASS_LIST;
    globalReplies.setAttribute('role', Constants.ARIA_ROLE_GROUP);

    // Add title to global replies
    const globalTitle = document.createElement('div');
    globalTitle.className = Constants.CLASS_LIST_TITLE;
    globalTitle.textContent = '全局回复';
    globalReplies.appendChild(globalTitle);

    // Container for global quick reply items
    const globalItems = document.createElement('div');
    globalItems.id = Constants.ID_GLOBAL_ITEMS;
    globalReplies.appendChild(globalItems);

    // Add both columns to the menu container
    menuContainer.appendChild(chatReplies);
    menuContainer.appendChild(globalReplies);

    return menu;
}

/**
 * Creates an individual quick reply item (button).
 * @param {Object} quickReply - Quick reply data with label, message, and setName.
 * @returns {HTMLButtonElement} The created quick reply item.
 */
export function createQuickReplyItem(quickReply) {
    const item = document.createElement('button');
    item.className = Constants.CLASS_ITEM;
    item.textContent = quickReply.label;
    item.setAttribute('role', Constants.ARIA_ROLE_MENUITEM);
    item.setAttribute('title', quickReply.message);
    item.dataset.setName = quickReply.setName;
    item.dataset.label = quickReply.label;
    item.addEventListener('click', handleQuickReplyClick);
    return item;
}

/**
 * Creates a "no items" placeholder element.
 * @param {string} message - The message to display.
 * @returns {HTMLElement} The created placeholder element.
 */
export function createEmptyIndicator(message) {
    const empty = document.createElement('div');
    empty.className = Constants.CLASS_EMPTY;
    empty.textContent = message;
    return empty;
}

/**
 * Renders quick replies into their respective containers.
 * @param {Array<Object>} chatReplies - List of chat-specific quick replies.
 * @param {Array<Object>} globalReplies - List of global quick replies.
 */
export function renderQuickReplies(chatReplies, globalReplies) {
    const { chatItemsContainer, globalItemsContainer } = sharedState.domElements;
    if (!chatItemsContainer || !globalItemsContainer) return;

    // Clear existing content
    chatItemsContainer.innerHTML = '';
    globalItemsContainer.innerHTML = '';

    // Render chat quick replies
    if (chatReplies && chatReplies.length > 0) {
        chatReplies.forEach(reply => {
            const item = createQuickReplyItem(reply);
            chatItemsContainer.appendChild(item);
        });
    } else {
        chatItemsContainer.appendChild(createEmptyIndicator('当前聊天没有可用的快捷回复'));
    }

    // Render global quick replies
    if (globalReplies && globalReplies.length > 0) {
        globalReplies.forEach(reply => {
            const item = createQuickReplyItem(reply);
            globalItemsContainer.appendChild(item);
        });
    } else {
        globalItemsContainer.appendChild(createEmptyIndicator('没有可用的全局快捷回复'));
    }
}

/**
 * Updates the visibility of the menu UI and related ARIA attributes based on sharedState.
 */
export function updateMenuVisibilityUI() {
    const { menu, rocketButton } = sharedState.domElements;
    const show = sharedState.menuVisible;

    if (!menu || !rocketButton) return;

    if (show) {
        // Update content before showing
        const { chat, global } = fetchQuickReplies();
        renderQuickReplies(chat, global);

        menu.style.display = 'block';
        rocketButton.setAttribute('aria-expanded', 'true');
        rocketButton.classList.add('active');

        // Optional: Focus the first item in the menu for keyboard navigation
        const firstItem = menu.querySelector(`.${Constants.CLASS_ITEM}`);
        firstItem?.focus();
    } else {
        menu.style.display = 'none';
        rocketButton.setAttribute('aria-expanded', 'false');
        rocketButton.classList.remove('active');
    }
}
