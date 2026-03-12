<?php
/**
 * Plugin Name: SDUcraft Utils
 * Description: 一些小组件的集合
 * Version: 1.0.1
 * Author: Billadom
 */

if (!defined('ABSPATH')) exit;

define('ELEGANT_TOOLKIT_PATH', plugin_dir_path(__FILE__));
define('ELEGANT_TOOLKIT_URL', plugin_dir_url(__FILE__));

// 加载模块
require_once ELEGANT_TOOLKIT_PATH . 'includes/class-mindmap-renderer.php';
require_once ELEGANT_TOOLKIT_PATH . 'includes/class-tabs-block.php';
