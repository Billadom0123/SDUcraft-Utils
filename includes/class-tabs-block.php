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
            'parent'     => array('elegant/tabs'),
            'attributes' => array(
                'title' => array('type' => 'string', 'default' => '新标签页')
            ),
        ));

        register_block_type('elegant/tabs', array(
            'title'           => '标签页组',
            'render_callback' => array($this, 'render_callback'),
        ));
    }

    public function enqueue_editor_assets() {
        wp_enqueue_script(
            'elegant-tabs-editor',
            ELEGANT_TOOLKIT_URL . 'assets/tabs-editor.js',
            array('wp-blocks', 'wp-element', 'wp-data', 'wp-editor', 'wp-components', 'wp-dom-ready', 'wp-block-editor'),
            '1.0.1',
            true
        );
    }

    public function render_callback($attributes, $content) {
        $blocks = parse_blocks($content);
        $tabs = [];
        foreach ($blocks as $block) {
            if ($block['blockName'] === 'elegant/tab') {
                $tabs[] = [
                    'title'   => isset($block['attrs']['title']) ? $block['attrs']['title'] : '新标签页',
                    'content' => render_block($block)
                ];
            }
        }
        if (empty($tabs)) return '';

        $tabs_id = 'tabs-' . uniqid();
        ob_start();
        ?>
        <style>
            .elegant-tabs { margin: 30px 0; border-radius: 12px; overflow: hidden; background: #fff !important; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #eee !important; font-family: sans-serif; }
            .elegant-tabs-header { display: flex; background: #f8f9fb !important; border-bottom: 1px solid #eee !important; padding: 0 10px; overflow-x: auto; scrollbar-width: none; }
            .elegant-tab-trigger { padding: 16px 24px; cursor: pointer; font-size: 14px; font-weight: 600; color: #666 !important; white-space: nowrap; position: relative; transition: 0.3s; }
            .elegant-tab-trigger.active { color: #2196f3 !important; }
            .elegant-tab-trigger.active::after { content: ""; position: absolute; bottom: 0; left: 20%; width: 60%; height: 3px; background: #2196f3 !important; }
            .elegant-tabs-content { padding: 24px; background: #fff !important; min-height: 100px; }
            .elegant-tab-pane { display: none; }
            .elegant-tab-pane.active { display: block; animation: tabFadeIn 0.3s ease; }
            @keyframes tabFadeIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
            body.wp-dark-mode-active .elegant-tabs, body.dark .elegant-tabs { background: #1e1e1e !important; border-color: #333 !important; color: #eee !important; }
            body.wp-dark-mode-active .elegant-tabs-header, body.dark .elegant-tabs-header { background: #252525 !important; border-color: #333 !important; }
            body.wp-dark-mode-active .elegant-tabs-content, body.dark .elegant-tabs-content { background: #1e1e1e !important; }
        </style>
        <div class="elegant-tabs" id="<?php echo $tabs_id; ?>">
            <div class="elegant-tabs-header">
                <?php foreach ($tabs as $i => $t): ?>
                    <div class="elegant-tab-trigger <?php echo $i===0?'active':''; ?>" role="button" onclick="elegantSwitchTab(this, '<?php echo $tabs_id; ?>-p-<?php echo $i; ?>')"><?php echo esc_html($t['title']); ?></div>
                <?php endforeach; ?>
            </div>
            <div class="elegant-tabs-content">
                <?php foreach ($tabs as $i => $t): ?>
                    <div class="elegant-tab-pane <?php echo $i===0?'active':''; ?>" id="<?php echo $tabs_id; ?>-p-<?php echo $i; ?>"><?php echo $t['content']; ?></div>
                <?php endforeach; ?>
            </div>
        </div>
        <script>
            window.elegantSwitchTab = window.elegantSwitchTab || function(el, id) {
                const c = el.closest('.elegant-tabs');
                c.querySelectorAll('.elegant-tab-trigger').forEach(b => b.classList.remove('active'));
                el.classList.add('active');
                c.querySelectorAll('.elegant-tab-pane').forEach(p => p.classList.remove('active'));
                c.querySelector('#' + id).classList.add('active');
            }
        </script>
        <?php
        return ob_get_clean();
    }
}
new Elegant_Tabs_Block();
