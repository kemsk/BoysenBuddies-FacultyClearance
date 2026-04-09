# Generate self-signed SSL certificates for HTTPS
# This script creates cert.pem and key.pem for the nginx HTTPS configuration

Write-Host "Generating SSL certificates for HTTPS..."

# Check if OpenSSL is available in Git for Windows or other locations
$opensslPaths = @(
    "C:\Program Files\Git\usr\bin\openssl.exe",
    "C:\Program Files (x86)\Git\usr\bin\openssl.exe",
    "openssl.exe"
)

$openssl = $null
foreach ($path in $opensslPaths) {
    if (Test-Path $path) {
        $openssl = $path
        break
    }
}

if (-not $openssl) {
    Write-Error "OpenSSL not found. Please install OpenSSL or Git for Windows."
    exit 1
}

# Create a config file for SAN extensions
$config = @"
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = PH
ST = Manila
L = Quezon City
O = Xavier University
CN = localhost

[v3_req]
keyUsage = digitalSignature, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
"@

$config | Out-File -FilePath openssl.conf -Encoding UTF8

# Generate the certificates with SAN
& $openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
    -keyout key.pem `
    -out cert.pem `
    -config openssl.conf `
    -extensions v3_req

# Clean up config file
Remove-Item openssl.conf -Force

if ($LASTEXITCODE -eq 0) {
    Write-Host "SSL certificates generated successfully!"
    Write-Host "Files created: cert.pem, key.pem"
} else {
    Write-Error "Failed to generate certificates."
    exit 1
}
