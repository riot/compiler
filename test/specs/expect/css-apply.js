//src: test/specs/fixtures/css-apply.tag
riot.tag2('css-apply', '<p>should have riot color</p> <div>should be applied riot theme</p>', 'css-apply,[data-is="css-apply"]{ display: block; --riot-theme: { color: white; background-color: #F04; }; --riot-color: #F04; } css-apply p,[data-is="css-apply"] p{ border: solid 1px black; color: var(--riot-color); } css-apply div,[data-is="css-apply"] div{ @apply --riot-theme; }', '', function(opts) {
});
