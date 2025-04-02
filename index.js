// index.js - Main Entry Point
import { extension_settings } from "../../../extensions.js";
import * as Constants from './constants.js';
import { sharedState } from './state.js';
import { createMenuElement, createRocketButton } from './ui.js';
import { createSettingsHtml, loadAndApplySettings } from './settings.js';
import { setupEventListeners } from './events.js';

/**
 * Initializes the plugin: creates UI, sets up listeners, loads settings.
 */
function initializePlugin() {
    console.log(`[${Constants.EXTENSION_NAME}] Initializing...`);

    // Create menu element
    const menu = createMenuElement();

    // Find the send button to place our rocket button next to it
    const sendButton = $('#send_but');
    if (sendButton.length === 0) {
        console.error(`[${Constants.EXTENSION_NAME}] Could not find send button to attach rocket button`);
        return;
    }

    // Create and inject the rocket button before the send button
    const rocketButton = createRocketButton();
    sendButton.before(rocketButton);

    // Store references in shared state
    sharedState.domElements.rocketButton = rocketButton;
    sharedState.domElements.menu = menu;
    sharedState.domElements.chatItemsContainer = menu.querySelector(`#${Constants.ID_CHAT_ITEMS}`);
    sharedState.domElements.globalItemsContainer = menu.querySelector(`#${Constants.ID_GLOBAL_ITEMS}`);
    sharedState.domElements.settingsDropdown = document.getElementById(Constants.ID_SETTINGS_ENABLED_DROPDOWN); // Get after settings HTML is added

    // Append menu to the body
    document.body.appendChild(menu);

    // Load initial settings state and apply it to UI
    loadAndApplySettings();

    // Setup event listeners
    setupEventListeners();

    console.log(`[${Constants.EXTENSION_NAME}] Initialization complete.`);
}

// --- SillyTavern Extension Entry Point ---
jQuery(async () => {
    // 1. Ensure base settings object exists
    extension_settings[Constants.EXTENSION_NAME] = extension_settings[Constants.EXTENSION_NAME] || {};

    // 2. Add settings panel HTML to the UI
    //    (This needs to happen before initializePlugin tries to find the dropdown)
    $('#extensions_settings').append(createSettingsHtml());

    // 3. Initialize the core plugin logic
    //    (This will create elements, find the dropdown, load settings, and set listeners)
    initializePlugin();
});
