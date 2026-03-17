/**
 * Elegant Mindmap Block Editor
 */
wp.domReady(function() {
    var el = wp.element.createElement;
    var InnerBlocks = wp.blockEditor.InnerBlocks;
    var useSelect = wp.data.useSelect;
    var apiFetch = wp.apiFetch;

    wp.blocks.registerBlockType('elegant/mindmap', {
        title: '思维导图区块',
        icon: 'share-alt2',
        category: 'sducraft-utils',
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
        edit: function(props) {
            var previewVisibleState = wp.element.useState(false);
            var isPreviewVisible = previewVisibleState[0];
            var setPreviewVisible = previewVisibleState[1];
            var previewLoadingState = wp.element.useState(false);
            var isPreviewLoading = previewLoadingState[0];
            var setPreviewLoading = previewLoadingState[1];
            var previewHtmlState = wp.element.useState('');
            var previewHtml = previewHtmlState[0];
            var setPreviewHtml = previewHtmlState[1];
            var previewErrorState = wp.element.useState('');
            var previewError = previewErrorState[0];
            var setPreviewError = previewErrorState[1];

            var innerBlocks = useSelect(function(select) {
                return select('core/block-editor').getBlocks(props.clientId);
            }, [props.clientId]);

            var onPreview = function() {
                var serialized = wp.blocks.serialize(innerBlocks || []);
                setPreviewVisible(true);
                setPreviewLoading(true);
                setPreviewError('');

                apiFetch({
                    path: '/elegant-toolkit/v1/mindmap-preview',
                    method: 'POST',
                    data: { content: serialized }
                }).then(function(response) {
                    var html = response && response.html ? response.html : '';
                    setPreviewHtml(html);
                    if (!html) {
                        setPreviewError('当前内容还不能生成导图，请先完善列表层级。');
                    }
                }).catch(function() {
                    setPreviewError('预览生成失败，请稍后重试。');
                    setPreviewHtml('');
                }).finally(function() {
                    setPreviewLoading(false);
                });
            };

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
                        background: '#fafbfc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                    }
                },
                    el('span', null, '在下面编辑列表层级，前台会自动渲染成思维导图。'),
                    el('div', { style: { display: 'inline-flex', gap: '8px' } },
                        el('button', {
                            type: 'button',
                            onClick: onPreview,
                            disabled: isPreviewLoading,
                            style: {
                                border: '1px solid #ccd0d4',
                                background: '#fff',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                cursor: isPreviewLoading ? 'not-allowed' : 'pointer'
                            }
                        }, isPreviewLoading ? '生成中...' : (isPreviewVisible ? '刷新预览' : '预览导图')),
                        isPreviewVisible ? el('button', {
                            type: 'button',
                            onClick: function() { setPreviewVisible(false); },
                            style: {
                                border: '1px solid #ccd0d4',
                                background: '#fff',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }
                        }, '关闭预览') : null
                    )
                ),
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
                ),
                isPreviewVisible ? el('div', {
                    style: {
                        borderTop: '1px solid #eef1f4',
                        padding: '12px',
                        background: '#fcfdff'
                    }
                },
                    el('div', {
                        style: {
                            fontSize: '12px',
                            color: '#5c6773',
                            marginBottom: '8px'
                        }
                    }, '导图预览'),
                    previewError ? el('div', {
                        style: {
                            color: '#b32d2e',
                            fontSize: '12px',
                            marginBottom: '8px'
                        }
                    }, previewError) : null,
                    previewHtml ? el('div', {
                        dangerouslySetInnerHTML: { __html: previewHtml }
                    }) : (!isPreviewLoading ? el('div', {
                        style: {
                            color: '#7a8695',
                            fontSize: '12px'
                        }
                    }, '暂无可预览内容。') : null)
                ) : null
            );
        },
        save: function() {
            return el(InnerBlocks.Content);
        }
    });
});
