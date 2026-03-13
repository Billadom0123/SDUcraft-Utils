<?php
/**
 * Plugin Name: Elegant Tabs Shortcode (Anti-Conflict Version)
 * Description: 一个美观、响应式的标签页组件，已针对 wp-dark-mode 进行抗干扰处理。
 */

add_action('init', function() {
    add_shortcode('tabs', 'elegant_tabs_wrapper_shortcode');
    add_shortcode('tab', 'elegant_tab_item_shortcode');
});

$elegant_tabs_collection = [];

function elegant_tabs_wrapper_shortcode($atts, $content = null) {
    global $elegant_tabs_collection;
    $elegant_tabs_collection = [];
    do_shortcode($content);

    if (empty($elegant_tabs_collection)) return '';

    $tabs_id = 'tabs-' . uniqid();
    
    ob_start();
    ?>
    <style>
        .elegant-tabs {
            margin: 30px 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            border-radius: 12px;
            overflow: hidden;
            background: #ffffff !important; /* 强制背景 */
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            border: 1px solid #eee !important;
            color: #444 !important;
        }

        /* 头部导航 */
        .tabs-header {
            display: flex;
            background: #f8f9fb !important;
            border-bottom: 1px solid #eee !important;
            padding: 0 10px;
            overflow-x: auto;
            scrollbar-width: none;
        }
        .tabs-header::-webkit-scrollbar { display: none; }

        /* 使用 div 代替 button，规避 wp-dark-mode 的全局样式 */
        .tab-trigger {
            padding: 16px 24px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 500;
            color: #666 !important;
            white-space: nowrap;
            transition: all 0.3s ease;
            position: relative;
            background: transparent !important; /* 彻底禁用背景色修改 */
            border: none !important;
            box-shadow: none !important;
            display: inline-block;
            user-select: none;
        }

        .tab-trigger:hover { color: #2196f3 !important; }

        .tab-trigger.active {
            color: #2196f3 !important;
            background: transparent !important;
        }

        .tab-trigger::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 20%;
            width: 60%;
            height: 3px;
            background: #2196f3 !important;
            border-top-left-radius: 3px;
            border-top-right-radius: 3px;
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }

        .tab-trigger.active::after {
            transform: scaleX(1);
        }

        .tabs-content-wrapper {
            padding: 24px;
            line-height: 1.6;
            background: #ffffff !important;
        }

        .tab-pane {
            display: none;
            animation: fadeInTab 0.4s ease;
        }

        .tab-pane.active {
            display: block;
        }

        /* =========================================
           暗色模式主动适配 (针对 wp-dark-mode)
           ========================================= */
        /* 1. 检测 body 上的暗色类名 (常见于插件) */
        body.wp-dark-mode-active .elegant-tabs,
        body.dark .elegant-tabs {
            background: #1e1e1e !important;
            border-color: #333 !important;
        }
        body.wp-dark-mode-active .tabs-header,
        body.dark .tabs-header {
            background: #252525 !important;
            border-color: #333 !important;
        }
        body.wp-dark-mode-active .tab-trigger,
        body.dark .tab-trigger {
            color: #aaa !important;
        }
        body.wp-dark-mode-active .tabs-content-wrapper,
        body.dark .tabs-content-wrapper {
            background: #1e1e1e !important;
            color: #ddd !important;
        }
        body.wp-dark-mode-active .tab-trigger.active,
        body.dark .tab-trigger.active {
            color: #4dabf7 !important;
        }

        @keyframes fadeInTab {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>

    <div class="elegant-tabs" id="<?php echo $tabs_id; ?>">
        <div class="tabs-header">
            <?php foreach ($elegant_tabs_collection as $index => $tab): ?>
                <div class="tab-trigger <?php echo $index === 0 ? 'active' : ''; ?>" 
                     role="button"
                     tabindex="0"
                     onclick="switchTab(this, '<?php echo $tabs_id; ?>-pane-<?php echo $index; ?>')">
                    <?php echo esc_html($tab['title']); ?>
                </div>
            <?php endforeach; ?>
        </div>
        <div class="tabs-content-wrapper">
            <?php foreach ($elegant_tabs_collection as $index => $tab): ?>
                <div class="tab-pane <?php echo $index === 0 ? 'active' : ''; ?>" 
                     id="<?php echo $tabs_id; ?>-pane-<?php echo $index; ?>">
                    <?php echo apply_filters('the_content', $tab['content']); ?>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <script>
        if (typeof switchTab !== 'function') {
            function switchTab(el, paneId) {
                const container = el.closest('.elegant-tabs');
                container.querySelectorAll('.tab-trigger').forEach(b => b.classList.remove('active'));
                el.classList.add('active');
                container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                container.querySelector('#' + paneId).classList.add('active');
            }
        }
    </script>
    <?php
    return ob_get_clean();
}

function elegant_tab_item_shortcode($atts, $content = null) {
    global $elegant_tabs_collection;
    $atts = shortcode_atts(['title' => 'Tab'], $atts);
    $elegant_tabs_collection[] = ['title' => $atts['title'], 'content' => $content];
    return '';
}
