/**
 * Elegant Tabs Editor Scripts
 */
wp.domReady(function() {
    var el = wp.element.createElement;
    var InnerBlocks = wp.blockEditor.InnerBlocks;
    var TextControl = wp.components.TextControl;

    // 子区块：elegant/tab
    wp.blocks.registerBlockType('elegant/tab', {
        title: '标签页项目',
        icon: 'welcome-add-page',
        parent: ['elegant/tabs'],
        attributes: { title: { type: 'string', default: '新标签页' } },
        edit: function(props) {
            return el('div', { 
                className: 'et-editor-tab-item', 
                style: { padding: '15px', border: '1px solid #f0f0f0', background: '#fff' } 
            },
                el(TextControl, { 
                    label: '标签标题', 
                    value: props.attributes.title, 
                    onChange: function(v){ props.setAttributes({title:v}); } 
                }),
                el(InnerBlocks)
            );
        },
        save: function() { return el(InnerBlocks.Content); }
    });

    // 父区块：elegant/tabs
    wp.blocks.registerBlockType('elegant/tabs', {
        title: '标签页组',
        description: '创建一个美观、响应式的标签页容器，用于分类展示内容。',
        icon: 'index-card',
        category: 'design',
        keywords: ['tabs', '选项卡', '标签'],
        
        // 【核心加回】区块预览示例 (Inserter Preview)
        example: {
            innerBlocks: [
                {
                    name: 'elegant/tab',
                    attributes: { title: '预览标签 1' },
                    innerBlocks: [ { name: 'core/paragraph', attributes: { content: '在这里输入内容...' } } ]
                },
                {
                    name: 'elegant/tab',
                    attributes: { title: '预览标签 2' }
                }
            ]
        },

        edit: function(props) {
            var clientId = props.clientId;
            
            // 使用 ES5 方式处理 Hook
            var state = wp.element.useState(0);
            var activeIndex = state[0];
            var setActiveIndex = state[1];

            var innerBlocks = wp.data.useSelect(function(select) {
                return select('core/block-editor').getBlocks(clientId);
            }, [clientId]);

            var onAddTab = function() {
                var newBlock = wp.blocks.createBlock('elegant/tab', { 
                    title: '新标签页 ' + ((innerBlocks ? innerBlocks.length : 0) + 1) 
                });
                wp.data.dispatch('core/block-editor').insertBlocks(newBlock, innerBlocks.length, clientId);
                setActiveIndex(innerBlocks.length);
            };

            return el('div', { className: 'et-editor-tabs-wrap' },
                el('div', { className: 'et-nav', style: { display: 'flex', alignItems: 'center', background: '#f8f9fb', border: '1px solid #eee', borderBottom: 'none' } },
                    (innerBlocks || []).map(function(block, index) {
                        var isActive = activeIndex === index;
                        return el('div', {
                            key: block.clientId,
                            onClick: function() { setActiveIndex(index); },
                            style: {
                                padding: '12px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                                color: isActive ? '#2196f3' : '#777',
                                background: isActive ? '#fff' : 'transparent',
                                borderBottom: isActive ? '3px solid #2196f3' : '3px solid transparent'
                            }
                        }, block.attributes.title || '标签');
                    }),
                    el('div', { onClick: onAddTab, style: { padding: '0 15px', cursor: 'pointer', color: '#2196f3', fontSize: '20px' } }, '+')
                ),
                el('div', { className: 'et-content', style: { border: '1px solid #eee', padding: '15px', background: '#fff' } },
                    el('style', null, 
                        '.et-editor-tabs-wrap .block-editor-block-list__layout > div.wp-block:not(:nth-child(' + (activeIndex + 1) + ')) { display: none !important; }' +
                        '.et-editor-tabs-wrap .block-editor-block-list__layout > .block-list-appender { display: block !important; margin-top: 15px; }'
                    ),
                    el(InnerBlocks, { 
                        allowedBlocks: ['elegant/tab'],
                        template: [['elegant/tab', {title:'选项卡 1'}], ['elegant/tab', {title:'选项卡 2'}]],
                        renderAppender: InnerBlocks.ButtonBlockAppender 
                    })
                )
            );
        },
        save: function() { return el(InnerBlocks.Content); }
    });
});
