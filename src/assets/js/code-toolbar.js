/**
 * The toolbar above every code block: a label, download, copy and collapse.
 *
 * Built here rather than in the template because the markdown pipeline emits a
 * bare block. The language comes off the `language-*` class the highlighter
 * already sets, so a fenced block gets a toolbar without the author asking.
 *
 * Where a post used the {% code %} shortcode, its label is taken and the
 * shortcode's own header removed. That keeps the hand-written labels - "Prep
 * over SSH" reads better than "Bash" - while every other block still gets one.
 */
(function() {
    'use strict';

    // Download needs a file extension, and the language name is not always it.
    var EXT = {
        javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', python: 'py',
        bash: 'sh', shell: 'sh', sh: 'sh', zsh: 'sh', console: 'sh',
        yaml: 'yml', yml: 'yml', markdown: 'md', json: 'json', html: 'html',
        css: 'css', scss: 'scss', sql: 'sql', go: 'go', java: 'java',
        kotlin: 'kt', c: 'c', cpp: 'cpp', dart: 'dart', ruby: 'rb', rust: 'rs',
        text: 'txt', plaintext: 'txt'
    };

    // Capitalising the class name gives "Javascript" and "Sql". These are the
    // ones worth spelling properly; anything else falls back to a capital.
    var NAME = {
        javascript: 'JavaScript', js: 'JavaScript', typescript: 'TypeScript',
        json: 'JSON', html: 'HTML', css: 'CSS', scss: 'SCSS', sql: 'SQL',
        yaml: 'YAML', yml: 'YAML', cpp: 'C++', c: 'C', php: 'PHP',
        bash: 'Bash', sh: 'Shell', shell: 'Shell', go: 'Go', ruby: 'Ruby',
        rust: 'Rust', kotlin: 'Kotlin', java: 'Java', python: 'Python',
        markdown: 'Markdown', text: 'Text', plaintext: 'Text'
    };

    var ICON = {
        download: 'download', copy: 'content_copy', done: 'check',
        collapse: 'expand_less', expand: 'expand_more'
    };

    function iconSpan(name) {
        var s = document.createElement('span');
        s.className = 'material-icons md-18';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = name;
        return s;
    }

    function makeButton(title, name) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'code-action';
        b.title = title;
        b.setAttribute('aria-label', title);
        b.appendChild(iconSpan(name));
        return b;
    }

    function languageOf(block) {
        var m = /(?:^|\s)language-([\w+#-]+)/.exec(block.className || '');
        return m ? m[1] : '';
    }

    /** The block's text, without the trailing blank line the markup carries. */
    function textOf(block) {
        return block.innerText.replace(/\s+$/, '') + '\n';
    }

    function decorate(block) {
        if (block.closest('.code-wrapper')) return;   // already done

        var lang = languageOf(block);
        var label = '';

        var prev = block.previousElementSibling;
        if (prev && prev.classList.contains('quirky-code-header')) {
            var span = prev.querySelector('.code-label');
            label = span ? span.textContent.trim() : '';
            prev.parentNode.removeChild(prev);
        }
        if (!label) {
            label = NAME[lang] ||
                    (lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Code');
        }

        var wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';

        var header = document.createElement('div');
        header.className = 'code-header';

        var name = document.createElement('span');
        name.className = 'code-lang';
        name.textContent = label;

        var actions = document.createElement('div');
        actions.className = 'code-actions';

        var download = makeButton('Download', ICON.download);
        download.addEventListener('click', function() {
            var blob = new Blob([textOf(block)], { type: 'text/plain' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'snippet.' + (EXT[lang] || lang || 'txt');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        var copy = makeButton('Copy', ICON.copy);
        copy.addEventListener('click', function() {
            var mark = copy.firstChild;
            function flash(icon, cls) {
                mark.textContent = icon;
                copy.classList.add(cls);
                setTimeout(function() {
                    mark.textContent = ICON.copy;
                    copy.classList.remove(cls);
                }, 1600);
            }
            if (!navigator.clipboard) { flash('close', 'is-failed'); return; }
            navigator.clipboard.writeText(textOf(block)).then(
                function() { flash(ICON.done, 'is-done'); },
                function() { flash('close', 'is-failed'); });
        });

        var toggle = makeButton('Collapse', ICON.collapse);
        toggle.setAttribute('aria-expanded', 'true');
        toggle.addEventListener('click', function() {
            // The block is hidden by a class on the wrapper rather than an
            // inline style, so the rule stays in the stylesheet.
            var collapsed = wrapper.classList.toggle('is-collapsed');
            toggle.firstChild.textContent = collapsed ? ICON.expand : ICON.collapse;
            toggle.title = collapsed ? 'Expand' : 'Collapse';
            toggle.setAttribute('aria-label', toggle.title);
            toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        });

        actions.appendChild(download);
        actions.appendChild(copy);
        actions.appendChild(toggle);
        header.appendChild(name);
        header.appendChild(actions);

        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(header);
        wrapper.appendChild(block);
    }

    QuirkyUtils.domReady(function() {
        document.querySelectorAll('.highlighter-rouge').forEach(decorate);
    });
})();
