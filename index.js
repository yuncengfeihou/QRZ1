// file_2/index.js (Refactored)

import { extension_settings } from "../../../extensions.js";

// 插件名称常量
const EXTENSION_NAME = "quick-reply-menu";

// 存储快捷回复数据
let chatQuickReplies = [];
let globalQuickReplies = [];
let menuVisible = false;
let dataNeedsUpdate = true; // 数据更新标志，初始为 true

/**
 * 初始化快速回复菜单及相关按钮
 */
function initQuickReplyControls() {
    // --- UI 创建部分保持不变 ---
    // 创建关闭按钮
    const quickReplyCloseButton = document.createElement('div');
    quickReplyCloseButton.id = 'quick-reply-close-button';
    quickReplyCloseButton.innerText = '[关闭]';
    quickReplyCloseButton.title = '关闭菜单';
    quickReplyCloseButton.style.display = 'none'; // 初始隐藏
    document.body.appendChild(quickReplyCloseButton);

    // 创建主题切换按钮
    const quickReplyThemeToggleButton = document.createElement('div');
    quickReplyThemeToggleButton.id = 'quick-reply-theme-toggle-button';
    quickReplyThemeToggleButton.innerText = '[切换]';
    quickReplyThemeToggleButton.title = '切换主题';
    quickReplyThemeToggleButton.style.display = 'none'; // 初始隐藏
    document.body.appendChild(quickReplyThemeToggleButton);

    // 创建快速回复菜单
    const quickReplyMenu = document.createElement('div');
    quickReplyMenu.id = 'quick-reply-menu';
    quickReplyMenu.innerHTML = `
        <div class="quick-reply-menu-container">
            <div class="quick-reply-list" id="chat-quick-replies">
                <div class="quick-reply-list-title">聊天快捷回复</div>
                <div id="chat-qr-items"></div>
            </div>
            <div class="quick-reply-list" id="global-quick-replies">
                <div class="quick-reply-list-title">全局快捷回复</div>
                <div id="global-qr-items"></div>
            </div>
        </div>
    `;
    document.body.appendChild(quickReplyMenu);

    // --- 事件绑定部分保持不变 ---
    // 绑定关闭按钮点击事件
    quickReplyCloseButton.addEventListener('click', hideQuickReplyMenu);

    // 绑定主题切换按钮点击事件
    quickReplyThemeToggleButton.addEventListener('click', () => {
        const menu = document.getElementById('quick-reply-menu');
        menu.classList.toggle('light-theme');
    });

    // 点击菜单外部区域关闭菜单
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('quick-reply-menu');
        const closeButton = document.getElementById('quick-reply-close-button');
        const toggleButton = document.getElementById('quick-reply-theme-toggle-button');
        const rocketButton = document.getElementById('quick-reply-rocket-button');

        if (menuVisible &&
            event.target !== menu &&
            !menu.contains(event.target) &&
            event.target !== closeButton &&
            event.target !== toggleButton &&
            (!rocketButton || event.target !== rocketButton)
           ) {
            hideQuickReplyMenu();
        }
    });
}

/**
 * 显示快速回复菜单 (逻辑不变)
 */
function showQuickReplyMenu() {
    if (menuVisible) return;

    const menu = document.getElementById('quick-reply-menu');
    const closeButton = document.getElementById('quick-reply-close-button');
    const themeToggleButton = document.getElementById('quick-reply-theme-toggle-button');

    if (dataNeedsUpdate) {
        console.log(`[${EXTENSION_NAME}] Fetching quick replies...`);
        updateQuickReplies(); // 调用重构后的函数
        dataNeedsUpdate = false;
    } else {
        console.log(`[${EXTENSION_NAME}] Using cached quick replies...`);
    }

    renderQuickReplies(); // 渲染函数不变

    menu.style.display = 'block';
    closeButton.style.display = 'block';
    themeToggleButton.style.display = 'block';
    console.log(`[${EXTENSION_NAME}] Theme toggle button display:`, themeToggleButton.style.display);
    menuVisible = true;
}


/**
 * 隐藏快速回复菜单 (逻辑不变)
 */
function hideQuickReplyMenu() {
    const menu = document.getElementById('quick-reply-menu');
    const closeButton = document.getElementById('quick-reply-close-button');
    const themeToggleButton = document.getElementById('quick-reply-theme-toggle-button');
    menu.style.display = 'none';
    closeButton.style.display = 'none';
    themeToggleButton.style.display = 'none';
    menuVisible = false;
    // menu.classList.remove('light-theme'); // 可选
}

/**
 * 获取并更新当前可用的快捷回复（使用 file_1 的检测逻辑重构）
 */
