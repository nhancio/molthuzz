const { withDangerousMod } = require('expo/config-plugins');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

const rule = '-dontwarn org.webrtc.Dav1dDecoder$Natives';

module.exports = function withWebRtcR8(config) {
  return withDangerousMod(config, ['android', async mod => {
    const file = path.join(mod.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
    const contents = await readFile(file, 'utf8');
    if (!contents.split(/\r?\n/).some(line => line.trim() === rule)) {
      // WebRTC 155 AARs retain the unused generated bridge but omit its Java
      // decoder/interface. Recheck on upgrades; do not broaden this exception.
      // Upstream diagnosis: https://github.com/jitsi/jitsi-meet/pull/17996
      await writeFile(file, `${contents.trimEnd()}\n\n# WebRTC 155 orphan optional Dav1d JNI interface (Makezy)\n${rule}\n`);
    }
    return mod;
  }]);
};
