pragma ComponentBehavior: Bound
// One persistent client; the library manager and native document foldout share it.
// Closing either surface never submits or closes the stock document.
import QtQuick
import QtQuick.Layouts
import common as NativeCommon
import device.ui.controls as NativeControls
import ark.controls as ArkControls
import ark.tokens as ArkTokens

Item {
    id: bridge
    required property string nativeDocumentUUID
    readonly property var stockUUIDPattern: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    readonly property string documentUUID: canonicalUUID(nativeDocumentUUID)
    required property var library
    required property Item panelParent
    required property real panelLeftMargin
    required property real panelRightMargin
    required property real panelTopMargin
    required property real panelBottomMargin
    required property bool panelEnabled
    property bool expanded: false
    property var state: ({})
    property bool localOnline: false
    property bool currentPending: true
    property bool currentBusy: false
    property bool polling: false
    property bool actionBusy: false
    property int generation: 0
    property string errorText: ""
    // Retain the import trace when the current document changes.
    property string importDiagnostic: ""
    // Stock upload uses token + ".pdf"; the local API retains the token identity.
    property var importNames: ({})
    property var importReports: ({})
    property var importReady: ({})
    readonly property bool currentMatches: localOnline && !currentPending && state.documentUUID === documentUUID
    readonly property bool associated: currentMatches && !!state.serverId
    readonly property string statusText: !localOnline ? "Bridge offline" : !currentMatches ? "Updating current document" : !associated ? "Unassociated document" : (state.serverName || state.serverId) + " · " + state.connection + " · " + state.status

    width: 0
    height: 0
    function canonicalUUID(value) {
        var text = value ? value.toString() : "";
        if (text.length === 38 && text[0] === "{" && text[37] === "}")
            text = text.slice(1, -1);
        return bridge.stockUUIDPattern.test(text) ? text.toLowerCase() : "";
    }

    function showManager() {
        expanded = true;
    }
    onPanelEnabledChanged: {
        if (!panelEnabled)
            expanded = false;
    }

    onDocumentUUIDChanged: updateCurrent()
    Component.onCompleted: updateCurrent()
    Component.onDestruction: {
        // Clearing the stock document is not submission.
        request("POST", "/current", {
            documentUUID: ""
        }, function (ok, value) {});
    }

    function request(method, path, payload, callback) {
        var xhr = new XMLHttpRequest();
        var finished = false;
        function finish(ok, value) {
            if (finished)
                return;
            finished = true;
            callback(ok, value);
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== XMLHttpRequest.DONE)
                return;
            if (xhr.status < 200 || xhr.status >= 300) {
                var failure = {error: "Local HTTP " + xhr.status};
                try {
                    var rejected = JSON.parse(xhr.responseText);
                    if (rejected && typeof rejected.error === "string")
                        failure.error = rejected.error;
                } catch (error) {}
                finish(false, failure);
                return;
            }
            if (!xhr.responseText) {
                finish(true, {});
                return;
            }
            try {
                finish(true, JSON.parse(xhr.responseText));
            } catch (error) {
                finish(false, null);
            }
        };
        xhr.onerror = function () {
            finish(false, null);
        };
        xhr.open(method, "http://127.0.0.1:9821" + path);
        if (payload !== null)
            xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(payload === null ? "" : JSON.stringify(payload));
    }

    function updateCurrent() {
        generation += 1;
        currentPending = true;
        state = ({});
        errorText = "";
        expanded = false;
        publishCurrent();
    }

    function publishCurrent() {
        if (currentBusy || !currentPending)
            return;
        currentBusy = true;
        var sentGeneration = generation;
        var sentUUID = documentUUID;
        // Serialize current updates so a late close cannot overwrite a newer open.
        request("POST", "/current", {
            documentUUID: sentUUID
        }, function (ok, value) {
            currentBusy = false;
            if (sentGeneration !== generation) {
                publishCurrent();
                return;
            }
            localOnline = ok;
            currentPending = !ok;
            if (ok)
                refreshState();
        });
    }

    function refreshState() {
        if (polling || currentBusy || currentPending)
            return;
        polling = true;
        var requestedGeneration = generation;
        request("GET", "/state", null, function (ok, value) {
            polling = false;
            if (requestedGeneration !== generation)
                return;
            localOnline = ok;
            if (!ok) {
                state = ({});
                return;
            }
            if (value.documentUUID !== documentUUID) {
                currentPending = true;
                state = ({});
                publishCurrent();
                return;
            }
            var names = ({});
            var imports = value.imports || [];
            // Map iteration can reorder unchanged jobs and replace a pressed delegate.
            imports.sort(function (left, right) {
                if (left.serverId !== right.serverId)
                    return left.serverId < right.serverId ? -1 : 1;
                if (left.jobId !== right.jobId)
                    return left.jobId < right.jobId ? -1 : 1;
                return 0;
            });
            value.imports = imports;
            state = value;
            for (var i = 0; i < imports.length; i++) {
                var entry = imports[i];
                if (typeof entry.importName === "string" && /^pi-ink-[0-9a-f]{32}$/.test(entry.importName))
                    names[entry.importName + ".pdf"] = entry.importName;
            }
            importNames = names;
            for (var j = 0; j < imports.length; j++) {
                if (imports[j].status === "importing" && names[imports[j].importName + ".pdf"] === imports[j].importName) {
                    acknowledgeImportReady(imports[j].importName);
                    sendImportReceipt(imports[j].importName);
                }
            }
        });
    }

    function acknowledgeImportReady(importName) {
        if (importReady[importName])
            return;
        importReady[importName] = true;
        request("POST", "/import-ready", {
            importName: importName
        }, function (ok, value) {
            delete importReady[importName];
        });
    }

    function submit(path, pressedUUID, confirmationId) {
        if (!currentMatches || actionBusy || pressedUUID !== documentUUID)
            return;
        if (path === "/send" && !state.canSend)
            return;
        if (path === "/confirm" && (!state.canConfirm || !confirmationId))
            return;
        actionBusy = true;
        errorText = "";
        var sentGeneration = generation;
        var payload = {
            documentUUID: documentUUID
        };
        if (path === "/confirm")
            payload.confirmationId = confirmationId;
        request("POST", path, payload, function (ok, value) {
            actionBusy = false;
            if (sentGeneration !== generation)
                return;
            if (!ok)
                errorText = "Action rejected. Check connection and current document.";
            refreshState();
        });
    }

    function importSource(entry) {
        if (actionBusy || entry.status !== "pending" || entry.importName !== "")
            return;
        actionBusy = true;
        errorText = "";
        importDiagnostic = "Import requested; waiting for a controlled native receipt.";
        request("POST", "/import", {
            serverId: entry.serverId,
            jobId: entry.jobId
        }, function (ok, value) {
            actionBusy = false;
            if (!ok) {
                errorText = "Import failed: " + (value && typeof value.error === "string" ? value.error : "Local request failed.");
                importDiagnostic += "\n" + errorText;
            } else {
                importDiagnostic += "\nDocument binding acknowledged.";
            }
            refreshState();
        });
    }

    function pairServer(serverId) {
        if (actionBusy)
            return;
        actionBusy = true;
        request("POST", "/pair", {serverId: serverId}, function (ok, value) {
            bridge.actionBusy = false;
            if (!ok)
                bridge.errorText = "Pairing rejected. Check setup trust and desktop approval.";
            bridge.refreshState();
        });
    }

    function createServerFolder(serverId) {
        if (actionBusy)
            return;
        actionBusy = true;
        var name = library.uniqueVisibleName("Pi Ink " + serverId);
        var id = library.createCollection("", name);
        var uuid = canonicalUUID(id);
        if (!uuid) {
            errorText = "Stock folder creation did not return a UUID.";
            actionBusy = false;
            return;
        }
        request("POST", "/folder", {serverId: serverId, folderUUID: uuid}, function (ok, value) {
            bridge.actionBusy = false;
            if (!ok)
                bridge.errorText = "Folder remains in the stock library, but association was rejected.";
            bridge.refreshState();
        });
    }

    function reportNativeDiagnostic(importName, code) {
        request("POST", "/diagnostic", {
            importName: importName,
            code: code
        }, function (ok, value) {
            if (!ok)
                importDiagnostic += "\nDiagnostic report failed.";
        });
    }

    function reportImport(visibleName, id) {
        // Resolve only the exact uploaded filename, never an arbitrary basename.
        if (!Object.prototype.hasOwnProperty.call(importNames, visibleName)) {
            if (typeof visibleName === "string" && importNames[visibleName + ".pdf"] === visibleName) {
                importDiagnostic = "Native receipt filename differs from the uploaded PDF filename.";
                reportNativeDiagnostic(visibleName, "import.receipt_filename_mismatch");
            }
            return;
        }
        var importName = importNames[visibleName];
        importDiagnostic = "Native receipt filename matched; resolving the document UUID.";
        if (importReports[importName]) {
            sendImportReceipt(importName);
            return;
        }
        var uuid = canonicalUUID(id);
        if (!uuid) {
            importDiagnostic = "Native receipt name matched, but the document UUID could not be converted.";
            reportNativeDiagnostic(importName, "import.receipt_uuid_invalid");
            return;
        }
        importDiagnostic = "Native document UUID resolved; reading the stock parent UUID.";
        var parentId = library.parentIdForId(id);
        var serializedParent = parentId ? parentId.toString() : "";
        var folder = canonicalUUID(serializedParent);
        if (serializedParent && !folder) {
            errorText = "Import receipt has an invalid stock parent UUID.";
            importDiagnostic = errorText;
            reportNativeDiagnostic(importName, "import.receipt_parent_invalid");
            return;
        }
        importReports[importName] = {
            payload: {
                importName: importName,
                documentUUID: uuid,
                folderUUID: folder
            },
            inFlight: false,
            acknowledged: false
        };
        importDiagnostic = "Native document and parent UUIDs resolved; sending the receipt.";
        sendImportReceipt(importName);
    }

    function sendImportReceipt(importName) {
        var report = importReports[importName];
        if (importNames[importName + ".pdf"] !== importName || !report || report.inFlight || report.acknowledged)
            return;
        report.inFlight = true;
        request("POST", "/imported", report.payload, function (ok, value) {
            report.inFlight = false;
            report.acknowledged = ok;
            if (!ok) {
                errorText = "Import receipt not acknowledged. Retrying the same controlled UUID.";
                importDiagnostic = "Native receipt rejected: " + (value && typeof value.error === "string" ? value.error : "Local request failed.");
            }
            if (ok) {
                importDiagnostic = "Native receipt accepted; waiting for document binding.";
                refreshState();
            }
        });
    }

    Connections {
        target: bridge.library
        function onEntryImported(visibleName, id) {
            bridge.reportImport(visibleName, id);
        }
    }

    Timer {
        interval: 1000
        running: true
        repeat: true
        onTriggered: {
            if (bridge.currentPending)
                bridge.publishCurrent();
            else
                bridge.refreshState();
        }
    }

    NativeCommon.Background {
        id: surface
        parent: bridge.panelParent
        anchors.fill: parent
        anchors.leftMargin: bridge.panelLeftMargin
        anchors.rightMargin: bridge.panelRightMargin
        anchors.topMargin: bridge.panelTopMargin
        anchors.bottomMargin: bridge.panelBottomMargin
        visible: bridge.expanded && bridge.panelEnabled
        clip: true

        ArkControls.NavigationBar {
            id: navigationBar
            type: ArkTokens.NavigationBar.secondary
            anchors.top: parent.top
            anchors.left: parent.left
            anchors.right: parent.right
            title: "Pi Ink"
            borderPosition: ArkControls.NavigationBar.Border.Bottom

            ArkControls.NavigationBar.Button {
                text: "Back"
                iconSource: "qrc:/ark/icons/chevron_left"
                onClicked: bridge.expanded = false
            }
            Item {
                Layout.fillWidth: true
            }
        }

        NativeControls.ScrollContainer {
            anchors.fill: parent
            anchors.topMargin: navigationBar.height
            topMargin: NativeCommon.Values.designGridHorizontalHeight + NativeCommon.Values.designGridHorizontalGutter + NativeCommon.Values.designGridHorizontalSpacing
            leftMargin: NativeCommon.Values.designGridVerticalGutter + NativeCommon.Values.designGridVerticalSpacing + NativeCommon.Values.designGridVerticalWidth
            rightMargin: NativeCommon.Values.designGridVerticalGutter + NativeCommon.Values.designGridVerticalSpacing + NativeCommon.Values.designGridVerticalWidth
            bottomMargin: NativeCommon.Values.designGridHorizontalHeight + NativeCommon.Values.designGridHorizontalGutter + NativeCommon.Values.designGridHorizontalSpacing

            view: Flickable {
                id: panelScroll
                contentHeight: content.height
                clip: true
                boundsBehavior: Flickable.StopAtBounds
                Column {
                    id: content
                    width: panelScroll.width
                    spacing: NativeCommon.Values.designGridHorizontalSpacing
                    NativeControls.Button {
                        property string documentAtPress: ""
                        width: 140
                        height: 64
                        text: "Send"
                        enabled: bridge.currentMatches && !!bridge.state.canSend && !bridge.actionBusy
                        onPressedChanged: {
                            if (pressed)
                                documentAtPress = bridge.documentUUID;
                        }
                        onClicked: bridge.submit("/send", documentAtPress, "")
                    }

                    Text {
                        width: parent.width
                        text: bridge.statusText
                        font.pixelSize: 24
                        wrapMode: Text.Wrap
                        textFormat: Text.PlainText
                        color: "black"
                    }
                    Text {
                        width: parent.width
                        visible: bridge.errorText !== ""
                        text: bridge.errorText
                        font.pixelSize: 22
                        wrapMode: Text.Wrap
                        textFormat: Text.PlainText
                        color: "black"
                    }
                    Text {
                        width: parent.width
                        text: "Bridge version: " + (bridge.localOnline && bridge.state.version ? bridge.state.version : "unavailable")
                        font.pixelSize: 20
                        wrapMode: Text.WrapAnywhere
                        textFormat: Text.PlainText
                        color: "black"
                    }
                    Text {
                        width: parent.width
                        visible: bridge.importDiagnostic !== ""
                        text: bridge.importDiagnostic
                        font.pixelSize: 20
                        wrapMode: Text.Wrap
                        textFormat: Text.PlainText
                        color: "black"
                    }
                    Column {
                        width: parent.width
                        spacing: 10
                        visible: bridge.currentMatches && bridge.state.status === "confirmation-required"
                        Text {
                            width: parent.width
                            text: "Ink extends outside the source. Sending clips that ink from the PNG. The full PDF is retained; the stock document stays editable."
                            font.pixelSize: 24
                            wrapMode: Text.Wrap
                            textFormat: Text.PlainText
                            color: "black"
                        }
                        NativeControls.Button {
                            property string confirmationAtPress: ""
                            property string documentAtPress: ""
                            width: parent.width
                            height: 72
                            text: "Confirm clipping and send this result"
                            enabled: bridge.currentMatches && !!bridge.state.canConfirm && !!bridge.state.confirmationId && !bridge.actionBusy
                            onPressedChanged: {
                                if (pressed) {
                                    documentAtPress = bridge.documentUUID;
                                    confirmationAtPress = bridge.state.confirmationId;
                                }
                            }
                            onClicked: bridge.submit("/confirm", documentAtPress, confirmationAtPress)
                        }
                    }
                    Column {
                        width: parent.width
                        spacing: 10
                        Text {
                            width: parent.width
                            text: "Current document UUID: " + bridge.documentUUID
                            font.pixelSize: 20
                            wrapMode: Text.WrapAnywhere
                            textFormat: Text.PlainText
                            color: "black"
                        }
                        Text {
                            width: parent.width
                            visible: bridge.associated
                            text: "Bound server ID: " + (bridge.state.serverId || "")
                            font.pixelSize: 20
                            wrapMode: Text.WrapAnywhere
                            textFormat: Text.PlainText
                            color: "black"
                        }
                        Text {
                            width: parent.width
                            visible: bridge.associated && typeof bridge.state.folderUUID === "string"
                            text: "Parent observed at import: " + (bridge.state.folderUUID || "Stock root")
                            font.pixelSize: 20
                            wrapMode: Text.WrapAnywhere
                            textFormat: Text.PlainText
                            color: "black"
                        }
                        Text {
                            text: "Associated stock folders"
                            font.pixelSize: 24
                            color: "black"
                        }
                        Repeater {
                            model: bridge.state.folders || []
                            delegate: Text {
                                required property var modelData
                                width: content.width
                                text: (modelData.folderUUID || "Stock root") + " · " + (modelData.serverName || modelData.serverId) + " · " + modelData.serverId
                                font.pixelSize: 20
                                wrapMode: Text.WrapAnywhere
                                textFormat: Text.PlainText
                                color: "black"
                            }
                        }
                        Text {
                            text: "Paired servers"
                            font.pixelSize: 24
                            color: "black"
                        }
                        Repeater {
                            model: bridge.state.servers || []
                            delegate: Column {
                                id: serverEntry
                                required property var modelData
                                width: content.width
                                spacing: 8
                                Text {
                                    width: parent.width
                                    text: serverEntry.modelData.name + " · " + serverEntry.modelData.serverId + " · " + serverEntry.modelData.connection + (serverEntry.modelData.pairingId ? "\\nApproval ID: " + serverEntry.modelData.pairingId : "")
                                    font.pixelSize: 20
                                    wrapMode: Text.WrapAnywhere
                                    textFormat: Text.PlainText
                                    color: "black"
                                }
                                NativeControls.Button {
                                    width: parent.width
                                    height: 64
                                    text: "Pair with this setup-trusted server"
                                    visible: serverEntry.modelData.connection !== "online"
                                    onClicked: bridge.pairServer(serverEntry.modelData.serverId)
                                }
                                NativeControls.Button {
                                    width: parent.width
                                    height: 64
                                    text: "Create associated stock folder"
                                    enabled: serverEntry.modelData.connection === "online"
                                    onClicked: bridge.createServerFolder(serverEntry.modelData.serverId)
                                }
                            }
                        }
                        Text {
                            text: "Synthetic imports"
                            font.pixelSize: 24
                            color: "black"
                        }
                        Repeater {
                            model: bridge.state.imports || []
                            delegate: Column {
                                id: importEntry
                                required property var modelData
                                width: content.width
                                spacing: 6
                                Text {
                                    width: parent.width
                                    text: importEntry.modelData.serverId + " · job " + importEntry.modelData.jobId + " · " + importEntry.modelData.status
                                    font.pixelSize: 20
                                    wrapMode: Text.WrapAnywhere
                                    textFormat: Text.PlainText
                                    color: "black"
                                }
                                NativeControls.Button {
                                    width: parent.width
                                    height: 64
                                    text: "Import synthetic source"
                                    visible: importEntry.modelData.status === "pending" && importEntry.modelData.importName === ""
                                    enabled: !bridge.actionBusy && bridge.localOnline
                                    onClicked: bridge.importSource(importEntry.modelData)
                                }
                            }
                        }
                        Text {
                            width: parent.width
                            text: "Setup provisions certificate trust, not pairing. Select Pair, then approve the matching device and approval ID on the desktop. Import uses the stock destination; the observed parent UUID is shown separately. Move documents only with normal stock controls. Saving or closing never sends."
                            font.pixelSize: 20
                            wrapMode: Text.Wrap
                            textFormat: Text.PlainText
                            color: "black"
                        }
                    }
                }
            }
        }
    }
}
