class BoundedReadError(RuntimeError):
    pass


def file_stamp(info):
    return (info.st_dev, info.st_ino, info.st_uid, info.st_gid, stat.S_IFMT(info.st_mode), stat.S_IMODE(info.st_mode), info.st_size, info.st_mtime_ns, info.st_ctime_ns)


def read_owned_regular(path, cap, expected_identity=None):
    """Read at most cap+1 bytes through verified no-follow directory/file fds.

    Refuse nonregular/unowned files, replacement, growth, or a changed path.
    Error messages contain only fixed reasons, never file bytes or secret values.
    """
    path = Path(path)
    if not path.is_absolute() or ".." in path.parts or not 0 < cap <= 10485760:
        raise BoundedReadError("FIXED_PATH_OR_CAP_INVALID")
    directories = []
    links = []
    descriptor = None
    directory_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC
    try:
        parent_fd = os.open("/", directory_flags)
        directories.append(parent_fd)
        for component in path.parts[1:-1]:
            child_fd = os.open(component, directory_flags, dir_fd=parent_fd)
            directories.append(child_fd)
            info = os.fstat(child_fd)
            if not stat.S_ISDIR(info.st_mode) or info.st_uid not in (0, os.getuid()):
                raise BoundedReadError("PARENT_DIRECTORY_OWNER_REFUSED")
            links.append((parent_fd, component, child_fd))
            parent_fd = child_fd
        before_path = os.stat(path.name, dir_fd=parent_fd, follow_symlinks=False)
        if not stat.S_ISREG(before_path.st_mode) or before_path.st_uid != os.getuid():
            raise BoundedReadError("REGULAR_OWNED_FILE_REQUIRED")
        if expected_identity is not None and (before_path.st_dev, before_path.st_ino) != expected_identity:
            raise BoundedReadError("EXPECTED_FILE_IDENTITY_CHANGED")
        # Nonblocking open also prevents a replaced FIFO from blocking before fstat.
        descriptor = os.open(path.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC | os.O_NONBLOCK, dir_fd=parent_fd)
        before_fd = os.fstat(descriptor)
        if not stat.S_ISREG(before_fd.st_mode) or before_fd.st_uid != os.getuid() or file_stamp(before_fd) != file_stamp(before_path):
            raise BoundedReadError("OPENED_FILE_IDENTITY_OR_OWNER_CHANGED")
        remaining = cap + 1
        chunks = []
        while remaining:
            chunk = os.read(descriptor, min(65536, remaining))
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        if remaining == 0:
            raise BoundedReadError("ACTUAL_READ_EXCEEDS_BYTE_CAP")
        after_fd = os.fstat(descriptor)
        after_path = os.stat(path.name, dir_fd=parent_fd, follow_symlinks=False)
        if file_stamp(after_fd) != file_stamp(before_fd) or file_stamp(after_path) != file_stamp(after_fd):
            raise BoundedReadError("FILE_CHANGED_DURING_BOUNDED_READ")
        for ancestor_fd, name, opened_fd in links:
            current = os.stat(name, dir_fd=ancestor_fd, follow_symlinks=False)
            opened = os.fstat(opened_fd)
            if not stat.S_ISDIR(current.st_mode) or current.st_uid not in (0, os.getuid()) or (current.st_dev, current.st_ino) != (opened.st_dev, opened.st_ino):
                raise BoundedReadError("PARENT_PATH_CHANGED_DURING_READ")
        return b"".join(chunks)
    except OSError:
        raise BoundedReadError("NOFOLLOW_OR_IDENTITY_READ_REFUSED") from None
    finally:
        if descriptor is not None:
            os.close(descriptor)
        for directory_fd in reversed(directories):
            os.close(directory_fd)


