#!/bin/bash
set -e

# --- Configuration ---
SSH_USER="ubuntu"
SSH_HOST="207.127.92.182"
SSH_KEY="$HOME/oci-vms/ssh-priv.key"
REMOTE_DIR="/opt/budgeteer"
LOCAL_FRONTEND_PATH="./frontend/web"
LOCAL_BACKEND_PATH="./backend"

# SSH options for passwordless login
SSH_OPTS="-i $SSH_KEY"

# --- Deployment Steps ---

echo "Connecting to $SSH_HOST and setting up directories..."
ssh $SSH_OPTS $SSH_USER@$SSH_HOST << EOF
    sudo mkdir -p $REMOTE_DIR/frontend
    sudo mkdir -p $REMOTE_DIR/backend
    sudo chown -R $SSH_USER:$SSH_USER $REMOTE_DIR
EOF

echo "Uploading frontend files..."
scp $SSH_OPTS -r $LOCAL_FRONTEND_PATH/* $SSH_USER@$SSH_HOST:$REMOTE_DIR/frontend/

echo "Uploading backend files..."
scp $SSH_OPTS -r $LOCAL_BACKEND_PATH/* $SSH_USER@$SSH_HOST:$REMOTE_DIR/backend/

echo "Setting final file permissions on the remote server..."
ssh $SSH_OPTS $SSH_USER@$SSH_HOST << EOF
    sudo chown -R www-data:www-data $REMOTE_DIR
    sudo chmod -R 755 $REMOTE_DIR
EOF

echo "Installing packages on the remote server..."
ssh $SSH_OPTS $SSH_USER@$SSH_HOST << 'EOF'
    sudo apt-get update
    sudo apt-get install -y nodejs npm sqlite3 curl apt-transport-https gnupg2 ca-certificates

    # Install Caddy
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/deb.debian.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt-get update
    sudo apt-get install -y caddy
EOF

echo "Installing backend dependencies..."
ssh $SSH_OPTS $SSH_USER@$SSH_HOST << EOF
    cd $REMOTE_DIR/backend
    sudo npm ci --omit=dev
EOF

echo "Creating systemd service for the backend..."
ssh $SSH_OPTS $SSH_USER@$SSH_HOST << 'EOF'
    sudo bash -c 'cat > /etc/systemd/system/budgeteer-backend.service' <<'EOT'
[Unit]
Description=Budgeteer Backend
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/budgeteer/backend/index.js
WorkingDirectory=/opt/budgeteer/backend
Restart=always
User=www-data
Group=www-data
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOT
EOF

echo "Starting the backend service..."
ssh $SSH_OPTS $SSH_USER@$SSH_HOST << 'EOF'
    sudo systemctl daemon-reload
    sudo systemctl enable --now budgeteer-backend
EOF

echo "Creating Caddyfile..."
ssh $SSH_OPTS $SSH_USER@$SSH_HOST << 'EOF'
    sudo bash -c 'cat > /etc/caddy/Caddyfile' <<'EOT'
budgeteer.sammosios.com {
    root * /opt/budgeteer/frontend
    file_server
}

api.budgeteer.sammosios.com {
    reverse_proxy localhost:3000
}
EOT
EOF

echo "Reloading Caddy..."
ssh $SSH_OPTS $SSH_USER@$SSH_HOST << 'EOF'
    sudo systemctl reload caddy
EOF

echo "--- Deployment Complete ---"
echo ""
echo "--- Final Validation ---"
ssh $SSH_OPTS $SSH_USER@$SSH_HOST << 'EOF'
    echo "Backend Status:"
    systemctl is-active budgeteer-backend
    echo ""
    echo "Caddy Status:"
    systemctl is-active caddy
    echo ""
    echo "Testing backend locally on server:"
    curl -s http://localhost:3000/
    echo ""
EOF

echo "✅ Deployment script finished."
echo "NOTE: Caddy's HTTPS will not be active until you point your DNS A records to $SSH_HOST."
