/**
 * Life in weeks - the detail panel.
 *
 * Every marked week is a <button> carrying its own text in data attributes, so
 * clicking one only has to copy four strings into the single shared panel.
 * One panel, not one per week: the grid runs to several thousand boxes and a
 * popover each would be a document nobody's browser enjoys.
 */
(function() {
    'use strict';

    YoloUtils.domReady(function() {
        var panel = document.getElementById('weeks-detail');
        if (!panel) return;

        var headline = panel.querySelector('#weeks-detail-headline');
        var date = panel.querySelector('.weeks-detail-date');
        var description = panel.querySelector('.weeks-detail-description');
        var close = panel.querySelector('.weeks-detail-close');
        var open = null;

        function hide() {
            panel.hidden = true;
            if (open) open.classList.remove('week-open');
            open = null;
        }

        function show(week) {
            if (open) open.classList.remove('week-open');
            open = week;
            week.classList.add('week-open');

            headline.textContent = week.dataset.headline || '';
            date.textContent = week.dataset.dateLabel || '';

            // An entry may have a headline and no description; hide the
            // paragraph rather than leaving an empty line in the panel.
            var text = week.dataset.description || '';
            description.textContent = text;
            description.hidden = !text;

            panel.hidden = false;
        }

        // Delegated: one listener on the page rather than one per marked week.
        document.addEventListener('click', function(e) {
            // Any labelled week, not just a life event: the weeks a job
            // started carry the same data attributes and are the same kind
            // of button. Keyed on the attribute the panel actually reads, so
            // a new kind of marked week works without touching this.
            var week = e.target.closest('.week[data-headline]');
            if (week) {
                if (week === open) hide();
                else show(week);
                return;
            }
            if (!panel.hidden && !panel.contains(e.target)) hide();
        });

        close.addEventListener('click', hide);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !panel.hidden) {
                var focused = open;
                hide();
                if (focused) focused.focus();
            }
        });
    });
})();
