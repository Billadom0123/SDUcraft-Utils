<?php
/**
 * 整合包信息区块
 */
class Elegant_Game_Meta_Block {

    public function __construct() {
        add_action('init', array($this, 'register_block'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_editor_assets'));
        add_shortcode('game_meta', array($this, 'render_shortcode'));
        add_shortcode('pack_info', array($this, 'render_shortcode'));
    }

    public function register_block() {
        register_block_type('elegant/game-meta', array(
            'title'           => '整合包信息',
            'description'     => '整合包信息：标题、版本、作者、简介。',
            'category'        => 'sducraft-utils',
            'attributes'      => array(
                'title'   => array('type' => 'string', 'default' => ''),
                'version' => array('type' => 'string', 'default' => ''),
                'author'  => array('type' => 'string', 'default' => ''),
                'summary' => array('type' => 'string', 'default' => ''),
            ),
            'render_callback' => array($this, 'render_block'),
        ));

        register_block_type('elegant/post-game-meta', array(
            'title'           => '文章整合包信息',
            'description'     => '自动读取当前文章中的整合包信息区块并显示。',
            'category'        => 'sducraft-utils',
            'attributes'      => array(
                'field' => array('type' => 'string', 'default' => 'all'),
                'fields' => array(
                    'type'    => 'array',
                    'default' => array('all'),
                    'items'   => array('type' => 'string'),
                ),
            ),
            'uses_context'    => array('postId', 'postType'),
            'render_callback' => array($this, 'render_post_game_meta_block'),
        ));
    }

    public function enqueue_editor_assets() {
        wp_enqueue_script(
            'elegant-game-meta-editor',
            ELEGANT_TOOLKIT_URL . 'assets/game-meta-editor.js',
            array('wp-blocks', 'wp-element', 'wp-data', 'wp-block-editor', 'wp-components', 'wp-dom-ready'),
            '1.4.7',
            true
        );
    }

    public function render_block($attributes) {
        $meta = $this->normalize_meta($attributes);
        if ($this->is_meta_empty($meta)) {
            return '';
        }

        return $this->render_meta_markup($meta);
    }

    public function render_post_game_meta_block($attributes, $content, $block = null) {
        $post_id = 0;

        if ($block instanceof WP_Block && !empty($block->context['postId'])) {
            $post_id = absint($block->context['postId']);
        }

        if (!$post_id) {
            $post_id = get_the_ID();
        }

        if (!$post_id) {
            return '';
        }

        $meta = $this->get_game_meta_from_post($post_id);
        if ($this->is_meta_empty($meta)) {
            return '';
        }

        $selected_fields = $this->normalize_selected_fields($attributes);
        if (in_array('all', $selected_fields, true)) {
            return $this->render_meta_markup($meta, 2);
        }

        $filtered_meta = $this->filter_meta_by_fields($meta, $selected_fields);
        if ($this->is_meta_empty($filtered_meta)) {
            return '';
        }

        return $this->render_meta_markup($filtered_meta, 2);
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'post_id' => 0,
            'field'   => '',
        ), $atts, 'game_meta');

        $post_id = absint($atts['post_id']);
        if (!$post_id) {
            $post_id = get_the_ID();
        }

        if (!$post_id) {
            return '';
        }

        $meta = $this->get_game_meta_from_post($post_id);
        if ($this->is_meta_empty($meta)) {
            return '';
        }

        $field = sanitize_key($atts['field']);
        if ($field) {
            if (!isset($meta[$field])) {
                return '';
            }
            return esc_html($meta[$field]);
        }

        return $this->render_meta_markup($meta);
    }

    public function get_game_meta_from_post($post_id) {
        $post = get_post($post_id);
        if (!$post instanceof WP_Post) {
            return array();
        }

        $blocks = parse_blocks((string) $post->post_content);
        if (empty($blocks)) {
            return array();
        }

        return $this->find_game_meta_block($blocks);
    }

    private function find_game_meta_block($blocks) {
        foreach ($blocks as $block) {
            if (!empty($block['blockName']) && $block['blockName'] === 'elegant/game-meta') {
                $attrs = isset($block['attrs']) && is_array($block['attrs']) ? $block['attrs'] : array();
                $meta = $this->normalize_meta($attrs);
                if (!$this->is_meta_empty($meta)) {
                    return $meta;
                }
            }

            if (!empty($block['innerBlocks']) && is_array($block['innerBlocks'])) {
                $meta = $this->find_game_meta_block($block['innerBlocks']);
                if (!$this->is_meta_empty($meta)) {
                    return $meta;
                }
            }
        }

        return array();
    }

