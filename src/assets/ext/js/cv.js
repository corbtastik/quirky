/**
 * The career band's caption.
 *
 * Every block already carries its details in `title`, so the band works with
 * no JavaScript - this only replaces the browser's half-second tooltip delay
 * with a caption that updates as the pointer moves, which is what makes the
 * band scannable rather than something you have to interrogate block by block.
 *
 * Delegated from the track, so eleven blocks cost four listeners.
 */
(function() {
    'use strict';

    YoloUtils.domReady(function() {
        var track = document.querySelector('.career-track');
        var caption = document.getElementById('career-caption');
        if (!track || !caption) return;

        var resting = caption.dataset.default || caption.innerHTML;

        function show(block) {
            caption.innerHTML =
                '<b>' + block.dataset.employer + '</b> &mdash; ' +
                block.dataset.title + ' &middot; ' + block.dataset.span;
        }

        function reset() {
            caption.innerHTML = resting;
        }

        // Pointer and keyboard are separate paths on purpose: focus should
        // survive the pointer wandering off, so only the matching event resets.
        track.addEventListener('mouseover', function(e) {
            var block = e.target.closest('.career-block');
            if (block) show(block);
        });
        track.addEventListener('mouseleave', reset);

        track.addEventListener('focusin', function(e) {
            var block = e.target.closest('.career-block');
            if (block) show(block);
        });
        track.addEventListener('focusout', reset);
    });
})();
