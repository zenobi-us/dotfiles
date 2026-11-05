// Applies retained QMDs plus the candidate to copied stock resources on the host.
// Never reads a device or writes into the retained input directories.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

extern void qmldiff_set_version(const char *);
extern int qmldiff_build_change_files(const char *);
extern const char *qmldiff_process_file(const char *, const char *, size_t);

static int path_join(char *buffer, size_t capacity, const char *directory, const char *name) {
    int length = snprintf(buffer, capacity, "%s/%s", directory, name);
    return length >= 0 && (size_t)length < capacity;
}

int main(int argc, char **argv) {
    if (argc != 4) return 1;
    qmldiff_set_version("3.28.0.172");
    int count = qmldiff_build_change_files(argv[2]);
    printf("LOADED %d\n", count);
    if (count != 13) return 2;
    const char *names[] = {"DocumentView.qml", "MainView.qml", "Toolbar.qml", "Navigator.qml", "Sidebar.qml"};
    const char *resources[] = {
        "/qml/device/view/documentview/DocumentView.qml",
        "/qml/device/view/main/MainView.qml",
        "/qt/qml/xofm/libs/toolbar/qml/Toolbar.qml",
        "/qml/device/view/navigator/Navigator.qml",
        "/qml/device/view/navigator/Sidebar.qml"
    };
    for (size_t index = 0; index < sizeof(names) / sizeof(names[0]); ++index) {
        char path[1024];
        if (!path_join(path, sizeof(path), argv[1], names[index])) return 3;
        FILE *input = fopen(path, "rb");
        if (!input || fseek(input, 0, SEEK_END) != 0) return 4;
        long length = ftell(input);
        if (length < 0 || fseek(input, 0, SEEK_SET) != 0) return 5;
        char *data = malloc((size_t)length + 1);
        if (!data || fread(data, 1, (size_t)length, input) != (size_t)length) return 6;
        data[length] = '\0';
        fclose(input);
        const char *patched = qmldiff_process_file(resources[index], data, (size_t)length);
        free(data);
        if (!patched || !path_join(path, sizeof(path), argv[3], names[index])) return 7;
        FILE *output = fopen(path, "wx");
        size_t bytes = strlen(patched);
        if (!output || fwrite(patched, 1, bytes, output) != bytes || fclose(output) != 0) return 8;
        // The upstream FFI has no release function. This short-lived process owns its output lifetime.
        printf("PATCHED %s bytes=%zu\n", resources[index], bytes);
    }
    return 0;
}
