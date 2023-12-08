# ERequisition Server API Phase 1 (Static Website Hosting)
## Using ExpressJS, Prisma, Docker, Dokku, MySQL, Hosted on AWS EC2
---
---
---

# Database changes
## Prerequisites
- A local copy of the code from the git repository
- The ability to run the code locally
  - You've gone through MDLabs' local app setup process
- The ability to deploy the code to the ereq-server
## Steps
- Make changes to the database schema in the prisma/schema.prisma file
- Start the local database if it isn't already running
  - `sudo /etc/init.d/mysql start`
- Run `docker-compose up` to start the application
- Run `docker exec -it ereq-server-api-1 npx prisma migrate dev --name <what_did_you_change>` to generate a migration file in the prisma/migrations folder
- Check the local database using MySQL Workbench to ensure that migrations applied and no key data was lost
- Commit and push the changes to the git repository
- Deploy the changes to the ereq-server
  - `git push dokku master`
  - This will run the postdeploy script in the app.json file which will run the `prisma migrate deploy` command on the remote database
- Check the remote database using MySQL Workbench to ensure that migrations applied and no key data was lost

# Deployment
## Prerequisites
- The setup process must be completed before deployment can occur.
- You must have been authorized to deploy applications to the ereq-server.
- You must have your SSH key for application deployment in your .ssh folder
## Steps


# Setup
Initialize an AWS EC2 instance with the following settings:
- Instance Name: ereq-server
- OS Image: Ubuntu 22.04
- Architecture: x86
- Instance Type: t2.medium
- Key Pair: aws-ereq-server
- Network Settings:
  - VPC: vpc-cbe83ab1 (vpc-ue1-analytics-portal) 10.68.0.0/16
  - Subnet: subnet-0b7549273cb3df59d   sbn-ue1d-staging-private-app01
  - Auto-assign Public IP: Enable (This will be overridden later)
  - Security Group: Create new security group
    - Security Group Name: ereq-server-ec2
    - Description: ereq-server-ec2 Firewall (Distinct from Load balancer firewall)
    - Inbound Rules:
      - SSH: TCP 22 from 10.63.6.0/24 (Allow ssh from HQ Servers)
      - MySQL/Aurora: TCP 3306 from 192.168.101.0/24 (Allow MySQL view from HQ Workstations)
      - MySQL/Aurora: TCP 3306 from 10.63.6.0/24 (Allow MySQL view from HQ Servers)
      - HTTP: TCP 80 from anywhere [phase 1 only] (Allow HTTP API requests from anywhere, specifically the LoadBalancer)
  - Advanced Network Configuration:
    - Network Interface 1:
      - Index: 0
      - Network interface: new interface
      - Description: static IP
      - Subnet: subnet-0b7549273cb3df59d   sbn-ue1d-staging-private-app01
      - Security Groups: New
      - Primary IP: 10.68.106.142 # 1 more than Analytics Portal
      - Delete on termination: yes
- EBS Volumes:
  - Volume 1:
    - Storage Type: EBS
    - Device name: /dev/sda1
    - Snapshot: snap-0fe62e94bc2ecc9d5
    - Size: 256 GiB
    - Volume Type: gp2
    - Delete on termination: no
    - Encrypted: encrypted
    - KMS Key: ereq-server-encryption # Administrators are users with role: ereq-lambda-role-prod and RepPortalDevAdmin. This is the same key used for the Analytics Portal and ereqLambda
    - File systems: efs
- Advanced Details
  - Hostname type: resource name
  - Termination protection: enable
  - Detailed CloudWatch monitoring: enable

If a DNS record doesn't exist in AWS Route53 for ereq-server.mdlabs.com, create one with the following settings:
- Name: ereq-server.mdlabs.com
- Type: CNAME - Canonical name
- Value: placeholder

If an SSL Certificate doesn't exist in AWS Certificate Manager for ereq-server.mdlabs.com, create one.
- Domain name: ereq-server.mdlabs.com
- Validation method: DNS validation
  - Create record in Route53 matching the name and value provided by AWS Certificate Manager
  - Wait for validation to complete

If a Load Balancer is not already created for the ereq-server, create one with the following settings:
- Type: Application Load Balancer
- Load Balancer Name: ereq-server
- Scheme: Internet-facing
- IP address type: ipv4
- VPC: vpc-cbe83ab1 (vpc-ue1-analytics-portal)
- Mappings:
  - subnet-0b2b16bf81a6c6399
  - subnet-0c58fcb23c099ca5e
  - subnet-0d475945984017952
  - subnet-040ae5fd4872aac38
- Security Group: Create new security group
  - Security Group Name: ereq-server-lb
  - Description: ereq-server-lb Firewall (Distinct from EC2 firewall)
  - Inbound Rules:
    - HTTP: TCP 80 from anywhere [phase 1 only] (Allow HTTP API requests from anywhere in order to see static failure message)
    - HTTPS: TCP 443 from anywhere [phase 1 only] (Allow HTTPS API requests from anywhere)

## Configure Load Balancer
- Add a listener for HTTP on port 80 to tell users to use HTTPS only
  - Return fixed response:
    - Code 418
    - Response body: <a href="https://ereq-server.mdlabs.com">Available on HTTPS only</a>
    - Content type: text/html
- Add a listener for HTTPS on port 443
  - Listener Protocol: HTTPS
  - Forward to target group: ereq-server
  - Security Policy: (Recommended)
  - Certificate: ereq-server.mdlabs.com

## Configure DNS
- Get the DNS name for the load balancer
- Change the DNS record for ereq-server.mdlabs.com to point to the load balancer DNS name
- Wait for DNS to propagate
- Ping ereq-server.mdlabs.com to verify that it is pointing to the load balancer. It should resolve a public IP address.


## Configure EC2 Instance
- SSH into the EC2 instance
  - Use the .pem file supplied in the Key Pair step of the EC2 instance setup
- Set up Dokku
  - Install Dokku
    - ` wget https://dokku.com/install/v0.32.3/bootstrap.sh`
    - `sudo DOKKU_TAG=v0.32.3 bash bootstrap.sh`
  - Add SSH Keys for people who can deploy to it
    - `cat ~/.ssh/authorized_keys | dokku ssh-keys:add admin`
    - If you have been authorized to deploy applications, add your SSH Key
      - `cat <your eds.pub contents> | dokku ssh-keys:add <your username>`
- Set up MySQL
  - Create the DB inside dokku
    - `dokku plugin:install https://github.com/dokku/dokku-mysql.get mysql`
    - `export MYSQL_IMAGE_VERSION="8.0"`
    - `export MYSQL_IMAGE="mysql"`
    - `dokku mysql:create ereq-server-db`
  - Allow external computers to connect to the MySQL DB
    - `dokku mysql:expose ereq-server-db 3306`
  - Obtain the root password for admin use, saved to the IT Password Manager
    - `sudo cat /var/lib/dokku/services/mysql/ereq-server-db/ROOTPASSWORD`
- Set up the app repository
  - Create the app inside dokku
    - `dokku apps:create ereq-server`
    - `dokku config:set ereq-server NODE_ENV=production`
  - Link the app to the DB
    - `dokku mysql:link ereq-server-db ereq-server`