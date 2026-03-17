// Handle device selection
function handleDeviceSelect(device) {
    const iosInstructions = document.getElementById('ios-instructions');
    const androidInstructions = document.getElementById('android-instructions');
    const resultSection = document.getElementById('result-section');
    
    // Hide all sections first
    iosInstructions.classList.add('hidden');
    androidInstructions.classList.add('hidden');
    resultSection.classList.add('hidden');
    
    // Show selected device instructions
    if (device === 'ios') {
        iosInstructions.classList.remove('hidden');
    } else if (device === 'android') {
        androidInstructions.classList.remove('hidden');
    }
}

// Download configuration profile for iOS
function downloadProfile() {
    // Get current domain
    const domain = window.location.hostname;
    const redirectURL = window.location.href.split('?')[0] + '?udid={UDID}';
    
    // Create mobileconfig content
    const mobileconfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>URL</key>
            <string>${redirectURL}</string>
            <key>DeviceAttributes</key>
            <array>
                <string>UDID</string>
                <string>PRODUCT</string>
                <string>VERSION</string>
            </array>
        </dict>
    </array>
    <key>PayloadOrganization</key>
    <string>UDID Finder</string>
    <key>PayloadDisplayName</key>
    <string>Get UDID Profile</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadUUID</key>
    <string>${generateUUID()}</string>
    <key>PayloadIdentifier</key>
    <string>com.udidfinder.profile</string>
    <key>PayloadDescription</key>
    <string>Install this profile to get your device UDID</string>
    <key>PayloadType</key>
    <string>Configuration</string>
</dict>
</plist>`;
    
    // Create blob and download
    const blob = new Blob([mobileconfig], { type: 'application/x-apple-aspen-config' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'udid_profile.mobileconfig';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Generate UUID for the profile
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Parse URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Display UDID if returned from profile
window.onload = function() {
    const udid = getUrlParameter('udid');
    const product = getUrlParameter('PRODUCT');
    const version = getUrlParameter('VERSION');
    
    if (udid) {
        const iosInstructions = document.getElementById('ios-instructions');
        const androidInstructions = document.getElementById('android-instructions');
        const resultSection = document.getElementById('result-section');
        const udidValue = document.getElementById('udid-value');
        const deviceModel = document.getElementById('device-model');
        const iosVersion = document.getElementById('ios-version');
        
        // Hide instructions, show result
        iosInstructions.classList.add('hidden');
        androidInstructions.classList.add('hidden');
        resultSection.classList.remove('hidden');
        
        // Display device information
        udidValue.textContent = udid;
        deviceModel.textContent = product || 'Unknown';
        iosVersion.textContent = version || 'Unknown';
        
        // Clean URL (remove parameters)
        if (history.pushState) {
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.pushState({path: newUrl}, '', newUrl);
        }
    }
}

// Copy UDID to clipboard
function copyUDID() {
    const udidValue = document.getElementById('udid-value').textContent;
    
    // Create temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = udidValue;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // Show feedback
    alert('UDID copied to clipboard!');
}