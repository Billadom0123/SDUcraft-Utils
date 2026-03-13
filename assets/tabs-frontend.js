(function() {
    function activateTab(container, trigger) {
        if (!container || !trigger) {
            return;
        }

        var targetId = trigger.getAttribute('data-tab-target');
        if (!targetId) {
            return;
        }

        var targetPanel = container.querySelector('#' + targetId);
        if (!targetPanel) {
            return;
        }

        var triggers = container.querySelectorAll('.elegant-tab-trigger');
        var panels = container.querySelectorAll('.elegant-tab-pane');

        triggers.forEach(function(btn) {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('tabindex', '-1');
        });

        panels.forEach(function(panel) {
            panel.classList.remove('active');
            panel.setAttribute('hidden', 'hidden');
        });

        trigger.classList.add('active');
        trigger.setAttribute('aria-selected', 'true');
        trigger.setAttribute('tabindex', '0');
        targetPanel.classList.add('active');
        targetPanel.removeAttribute('hidden');
    }

    document.addEventListener('click', function(event) {
        var trigger = event.target.closest('.elegant-tab-trigger[data-tab-target]');
        if (!trigger) {
            return;
        }

        var container = trigger.closest('.elegant-tabs');
        activateTab(container, trigger);
    });

    document.addEventListener('keydown', function(event) {
        var trigger = event.target.closest('.elegant-tab-trigger[data-tab-target]');
        if (!trigger) {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            var container = trigger.closest('.elegant-tabs');
            activateTab(container, trigger);
        }
    });
})();
