<?php
/**
 * Plugin Name: WWC Core
 * Description: World Wide Connect Core Plugin
 * Version: 1.0.0
 * Author: Mostofa Kamal
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action('admin_menu', function () {
    add_menu_page(
        'WWC Core',
        'WWC Core',
        'manage_options',
        'wwc-core',
        function () {
            echo '<div class="wrap"><h1>Welcome to WWC Core</h1><p>Plugin installed successfully.</p></div>';
        },
        'dashicons-video-alt3'
    );
});
