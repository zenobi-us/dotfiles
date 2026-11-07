# Source the Paper Pro SDK environment. Use XOVI generator commit 2b99649f5e4fd6288be7792a8570bd16418adb70.
CXXFLAGS += -fPIC -Wall -Wextra $(shell pkg-config --cflags Qt6Core Qt6Network)
LDLIBS += $(shell pkg-config --libs Qt6Core Qt6Network)

pi-ink-loopback.so: main.o xovi.o
	$(CXX) $(CXXFLAGS) -shared -o $@ $^ $(LDLIBS)

main.o: main.cpp xovi.h

xovi.cpp xovi.h &: pi-ink-loopback.xovi
	python3 $(XOVI_REPO)/util/xovigen.py -o xovi.cpp -H xovi.h $<
