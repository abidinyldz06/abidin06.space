# DNS Setup for abidin06.space

## GitHub Pages Custom Domain Configuration

### Required DNS Records

#### A Records (Root Domain)
```
Type: A
Name: @ (root)
Value: 185.199.108.153
TTL: 3600

Type: A
Name: @ (root)
Value: 185.199.109.153
TTL: 3600

Type: A
Name: @ (root)
Value: 185.199.110.153
TTL: 3600

Type: A
Name: @ (root)
Value: 185.199.111.153
TTL: 3600
```

#### CNAME Record (www subdomain)
```
Type: CNAME
Name: www
Value: abidinyldz06.github.io
TTL: 3600
```

### Hostinger DNS Configuration Steps

1. **Login to Hostinger Control Panel**
   - Go to https://hpanel.hostinger.com
   - Login with your credentials

2. **Navigate to Domain Management**
   - Click on "Domains" in the sidebar
   - Select "abidin06.space" domain

3. **Access DNS Zone Editor**
   - Click on "DNS/Nameservers"
   - Select "DNS Zone Editor"

4. **Update DNS Records**
   - Delete existing A records pointing to old hosting
   - Add the 4 GitHub Pages A records listed above
   - Add the CNAME record for www subdomain

5. **Save Changes**
   - Click "Save" or "Update" to apply changes
   - Wait for DNS propagation (1-48 hours)

### GitHub Pages Configuration

1. **Repository Settings**
   - Go to https://github.com/abidinyldz06/abidin06.space/settings
   - Navigate to "Pages" section

2. **Configure Source**
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)

3. **Custom Domain**
   - Custom domain: abidin06.space
   - Check "Enforce HTTPS" (after DNS propagation)

### Verification

#### DNS Propagation Check
- Use https://dnschecker.org
- Enter "abidin06.space" and check A records
- Enter "www.abidin06.space" and check CNAME

#### Command Line Verification
```bash
# Check A records
nslookup abidin06.space

# Check CNAME
nslookup www.abidin06.space

# Check with dig (Linux/Mac)
dig abidin06.space
dig www.abidin06.space
```

#### Expected Results
```
abidin06.space → 185.199.108.153 (and other GitHub IPs)
www.abidin06.space → abidinyldz06.github.io
```

### SSL Certificate

GitHub Pages automatically provides SSL certificate for custom domains:
- Certificate is issued by Let's Encrypt
- Automatic renewal
- HTTPS enforcement available after DNS propagation

### Troubleshooting

#### Common Issues
1. **DNS not propagating**
   - Wait 24-48 hours
   - Clear DNS cache: `ipconfig /flushdns` (Windows)

2. **SSL certificate not working**
   - Ensure DNS is fully propagated
   - Disable and re-enable "Enforce HTTPS" in GitHub Pages settings

3. **404 errors**
   - Check if CNAME file exists in repository root
   - Verify GitHub Pages is enabled and configured correctly

#### Support Resources
- GitHub Pages Documentation: https://docs.github.com/en/pages
- Hostinger DNS Guide: https://support.hostinger.com/en/articles/1583227
- DNS Checker: https://dnschecker.org

### Timeline

| Step | Duration | Status |
|------|----------|--------|
| DNS Configuration | 5 minutes | ⏳ Pending |
| DNS Propagation | 1-48 hours | ⏳ Waiting |
| SSL Certificate | 1-24 hours | ⏳ After DNS |
| Full Activation | 1-48 hours | ⏳ Final |

### Final URLs

After successful configuration:
- **Primary:** https://abidin06.space
- **WWW:** https://www.abidin06.space
- **GitHub Pages:** https://abidinyldz06.github.io/abidin06.space (backup)

---

**Last Updated:** January 12, 2025
**Status:** DNS Configuration Required