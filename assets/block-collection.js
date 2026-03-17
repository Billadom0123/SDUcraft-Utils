/**
 * Register SDUcraft block collection in a single shared entry.
 */
wp.domReady(function() {
    if (wp.blocks && typeof wp.blocks.registerBlockCollection === 'function') {
        wp.blocks.registerBlockCollection('elegant', {
            title: 'SDUcraft Utils'
        });
    }
});
