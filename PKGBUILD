# Maintainer: local build; proprietary upstream payload is supplied by the user
pkgname=chatgpt-linux
pkgver=26.707.31428
pkgrel=1
pkgdesc='Unofficial Linux compatibility package for the unified ChatGPT/Codex desktop app'
arch=('x86_64')
url='https://chatgpt.com/download/'
license=('custom')
depends=('alsa-lib' 'at-spi2-core' 'cairo' 'dbus' 'expat' 'gcc-libs' 'glib2' 'glibc'
         'gtk3' 'libcups' 'libdrm' 'libsecret' 'libx11' 'libxcb' 'libxcomposite'
         'libxdamage' 'libxext' 'libxfixes' 'libxkbcommon' 'libxrandr' 'mesa' 'nspr'
         'nss' 'pango' 'pipewire' 'xdg-desktop-portal' 'xdg-utils')
makedepends=('base-devel' 'nodejs' 'npm' 'python' 'unzip' '7zip')
optdepends=('wl-clipboard: Wayland clipboard integration'
            'grim: Wayland screenshots'
            'ydotool: user-authorized Wayland input automation'
            'xdg-desktop-portal-hyprland: Hyprland screen sharing and file dialogs')
options=('!strip')
source=('ChatGPT.dmg'
        'https://nodejs.org/dist/v24.14.0/node-v24.14.0-linux-x64.tar.xz')
noextract=('ChatGPT.dmg')
sha256sums=('6f67af7e2f934093ab8afebcec11374d40c8db8f9100fb6620f24155401d8319'
            '41cd79bb7877c81605a9e68ec4c91547774f46a40c67a17e34d7179ef11729df')

build() {
  "$startdir/scripts/build.sh" "$srcdir/ChatGPT.dmg" "$srcdir/node-v24.14.0-linux-x64/bin/node"
}

package() {
  install -d "$pkgdir/opt/chatgpt-linux"
  cp -a "$startdir/build/runtime/." "$pkgdir/opt/chatgpt-linux/"
  install -Dm755 "$startdir/packaging/chatgpt-linux" "$pkgdir/usr/bin/chatgpt-linux"
  install -Dm644 "$startdir/packaging/chatgpt-linux.desktop" \
    "$pkgdir/usr/share/applications/chatgpt-linux.desktop"
  install -Dm644 "$startdir/build/runtime/resources/icon-chatgpt.png" \
    "$pkgdir/usr/share/pixmaps/chatgpt-linux.png"
  install -Dm644 "$startdir/LICENSE" "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
  install -Dm644 "$startdir/NOTICE.md" "$pkgdir/usr/share/licenses/$pkgname/NOTICE.md"
}
