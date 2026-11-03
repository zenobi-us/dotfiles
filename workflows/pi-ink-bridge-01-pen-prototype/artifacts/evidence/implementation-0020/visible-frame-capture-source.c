#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <sys/resource.h>
#include <unistd.h>
#include <drm.h>
#include <drm_mode.h>
#include <drm_fourcc.h>

/* One visible primary framebuffer only. Never modeset, flip, write pixels,
 * read process memory, open notebooks, or guess an offscreen framebuffer. */
static int fail(const char *reason) {
    fprintf(stderr, "CAPTURE_ABORT %s errno=%d\n", reason, errno);
    return 1;
}
static int output(const void *data, size_t length) {
    const unsigned char *p = data;
    while (length) {
        ssize_t n = write(STDOUT_FILENO, p, length);
        if (n < 0 && errno == EINTR) continue;
        if (n <= 0) return -1;
        p += n;
        length -= (size_t)n;
    }
    return 0;
}
static int plane_geometry(int fd, uint32_t id, uint32_t w, uint32_t h) {
    uint32_t ids[64];
    uint64_t values[64];
    struct drm_mode_obj_get_properties props = {0};
    props.props_ptr = (uintptr_t)ids;
    props.prop_values_ptr = (uintptr_t)values;
    props.count_props = 64;
    props.obj_id = id;
    props.obj_type = DRM_MODE_OBJECT_PLANE;
    if (ioctl(fd, DRM_IOCTL_MODE_OBJ_GETPROPERTIES, &props) || props.count_props > 64) return -1;
    const char *names[] = {"SRC_X", "SRC_Y", "SRC_W", "SRC_H", "CRTC_X", "CRTC_Y", "CRTC_W", "CRTC_H", "type"};
    uint64_t expected[] = {0, 0, (uint64_t)w << 16, (uint64_t)h << 16, 0, 0, w, h, 1};
    unsigned seen = 0;
    for (uint32_t i = 0; i < props.count_props; ++i) {
        struct drm_mode_get_property prop = {0};
        prop.prop_id = ids[i];
        if (ioctl(fd, DRM_IOCTL_MODE_GETPROPERTY, &prop)) return -1;
        prop.name[sizeof(prop.name) - 1] = 0;
        for (unsigned j = 0; j < 9; ++j) {
            if (!strcmp(prop.name, names[j])) {
                if (values[i] != expected[j]) return -1;
                seen |= 1u << j;
            }
        }
        if (!strcmp(prop.name, "rotation") && values[i] != DRM_MODE_ROTATE_0) return -1;
        if (!strcmp(prop.name, "alpha") && values[i] != 65535) return -1;
    }
    return seen == 511 ? 0 : -1;
}
int main(void) {
    struct rlimit no_core = {0, 0};
    if (setrlimit(RLIMIT_CORE, &no_core)) return fail("disable_own_core_dump");
    alarm(12);
    int fd = open("/dev/dri/card0", O_RDONLY | O_CLOEXEC);
    if (fd < 0) return fail("open_readonly_card0");
    /* These two capabilities affect only this file descriptor's query API. */
    struct drm_set_client_cap cap = {.capability = DRM_CLIENT_CAP_UNIVERSAL_PLANES, .value = 1};
    if (ioctl(fd, DRM_IOCTL_SET_CLIENT_CAP, &cap)) return fail("universal_query_capability");
    cap.capability = DRM_CLIENT_CAP_ATOMIC;
    if (ioctl(fd, DRM_IOCTL_SET_CLIENT_CAP, &cap)) return fail("atomic_query_capability");
    uint32_t crtcs[16];
    struct drm_mode_card_res res = {0};
    res.crtc_id_ptr = (uintptr_t)crtcs;
    res.count_crtcs = 16;
    if (ioctl(fd, DRM_IOCTL_MODE_GETRESOURCES, &res) || res.count_crtcs > 16) return fail("crtc_metadata");
    struct drm_mode_crtc active = {0};
    unsigned active_count = 0;
    for (uint32_t i = 0; i < res.count_crtcs; ++i) {
        struct drm_mode_crtc c = {.crtc_id = crtcs[i]};
        if (ioctl(fd, DRM_IOCTL_MODE_GETCRTC, &c)) return fail("get_crtc");
        if (c.mode_valid) {
            if (!c.fb_id) return fail("active_crtc_without_visible_fb");
            active = c;
            ++active_count;
        }
    }
    if (active_count != 1 || active.x || active.y) return fail("not_one_uncropped_active_crtc");
    uint32_t plane_ids[64];
    struct drm_mode_get_plane_res planes = {.plane_id_ptr = (uintptr_t)plane_ids, .count_planes = 64};
    if (ioctl(fd, DRM_IOCTL_MODE_GETPLANERESOURCES, &planes) || planes.count_planes > 64) return fail("plane_metadata");
    unsigned visible_count = 0;
    for (uint32_t i = 0; i < planes.count_planes; ++i) {
        struct drm_mode_get_plane plane = {.plane_id = plane_ids[i]};
        if (ioctl(fd, DRM_IOCTL_MODE_GETPLANE, &plane)) return fail("get_plane");
        if (plane.crtc_id == active.crtc_id && plane.fb_id) {
            if (plane.fb_id != active.fb_id || plane_geometry(fd, plane.plane_id, active.mode.hdisplay, active.mode.vdisplay)) return fail("unsupported_visible_composition");
            ++visible_count;
        }
    }
    if (visible_count != 1) return fail("not_one_visible_primary_plane");
    struct drm_mode_fb_cmd2 fb = {.fb_id = active.fb_id};
    if (ioctl(fd, DRM_IOCTL_MODE_GETFB2, &fb)) return fail("visible_fb_metadata");
    if (!fb.handles[0] || fb.handles[1] || fb.handles[2] || fb.handles[3] || fb.offsets[0] || fb.modifier[0] != DRM_FORMAT_MOD_LINEAR || fb.width != active.mode.hdisplay || fb.height != active.mode.vdisplay || !fb.width || !fb.height || fb.width > 10000 || fb.height > 10000) return fail("unsupported_visible_layout");
    unsigned bpp = 0, red = 0, blue = 0, alpha = 0;
    switch (fb.pixel_format) {
        case DRM_FORMAT_XRGB8888: bpp = 4; red = 2; break;
        case DRM_FORMAT_ARGB8888: bpp = 4; red = 2; alpha = 1; break;
        case DRM_FORMAT_XBGR8888: bpp = 4; blue = 2; break;
        case DRM_FORMAT_ABGR8888: bpp = 4; blue = 2; alpha = 1; break;
        case DRM_FORMAT_RGB888: bpp = 3; red = 2; break;
        case DRM_FORMAT_BGR888: bpp = 3; blue = 2; break;
        case DRM_FORMAT_RGB565: bpp = 2; break;
        default: return fail("unsupported_pixel_format");
    }
    uint64_t end = (uint64_t)fb.offsets[0] + (uint64_t)fb.pitches[0] * fb.height;
    if ((uint64_t)fb.width * bpp > fb.pitches[0] || end > 128u * 1024u * 1024u) return fail("visible_bounds");
    struct drm_mode_map_dumb map = {.handle = fb.handles[0]};
    if (ioctl(fd, DRM_IOCTL_MODE_MAP_DUMB, &map)) return fail("readonly_map_visible_handle");
    const unsigned char *pixels = mmap(NULL, (size_t)end, PROT_READ, MAP_SHARED, fd, (off_t)map.offset);
    if (pixels == MAP_FAILED) return fail("readonly_mmap_visible_handle");
    unsigned char *row = malloc((size_t)fb.width * 3);
    if (!row) return fail("row_allocation");
    char header[80];
    int header_size = snprintf(header, sizeof(header), "P6\n%u %u\n255\n", fb.width, fb.height);
    if (header_size < 0 || (size_t)header_size >= sizeof(header) || output(header, (size_t)header_size)) return fail("output_header");
    for (uint32_t y = 0; y < fb.height; ++y) {
        const unsigned char *source = pixels + fb.offsets[0] + (size_t)y * fb.pitches[0];
        for (uint32_t x = 0; x < fb.width; ++x) {
            const unsigned char *p = source + (size_t)x * bpp;
            if (bpp == 2) {
                uint16_t value = (uint16_t)p[0] | (uint16_t)p[1] << 8;
                row[3*x] = (unsigned char)((value >> 11) * 255 / 31);
                row[3*x+1] = (unsigned char)(((value >> 5) & 63) * 255 / 63);
                row[3*x+2] = (unsigned char)((value & 31) * 255 / 31);
            } else {
                if (alpha && p[3] != 255) return fail("nonopaque_primary_pixel");
                row[3*x] = p[red]; row[3*x+1] = p[1]; row[3*x+2] = p[blue];
            }
        }
        if (output(row, (size_t)fb.width * 3)) return fail("output_visible_row");
    }
    struct drm_mode_crtc after = {.crtc_id = active.crtc_id};
    if (ioctl(fd, DRM_IOCTL_MODE_GETCRTC, &after) || after.fb_id != active.fb_id) return fail("visible_frame_changed_reject_output");
    fprintf(stderr, "VISIBLE_PRIMARY_CAPTURE width=%u height=%u fourcc=%08x\n", fb.width, fb.height, fb.pixel_format);
    free(row);
    munmap((void *)pixels, (size_t)end);
    struct drm_gem_close release = {.handle = fb.handles[0]};
    (void)ioctl(fd, DRM_IOCTL_GEM_CLOSE, &release);
    close(fd);
    return 0;
}
