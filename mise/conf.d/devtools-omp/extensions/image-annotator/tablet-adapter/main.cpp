// Temporary firmware-3.28.0.172 adapter for the tablet prototype.
// Based on asivery/rm-xovi-extensions at 6c709dd8416ddf89034831073d76fb4ee3372905.
// These Qt hooks affect every caller in Xochitl; there is no LAN proxy or settings bypass.
#include <QHostAddress>
#include <QNetworkInterface>
#include <QString>
#include <QTcpServer>
#include <cstdio>
#include "xovi.h"
using QStringConstPtr = const QString *;
using QHostAddressConstPtr = const QHostAddress *;
using QTcpServerPtr = QTcpServer *;

extern "C" {
void _xovi_construct() {
    std::fputs("PI_INK_LOOPBACK_0020 loaded; process-wide Qt hooks; no LAN proxy\n", stderr);
}
QNetworkInterface override$_ZN17QNetworkInterface17interfaceFromNameERK7QString(const QString &name) {
    if (name == QStringLiteral("usb0") || name == QStringLiteral("usb1")) {
        const QString loopback = QStringLiteral("lo");
        return $_ZN17QNetworkInterface17interfaceFromNameERK7QString(&loopback);
    }
    return $_ZN17QNetworkInterface17interfaceFromNameERK7QString(&name);
}
bool override$_ZNK12QHostAddress8isGlobalEv(const QHostAddress *address) {
    return address->isLoopback() || $_ZNK12QHostAddress8isGlobalEv(address);
}
bool override$_ZN10QTcpServer6listenERK12QHostAddresst(QTcpServer *server, const QHostAddress &address, unsigned short port) {
    // Preserve Qt's bool ABI; force all intercepted port-80 listeners to IPv4 loopback.
    if (port == 80) {
        const QHostAddress loopback(QHostAddress::LocalHost);
        return $_ZN10QTcpServer6listenERK12QHostAddresst(server, &loopback, 81);
    }
    return $_ZN10QTcpServer6listenERK12QHostAddresst(server, &address, port);
}
}
