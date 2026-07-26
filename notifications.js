// Global Notifications Logic for Smart Business Dashboard
(function() {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        /* Notification Panel Styling */
        #notificationPanel { z-index: 1000; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Dark mode overrides (if body has .dark-mode) */
        body.dark-mode #notificationPanel { background: #242424 !important; border-color: #333 !important; }
        body.dark-mode #notificationPanel>div:first-child { background: #1a1a1a !important; border-color: #333 !important; }
        body.dark-mode #notificationPanel h4 { color: white !important; }
        body.dark-mode #notificationList { background: #242424 !important; }
        body.dark-mode .notification-item { background: #1a1a1a !important; border-color: #333 !important; }
        body.dark-mode .notification-item:hover { background: #333 !important; }
        body.dark-mode .notification-msg { color: #f3f4f6 !important; }
        body.dark-mode .notification-time { color: #9ca3af !important; }

        /* Floating Bell */
        #floatingNotificationWrapper {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 9999;
        }
    `;
    document.head.appendChild(style);

    // 2. Initialize State
    window.notifications = JSON.parse(localStorage.getItem('smart_dash_notifications') || '[]');

    // 3. Inject UI
    document.addEventListener('DOMContentLoaded', () => {
        let bellBtn = document.getElementById('notificationBtn');
        let wrapper = null;
        
        if (!bellBtn) {
            // Check if there is an anonymous bell icon (like in calendar.html)
            const svgs = document.querySelectorAll('svg');
            let foundBell = null;
            for(let svg of svgs) {
                if (svg.innerHTML.includes('M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11')) {
                    foundBell = svg.closest('button');
                    if (foundBell) break;
                }
            }

            if (foundBell) {
                foundBell.id = 'notificationBtn';
                foundBell.onclick = window.toggleNotificationPanel;
                // Add dot span inside if missing
                if(!foundBell.querySelector('#notification-dot')) {
                    foundBell.innerHTML += `<span id="notification-dot" class="hidden absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>`;
                }
                foundBell.classList.add('relative');
                
                // create a wrapper div around the bell
                wrapper = document.createElement('div');
                wrapper.className = 'relative inline-block flex items-center';
                foundBell.parentNode.insertBefore(wrapper, foundBell);
                wrapper.appendChild(foundBell);
                bellBtn = foundBell;
            } else {
                // Inject floating bell
                wrapper = document.createElement('div');
                wrapper.id = 'floatingNotificationWrapper';
                wrapper.className = 'relative';
                wrapper.innerHTML = `
                    <button id="notificationBtn" onclick="toggleNotificationPanel(event)" class="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-[#242424] hover:bg-neutral-50 shadow-lg transition relative">
                        <span id="notification-dot" class="hidden absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    </button>
                `;
                document.body.appendChild(wrapper);
                bellBtn = document.getElementById('notificationBtn');
            }
        } else {
            wrapper = bellBtn.parentElement;
        }

        // Add dropdown panel to wrapper if it doesn't already exist
        if(!document.getElementById('notificationPanel')) {
            const dropdownHtml = `
                <div id="notificationPanel" class="hidden absolute right-0 top-[110%] w-72 bg-white rounded-[1.5rem] shadow-2xl border border-neutral-100 z-50 overflow-hidden opacity-0 transform scale-95 transition-all duration-200 origin-top-right flex flex-col ${wrapper.id==='floatingNotificationWrapper'? 'origin-bottom-right top-auto bottom-[110%]' : ''}">
                    <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-100/50 bg-neutral-50/50">
                        <h4 class="text-xs font-extrabold text-[#242424]">Notifications</h4>
                        <button onclick="clearNotifications(event)" class="text-neutral-400 hover:text-red-500 transition-colors" title="Clear All">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                    <div id="notificationList" class="max-h-64 overflow-y-auto hide-scrollbar flex flex-col p-2 gap-1 bg-white"></div>
                </div>
                <div id="pushNotificationPopup" class="absolute right-[110%] top-0 w-max max-w-[200px] bg-[#242424] text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-lg z-50 opacity-0 transform translate-x-4 transition-all duration-400 pointer-events-none flex items-center justify-center text-center ${wrapper.id==='floatingNotificationWrapper'? 'right-0 top-auto bottom-[110%] mb-2' : ''}">
                    <span id="pushNotificationText"></span>
                </div>
            `;
            wrapper.insertAdjacentHTML('beforeend', dropdownHtml);
        }

        window.updateNotificationUI();
    });

    // 4. Logic Functions
    window.saveNotifications = function() {
        localStorage.setItem('smart_dash_notifications', JSON.stringify(window.notifications));
        window.updateNotificationUI();
    };

    window.triggerNotification = function(msg) {
        const popup = document.getElementById('pushNotificationPopup');
        const popupText = document.getElementById('pushNotificationText');
        if (popup && popupText) {
            popupText.textContent = msg;
            popup.classList.remove('hidden', 'opacity-0', 'translate-x-4', 'pointer-events-none');
            setTimeout(() => {
                popup.classList.add('opacity-0', 'translate-x-4', 'pointer-events-none');
            }, 5000);
        }
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        window.notifications.unshift({ msg, time: timeStr, id: Date.now() });
        window.saveNotifications();
    };

    window.updateNotificationUI = function() {
        const dot = document.getElementById('notification-dot');
        const list = document.getElementById('notificationList');
        if (!dot || !list) return;

        if (window.notifications.length > 0) dot.classList.remove('hidden');
        else dot.classList.add('hidden');

        if (window.notifications.length === 0) {
            list.innerHTML = '<div class="text-center text-neutral-400 text-[10px] py-4">No new notifications</div>';
            return;
        }

        list.innerHTML = window.notifications.map(n => `
            <div class="notification-item flex justify-between items-start p-2 rounded-xl bg-neutral-50/50 border border-neutral-100 hover:bg-neutral-100/50 transition-colors">
                <span class="notification-msg text-[11px] font-bold text-[#242424] leading-tight flex-1 pr-2">${n.msg}</span>
                <span class="notification-time text-[9px] font-bold text-neutral-400 whitespace-nowrap mt-0.5">${n.time}</span>
            </div>
        `).join('');
    };

    window.toggleNotificationPanel = function(e) {
        e.stopPropagation();
        const panel = document.getElementById('notificationPanel');
        if(!panel) return;
        if (panel.classList.contains('hidden') || panel.classList.contains('opacity-0')) {
            panel.classList.remove('hidden');
            void panel.offsetWidth;
            panel.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        } else {
            window.closeNotificationPanel();
        }
    };

    window.closeNotificationPanel = function() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            setTimeout(() => { panel.classList.add('hidden'); }, 200);
        }
    };

    window.clearNotifications = function(e) {
        if(e) e.stopPropagation();
        window.notifications = [];
        window.saveNotifications();
        window.closeNotificationPanel();
    };

    document.addEventListener('click', function (e) {
        const panel = document.getElementById('notificationPanel');
        const btn = document.getElementById('notificationBtn') || (document.getElementById('floatingNotificationWrapper') ? document.getElementById('floatingNotificationWrapper').querySelector('button') : null);
        if (panel && !panel.classList.contains('hidden') && !panel.contains(e.target) && (!btn || !btn.contains(e.target))) {
            window.closeNotificationPanel();
        }
    });

    // 5. Cross-tab synchronization
    window.addEventListener('storage', (e) => {
        if (e.key === 'smart_dash_notifications') {
            window.notifications = JSON.parse(e.newValue || '[]');
            window.updateNotificationUI();
        }
    });

})();
