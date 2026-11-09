// The AppLoad screen owns connection display; XOVI only launches this application.
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import net.asivery.AppLoad 1.0

Rectangle {
    id: root
    color: "white"
    signal close()
    property var servers: []
    property string connectionError: "Checking server connection…"
    function unloading() { poll.stop(); endpoint.terminate(); }
    AppLoad {
        id: endpoint
        applicationID: "org.pi-ink.annotations"
        onMessageReceived: function(type, contents) {
            if (type !== 2) return;
            try {
                root.servers = JSON.parse(contents);
                root.connectionError = root.servers.length ? "" : "No provisioned server. Run /annotate add-device on the desktop.";
            } catch (error) {
                root.connectionError = "Invalid connection response. Close the app and repair its installation.";
            }
        }
    }
    Timer {
        id: poll
        interval: 5000
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: endpoint.sendMessage(1, "")
    }
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 48
        spacing: 32
        RowLayout {
            Layout.fillWidth: true
            Label { text: "Pi Annotations"; font.pixelSize: 42; Layout.fillWidth: true }
            Button { text: "Close"; font.pixelSize: 28; onClicked: root.close() }
        }
        Label { text: "Server connections"; font.pixelSize: 32 }
        Label {
            text: root.connectionError
            visible: text.length > 0
            font.pixelSize: 26
            wrapMode: Text.WordWrap
            Layout.fillWidth: true
        }
        Repeater {
            model: root.servers
            delegate: ColumnLayout {
                required property var modelData
                Layout.fillWidth: true
                spacing: 12
                Label { text: modelData.name; font.pixelSize: 32; font.bold: true }
                Label { text: modelData.connection; font.pixelSize: 28 }
                Label { text: "Server ID: " + modelData.serverId; font.pixelSize: 24; wrapMode: Text.WrapAnywhere; Layout.fillWidth: true }
                Label { text: modelData.detail; font.pixelSize: 24; wrapMode: Text.WordWrap; Layout.fillWidth: true }
            }
        }
        Item { Layout.fillHeight: true }
        Label {
            text: "The stock editor remains responsible for drawing. Closing this screen does not remove drafts or pairing records."
            wrapMode: Text.WordWrap
            font.pixelSize: 24
            Layout.fillWidth: true
        }
    }
}
