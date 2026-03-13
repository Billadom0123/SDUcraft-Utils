<?php
/**
 * Elegant Tabs Block
 */
class Elegant_Tabs_Block {

    public function __construct() {
        add_action('init', array($this, 'register_blocks'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_editor_assets'));
    }

    public function register_blocks() {
        register_block_type('elegant/tab', array(
            'title'      => '标签页项目',
            'description'=> '标签页组中的单个内容面板。',
            'parent'     => array('elegant/tabs'),
            'attributes' => array(
                'title' => array('type' => 'string', 'default' => '新标签页')
            ),
        ));

        register_block_type('elegant/tabs', array(
            'title'           => '标签页组',
            'description'     => '拥有可切换的多个标签页',
            'render_callback' => array($this, 'render_callback'),
        ));
    }

    public function enqueue_editor_assets() {
        wp_enqueue_script(
            'elegant-tabs-editor',
            ELEGANT_TOOLKIT_URL . 'assets/tabs-editor.js',
            array('wp-blocks', 'wp-element', 'wp-data', 'wp-editor', 'wp-components', 'wp-dom-ready', 'wp-block-editor'),
            '1.0.14',
            true
        );
    }

    public function enqueue_frontend_assets() {
        wp_enqueue_style(
            'elegant-tabs-frontend-style',
            ELEGANT_TOOLKIT_URL . 'assets/tabs-frontend.css',
            array(),
            '1.0.0'
        );

        wp_enqueue_script(
            'elegant-tabs-frontend',
            ELEGANT_TOOLKIT_URL . 'assets/tabs-frontend.js',
            array(),
            '1.0.2',
            true
        );
    }

    public function render_callback($attributes, $content, $block = null) {
        $blocks = array();

        // Prefer parsed innerBlocks from the current dynamic block instance.
        if ($block instanceof WP_Block && !empty($block->parsed_block['innerBlocks']) && is_array($block->parsed_block['innerBlocks'])) {
            $blocks = $block->parsed_block['innerBlocks'];
        } elseif (!empty($content)) {
            $blocks = parse_blocks($content);
        }

        $tabs = [];
        foreach ($blocks as $inner_block) {
            if (!empty($inner_block['blockName']) && $inner_block['blockName'] === 'elegant/tab') {
                $tabs[] = [
                    'title'   => isset($inner_block['attrs']['title']) ? $inner_block['attrs']['title'] : '新标签页',
                    'content' => render_block($inner_block)
                ];
            }
        }

        // Fallback: if parsing fails, still render content as a single pane.
        if (empty($tabs) && !empty(trim($content))) {
            $tabs[] = [
                'title'   => '内容',
                'content' => $content,
            ];
        }

        if (empty($tabs)) return '';

        $this->enqueue_frontend_assets();

        $tabs_id = 'tabs-' . uniqid();
        ob_start();
        ?>
        <div class="elegant-tabs" id="<?php echo esc_attr($tabs_id); ?>">
            <div class="elegant-tabs-header" role="tablist" aria-label="Elegant Tabs">
                <?php foreach ($tabs as $i => $t):
                    $trigger_id = $tabs_id . '-t-' . $i;
                    $panel_id = $tabs_id . '-p-' . $i;
                ?>
                    <div
                        class="elegant-tab-trigger <?php echo $i===0?'active':''; ?>"
                        id="<?php echo esc_attr($trigger_id); ?>"
                        role="tab"
                        tabindex="<?php echo $i===0?'0':'-1'; ?>"
                        aria-selected="<?php echo $i===0?'true':'false'; ?>"
                        aria-controls="<?php echo esc_attr($panel_id); ?>"
                        data-tab-target="<?php echo esc_attr($panel_id); ?>"
                    ><?php echo esc_html($t['title']); ?></div>
                <?php endforeach; ?>
            </div>
            <div class="elegant-tabs-content">
                <?php foreach ($tabs as $i => $t):
                    $trigger_id = $tabs_id . '-t-' . $i;
                    $panel_id = $tabs_id . '-p-' . $i;
                ?>
                    <div
                        class="elegant-tab-pane <?php echo $i===0?'active':''; ?>"
                        id="<?php echo esc_attr($panel_id); ?>"
                        role="tabpanel"
                        aria-labelledby="<?php echo esc_attr($trigger_id); ?>"
                        <?php echo $i===0?'':'hidden'; ?>
                    ><?php echo $t['content']; ?></div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
new Elegant_Tabs_Block();
