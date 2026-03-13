/**
 * Elegant Mindmap Block Editor
 */
wp.domReady(function() {
    var el = wp.element.createElement;
    var InnerBlocks = wp.blockEditor.InnerBlocks;

    wp.blocks.registerBlockType('elegant/mindmap', {
        title: '思维导图区块',
        icon: 'share-alt2',
        category: 'design',
        description: '通过列表结构创建思维导图，支持多层级分支。',
        keywords: ['mindmap', '思维导图', 'list'],
        example: {
            innerBlocks: [
                {
                    name: 'core/list',
                    attributes: {
                        values: '<li>中心主题<ul><li>分支 A<ul><li>叶子 A-1</li></ul></li><li>分支 B</li></ul></li>'
                    }
                }
            ]
        },
        edit: function() {
            return el('div', {
                className: 'elegant-mindmap-editor-wrap',
                style: {
                    border: '1px solid #e3e6ea',
                    borderRadius: '8px',
                    background: '#fff'
                }
            },
                el('div', {
                    style: {
                        padding: '10px 12px',
                        borderBottom: '1px solid #eef1f4',
                        fontSize: '12px',
                        color: '#5c6773',
                        background: '#fafbfc'
                    }
                }, '在下面编辑列表层级，前台会自动渲染成思维导图。'),
                el('div', { style: { padding: '12px' } },
                    el(InnerBlocks, {
                        allowedBlocks: ['core/list'],
                        template: [
                            ['core/list', {
                                values: '<li>中心主题<ul><li>一级分支 1</li><li>一级分支 2<ul><li>二级分支</li></ul></li></ul></li>'
                            }]
                        ],
                        templateLock: false,
                        renderAppender: InnerBlocks.ButtonBlockAppender
                    })
                )
            );
        },
        save: function() {
            return el(InnerBlocks.Content);
        }
    });
});
