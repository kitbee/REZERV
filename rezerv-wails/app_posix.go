//go:build !windows
package main

import "os/exec"

func hideConsole(cmd *exec.Cmd) {
	// On macOS/Linux, background processes run without spawning a terminal window.
}

func (a *App) setupTray() {
	// On macOS/Linux, we use native Wails SingleInstanceLock and HideWindowOnClose to hide and show window without cgo thread issues.
}
