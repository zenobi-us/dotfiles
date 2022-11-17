
case $(uname) in
  'Darwin')
	export ANDROID_HOME=$HOME/Library/Android/sdk
	;;
  'Linux')
  	export ANDROID_HOME=$HOME/.local/share/android/sdk
    ;;
esac

export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
