#!/bin/sh

#
# Environment Information
#
UNKNOWN_PROCESSOR_LABEL=unknown_processor
UNKNOWN_PLATFORM_LABEL=unknown_platform
UNKNOWN_OS_LABEL=unknown_os
UNKNOWN_OS_VERSION=unknown_version

#
# Determine System Processor
#
if uname -p >/dev/null 2>/dev/null; then
    PROCESSOR=`uname -p`
else
    PROCESSOR=$UNKNOWN_PROCESSOR_LABEL
fi
if [ "x$PROCESSOR" != x$UNKNOWN_PROCESSOR_LABEL ]; then
    : do nothing
elif [ -x /bin/arch ]; then
    PROCESSOR=`/bin/arch`
elif uname >/dev/null 2>/dev/null; then
    case `uname` in
        AIX) PROCESSOR=rs6000-aix ;;
        FreeBSD)
            PLATFORM=bsd
            if uname -m >/dev/null 2>/dev/null; then
                PROCESSOR=`uname -m`
            else
                PROCESSOR=$UNKNOWN_PROCESSOR_LABEL
            fi
            ;;
        Linux)
            PLATFORM=linux;
            if uname -m >/dev/null 2>/dev/null; then
                case `uname -m` in
                i586|i486|i386)
                    PROCESSOR=x86 ;;
                *)
                    PROCESSOR=`uname -m` ;;
                esac
            else
                PROCESSOR=$UNKNOWN_PROCESSOR_LABEL
            fi
            ;;
        *) PROCESSOR=$UNKNOWN_PROCESSOR_LABEL ;;
    esac
    exit 0
fi
case $PROCESSOR in
    sun4)
        PROCESSOR=sparc ;;
    powerpc)
        PROCESSOR=ppc ;;
    i386|i486|i586|i686|Pentium*|AMD?Athlon*)
        PROCESSOR=x86 ;;
    x86_64|amd64)
        PROCESSOR=x64 ;;
esac

#
# Determine OS Platform
#
case $PROCESSOR in
    sparc)
        case `uname -r` in
            4.*)          PLATFORM=sunos ;;
            [5-9].*)      PLATFORM=solaris ;;
            *)            PLATFORM=$UNKNOWN_PLATFORM_LABEL ;;
        esac ;;
    ppc)
        case `uname` in
            Darwin)       PLATFORM=darwin ;;
            *)            PLATFORM=$UNKNOWN_PLATFORM_LABEL ;;
        esac ;;
    mips)
        case `uname -s` in
            IRIX)
                case `uname -r` in
                    5.*)  PLATFORM=irix5 ;;
                    *)    PLATFORM=$UNKNOWN_PLATFORM_LABEL ;;
                esac ;;
            Linux)        PLATFORM=linux ;;
            *)            PLATFORM=$UNKNOWN_PLATFORM_LABEL ;;
        esac ;;
    x86|x64)
        case `uname` in
            FreeBSD)      PLATFORM=bsd ;;
            Linux)        PLATFORM=linux ;;
            Darwin)       PLATFORM=darwin ;;
            *)            PLATFORM=unknown ;;
        esac ;;
    alpha)
        case `uname` in
            OSF1)         PLATFORM=osf1 ;;
            Linux|linux)  PLATFORM=linux ;;
            *)            PLATFORM=unknown ;;
            esac ;;
    *)                    PLATFORM=$UNKNOWN_PLATFORM_LABEL ;;
esac

export OSINFO_ARCH=$(tolowercase $PROCESSOR)
export OSINFO_PLATFORM=$(tolowercase $PLATFORM)

#
# Determine OS Name
#
case $PLATFORM in
    linux)
        if [ -f /etc/os-release ]; then
            # freedesktop.org and systemd
            . /etc/os-release
            OS_NAME=$NAME
            OS_VERSION=$VERSION_ID
        elif type lsb_release >/dev/null 2>&1; then
            # linuxbase.org
            OS_NAME=$(lsb_release -si)
            OS_VERSION=$(lsb_release -sr)
        elif [ -f /etc/lsb-release ]; then
            # For some versions of Debian/Ubuntu without lsb_release command
            . /etc/lsb-release
            OS_NAME=$DISTRIB_ID
            OS_VERSION=$DISTRIB_RELEASE
        elif [ -f /etc/debian_version ]; then
            # Older Debian/Ubuntu/etc.
            OS_NAME=Debian
            OS_VERSION=$(cat /etc/debian_version)
        elif [ -f /etc/SuSe-release ]; then
            # Older SuSE/etc.
            ...
        elif [ -f /etc/redhat-release ]; then
            # Older Red Hat, CentOS, etc.
            ...
        else
            # Fall back to uname, e.g. "Linux <version>", also works for BSD, etc.
            OS_NAME=$(uname -s)
            OS_VERSION=$(uname -r)
        fi
    ;;
    *)
        OS_NAME=$UNKNOWN_OS_LABEL
        OS_VERSION=$UNKNOWN_OS_VERSION
    ;;
esac

export OSINFO_NAME=$(tolowercase $OS_NAME)
export OSINFO_VERSION=$(tolowercase $OS_VERSION)