    private function normalize_meta($attributes) {
        $title = isset($attributes['title']) ? sanitize_text_field((string) $attributes['title']) : '';
        $version = isset($attributes['version']) ? sanitize_text_field((string) $attributes['version']) : '';
        $author = isset($attributes['author']) ? sanitize_text_field((string) $attributes['author']) : '';
        $summary = isset($attributes['summary']) ? sanitize_textarea_field((string) $attributes['summary']) : '';

        return array(
            'title'   => trim($title),
            'version' => trim($version),
            'author'  => trim($author),
            'summary' => trim($summary),
        );
    }

    private function normalize_selected_fields($attributes) {
        $allowed_fields = array('all', 'title', 'version', 'author', 'summary');
        $fields = array();

        if (isset($attributes['fields']) && is_array($attributes['fields'])) {
            foreach ($attributes['fields'] as $field_item) {
                $field_key = sanitize_key((string) $field_item);
                if ($field_key !== '' && in_array($field_key, $allowed_fields, true)) {
                    $fields[] = $field_key;
                }
            }
        }

        // Backward compatibility for old block data that only stores a single field.
        if (empty($fields) && !empty($attributes['field'])) {
            $legacy_field = sanitize_key((string) $attributes['field']);
            if (in_array($legacy_field, $allowed_fields, true)) {
                $fields[] = $legacy_field;
            }
        }

        $fields = array_values(array_unique($fields));
        if (empty($fields)) {
            return array('all');
        }

        if (in_array('all', $fields, true)) {
            return array('all');
        }

        return $fields;
    }

    private function filter_meta_by_fields($meta, $fields) {
        $filtered_meta = array(
            'title'   => '',
            'version' => '',
            'author'  => '',
            'summary' => '',
        );

        foreach ($fields as $field_key) {
            if (isset($filtered_meta[$field_key]) && isset($meta[$field_key])) {
                $filtered_meta[$field_key] = $meta[$field_key];
            }
        }

        return $filtered_meta;
    }

    private function is_meta_empty($meta) {
        return empty($meta['title']) && empty($meta['version']) && empty($meta['author']) && empty($meta['summary']);
    }

    private function render_meta_markup($meta, $summary_line_clamp = 0) {
        ob_start();
        $summary_text = isset($meta['summary']) ? (string) $meta['summary'] : '';
        if ($summary_line_clamp > 0) {
            $summary_text = preg_replace('/\r\n|\r|\n/', ' ', $summary_text);
        }
        ?>
        <section class="elegant-game-meta" style="border:1px solid #e8eaed;border-radius:12px;padding:16px 18px;margin:18px 0;background:#fff;">
            <?php if (!empty($meta['title'])) : ?>
                <h3 style="margin:0 0 12px;font-size:22px;line-height:1.3;"><?php echo esc_html($meta['title']); ?></h3>
            <?php endif; ?>

            <?php if (!empty($meta['version']) || !empty($meta['author'])) : ?>
                <p style="margin:0 0 10px;color:#555;">
                    <?php if (!empty($meta['version'])) : ?>
                        <span><strong>版本：</strong><?php echo esc_html($meta['version']); ?></span>
                    <?php endif; ?>
                    <?php if (!empty($meta['author'])) : ?>
                        <span style="<?php echo !empty($meta['version']) ? 'margin-left:14px;' : ''; ?>"><strong>作者：</strong><?php echo esc_html($meta['author']); ?></span>
                    <?php endif; ?>
                </p>
            <?php endif; ?>

            <?php if (!empty($summary_text)) : ?>
                <p style="margin:0;color:#333;line-height:1.75;<?php echo $summary_line_clamp > 0 ? 'display:flex;align-items:flex-start;' : ''; ?>">
                    <strong style="<?php echo $summary_line_clamp > 0 ? 'flex:0 0 auto;margin-right:4px;' : ''; ?>">简介：</strong>
                    <?php if ($summary_line_clamp > 0) : ?>
                        <span style="flex:1;min-width:0;display:-webkit-box;-webkit-line-clamp:<?php echo (int) $summary_line_clamp; ?>;-webkit-box-orient:vertical;overflow:hidden;vertical-align:top;">
                            <?php echo esc_html($summary_text); ?>
                        </span>
                    <?php else : ?>
                        <span><?php echo nl2br(esc_html($summary_text)); ?></span>
                    <?php endif; ?>
                </p>
            <?php endif; ?>
        </section>
        <?php
        return ob_get_clean();
    }
}

$GLOBALS['elegant_game_meta_block'] = new Elegant_Game_Meta_Block();

if (!function_exists('elegant_get_game_meta_from_post')) {
    function elegant_get_game_meta_from_post($post_id) {
        if (isset($GLOBALS['elegant_game_meta_block']) && $GLOBALS['elegant_game_meta_block'] instanceof Elegant_Game_Meta_Block) {
            return $GLOBALS['elegant_game_meta_block']->get_game_meta_from_post($post_id);
        }

        return array();
    }
}
