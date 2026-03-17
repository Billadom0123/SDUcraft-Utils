<?php
/**
 * Plugin Name: SDUcraft Utils
 * Description: 一些小组件的集合
 * Version: 1.1.5
 * Author: Billadom
 */

if (!defined('ABSPATH')) exit;

define('ELEGANT_TOOLKIT_PATH', plugin_dir_path(__FILE__));
define('ELEGANT_TOOLKIT_URL', plugin_dir_url(__FILE__));

function sducraft_utils_register_block_category($categories) {
	foreach ($categories as $category) {
		if (!empty($category['slug']) && $category['slug'] === 'sducraft-utils') {
			return $categories;
		}
	}

	array_unshift($categories, array(
		'slug'  => 'sducraft-utils',
		'title' => 'SDUcraft Utils',
		'icon'  => null,
	));

	return $categories;
}
add_filter('block_categories_all', 'sducraft_utils_register_block_category');

function sducraft_utils_enqueue_editor_collection_assets() {
	wp_enqueue_script(
		'sducraft-utils-block-collection',
		ELEGANT_TOOLKIT_URL . 'assets/block-collection.js',
		array('wp-blocks', 'wp-dom-ready'),
		'1.0.0',
		true
	);
}
add_action('enqueue_block_editor_assets', 'sducraft_utils_enqueue_editor_collection_assets');

// 加载模块
require_once ELEGANT_TOOLKIT_PATH . 'includes/class-mindmap-renderer.php';
require_once ELEGANT_TOOLKIT_PATH . 'includes/class-tabs-block.php';
require_once ELEGANT_TOOLKIT_PATH . 'includes/class-game-meta-block.php';
require_once ELEGANT_TOOLKIT_PATH . 'includes/class-query-marquee-block.php';
