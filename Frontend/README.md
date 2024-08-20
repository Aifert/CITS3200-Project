Current Dependancies / Technologies
- Ubuntu 22.04.3 LTS WSL 2
- NodeJS

# Installation of Node.js
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Verifectation of proper installation
node -v (Should return v20.16.0)
npm -v (Should return 10.8.1)