/**
 * 整合包信息编辑js
 */
wp.domReady(function() {
    var el = wp.element.createElement;
    var TextControl = wp.components.TextControl;
    var TextareaControl = wp.components.TextareaControl;
    var CheckboxControl = wp.components.CheckboxControl;
    var PanelBody = wp.components.PanelBody;
    var InspectorControls = wp.blockEditor.InspectorControls;
    var useSelect = wp.data.useSelect;

    var FIELD_KEYS = ['all', 'title', 'version', 'author', 'summary'];

    var FIELD_LABELS = {
        all: '完整信息卡（全部字段）',
        title: '标题',
        version: '版本',
        author: '作者',
        summary: '简介'
    };

    function normalizeMeta(attrs) {
        attrs = attrs || {};
        return {
            title: attrs.title ? String(attrs.title) : '',
            version: attrs.version ? String(attrs.version) : '',
            author: attrs.author ? String(attrs.author) : '',
            summary: attrs.summary ? String(attrs.summary) : ''
        };
    }

    function isMetaEmpty(meta) {
        return !meta.title && !meta.version && !meta.author && !meta.summary;
    }

    function normalizeSummaryForClamp(value) {
        return value ? String(value).replace(/\r\n|\r|\n/g, ' ') : '';
    }

    function normalizeSelectedFields(attributes) {
        var attrs = attributes || {};
        var fields = Array.isArray(attrs.fields) ? attrs.fields.slice() : [];

        if (!fields.length && attrs.field) {
            fields = [String(attrs.field)];
        }

        fields = fields
            .map(function(item) { return String(item || '').trim(); })
            .filter(function(item) { return FIELD_KEYS.indexOf(item) >= 0; });

        fields = fields.filter(function(item, index) {
            return fields.indexOf(item) === index;
        });

        if (!fields.length) {
            return ['all'];
        }

        if (fields.indexOf('all') >= 0) {
            return ['all'];
        }

        return fields;
    }

    function toggleSelectedField(currentFields, targetField, checked) {
        var nextFields = Array.isArray(currentFields) ? currentFields.slice() : ['all'];

        if (targetField === 'all') {
            return checked ? ['all'] : nextFields;
        }

        nextFields = nextFields.filter(function(item) {
            return item !== 'all';
        });

        if (checked) {
            if (nextFields.indexOf(targetField) < 0) {
                nextFields.push(targetField);
            }
        } else {
            nextFields = nextFields.filter(function(item) {
                return item !== targetField;
            });
        }

        if (!nextFields.length) {
            return ['all'];
        }

        return nextFields;
    }

    function findGameMetaAttrs(blocks) {
        if (!Array.isArray(blocks)) {
            return null;
        }

        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i] || {};
            if (block.name === 'elegant/game-meta') {
                return normalizeMeta(block.attributes);
            }

            if (Array.isArray(block.innerBlocks) && block.innerBlocks.length) {
                var innerFound = findGameMetaAttrs(block.innerBlocks);
                if (innerFound) {
                    return innerFound;
                }
            }
        }

        return null;
    }

    function filterMetaBySelectedFields(meta, selectedFields) {
        var safeMeta = normalizeMeta(meta || {});
        var fields = Array.isArray(selectedFields) ? selectedFields : ['all'];

        if (fields.indexOf('all') >= 0) {
            return safeMeta;
        }

        return {
            title: fields.indexOf('title') >= 0 ? safeMeta.title : '',
            version: fields.indexOf('version') >= 0 ? safeMeta.version : '',
            author: fields.indexOf('author') >= 0 ? safeMeta.author : '',
            summary: fields.indexOf('summary') >= 0 ? safeMeta.summary : ''
        };
    }

    wp.blocks.registerBlockType('elegant/game-meta', {
        title: '整合包信息',
        icon: 'id-alt',
        category: 'widgets',
        description: '整合包信息（标题、版本、作者、简介）',
        attributes: {
            title: { type: 'string', default: '' },
            version: { type: 'string', default: '' },
            author: { type: 'string', default: '' },
            summary: { type: 'string', default: '' }
        },
        supports: {
            html: false
        },
        edit: function(props) {
            return el('div', {
                    className: 'elegant-game-meta-editor',
                    style: {
                        border: '1px solid #e8eaed',
                        borderRadius: '12px',
                        padding: '16px',
                        background: '#fff'
                    }
                },
                el('p', {
                    style: {
                        marginTop: 0,
                        color: '#666',
                        fontSize: '12px'
                    }
                }, '填写整合包信息，可通过 [game_meta] 或 [pack_info] 在外部调用。'),
                el(TextControl, {
                    label: '标题',
                    value: props.attributes.title,
                    onChange: function(value) {
                        props.setAttributes({ title: value });
                    }
                }),
                el(TextControl, {
                    label: '版本',
                    value: props.attributes.version,
                    onChange: function(value) {
                        props.setAttributes({ version: value });
                    }
                }),
                el(TextControl, {
                    label: '作者',
                    value: props.attributes.author,
                    onChange: function(value) {
                        props.setAttributes({ author: value });
                    }
                }),
                el(TextareaControl, {
                    label: '简介',
                    value: props.attributes.summary,
                    rows: 4,
                    onChange: function(value) {
                        props.setAttributes({ summary: value });
                    }
                })
            );
        },
        save: function() {
            return null;
        }
    });

    wp.blocks.registerBlockType('elegant/post-game-meta', {
        title: '文章整合包信息',
        icon: 'media-document',
        category: 'theme',
        description: '自动读取当前文章的首个整合包信息区块并显示。',
        usesContext: ['postId', 'postType'],
        keywords: ['query', 'post', 'gamemeta', '整合包信息'],
        attributes: {
            field: { type: 'string', default: 'all' },
            fields: { type: 'array', default: ['all'] }
        },
        supports: {
            html: false
        },
        edit: function(props) {
            var contextPostId = props.context && props.context.postId ? parseInt(props.context.postId, 10) : 0;
            var contextPostType = props.context && props.context.postType ? props.context.postType : '';
            var selectedFields = normalizeSelectedFields(props.attributes);
            var hasAllSelected = selectedFields.indexOf('all') >= 0;

            var syncFieldAttributes = function(nextFields) {
                var safeFields = normalizeSelectedFields({ fields: nextFields });
                props.setAttributes({
                    fields: safeFields,
                    field: safeFields.indexOf('all') >= 0 ? 'all' : (safeFields[0] || 'all')
                });
            };

            var previewMeta = useSelect(function(select) {
                var coreEditor = select('core/editor');
                var editorPostId = coreEditor && coreEditor.getCurrentPostId ? coreEditor.getCurrentPostId() : 0;
                var editorPostType = coreEditor && coreEditor.getCurrentPostType ? coreEditor.getCurrentPostType() : '';
                var editedContent = coreEditor && coreEditor.getEditedPostContent ? coreEditor.getEditedPostContent() : '';
                var sourcePostId = contextPostId || editorPostId;
                var sourcePostType = contextPostType || editorPostType;
                var rawContent = '';

                if (!sourcePostId || !sourcePostType) {
                    return normalizeMeta({});
                }

                if (sourcePostId === editorPostId && sourcePostType === editorPostType && editedContent) {
                    rawContent = editedContent;
                } else {
                    var coreStore = select('core');
                    var record = coreStore && coreStore.getEntityRecord
                        ? coreStore.getEntityRecord('postType', sourcePostType, sourcePostId)
                        : null;

                    if (record && record.content) {
                        rawContent = record.content.raw || record.content.rendered || '';
                    }
                }

                if (!rawContent || typeof rawContent !== 'string') {
                    return normalizeMeta({});
                }

                var parsedBlocks = wp.blocks.parse(rawContent);
                var found = findGameMetaAttrs(parsedBlocks);

                return found || normalizeMeta({});
            }, [contextPostId, contextPostType]);

            var hasMeta = !isMetaEmpty(previewMeta);

            var previewNode = null;
            if (!hasMeta) {
                previewNode = el('p', {
                    style: {
                        margin: 0,
                        color: '#8a94a2',
                        fontSize: '13px',
                        lineHeight: 1.6
                    }
                }, '当前文章未找到整合包信息，请先在对应文章内容中添加并填写“整合包信息”区块。');
            } else {
                var previewCardMeta = filterMetaBySelectedFields(previewMeta, selectedFields);
                if (isMetaEmpty(previewCardMeta)) {
                    previewNode = el('p', {
                        style: {
                            margin: 0,
                            color: '#8a94a2',
                            fontSize: '13px',
                            lineHeight: 1.6
                        }
                    }, '当前勾选字段暂无可显示内容。');
                } else {
                previewNode = el('section', {
                        style: {
                            border: '1px solid #e3e8ee',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            background: '#fff'
                        }
                    },
                    previewCardMeta.title ? el('h4', {
                        style: {
                            margin: '0 0 10px',
                            fontSize: '18px'
                        }
                    }, previewCardMeta.title) : null,
                    (previewCardMeta.version || previewCardMeta.author) ? el('p', {
                            style: {
                                margin: '0 0 8px',
                                color: '#5a6470'
                            }
                        },
                        previewCardMeta.version ? '版本：' + previewCardMeta.version : '',
                        previewCardMeta.version && previewCardMeta.author ? '  |  ' : '',
                        previewCardMeta.author ? '作者：' + previewCardMeta.author : ''
                    ) : null,
                    previewCardMeta.summary ? el('p', {
                        style: {
                            margin: 0,
                            lineHeight: 1.7,
                            color: '#2f3640',
                            display: 'flex',
                            alignItems: 'flex-start'
                        }
                    },
                    el('strong', {
                        style: {
                            flex: '0 0 auto',
                            marginRight: '4px'
                        }
                    }, '简介：'),
                    el('span', {
                        style: {
                            flex: 1,
                            minWidth: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            whiteSpace: 'normal',
                            verticalAlign: 'top'
                        }
                    }, normalizeSummaryForClamp(previewCardMeta.summary))) : null
                );
                }
            }

            return el('div', null,
                el(InspectorControls, null,
                    el(PanelBody, {
                            title: '显示设置',
                            initialOpen: true
                        },
                        el('p', {
                            style: {
                                marginTop: 0,
                                marginBottom: '10px',
                                color: '#5a6470',
                                fontSize: '12px',
                                lineHeight: 1.6
                            }
                        }, '支持多选。无论勾选哪些字段，预览与前端都会按卡片样式展示。'),
                        el(CheckboxControl, {
                            label: FIELD_LABELS.all,
                            checked: hasAllSelected,
                            onChange: function(checked) {
                                syncFieldAttributes(toggleSelectedField(selectedFields, 'all', checked));
                            }
                        }),
                        el(CheckboxControl, {
                            label: FIELD_LABELS.title,
                            checked: selectedFields.indexOf('title') >= 0,
                            onChange: function(checked) {
                                syncFieldAttributes(toggleSelectedField(selectedFields, 'title', checked));
                            }
                        }),
                        el(CheckboxControl, {
                            label: FIELD_LABELS.version,
                            checked: selectedFields.indexOf('version') >= 0,
                            onChange: function(checked) {
                                syncFieldAttributes(toggleSelectedField(selectedFields, 'version', checked));
                            }
                        }),
                        el(CheckboxControl, {
                            label: FIELD_LABELS.author,
                            checked: selectedFields.indexOf('author') >= 0,
                            onChange: function(checked) {
                                syncFieldAttributes(toggleSelectedField(selectedFields, 'author', checked));
                            }
                        }),
                        el(CheckboxControl, {
                            label: FIELD_LABELS.summary,
                            checked: selectedFields.indexOf('summary') >= 0,
                            onChange: function(checked) {
                                syncFieldAttributes(toggleSelectedField(selectedFields, 'summary', checked));
                            }
                        })
                    )
                ),
                el('div', {
                        className: 'elegant-post-game-meta-editor',
                        style: {
                            border: '1px dashed #cdd4dc',
                            borderRadius: '10px',
                            padding: '14px',
                            background: '#f9fbff'
                        }
                    },
                    el('p', {
                        style: {
                            margin: '0 0 10px',
                            fontWeight: 600
                        }
                    }, '文章整合包信息预览'),
                    previewNode
                )
            );
        },
        save: function() {
            return null;
        }
    });
});
