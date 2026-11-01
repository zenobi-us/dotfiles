// Throwaway AppLoad pen-quality probe. Keep source pixels and strokes separate.
import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Window 2.15
import net.asivery.AppLoad 1.0
import net.asivery.CommandExecutor 1.0
import net.asivery.ApploadUtils

Rectangle {
    id: root
    color: "white"
    anchors.fill: parent
    signal close
    property string appDir: "/home/root/xovi/exthome/appload/pi-ink-bridge-pen-prototype"
    property string serverUrl: ""
    property string statusText: "Loading the source image."
    property var strokes: []
    property int penSamples: 0
    property int paintCount: 0
    property int ignoredTouches: 0
    property bool rotated: false
    property real zoom: 1
    property bool sourceReady: false
    property bool penDown: false
    property var penDevice: null

    AppLoad {
        id: endpoint
        applicationID: "net.zenobi.pi-ink-bridge.pen-prototype"
        onMessageReceived: function(type, contents) {
            if (type === 1) root.acceptPen(JSON.parse(contents))
            if (type === 2) {
                root.penDevice = JSON.parse(contents)
                root.statusText = "Native pen connected. Draw on the grid."
            }
        }
    }

    function acceptPen(sample) {
        if (!sourceReady || !sample.down) {
            penDown = false
            return
        }
        var point = canvas.mapFromItem(null, sample.x * root.Screen.width, sample.y * root.Screen.height)
        if (point.x < 0 || point.y < 0 || point.x >= 800 || point.y >= 1000) {
            penDown = false
            return
        }
        if (!penDown) strokes.push([])
        penDown = true
        strokes[strokes.length - 1].push({x: Math.round(point.x * 100) / 100,
            y: Math.round(point.y * 100) / 100, rawX: sample.x, rawY: sample.y,
            pressure: sample.pressure, time: Date.now()})
        penSamples++
        canvas.requestPaint()
    }

    function unloading() { endpoint.terminate() }

    function transfer(path, extra) {
        var args = ["--silent", "--show-error", "--fail", "--max-time", "15",
                    "--config", appDir + "/transfer.conf"]
        return JSON.parse(command.executeCommand("/home/root/.vellum/bin/curl", args.concat(extra, [serverUrl + path])))
    }

    function sendResult() {
        if (!sourceReady || strokes.length === 0) {
            statusText = "Draw with the pen before sending."
            return
        }
        var metadata = JSON.stringify({sourceWidth: 800, sourceHeight: 1000,
                                      strokes: strokes, penSamples: penSamples,
                                      paintCount: paintCount, ignoredTouches: ignoredTouches,
                                      rotation: rotated ? 90 : 0, zoom: zoom, penDevice: penDevice})
        if (metadata.length > 100000) {
            statusText = "This probe has too many pen samples. Clear and draw a shorter pattern."
            return
        }
        var strokeReply = transfer("/strokes", ["--request", "POST", "--data-binary", metadata])
        if (strokeReply.stderr.length > 0) {
            statusText = "Stroke upload failed: " + strokeReply.stderr
            return
        }
        // Qt 6.10.3 resolves Canvas.save() paths against qrc:, so write its PNG bytes directly.
        var dataUrl = canvas.toDataURL("image/png")
        var prefix = "data:image/png;base64,"
        if (dataUrl.indexOf(prefix) !== 0 || dataUrl.length > 100000) {
            statusText = "The canvas could not export a small PNG. The desktop has the stroke coordinates."
            return
        }
        var saved = JSON.parse(command.executeCommand(appDir + "/png-writer", [dataUrl.slice(prefix.length)]))
        if (saved.stderr.length > 0) {
            statusText = "PNG write failed: " + saved.stderr
            return
        }
        var reply = transfer("/result", ["--request", "POST", "--data-binary", "@" + appDir + "/result.png"])
        statusText = reply.stdout.indexOf('"accepted":true') >= 0
            ? "The desktop accepted the PNG. Report pen latency and palm handling in Pi/OMP."
            : "PNG upload failed: " + reply.stderr
    }

    CommandExecutor { id: command }

    Component.onCompleted: {
        serverUrl = JSON.parse(command.executeCommand("cat", [appDir + "/server-url"])).stdout.trim()
        var reply = transfer("/source", ["--output", appDir + "/source.png"])
        if (reply.stderr.length > 0) {
            statusText = "Source download failed: " + reply.stderr
            return
        }
        canvas.loadImage("file://" + appDir + "/source.png")
    }

    Column {
        id: header
        anchors { top: parent.top; left: parent.left; right: parent.right; margins: 20 }
        spacing: 10
        Text { text: "Pi Ink pen prototype — native pen"; font.pixelSize: 32; font.bold: true }
        Text {
            width: parent.width
            wrapMode: Text.WordWrap
            font.pixelSize: 22
            text: "Use the pen to mark the grid. Rest your palm on the screen. Change scale and rotation, then mark the same grid points."
        }
        Row {
            spacing: 12
            Button { text: "Scale " + Math.round(root.zoom * 100) + "%"; height: 70; font.pixelSize: 23; onClicked: root.zoom = root.zoom === 1 ? 0.7 : 1 }
            Button { text: "Rotate"; height: 70; font.pixelSize: 23; onClicked: root.rotated = !root.rotated }
            Button {
                text: "Clear"; height: 70; font.pixelSize: 23
                onClicked: { root.strokes = []; root.penSamples = 0; canvas.requestPaint() }
            }
            Button { text: "Send PNG"; height: 70; font.pixelSize: 23; onClicked: root.sendResult() }
            Button { text: "Close"; height: 70; font.pixelSize: 23; onClicked: root.close() }
        }
    }

    Item {
        id: viewport
        anchors { top: header.bottom; bottom: footer.top; left: parent.left; right: parent.right; margins: 20 }
        clip: true
        Canvas {
            id: canvas
            width: 800
            height: 1000
            anchors.centerIn: parent
            rotation: root.rotated ? 90 : 0
            scale: Math.min(viewport.width / (root.rotated ? 1000 : 800), viewport.height / (root.rotated ? 800 : 1000)) * root.zoom
            antialiasing: true
            onImageLoaded: {
                root.sourceReady = true
                root.statusText = "The source is ready. Only pen input draws."
                requestPaint()
            }
            onPaint: {
                if (!root.sourceReady) return
                var ctx = getContext("2d")
                ctx.clearRect(0, 0, 800, 1000)
                ctx.drawImage("file://" + root.appDir + "/source.png", 0, 0, 800, 1000)
                ctx.strokeStyle = "#b00000"
                ctx.fillStyle = "#b00000"
                ctx.lineWidth = 4
                ctx.lineCap = "round"
                ctx.lineJoin = "round"
                for (var s = 0; s < root.strokes.length; s++) {
                    var stroke = root.strokes[s]
                    if (stroke.length === 1) {
                        ctx.beginPath()
                        ctx.arc(stroke[0].x, stroke[0].y, 2, 0, 2 * Math.PI)
                        ctx.fill()
                    } else {
                        ctx.beginPath()
                        ctx.moveTo(stroke[0].x, stroke[0].y)
                        for (var p = 1; p < stroke.length; p++) ctx.lineTo(stroke[p].x, stroke[p].y)
                        ctx.stroke()
                    }
                }
                root.paintCount++
            }
            PointHandler {
                acceptedDevices: PointerDevice.TouchScreen
                onActiveChanged: { if (active) root.ignoredTouches++ }
            }
            DisplayMethodArea { anchors.fill: parent; displayMethod: DisplayMethodArea.Fast }
        }
    }

    Column {
        id: footer
        anchors { bottom: parent.bottom; left: parent.left; right: parent.right; margins: 20 }
        spacing: 8
        Text {
            text: "Pen samples: " + root.penSamples + " | Paints: " + root.paintCount + " | Ignored touches: " + root.ignoredTouches
            font.pixelSize: 20
        }
        Text { text: root.statusText; width: parent.width; wrapMode: Text.WordWrap; font.pixelSize: 22 }
    }

}