function updateQuickReplies() {
    // 重置数据
    chatQuickReplies = [];
    globalQuickReplies = [];
    const chatQrLabels = new Set(); // 用于全局去重

    // 1. 检查 API 是否存在
    if (!window.quickReplyApi) {
        console.error(`[${EXTENSION_NAME}] Quick Reply API (window.quickReplyApi) not found! Cannot fetch replies.`);
        return; // 无法获取，直接返回
    }

    const qrApi = window.quickReplyApi;

    // 2. 检查 Quick Reply v2 主插件是否启用
    //    (注意：isEnabled=true 或 undefined 都视为启用)
    if (!qrApi.settings || qrApi.settings.isEnabled === false) {
        console.log(`[${EXTENSION_NAME}] Core Quick Reply v2 is disabled. Skipping reply fetch.`);
        // 清空数据（虽然已在开头重置，这里再次确保）并返回
        chatQuickReplies = [];
        globalQuickReplies = [];
        return;
    }

    // 3. 尝试获取数据 (主插件已启用)
    try {
        // Fetch Chat Quick Replies (来自 chatConfig)
        if (qrApi.settings?.chatConfig?.setList) {
            qrApi.settings.chatConfig.setList.forEach(setLink => {
                // 检查 setLink, setLink.set, setLink.set.qrList 是否有效
                if (setLink?.isVisible && setLink.set?.qrList) {
                    setLink.set.qrList.forEach(qr => {
                        // 检查 qr 对象存在，未隐藏，且有 label
                        if (qr && !qr.isHidden && qr.label) {
                            chatQuickReplies.push({
                                setName: setLink.set.name || 'Unknown Chat Set', // 提供默认值
                                label: qr.label,
                                message: qr.message || '(无消息内容)'
                            });
                            chatQrLabels.add(qr.label); // 记录聊天标签用于去重
                        }
                    });
                }
            });
        } else {
             console.warn(`[${EXTENSION_NAME}] Could not find chatConfig.setList in quickReplyApi settings.`);
        }

        // Fetch Global Quick Replies (来自 config)
        if (qrApi.settings?.config?.setList) {
            qrApi.settings.config.setList.forEach(setLink => {
                // 检查 setLink, setLink.set, setLink.set.qrList 是否有效
                if (setLink?.isVisible && setLink.set?.qrList) {
                    setLink.set.qrList.forEach(qr => {
                        // 检查 qr 对象存在，未隐藏，有 label，且 label 未在聊天回复中出现
                        if (qr && !qr.isHidden && qr.label && !chatQrLabels.has(qr.label)) {
                            globalQuickReplies.push({
                                setName: setLink.set.name || 'Unknown Global Set', // 提供默认值
                                label: qr.label,
                                message: qr.message || '(无消息内容)'
                            });
                        }
                    });
                }
            });
        } else {
             console.warn(`[${EXTENSION_NAME}] Could not find config.setList in quickReplyApi settings.`);
        }

        console.log(`[${EXTENSION_NAME}] Updated Quick Replies - Chat: ${chatQuickReplies.length}, Global: ${globalQuickReplies.length}`);

    } catch (error) {
        console.error(`[${EXTENSION_NAME}] Error fetching quick replies:`, error);
        // 出错时清空数据，防止使用不完整或错误的数据
        chatQuickReplies = [];
        globalQuickReplies = [];
    }
}

/**
 * 渲染快捷回复到菜单 (逻辑不变, 使用 DocumentFragment 优化)
 */
function renderQuickReplies() {
    const chatContainer = document.getElementById('chat-qr-items');
    const globalContainer = document.getElementById('global-qr-items');

    chatContainer.innerHTML = '';
    globalContainer.innerHTML = '';

    const chatFragment = document.createDocumentFragment();
    const globalFragment = document.createDocumentFragment();

    if (chatQuickReplies.length > 0) {
        chatQuickReplies.forEach(qr => {
            const item = createQuickReplyItem(qr);
            chatFragment.appendChild(item);
        });
        chatContainer.appendChild(chatFragment);
    } else {
        chatContainer.innerHTML = '<div class="quick-reply-empty">没有可用的聊天快捷回复</div>';
    }

    if (globalQuickReplies.length > 0) {
        globalQuickReplies.forEach(qr => {
            const item = createQuickReplyItem(qr);
            globalFragment.appendChild(item);
        });
        globalContainer.appendChild(globalFragment);
    } else {
        globalContainer.innerHTML = '<div class="quick-reply-empty">没有可用的全局快捷回复</div>';
    }
}

/**
 * 辅助函数：创建单个快捷回复项的 DOM 元素 (逻辑不变)
 */
function createQuickReplyItem(qr) {
    const item = document.createElement('div');
    item.className = 'quick-reply-item';
    item.innerText = qr.label;
    const fullMessagePreview = `来自 "${qr.setName}":\n${qr.message}`;
    item.title = fullMessagePreview;
    item.addEventListener('click', () => {
        triggerQuickReply(qr.setName, qr.label); // 调用重构后的触发函数
        hideQuickReplyMenu();
    });
    return item;
}


