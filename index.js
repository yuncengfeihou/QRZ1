import { extension_settings } from "../../../extensions.js";

// 插件名称常量
const EXTENSION_NAME = "quick-reply-menu";

// 存储快捷回复数据
let menuVisible = false;
let dataNeedsUpdate = true; // 数据更新标志，初始为 true

/**
 * 初始化快速回复菜单及相关按钮
 */
function initQuickReplyControls() {
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
        const toggleButton = document.getElementById('quick-reply-theme-toggle-button'); // 获取切换按钮
        const rocketButton = document.getElementById('quick-reply-rocket-button');

        if (menuVisible &&
            event.target !== menu &&
            !menu.contains(event.target) &&
            event.target !== closeButton && // 不要因为点击关闭按钮而触发
            event.target !== toggleButton && // 不要因为点击切换按钮而触发
            (!rocketButton || event.target !== rocketButton) // 不要因为点击火箭按钮而触发
           ) {
            hideQuickReplyMenu();
        }
    });
}

/**
 * 显示快速回复菜单
 */
function showQuickReplyMenu() {
    if (menuVisible) return;

    const menu = document.getElementById('quick-reply-menu');
    const closeButton = document.getElementById('quick-reply-close-button');
    const themeToggleButton = document.getElementById('quick-reply-theme-toggle-button');

    if (dataNeedsUpdate) {
        console.log(`[${EXTENSION_NAME}] Fetching quick replies...`);
        const quickReplies = fetchQuickReplies();
        renderQuickReplies(quickReplies.chat, quickReplies.global);
        dataNeedsUpdate = false;
    } else {
        console.log(`[${EXTENSION_NAME}] Using cached quick replies...`);
    }

    menu.style.display = 'block';
    closeButton.style.display = 'block';
    themeToggleButton.style.display = 'block';
    menuVisible = true;
}

/**
 * 隐藏快速回复菜单
 */
function hideQuickReplyMenu() {
    const menu = document.getElementById('quick-reply-menu');
    const closeButton = document.getElementById('quick-reply-close-button');
    const themeToggleButton = document.getElementById('quick-reply-theme-toggle-button');
    menu.style.display = 'none';
    closeButton.style.display = 'none';
    themeToggleButton.style.display = 'none';
    menuVisible = false;
}

/**
 * 获取聊天和全局快捷回复
 * @returns {{chat: Array, global: Array}} 包含聊天和全局快捷回复的对象
 */
