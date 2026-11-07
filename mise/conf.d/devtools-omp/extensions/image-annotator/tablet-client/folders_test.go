// An import parent is provenance, not permission to associate a stock folder.
package main

import (
	"net/http"
	"testing"
)

func TestObservedParentDoesNotAssignFolderOwnership(t *testing.T) {
	c, _ := pairedFixture(t, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	folder := "33333333-3333-4333-8333-333333333333"
	binding := c.disk.Bindings[docA]
	binding.FolderUUID = folder
	c.disk.Bindings[docA] = binding
	folders := c.view()["folders"].([]map[string]string)
	for _, entry := range folders {
		if entry["folderUUID"] == folder || entry["folderUUID"] == "" {
			t.Fatal("observed document parent or stock root became folder ownership")
		}
	}
	if err := c.associateFolder("server-a", folder); err != nil {
		t.Fatal(err)
	}
	found := false
	for _, entry := range c.view()["folders"].([]map[string]string) {
		if entry["folderUUID"] == folder && entry["serverId"] == "server-a" {
			found = true
		}
	}
	if !found {
		t.Fatal("explicit folder ownership was not displayed")
	}
	if err := c.associateFolder("server-b", folder); err == nil {
		t.Fatal("another server took explicit folder ownership")
	}
}
