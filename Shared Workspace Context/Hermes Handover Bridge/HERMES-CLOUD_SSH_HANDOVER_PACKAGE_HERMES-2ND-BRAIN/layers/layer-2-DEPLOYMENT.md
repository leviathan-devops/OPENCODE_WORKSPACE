# Layer 2: SSH-Based Cloud Hermes Deployment

## Step 1: Choose and Provision Cloud VM

### Option A: DigitalOcean (Recommended)
```bash
# Create droplet
doctl compute droplet create cloud-hermes \
  --image ubuntu-24-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc1 \
  --ssh-keys <YOUR_SSH_KEY_FINGERPRINT>

# Get IP
doctl compute droplet get cloud-hermes --format PublicIPv4
```

### Option B: Hetzner (Cheapest)
- Visit https://hetzner.cloud
- Create project, add server
- Ubuntu 22.04, 2 vCPU, 4GB RAM (~€4.50/month)

### Option C: Oracle Cloud Free Tier
- Free forever: Always Free resources
- 1GB RAM, 1/4 CPU, 50GB storage
- Visit https://cloud.oracle.com

## Step 2: Initial VM Setup

```bash
# SSH into VM
ssh root@<VM_IP>

# Update system
apt update && apt upgrade -y

# Create user
adduser leviathan
usermod -aG sudo -S -p '' leviathan

# Copy SSH key
mkdir -p /home/leviathan/.ssh
chmod 700 /home/leviathan/.ssh
cat >> /home/leviathan/.ssh/authorized_keys << 'KEYS'
ssh-rsa AAAAB3... your-public-key-here
KEYS
chmod 600 /home/leviathan/.ssh/authorized_keys
chown -R leviathan:leviathan /home/leviathan/.ssh

# Disable password auth (security)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

## Step 3: Install Hermes on VM

```bash
# SSH as leviathan
ssh leviathan@<VM_IP>

# Install prerequisites
sudo -S -p '' apt install -y python3 python3-pip git curl

# Clone Hermes (or use existing install method)
git clone https://github.com/leviathan-devops/hermes-agent.git ~/hermes-agent

# Or copy from local via scp
# From local: scp -r ~/.hermes leviathan@<VM_IP>:~/hermes-agent/

# Install Hermes
cd ~/hermes-agent
pip install -e .

# Verify
hermes --version
```

## Step 4: Configure Hermes Profile

```bash
# Copy 2nd-brain profile to VM
scp -r ~/.hermes/profiles/2nd-brain leviathan@<VM_IP>:~/.hermes/profiles/

# Or create minimal config on VM
mkdir -p ~/.hermes/profiles/2nd-brain
cat > ~/.hermes/profiles/2nd-brain/config.yaml << 'EOF'
model:
  default: minimax-m2.7
  provider: opencode-go
  base_url: https://opencode.ai/zen/go/v1
platforms:
  telegram:
    enabled: true
    token: "8668512792:AAF3jqr-SgrJep0HGyJX-m1q39LAt3Y4tLs"
