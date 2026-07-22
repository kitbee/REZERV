//go:build windows
package main

import (
	_ "embed"
	"os/exec"
	"syscall"
	"fyne.io/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed build/windows/icon.ico
var appIcon []byte

func hideConsole(cmd *exec.Cmd) {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	cmd.SysProcAttr.CreationFlags = 0x08000000 // CREATE_NO_WINDOW
}

func (a *App) setupTray() {
	go func() {
		systray.Run(a.onTrayReady, a.onTrayExit)
	}()
}

func (a *App) onTrayReady() {
	systray.SetIcon(appIcon)
	systray.SetTitle("REZERV")
	systray.SetTooltip("REZERV - Backup Tool")

	mShow := systray.AddMenuItem("Открыть REZERV", "Показать окно приложения")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Выход", "Закрыть приложение")

	go func() {
		for {
			select {
			case <-mShow.ClickedCh:
				runtime.WindowShow(a.ctx)
				runtime.WindowUnminimise(a.ctx)
			case <-mQuit.ClickedCh:
				systray.Quit()
				runtime.Quit(a.ctx)
			}
		}
	}()
}

func (a *App) onTrayExit() {
	// Cleanup if needed
}
