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
        category: 'sducraft-utils',
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
        category: 'sducraft-utils',
        description: '拥有可切换的多个标签页。',
        keywords: ['tabs', '选项卡', '标签'],
        example: {
            innerBlocks: [
                {
                    name: 'elegant/tab',
                    attributes: { title: '功能说明' },
                    innerBlocks: [
                        {
                            name: 'core/paragraph',
                            attributes: { content: '第一个标签页。' }
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
            var dragState = wp.element.useState(-1);
            var draggingIndex = dragState[0];
            var setDraggingIndex = dragState[1];
            var tabNodeRefs = wp.element.useRef({});
            var pendingRectsRef = wp.element.useRef(null);

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

            var onMoveTab = function(fromIndex, toIndex) {
                if (!innerBlocks || fromIndex === toIndex || toIndex < 0 || toIndex >= innerBlocks.length) {
                    return;
                }

                var blockToMove = innerBlocks[fromIndex];
                if (!blockToMove) {
                    return;
                }

                // Capture positions before reorder so we can animate into new slots.
                var currentRects = {};
                innerBlocks.forEach(function(item) {
                    var node = tabNodeRefs.current[item.clientId];
                    if (node) {
                        currentRects[item.clientId] = node.getBoundingClientRect();
                    }
                });
                pendingRectsRef.current = currentRects;

                var blockEditorDispatch = wp.data.dispatch('core/block-editor');

                if (typeof blockEditorDispatch.moveBlocksToPosition === 'function') {
                    blockEditorDispatch.moveBlocksToPosition([
                        blockToMove.clientId
                    ], clientId, clientId, toIndex);
                } else if (typeof blockEditorDispatch.moveBlockToPosition === 'function') {
                    blockEditorDispatch.moveBlockToPosition(
                        blockToMove.clientId,
                        clientId,
                        clientId,
                        toIndex
                    );
                }

                setActiveIndex(toIndex);
            };

            var onStartDragTab = function(index, event) {
                if (event.button !== 0) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                setDraggingIndex(index);
            };

            var onHoverDragTab = function(index, event) {
                if (draggingIndex < 0 || draggingIndex === index) {
                    return;
                }

                // Keep reorder intent explicit: only reorder while pointer is pressed.
                if (!event || event.buttons !== 1) {
                    return;
                }

                onMoveTab(draggingIndex, index);
                setDraggingIndex(index);
            };

            var onEndDragTab = function() {
                if (draggingIndex < 0) {
                    return;
                }

                setDraggingIndex(-1);
            };

            var onRemoveTab = function(index) {
                if (!innerBlocks || !innerBlocks[index] || innerBlocks.length <= 1) {
                    return;
                }

                wp.data.dispatch('core/block-editor').removeBlock(innerBlocks[index].clientId, false);

                if (activeIndex === index) {
                    setActiveIndex(Math.max(0, index - 1));
                } else if (activeIndex > index) {
                    setActiveIndex(activeIndex - 1);
                }
            };

            wp.element.useEffect(function() {
                var count = innerBlocks ? innerBlocks.length : 0;
                if (count === 0) {
                    setActiveIndex(0);
                    return;
                }

                if (activeIndex > count - 1) {
                    setActiveIndex(count - 1);
                }
            }, [innerBlocks ? innerBlocks.length : 0, activeIndex]);

            wp.element.useEffect(function() {
                if (draggingIndex < 0) {
                    return;
                }

                var stopDrag = function() {
                    setDraggingIndex(-1);
                };

                document.addEventListener('mouseup', stopDrag);
                window.addEventListener('blur', stopDrag);

                return function() {
                    document.removeEventListener('mouseup', stopDrag);
                    window.removeEventListener('blur', stopDrag);
                };
            }, [draggingIndex]);

            wp.element.useLayoutEffect(function() {
                var prevRects = pendingRectsRef.current;
                if (!prevRects || !innerBlocks || !innerBlocks.length) {
                    return;
                }

                innerBlocks.forEach(function(item) {
                    var node = tabNodeRefs.current[item.clientId];
                    var prevRect = prevRects[item.clientId];
                    if (!node || !prevRect) {
                        return;
                    }

                    var nextRect = node.getBoundingClientRect();
                    var deltaX = prevRect.left - nextRect.left;
                    if (!deltaX) {
                        return;
                    }

                    node.style.transition = 'none';
                    node.style.transform = 'translateX(' + deltaX + 'px)';
                    node.getBoundingClientRect();
                    node.style.transition = 'transform 220ms cubic-bezier(0.2, 0, 0, 1)';
                    node.style.transform = 'translateX(0)';
                });

                pendingRectsRef.current = null;
            }, [innerBlocks ? innerBlocks.map(function(item) { return item.clientId; }).join('|') : '']);

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
                            ref: function(node) {
                                if (node) {
                                    tabNodeRefs.current[block.clientId] = node;
                                } else {
                                    delete tabNodeRefs.current[block.clientId];
                                }
                            },
                            onClick: function() { setActiveIndex(index); },
                            onMouseEnter: function(event) {
                                onHoverDragTab(index, event);
                            },
                            onMouseUp: function() {
                                onEndDragTab();
                            },
                            style: {
                                flex: '0 0 auto',
                                padding: '12px 18px', cursor: draggingIndex >= 0 ? 'grabbing' : 'pointer', fontSize: '13px', fontWeight: 'bold',
                                color: isActive ? '#2196f3' : '#777',
                                background: isActive ? '#fff' : 'transparent',
                                borderBottom: isActive ? '3px solid #2196f3' : '3px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: draggingIndex === index ? 0.7 : 1
                            }
                        },
                            el('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } },
                                el('span', {
                                    onMouseDown: function(event) {
                                        onStartDragTab(index, event);
                                    },
                                    style: {
                                        fontSize: '20px',
                                        opacity: 0.55,
                                        cursor: draggingIndex === index ? 'grabbing' : 'grab'
                                    },
                                    title: '按住并拖动以调整顺序'
                                }, '⋮⋮'),
                                el('span', null, block.attributes.title || '标签')
                            ),
                            isActive ? el('span', {
                                style: {
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginLeft: '4px',
                                    fontWeight: 'normal',
                                    fontSize: '12px'
                                }
                            },
                                el('span', {
                                    role: 'button',
                                    title: innerBlocks.length <= 1 ? '至少保留一个标签页' : '删除当前标签页',
                                    onClick: function(e) {
                                        e.stopPropagation();
                                        onRemoveTab(index);
                                    },
                                    style: {
                                        cursor: innerBlocks.length <= 1 ? 'not-allowed' : 'pointer',
                                        opacity: innerBlocks.length <= 1 ? 0.35 : 1,
                                        color: '#d63638'
                                    }
                                }, '✕')
                            ) : null
                        );
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
                        '.' + safeClientClass + ' > .et-editor-tabs-content > .block-editor-inner-blocks > .block-editor-block-list__layout > [data-type="elegant/tab"]:not(:nth-child(' + (activeIndex + 1) + ')) { display: none !important; }'
                    ),
                    el(InnerBlocks, { 
                        allowedBlocks: ['elegant/tab'],
                        template: [['elegant/tab', {title:'选项卡 1'}], ['elegant/tab', {title:'选项卡 2'}]],
                            renderAppender: InnerBlocks.DefaultBlockAppender
                    })
                )
            );
        },
        save: function() { return el(InnerBlocks.Content); }
    });
});
