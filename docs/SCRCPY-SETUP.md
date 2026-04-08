# scrcpy Setup For Roamie

## Installing scrcpy
1. Download scrcpy from the official repository: https://github.com/Genymobile/scrcpy
2. Navigate to the Releases section and download: `scrcpy-win64-v3.3.4.zip` (64-bit)
3. Extract the zipped file into your desired location

## scrcpy Setup 
4. Now open Windows Command Prompt 
5. Navigate to where scrcpy folder: `cd Downloads\scrcpy-win64`
6. Then run: `scrcpy.exe`

## Enable Developer Mode (Android)
7. On your phone:
- Go to Settings → About Phone → Software Information
- Tap Build Number 7 times
- Enter your PIN if prompted
8. Go back to Settings → Developer Options
9. Enable:
- USB Debugging
10. Connect your phone to your computer via USB
11. When prompted on your phone:
- Tap Allow USB Debugging
12. Run again if needed: `scrcpy.exe`

## Run Roamie on Your Phone
13. In your Roamie project (VSCode terminal): `npm run dev -- --host` 
14. In a new terminal, run: `ipconfig`
15. Locate your IPv4 Address under: `Wireless LAN adapter Wi-Fi` 
- Example: `192.168.1.12`
16. On your phone browser, open: `http://YOUR_IP:5173`
- Example: `http://192.168.1.12:5173`

## Why scrcpy?

scrcpy enables real-time interaction with a physical device, allowing accurate testing of:
- GPS-based features
- UI responsiveness
- Location-triggered item collection

This ensures Roamie behaves correctly in real-world environments.