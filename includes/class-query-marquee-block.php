<?php
/**
 * Query Loop Marquee Block
 */
class Elegant_Query_Marquee_Block {

    public function __construct() {
        add_action('init', array($this, 'register_block'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_editor_assets'));
    }

    public function register_block() {
        register_block_type('elegant/query-marquee', array(
            'title'           => 'Query 跑马灯卡片',
            'description'     => '基于 Query Loop 的横向无限滚动卡片容器。',
            'attributes'      => array(
                'speed' => array(
                    'type'    => 'number',
                    'default' => 28,
                ),
                'categoryId' => array(
                    'type'    => 'number',
                    'default' => 0,
                ),
                'direction' => array(
                    'type'    => 'string',
                    'default' => 'left',
                ),
                'cardStyle' => array(
                    'type'    => 'string',
                    'default' => 'image-overlay',
                ),
                'layoutMode' => array(
                    'type'    => 'string',
                    'default' => 'single',
                ),
                'rowCount' => array(
                    'type'    => 'number',
                    'default' => 4,
                ),
                'rowGap' => array(
                    'type'    => 'number',
                    'default' => 12,
                ),
                'randomizeRows' => array(
                    'type'    => 'boolean',
                    'default' => true,
                ),
                'gap' => array(
                    'type'    => 'number',
                    'default' => 20,
                ),
                'cardMinWidth' => array(
                    'type'    => 'number',
                    'default' => 260,
                ),
                'pauseOnHover' => array(
                    'type'    => 'boolean',
                    'default' => true,
                ),
                'respectReducedMotion' => array(
                    'type'    => 'boolean',
                    'default' => true,
                ),
            ),
            'render_callback' => array($this, 'render_callback'),
        ));
    }

    public function enqueue_editor_assets() {
        wp_enqueue_script(
            'elegant-query-marquee-editor',
            ELEGANT_TOOLKIT_URL . 'assets/query-marquee-editor.js',
            array('wp-blocks', 'wp-element', 'wp-data', 'wp-block-editor', 'wp-components', 'wp-dom-ready'),
            '1.0.0',
            true
        );
    }

    public function enqueue_frontend_assets() {
        wp_enqueue_style(
            'elegant-query-marquee-frontend-style',
            ELEGANT_TOOLKIT_URL . 'assets/query-marquee-frontend.css',
            array(),
            '1.0.0'
        );

        wp_enqueue_script(
            'elegant-query-marquee-frontend',
            ELEGANT_TOOLKIT_URL . 'assets/query-marquee-frontend.js',
            array(),
            '1.0.0',
            true
        );
    }

    public function render_callback($attributes, $content, $block = null) {
        $speed = isset($attributes['speed']) ? (int) $attributes['speed'] : 28;
        $speed = max(8, min(120, $speed));

        $category_id = isset($attributes['categoryId']) ? absint($attributes['categoryId']) : 0;

        $direction = isset($attributes['direction']) ? sanitize_key((string) $attributes['direction']) : 'left';
        if (!in_array($direction, array('left', 'right'), true)) {
            $direction = 'left';
        }

        $card_style = isset($attributes['cardStyle']) ? sanitize_key((string) $attributes['cardStyle']) : 'image-overlay';
        if (!in_array($card_style, array('image-overlay', 'plain'), true)) {
            $card_style = 'image-overlay';
        }

        $layout_mode = isset($attributes['layoutMode']) ? sanitize_key((string) $attributes['layoutMode']) : 'single';
        if (!in_array($layout_mode, array('single', 'fullscreen'), true)) {
            $layout_mode = 'single';
        }

        $row_count = isset($attributes['rowCount']) ? (int) $attributes['rowCount'] : 4;
        $row_count = max(2, min(10, $row_count));

        $row_gap = isset($attributes['rowGap']) ? (int) $attributes['rowGap'] : 12;
        $row_gap = max(0, min(40, $row_gap));

        $randomize_rows = !isset($attributes['randomizeRows']) || (bool) $attributes['randomizeRows'];

        $gap = isset($attributes['gap']) ? (int) $attributes['gap'] : 20;
        $gap = max(0, min(80, $gap));

        $card_min_width = isset($attributes['cardMinWidth']) ? (int) $attributes['cardMinWidth'] : 260;
        $card_min_width = max(120, min(560, $card_min_width));

        $pause_on_hover = !isset($attributes['pauseOnHover']) || (bool) $attributes['pauseOnHover'];
        $respect_reduced_motion = !isset($attributes['respectReducedMotion']) || (bool) $attributes['respectReducedMotion'];

        $inner_html = '';
        if ($block instanceof WP_Block && !empty($block->parsed_block['innerBlocks']) && is_array($block->parsed_block['innerBlocks'])) {
            foreach ($block->parsed_block['innerBlocks'] as $inner_block) {
                if ($category_id > 0 && !empty($inner_block['blockName']) && $inner_block['blockName'] === 'core/query') {
                    if (empty($inner_block['attrs']) || !is_array($inner_block['attrs'])) {
                        $inner_block['attrs'] = array();
                    }

                    $query_args = !empty($inner_block['attrs']['query']) && is_array($inner_block['attrs']['query'])
                        ? $inner_block['attrs']['query']
                        : array();

                    $query_args['inherit'] = false;
                    $query_args['categoryIds'] = array($category_id);
                    $query_args['taxQuery'] = array(
                        'category' => array($category_id),
                    );

                    $inner_block['attrs']['query'] = $query_args;
                }

                $inner_html .= render_block($inner_block);
            }
        } elseif (!empty($content)) {
            $inner_html = $content;
        }

        if (trim($inner_html) === '') {
            return '';
        }

        $this->enqueue_frontend_assets();

        $classes = array('elegant-query-marquee', 'is-direction-' . $direction, 'is-card-style-' . $card_style, 'is-layout-' . $layout_mode);
        if ($pause_on_hover) {
            $classes[] = 'is-pause-on-hover';
        }

        $display_rows = $layout_mode === 'fullscreen' ? $row_count : 1;

        $wrapper_style = sprintf(
            '--eqm-duration:%1$ss;--eqm-gap:%2$spx;--eqm-card-min-width:%3$spx;--eqm-row-count:%4$s;--eqm-row-gap:%5$spx;',
            (string) $speed,
            (string) $gap,
            (string) $card_min_width,
            (string) $display_rows,
            (string) $row_gap
        );

        ob_start();
        ?>
        <div
            class="<?php echo esc_attr(implode(' ', $classes)); ?>"
            style="<?php echo esc_attr($wrapper_style); ?>"
            data-direction="<?php echo esc_attr($direction); ?>"
            data-respect-reduced-motion="<?php echo $respect_reduced_motion ? '1' : '0'; ?>"
            data-randomize-rows="<?php echo $randomize_rows ? '1' : '0'; ?>"
        >
            <div class="elegant-query-marquee__rows">
                <?php for ($row_index = 0; $row_index < $display_rows; $row_index++) :
                    $row_direction = $direction;
                    if ($layout_mode === 'fullscreen' && ($row_index % 2) === 1) {
                        $row_direction = $direction === 'left' ? 'right' : 'left';
                    }
                ?>
                    <div class="elegant-query-marquee__viewport is-row-direction-<?php echo esc_attr($row_direction); ?>">
                        <div class="elegant-query-marquee__track">
                            <div class="elegant-query-marquee__group">
                                <?php echo $inner_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                            </div>
                        </div>
                    </div>
                <?php endfor; ?>
            </div>
        </div>
        <?php

        return ob_get_clean();
    }
}

new Elegant_Query_Marquee_Block();