/**
 * 触发指定的快捷回复 (使用 file_1 的检测逻辑重构)
 */
function triggerQuickReply(setName, label) {
    // 1. 检查 API 是否存在
    if (!window.quickReplyApi) {
        console.error(`[${EXTENSION_NAME}] Quick Reply API not found! Cannot trigger reply.`);
        return; // 无法触发，直接返回
    }

    // 2. 检查 Quick Reply v2 主插件是否启用
    //    (注意：isEnabled=true 或 undefined 都视为启用)
    if (!window.quickReplyApi.settings || window.quickReplyApi.settings.isEnabled === false) {
         console.log(`[${EXTENSION_NAME}] Core Quick Reply v2 is disabled. Cannot trigger reply "${setName}.${label}".`);
         return; // 主插件禁用，不执行触发
    }

    // 3. 尝试触发 (主插件已启用)
    console.log(`[${EXTENSION_NAME}] Triggering Quick Reply: "${setName}.${label}"`);
    try {
        // 保持原有的 Promise 处理方式
        window.quickReplyApi.executeQuickReply(setName, label)
            .then(result => {
                console.log(`[${EXTENSION_NAME}] Quick Reply "${setName}.${label}" executed successfully:`, result);
            })
            .catch(error => {
                console.error(`[${EXTENSION_NAME}] Failed to execute Quick Reply "${setName}.${label}":`, error);
            });
    } catch (error) {
        // 处理同步错误，例如 executeQuickReply 方法本身不存在或调用时出错
        console.error(`[${EXTENSION_NAME}] Error trying to call executeQuickReply for "${setName}.${label}":`, error);
    }
}

/**
 * 插件加载入口 (逻辑不变)
 */
jQuery(async () => {
    extension_settings[EXTENSION_NAME] = extension_settings[EXTENSION_NAME] || {};

    const settingsHtml = `
    <div id="${EXTENSION_NAME}-settings" class="extension-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>快速回复增强菜单</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
            </div>
            <div class="inline-drawer-content">
                <p>此插件在发送按钮旁添加了一个🚀图标按钮，用于打开快速回复菜单。</p>
                <p>顶部的 [关闭] 按钮用于关闭菜单，[切换] 按钮用于切换菜单的深色/浅色主题。</p>
                <p><b>注意:</b> 菜单内容仅在首次打开时加载。如果主 Quick Reply v2 插件设置有变动，需要关闭菜单后重新打开此菜单以加载最新内容。</p>
                <div class="flex-container flexGap5">
                    <label>插件状态:</label>
                    <select id="${EXTENSION_NAME}-enabled" class="text_pole">
                        <option value="true" selected>启用</option>
                        <option value="false">禁用</option>
                    </select>
                </div>
                <hr class="sysHR">
            </div>
        </div>
    </div>`;

    $('#extensions_settings').append(settingsHtml);

    initQuickReplyControls();

    try {
        const sendButton = $('#send_but');
        if (sendButton.length > 0) {
            const rocketButtonHtml = `
                <div id="quick-reply-rocket-button" class="fa-solid fa-rocket interactable secondary-button" title="打开快速回复菜单" style="cursor: pointer; margin-right: 8px;"></div>
            `;
            sendButton.before(rocketButtonHtml);
            $('#quick-reply-rocket-button').on('click', showQuickReplyMenu);
            console.log(`插件 ${EXTENSION_NAME}: 火箭按钮成功注入！`);
        } else {
            console.warn(`插件 ${EXTENSION_NAME}: 未找到发送按钮 (#send_but)，无法注入火箭按钮。`);
        }
    } catch (error) {
        console.error(`插件 ${EXTENSION_NAME}: 注入火箭按钮时出错:`, error);
    }

    $(`#${EXTENSION_NAME}-enabled`).on('change', function() {
        const isEnabled = $(this).val() === 'true';
        extension_settings[EXTENSION_NAME].enabled = isEnabled;
        const rocketButton = $('#quick-reply-rocket-button');

        if (isEnabled) {
            rocketButton.show();
            dataNeedsUpdate = true; // 启用时标记需要更新数据
        } else {
            rocketButton.hide();
            hideQuickReplyMenu(); // 禁用时隐藏菜单
        }
    });

    // 初始化按钮状态
    const rocketButton = $('#quick-reply-rocket-button');
    if (extension_settings[EXTENSION_NAME].enabled !== false) {
        extension_settings[EXTENSION_NAME].enabled = true; // 默认或未设置时视为启用
        $(`#${EXTENSION_NAME}-enabled`).val('true');
        rocketButton.show();
    } else {
        $(`#${EXTENSION_NAME}-enabled`).val('false');
        rocketButton.hide();
    }
});