// 定义缓存名称，使用版本号便于后续更新
const CACHE_NAME = 'artcanvas-v1';

// 定义需要缓存的资源列表
const urlsToCache = [
    '/', // 根路径
    '/index.html', // 主页面
    '/css/style.css', // 样式文件
    '/js/app.js', // 主应用脚本
    '/images/icons/icon-192x192.png', // PWA图标（中）
    '/images/icons/icon-512x512.png'  // PWA图标（大）
];

// 监听Service Worker的install事件（在Service Worker首次安装时触发）
self.addEventListener('install', event => {
    // waitUntil() 确保Service Worker不会在缓存操作完成前安装完成
    event.waitUntil(
        // 打开指定名称的缓存
        caches.open(CACHE_NAME)
            // 将资源列表中的所有文件添加到缓存中
            .then(cache => cache.addAll(urlsToCache))
    );
});

// 监听fetch事件，拦截所有网络请求（在页面发起任何请求时触发）
self.addEventListener('fetch', event => {
    // respondWith() 允许我们拦截并自定义响应
    event.respondWith(
        // 在缓存中查找匹配的请求
        caches.match(event.request)
            // 如果没有找到，则通过网络获取资源
            .then(response => response || fetch(event.request))
    );
});