#!/bin/sh
cat <<EOF > /usr/share/nginx/html/config.js
window.APP_CONFIG = {
  API_URL: "${API_URL}"
};
EOF

exec nginx -g 'daemon off;'
