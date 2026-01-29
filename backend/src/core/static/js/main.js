// Sidebar Toggle Functionality for GestorCOC
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarCollapse = document.getElementById('sidebar-collapse');
    const collapseIndicator = document.getElementById('collapse-indicator');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mainContent = document.getElementById('main-content');

    // Check saved state
    const isMobile = window.innerWidth < 1024;
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    // Apply saved state on desktop
    if (!isMobile && isCollapsed) {
        collapseSidebar();
    }

    // Mobile: Toggle sidebar visibility
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('-translate-x-full');
            sidebarOverlay.classList.toggle('hidden');
        });
    }

    // Mobile: Close button
    if (sidebarClose) {
        sidebarClose.addEventListener('click', function () {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });
    }

    // Mobile: Click overlay to close
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });
    }

    // Desktop: Collapse sidebar
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', function () {
            toggleCollapse();
        });
    }

    // Desktop: Collapse indicator
    if (collapseIndicator) {
        collapseIndicator.addEventListener('click', function () {
            toggleCollapse();
        });
    }

    function toggleCollapse() {
        const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');

        if (isCurrentlyCollapsed) {
            expandSidebar();
        } else {
            collapseSidebar();
        }

        // Save state
        localStorage.setItem('sidebarCollapsed', !isCurrentlyCollapsed);
    }

    function collapseSidebar() {
        sidebar.classList.add('collapsed');
        sidebar.style.width = '5rem'; // 80px
        mainContent.style.marginLeft = '5rem';

        // Hide text elements
        document.querySelectorAll('.sidebar-text').forEach(el => {
            el.style.opacity = '0';
            el.style.width = '0';
        });

        // Rotate collapse indicator
        if (collapseIndicator) {
            collapseIndicator.querySelector('svg').style.transform = 'rotate(180deg)';
        }
    }

    function expandSidebar() {
        sidebar.classList.remove('collapsed');
        sidebar.style.width = '16rem'; // 256px
        mainContent.style.marginLeft = '16rem';

        // Show text elements
        document.querySelectorAll('.sidebar-text').forEach(el => {
            el.style.opacity = '1';
            el.style.width = 'auto';
        });

        // Rotate collapse indicator
        if (collapseIndicator) {
            collapseIndicator.querySelector('svg').style.transform = 'rotate(0deg)';
        }
    }

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            const nowMobile = window.innerWidth < 1024;

            if (nowMobile) {
                // Mobile: hide sidebar by default
                sidebar.classList.add('-translate-x-full');
                sidebarOverlay.classList.add('hidden');
                mainContent.style.marginLeft = '0';
            } else {
                // Desktop: show sidebar
                sidebar.classList.remove('-translate-x-full');
                sidebarOverlay.classList.add('hidden');

                // Restore collapsed state
                const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
                if (isCollapsed) {
                    collapseSidebar();
                } else {
                    expandSidebar();
                }
            }
        }, 250);
    });

    // Add smooth animations
    sidebar.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
    mainContent.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';

    // Dropdown toggles
    document.querySelectorAll('.nav-group-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function () {
            const chevron = this.querySelector('svg:last-child');
            if (chevron) {
                const isRotated = chevron.style.transform === 'rotate(180deg)';
                chevron.style.transform = isRotated ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
    });

    // Add active state to current page
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(function (item) {
        const href = item.getAttribute('href');
        if (href && currentPath.includes(href) && href !== '#') {
            item.classList.add('bg-sidebar-hover', 'text-white');
            item.classList.remove('text-white/80');
        }
    });

    // Animation for stats cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry, index) {
            if (entry.isIntersecting) {
                setTimeout(function () {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all animated elements
    document.querySelectorAll('.stat-card, .action-card').forEach(function (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        observer.observe(el);
    });
});
