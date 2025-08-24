const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy requests to Hugging Face CDN to avoid CORS issues
  app.use(
    '/api/hf',
    createProxyMiddleware({
      target: 'https://huggingface.co',
      changeOrigin: true,
      pathRewrite: {
        '^/api/hf': '',
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  );
  
  // Proxy for CDN LFS
  app.use(
    '/api/cdn-lfs',
    createProxyMiddleware({
      target: 'https://cdn-lfs-us-1.hf.co',
      changeOrigin: true,
      pathRewrite: {
        '^/api/cdn-lfs': '',
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  );
};