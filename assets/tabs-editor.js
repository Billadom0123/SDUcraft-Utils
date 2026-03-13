/**
 * Elegant Tabs Editor Scripts
 */
wp.domReady(function() {
    var el = wp.element.createElement;
    var InnerBlocks = wp.blockEditor.InnerBlocks;
    var TextControl = wp.components.TextControl;

    // 子区块：elegant/tab
    wp.blocks.registerBlockType('elegant/tab', {
        title: '单个标签页',
        icon: 'welcome-add-page',
        description: '标签页组中的单个内容面板。',
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
        icon: 'index-card',
        category: 'design',
        description: '将内容拆分成可切换的多个标签页，适合 FAQ、参数说明和步骤内容展示。',
        keywords: ['tabs', '选项卡', '标签'],
        example: {
            innerBlocks: [
                {
                    name: 'elegant/tab',
                    attributes: { title: '功能说明' },
                    innerBlocks: [
                        {
                            name: 'core/paragraph',
                            attributes: { content: '这是第一个标签页内容示例。' }
                        }
                    ]
                },
                {
                    name: 'elegant/tab',
                    attributes: { title: '使用方法' },
                    innerBlocks: [
                        {
                            name: 'core/paragraph',
                            attributes: { content: '点击标签即可切换对应内容。' }
                        }
                    ]
                }
            ]
        },
        edit: function(props) {
            var clientId = props.clientId;
            var safeClientClass = 'et-editor-tabs-' + clientId.replace(/[^a-zA-Z0-9_-]/g, '');
            var state = wp.element.useState(0);
            var activeIndex = state[0];
            var setActiveIndex = state[1];

            var innerBlocks = wp.data.useSelect(function(select) {
                return select('core/block-editor').getBlocks(clientId);
            }, [clientId]);

            var onAddTab = function() {
                var newBlock = wp.blocks.createBlock('elegant/tab', { 
                    title: '选项卡 ' + ((innerBlocks ? innerBlocks.length : 0) + 1) 
                });
                wp.data.dispatch('core/block-editor').insertBlocks(newBlock, innerBlocks.length, clientId);
                setActiveIndex(innerBlocks.length);
            };

            return el('div', { className: 'et-editor-tabs-wrap ' + safeClientClass },
                el('div', {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        background: '#f8f9fb',
                        border: '1px solid #eee',
                        borderBottom: 'none',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        whiteSpace: 'nowrap',
                        scrollbarWidth: 'thin'
                    }
                },
                    (innerBlocks || []).map(function(block, index) {
                        var isActive = activeIndex === index;
                        return el('div', {
                            key: block.clientId,
                            onClick: function() { setActiveIndex(index); },
                            style: {
                                flex: '0 0 auto',
                                padding: '12px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                                color: isActive ? '#2196f3' : '#777',
                                background: isActive ? '#fff' : 'transparent',
                                borderBottom: isActive ? '3px solid #2196f3' : '3px solid transparent'
                            }
                        }, block.attributes.title || '标签');
                    }),
                    el('div', {
                        onClick: onAddTab,
                        style: {
                            flex: '0 0 auto',
                            padding: '0 15px',
                            cursor: 'pointer',
                            color: '#2196f3',
                            fontSize: '20px'
                        }
                    }, '+')
                ),
                el('div', { className: 'et-editor-tabs-content', style: { border: '1px solid #eee', padding: '15px', background: '#fff' } },
                    el('style', null, 
                        '.' + safeClientClass + ' > .et-editor-tabs-content > .block-editor-inner-blocks > .block-editor-block-list__layout > [data-type="elegant/tab"]:not(:nth-child(' + (activeIndex + 1) + ')) { display: none !important; }' +
                        '.' + safeClientClass + ' > .et-editor-tabs-content > .block-editor-inner-blocks > .block-editor-block-list__layout > .block-list-appender { display: block !important; margin-top: 15px; }'
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
