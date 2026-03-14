(function() {
    function toArray(listLike) {
        return Array.prototype.slice.call(listLike || []);
    }

    function getNumericPx(value, fallback) {
        var num = parseFloat(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function shuffle(items) {
        for (var i = items.length - 1; i > 0; i -= 1) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = items[i];
            items[i] = items[j];
            items[j] = tmp;
        }
        return items;
    }

    function getPostTemplates(viewports) {
        return toArray(viewports).map(function(viewport) {
            return viewport.querySelector('.elegant-query-marquee__group .wp-block-post-template');
        }).filter(function(template) {
            return !!template;
        });
    }

    function getOriginalCardPool(root, sourceTemplate) {
        if (!root || !sourceTemplate) {
            return [];
        }

        if (!Array.isArray(root.__eqmOriginalCardPool)) {
            root.__eqmOriginalCardPool = toArray(sourceTemplate.children).map(function(card) {
                return card.cloneNode(true);
            });
        }

        return root.__eqmOriginalCardPool.map(function(card) {
            return card.cloneNode(true);
        });
    }

    function distributeUniquePostsAcrossRows(root, viewports, shouldShuffle) {
        if (!root) {
            return;
        }

        var templates = getPostTemplates(viewports);
        if (templates.length < 2) {
            return;
        }

        var cardPool = getOriginalCardPool(root, templates[0]);
        if (!cardPool.length) {
            return;
        }

        if (shouldShuffle) {
            cardPool = shuffle(cardPool);
        }

        templates.forEach(function(template) {
            while (template.firstChild) {
                template.removeChild(template.firstChild);
            }
        });

        cardPool.forEach(function(card, index) {
            var targetIndex = index % templates.length;
            templates[targetIndex].appendChild(card);
        });
    }

    function resetClones(track) {
        if (!track) {
            return;
        }

        var clones = track.querySelectorAll('.elegant-query-marquee__group.is-clone');
        clones.forEach(function(clone) {
            clone.remove();
        });
    }

    function initMarqueeRow(root, viewport) {
        if (!root || !viewport) {
            return;
        }

        var track = viewport.querySelector('.elegant-query-marquee__track');
        var baseGroup = track ? track.querySelector('.elegant-query-marquee__group:not(.is-clone)') : null;
        if (!track || !baseGroup) {
            return;
        }

        resetClones(track);

        var computed = window.getComputedStyle(root);
        var gap = getNumericPx(computed.getPropertyValue('--eqm-gap'), 20);
        var baseWidth = Math.ceil(baseGroup.getBoundingClientRect().width);
        if (baseWidth <= 0) {
            return;
        }

        track.style.setProperty('--eqm-row-group-width', baseWidth + 'px');

        var viewportWidth = Math.ceil(viewport.getBoundingClientRect().width);
        var targetWidth = Math.max(viewportWidth * 2, baseWidth * 2);
        var trackWidth = baseWidth;
        var guard = 0;

        while (trackWidth < targetWidth && guard < 8) {
            var clone = baseGroup.cloneNode(true);
            clone.classList.add('is-clone');
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
            trackWidth += baseWidth + gap;
            guard += 1;
        }
    }

    function initMarquee(root) {
        if (!root) {
            return;
        }

        var respectReducedMotion = root.getAttribute('data-respect-reduced-motion') === '1';
        if (respectReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        var viewports = root.querySelectorAll('.elegant-query-marquee__viewport');
        if (!viewports.length) {
            return;
        }

        var shouldRandomizeRows = root.getAttribute('data-randomize-rows') === '1' && viewports.length > 1;
        if (viewports.length > 1) {
            distributeUniquePostsAcrossRows(root, viewports, shouldRandomizeRows);
        }

        viewports.forEach(function(viewport) {
            initMarqueeRow(root, viewport);
        });
    }

    function initAll() {
        var marquees = document.querySelectorAll('.elegant-query-marquee');
        marquees.forEach(function(marquee) {
            initMarquee(marquee);
        });
    }

    var resizeTimer = null;
    window.addEventListener('resize', function() {
        if (resizeTimer) {
            window.clearTimeout(resizeTimer);
        }

        resizeTimer = window.setTimeout(function() {
            initAll();
        }, 120);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
