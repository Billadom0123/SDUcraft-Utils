<?php
/**
 * Mindmap SVG Renderer
 */
class Elegant_Mindmap_Renderer {
    
    public function __construct() {
        add_shortcode('svg_mindmap', array($this, 'render_shortcode'));
        add_action('init', array($this, 'register_block'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_editor_assets'));
    }

    public function register_block() {
        register_block_type('elegant/mindmap', array(
            'title'           => '思维导图区块',
            'description'     => '通过内置列表编辑内容并自动渲染为 SVG 思维导图。',
            'render_callback' => array($this, 'render_block'),
        ));
    }

    public function enqueue_editor_assets() {
        wp_enqueue_script(
            'elegant-mindmap-editor',
            ELEGANT_TOOLKIT_URL . 'assets/mindmap-editor.js',
            array('wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-data', 'wp-dom-ready'),
            '1.0.0',
            true
        );
    }

    public function render_shortcode($atts, $content = null) {
        return $this->render_mindmap($content);
    }

    public function render_block($attributes, $content, $block = null) {
        if ($block instanceof WP_Block && !empty($block->parsed_block['innerBlocks'])) {
            $content = '';
            foreach ($block->parsed_block['innerBlocks'] as $inner_block) {
                $content .= render_block($inner_block);
            }
        }

        return $this->render_mindmap($content);
    }

    private function render_mindmap($content) {
        $content = preg_replace('/<!--(.|\s)*?-->/', '', $content);
        $data = $this->parse_wp_list_to_array($content);
        
        if (empty($data)) return '';

        $config = ['node_height' => 42, 'v_gap' => 24, 'h_gap' => 60, 'char_width' => 10, 'padding_h' => 20];
        $current_leaf_y = 20; 
        $tree = $this->calculate_layout($data, $config, 10, 0, $current_leaf_y);
        $bounds = $this->get_bounds($tree);

        ob_start();
        ?>
        <div class="elegant-mindmap-wrapper" style="margin: 30px 0; width: 100%;">
            <svg xmlns="http://www.w3.org/2000/svg" width="<?php echo $bounds['x']; ?>" height="<?php echo $bounds['y']; ?>" viewBox="0 0 <?php echo $bounds['x']; ?> <?php echo $bounds['y']; ?>" style="max-width: 100%; height: auto; display: block;" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <style>
                        .link-line { fill: none; stroke: #c6cbd3; stroke-width: 2; stroke-linecap: round; }
                        .node-box { fill: #ffffff; stroke: #4b4f59; stroke-width: 1.2; transition: all 0.2s; }
                        .node-text { font-size: 14px; font-family: -apple-system, sans-serif; dominant-baseline: middle; text-anchor: middle; pointer-events: none; }
                        .conn-point { fill: #4b4f59; }
                        .mindmap-link:hover .node-box { fill: #f0f4ff; stroke: #2196f3; }
                        .mindmap-link { cursor: pointer; text-decoration: none; }
                    </style>
                </defs>
                <?php $this->render_svg_tree($tree); ?>
            </svg>
        </div>
        <?php
        return ob_get_clean();
    }

    private function parse_wp_list_to_array($html) {
        if (empty(trim($html))) return [];
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8"><div>' . $html . '</div>');
        libxml_clear_errors();
        $xpath = new DOMXPath($dom);
        $root_li = $xpath->query('//div/ul/li');
        return $this->parse_nodes($root_li, $xpath);
    }

    private function parse_nodes($nodes, $xpath) {
        $result = [];
        foreach ($nodes as $node) {
            $text = ""; $href = "";
            foreach ($node->childNodes as $child) {
                if ($child->nodeName === 'a') { $href = $child->getAttribute('href'); break; }
            }
            foreach ($node->childNodes as $child) {
                if ($child->nodeName === 'ul') continue;
                $text .= $child->textContent;
            }
            $item = ['text' => trim($text), 'href' => $href, 'children' => []];
            $sub_lists = $xpath->query('./ul/li', $node);
            if ($sub_lists->length > 0) $item['children'] = $this->parse_nodes($sub_lists, $xpath);
            $result[] = $item;
        }
        return $result;
    }

    private function calculate_layout($nodes, $config, $x, $level, &$current_leaf_y) {
        foreach ($nodes as &$node) {
            $node['width'] = mb_strlen($node['text']) * $config['char_width'] + $config['padding_h'] * 2;
            $node['height'] = $config['node_height'];
            $node['x'] = $x;
            if (!empty($node['children'])) {
                $next_x = $x + $node['width'] + $config['h_gap'];
                $node['children'] = $this->calculate_layout($node['children'], $config, $next_x, $level + 1, $current_leaf_y);
                $first_child = $node['children'][0];
                $last_child = $node['children'][count($node['children']) - 1];
                $node['y'] = $first_child['y'] + ($last_child['y'] - $first_child['y']) / 2;
            } else {
                $node['y'] = $current_leaf_y;
                $current_leaf_y += $node['height'] + $config['v_gap'];
            }
        }
        return $nodes;
    }

    private function get_bounds($nodes) {
        $max_x = 0; $max_y = 0;
        $scan = function($items) use (&$scan, &$max_x, &$max_y) {
            foreach ($items as $item) {
                $max_x = max($max_x, $item['x'] + $item['width'] + 20);
                $max_y = max($max_y, $item['y'] + $item['height'] + 20);
                if (!empty($item['children'])) $scan($item['children']);
            }
        };
        $scan($nodes);
        return ['x' => $max_x, 'y' => $max_y];
    }

    private function render_svg_tree($nodes) {
        foreach ($nodes as $node) {
            if (!empty($node['children'])) {
                $px = $node['x'] + $node['width']; $py = $node['y'] + $node['height'] / 2;
                foreach ($node['children'] as $child) {
                    $cx = $child['x']; $cy = $child['y'] + $child['height'] / 2;
                    $cp_x = $px + ($cx - $px) / 2;
                    echo sprintf('<path class="link-line" d="M %f %f C %f %f, %f %f, %f %f" />', $px, $py, $cp_x, $py, $cp_x, $cy, $cx, $cy);
                }
            }
            if (!empty($node['href'])) echo sprintf('<a href="%s" class="mindmap-link" target="_blank">', esc_url($node['href']));
            echo sprintf('<g transform="translate(%f, %f)"><rect class="node-box" x="0" y="0" rx="4" ry="4" width="%f" height="%f" />%s%s<text class="node-text" x="%f" y="%f">%s</text></g>',
                $node['x'], $node['y'], $node['width'], $node['height'],
                $node['x'] > 20 ? '<circle class="conn-point" cx="0" cy="'.($node['height']/2).'" r="3.2" />' : '',
                !empty($node['children']) ? '<circle class="conn-point" cx="'.$node['width'].'" cy="'.($node['height']/2).'" r="3.2" />' : '',
                $node['width'] / 2, $node['height'] / 2 + 1, esc_html($node['text'])
            );
            if (!empty($node['href'])) echo '</a>';
            if (!empty($node['children'])) $this->render_svg_tree($node['children']);
        }
    }
}
new Elegant_Mindmap_Renderer();