function fetchQuickReplies() {
    const chatReplies = [];
    const globalReplies = [];
    const chatQrLabels = new Set(); // 用于跟踪标签避免在全局中重复

    if (!window.quickReplyApi) {
        console.error(`[${EXTENSION_NAME}] Quick Reply API (window.quickReplyApi) not found! Cannot fetch replies.`);
        return { chat: [], global: [] };
    }

    const qrApi = window.quickReplyApi;

    // 检查 Quick Reply v2 扩展本身是否启用
    if (!qrApi.settings || qrApi.settings.isEnabled === false) {
        console.log(`[${EXTENSION_NAME}] Core Quick Reply v2 is disabled. Skipping reply fetch.`);
        return { chat: [], global: [] };
    }

    try {
        // 获取聊天快捷回复
        if (qrApi.settings?.chatConfig?.setList) {
            qrApi.settings.chatConfig.setList.forEach(setLink => {
                if (setLink?.isVisible && setLink.set?.qrList) {
                    setLink.set.qrList.forEach(qr => {
                        if (qr && !qr.isHidden && qr.label) {
                            chatReplies.push({
                                setName: setLink.set.name || 'Unknown Set',
                                label: qr.label,
                                message: qr.message || '(无消息内容)'
                            });
                            chatQrLabels.add(qr.label);
                        }
                    });
                }
            });
        } else {
            console.warn(`[${EXTENSION_NAME}] Could not find chatConfig.setList in quickReplyApi settings.`);
        }

        // 获取全局快捷回复
        if (qrApi.settings?.config?.setList) {
            qrApi.settings.config.setList.forEach(setLink => {
                if (setLink?.isVisible && setLink.set?.qrList) {
                    setLink.set.qrList.forEach(qr => {
                        // 只有在不隐藏且标签不存在于聊天回复中时才添加
                        if (qr && !qr.isHidden && qr.label && !chatQrLabels.has(qr.label)) {
                            globalReplies.push({
                                setName: setLink.set.name || 'Unknown Set',
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

        console.log(`[${EXTENSION_NAME}] Fetched Replies - Chat: ${chatReplies.length}, Global: ${globalReplies.length}`);

    } catch (error) {
        console.error(`[${EXTENSION_NAME}] Error fetching quick replies:`, error);
        return { chat: [], global: [] };
    }

    return { chat: chatReplies, global: globalReplies };
}

/**
 * 渲染快捷回复到菜单
 * @param {Array} chatReplies 聊天快捷回复数组
 * @param {Array} globalReplies 全局快捷回复数组
 */
function renderQuickReplies(chatReplies, globalReplies) {
    const chatContainer = document.getElementById('chat-qr-items');
    const globalContainer = document.getElementById('global-qr-items');

    // 清空容器
    chatContainer.innerHTML = '';
    globalContainer.innerHTML = '';

    // 渲染聊天快捷回复
    renderList(chatContainer, chatReplies, "没有可用的聊天快捷回复");
    
    // 渲染全局快捷回复
    renderList(globalContainer, globalReplies, "没有可用的全局快捷回复");
}

/**
 * 渲染回复列表到指定容器
 * @param {HTMLElement} container 要渲染到的容器
 * @param {Array} replies 回复数组
 * @param {string} emptyMessage 列表为空时显示的消息
 */
function renderList(container, replies, emptyMessage) {
    if (!container) return;

    if (replies.length > 0) {
        const fragment = document.createDocumentFragment();
        replies.forEach(qr => {
            fragment.appendChild(createQuickReplyItem(qr));
        });
        container.appendChild(fragment);
    } else {
        container.innerHTML = `<div class="quick-reply-empty">${emptyMessage}</div>`;
    }
}

/**
 * 创建单个快捷回复项
 * @param {Object} qr 快捷回复对象
 * @returns {HTMLElement} 创建的DOM元素
 */
function createQuickReplyItem(qr) {
    const item = document.createElement('div');
    item.className = 'quick-reply-item';
    item.innerText = qr.label;
    const fullMessagePreview = `来自 "${qr.setName}":\n${qr.message}`;
    item.title = fullMessagePreview;
    item.addEventListener('click', () => {
        triggerQuickReply(qr.setName, qr.label);
        hideQuickReplyMenu();
    });
    return item;
}

/**
 * 触发指定的快捷回复
 * @param {string} setName 集合名称
 * @param {string} label 标签名称
 */
function triggerQuickReply(setName, label) {
    if (!window.quickReplyApi) {
        console.error(`[${EXTENSION_NAME}] Quick Reply API not found! Cannot trigger reply.`);
        return;
    }

    // 触发前检查主 Quick Reply v2 是否启用
    if (!window.quickReplyApi.settings || window.quickReplyApi.settings.isEnabled === false) {
        console.log(`[${EXTENSION_NAME}] Core Quick Reply v2 is disabled. Cannot trigger reply.`);
        return;
    }

    console.log(`[${EXTENSION_NAME}] Triggering Quick Reply: "${setName}.${label}"`);
    try {
        window.quickReplyApi.executeQuickReply(setName, label)
            .then(() => {
                console.log(`[${EXTENSION_NAME}] Quick Reply "${setName}.${label}" executed successfully.`);
            })
            .catch(error => {
                console.error(`[${EXTENSION_NAME}] Failed to execute Quick Reply "${setName}.${label}":`, error);
            });
    } catch (error) {
        console.error(`[${EXTENSION_NAME}] Error triggering quick reply:`, error);
    }
}

/**
 * 插件加载入口
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
                <p><b>注意:</b> 菜单内容仅在首次打开时加载，如需更新请刷新页面或重新启用插件。</p>
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
            dataNeedsUpdate = true;
        } else {
            rocketButton.hide();
            hideQuickReplyMenu();
        }
    });

    const rocketButton = $('#quick-reply-rocket-button');
    if (extension_settings[EXTENSION_NAME].enabled !== false) {
        extension_settings[EXTENSION_NAME].enabled = true;
        $(`#${EXTENSION_NAME}-enabled`).val('true');
        rocketButton.show();
    } else {
        $(`#${EXTENSION_NAME}-enabled`).val('false');
        rocketButton.hide();
    }
});
