/**
 * Query Loop Marquee Editor Scripts
 */
wp.domReady(function() {
    var el = wp.element.createElement;
    var InnerBlocks = wp.blockEditor.InnerBlocks;
    var InspectorControls = wp.blockEditor.InspectorControls;
    var PanelBody = wp.components.PanelBody;
    var RangeControl = wp.components.RangeControl;
    var SelectControl = wp.components.SelectControl;
    var ToggleControl = wp.components.ToggleControl;
    var useSelect = wp.data.useSelect;

    wp.blocks.registerBlockType('elegant/query-marquee', {
        title: 'Query 跑马灯卡片',
        icon: 'images-alt2',
        category: 'sducraft-utils',
        description: '基于 Query Loop 的横向无限滚动卡片容器。',
        keywords: ['query', 'loop', 'marquee', '跑马灯'],
        attributes: {
            speed: { type: 'number', default: 28 },
            categoryId: { type: 'number', default: 0 },
            direction: { type: 'string', default: 'left' },
            cardStyle: { type: 'string', default: 'image-overlay' },
            layoutMode: { type: 'string', default: 'single' },
            rowCount: { type: 'number', default: 4 },
            rowGap: { type: 'number', default: 12 },
            randomizeRows: { type: 'boolean', default: true },
            gap: { type: 'number', default: 20 },
            cardMinWidth: { type: 'number', default: 260 },
            pauseOnHover: { type: 'boolean', default: true },
            respectReducedMotion: { type: 'boolean', default: true }
        },
        supports: {
            html: false
        },
        example: {
            attributes: {
                speed: 26,
                categoryId: 0,
                direction: 'left',
                cardStyle: 'image-overlay',
                layoutMode: 'single',
                rowCount: 4,
                rowGap: 12,
                randomizeRows: true,
                gap: 20,
                cardMinWidth: 260,
                pauseOnHover: true,
                respectReducedMotion: true
            }
        },
        edit: function(props) {
            var attrs = props.attributes;
            var innerBlocks = useSelect(function(select) {
                return select('core/block-editor').getBlocks(props.clientId);
            }, [props.clientId]);

            var categories = useSelect(function(select) {
                return select('core').getEntityRecords('taxonomy', 'category', {
                    per_page: 100,
                    hide_empty: false,
                    orderby: 'name',
                    order: 'asc'
                });
            }, []);

            var queryBlock = (innerBlocks || []).find(function(block) {
                return block && block.name === 'core/query';
            });

            var categoryOptions = [{ label: '全部目录', value: 0 }];
            if (Array.isArray(categories)) {
                categories.forEach(function(term) {
                    categoryOptions.push({
                        label: term && term.name ? term.name : '未命名目录',
                        value: term && term.id ? Number(term.id) : 0
                    });
                });
            }

            var syncQueryCategory = function(nextCategoryId) {
                if (!queryBlock || !queryBlock.clientId) {
                    return;
                }

                var categoryId = Number(nextCategoryId) || 0;
                var baseQuery = queryBlock.attributes && queryBlock.attributes.query ? queryBlock.attributes.query : {};
                var nextQuery = Object.assign({}, baseQuery);

                nextQuery.inherit = false;

                if (categoryId > 0) {
                    nextQuery.categoryIds = [categoryId];
                    nextQuery.taxQuery = { category: [categoryId] };
                } else {
                    delete nextQuery.categoryIds;
                    delete nextQuery.taxQuery;
                }

                wp.data.dispatch('core/block-editor').updateBlockAttributes(queryBlock.clientId, {
                    query: nextQuery
                });
            };

            var style = {
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                background: '#fff',
                overflow: 'hidden'
            };

            return el('div', { className: 'elegant-query-marquee-editor', style: style },
                el(InspectorControls, null,
                    el(PanelBody, { title: '内容来源', initialOpen: true },
                        el(SelectControl, {
                            label: '文章目录',
                            value: Number(attrs.categoryId || 0),
                            options: categoryOptions,
                            onChange: function(value) {
                                var categoryId = Number(value) || 0;
                                props.setAttributes({ categoryId: categoryId });
                                syncQueryCategory(categoryId);
                            },
                            help: Array.isArray(categories) ? '选择目录后会同步更新内部 Query Loop 过滤条件。' : '正在加载目录...'
                        }),
                        el(SelectControl, {
                            label: '卡片样式',
                            value: attrs.cardStyle || 'image-overlay',
                            options: [
                                { label: '头图覆盖正文（推荐）', value: 'image-overlay' },
                                { label: '普通样式', value: 'plain' }
                            ],
                            onChange: function(value) {
                                props.setAttributes({ cardStyle: value || 'image-overlay' });
                            }
                        }),
                        el(SelectControl, {
                            label: '布局模式',
                            value: attrs.layoutMode || 'single',
                            options: [
                                { label: '单行跑马灯', value: 'single' },
                                { label: '全屏多行交错（左右交替）', value: 'fullscreen' }
                            ],
                            onChange: function(value) {
                                props.setAttributes({ layoutMode: value || 'single' });
                            }
                        }),
                        attrs.layoutMode === 'fullscreen' ? el(RangeControl, {
                            label: '全屏行数',
                            value: Number(attrs.rowCount) || 4,
                            min: 2,
                            max: 10,
                            onChange: function(value) {
                                props.setAttributes({ rowCount: Number(value) || 4 });
                            }
                        }) : null,
                        attrs.layoutMode === 'fullscreen' ? el(RangeControl, {
                            label: '行间距（px）',
                            value: Number(attrs.rowGap) || 12,
                            min: 0,
                            max: 40,
                            onChange: function(value) {
                                props.setAttributes({ rowGap: Number(value) || 0 });
                            }
                        }) : null,
                        attrs.layoutMode === 'fullscreen' ? el(ToggleControl, {
                            label: '随机分配到各行',
                            checked: attrs.randomizeRows !== false,
                            onChange: function(value) {
                                props.setAttributes({ randomizeRows: !!value });
                            },
                            help: '开启后会把文章池随机后按行分配，尽量避免多行出现重复文章。'
                        }) : null
                    ),
                    el(PanelBody, { title: '滚动设置', initialOpen: true },
                        el(RangeControl, {
                            label: '速度（秒/轮）',
                            value: attrs.speed,
                            min: 8,
                            max: 120,
                            onChange: function(value) {
                                props.setAttributes({ speed: Number(value) || 28 });
                            }
                        }),
                        el(SelectControl, {
                            label: '方向',
                            value: attrs.direction,
                            options: [
                                { label: '向左', value: 'left' },
                                { label: '向右', value: 'right' }
                            ],
                            onChange: function(value) {
                                props.setAttributes({ direction: value || 'left' });
                            }
                        }),
                        el(RangeControl, {
                            label: '卡片间距（px）',
                            value: attrs.gap,
                            min: 0,
                            max: 80,
                            onChange: function(value) {
                                props.setAttributes({ gap: Number(value) || 0 });
                            }
                        }),
                        el(RangeControl, {
                            label: '卡片最小宽度（px）',
                            value: attrs.cardMinWidth,
                            min: 120,
                            max: 560,
                            onChange: function(value) {
                                props.setAttributes({ cardMinWidth: Number(value) || 260 });
                            }
                        }),
                        el(ToggleControl, {
                            label: '悬停时暂停',
                            checked: !!attrs.pauseOnHover,
                            onChange: function(value) {
                                props.setAttributes({ pauseOnHover: !!value });
                            }
                        }),
                        el(ToggleControl, {
                            label: '尊重减少动态效果偏好',
                            checked: !!attrs.respectReducedMotion,
                            onChange: function(value) {
                                props.setAttributes({ respectReducedMotion: !!value });
                            }
                        })
                    )
                ),
                el('div', {
                    style: {
                        padding: '10px 12px',
                        borderBottom: '1px solid #eef1f4',
                        fontSize: '12px',
                        color: '#5c6773',
                        background: '#fafbfc'
                    }
                }, '默认模板已包含头图+正文摘要覆盖层；你也可以自行编辑 Post Template。'),
                el('div', {
                    style: {
                        padding: '12px',
                        background: '#fff'
                    }
                },
                    el(InnerBlocks, {
                        allowedBlocks: ['core/query'],
                        template: [['core/query', {
                            query: {
                                perPage: 8,
                                pages: 0,
                                offset: 0,
                                postType: 'post',
                                order: 'desc',
                                orderBy: 'date',
                                inherit: false,
                                categoryIds: attrs.categoryId && Number(attrs.categoryId) > 0 ? [Number(attrs.categoryId)] : []
                            }
                        }, [
                            ['core/post-template', {
                                layout: {
                                    type: 'default'
                                }
                            }, [
                                ['core/post-featured-image', {
                                    isLink: true,
                                    height: '100%',
                                    className: 'eqm-card-image'
                                }],
                                ['core/post-title', {
                                    isLink: true,
                                    level: 3,
                                    className: 'eqm-card-title'
                                }],
                                ['core/post-excerpt', {
                                    excerptLength: 42,
                                    moreText: '',
                                    className: 'eqm-card-excerpt'
                                }]
                            ]],
                            ['core/query-no-results', {}, [
                                ['core/paragraph', { content: '当前条件下暂无文章。' }]
                            ]]
                        ]]],
                        templateLock: false,
                        renderAppender: InnerBlocks.DefaultBlockAppender
                    })
                )
            );
        },
        save: function() {
            return el(InnerBlocks.Content);
        }
    });
});
