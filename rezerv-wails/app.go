package main

import (
	"archive/zip"
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.setupTray()
}

// Exclusions structures
type Exclusions struct {
	Dirs      []string        `json:"dirs"`
	Files     []string        `json:"files"`
	Retention RetentionConfig `json:"retention"`
	Settings  SettingsConfig  `json:"settings"`
}

type RetentionConfig struct {
	Enabled        bool `json:"enabled"`
	MaxBackupCount int  `json:"maxBackupCount"`
}

type SettingsConfig struct {
	Bwlimit     string `json:"bwlimit"`
	Transfers   int    `json:"transfers"`
	ProjectPath string `json:"projectPath"`
}

// ProjectConfig structure returned to frontend
type ProjectConfig struct {
	ProjectRoot    string `json:"projectRoot"`
	ProjectName    string `json:"projectName"`
	ParentFolder   string `json:"parentFolder"`
	RcloneExe      string `json:"rcloneExe"`
	ExclusionsFile string `json:"exclusionsFile"`
}

// BackupFile represents a ZIP archive found in cloud
type BackupFile struct {
	Name string    `json:"name"`
	Size int64     `json:"size"`
	Date time.Time `json:"date"`
}

// RcloneFileObj for parsing lsjson output
type RcloneFileObj struct {
	Path    string `json:"Path"`
	Name    string `json:"Name"`
	Size    int64  `json:"Size"`
	IsDir   bool   `json:"IsDir"`
	ModTime string `json:"ModTime"`
}

// DetectConfig returns detected paths and names
func (a *App) DetectConfig() *ProjectConfig {
	var baseDir string
	exePath, err := os.Executable()
	if err == nil {
		baseDir = filepath.Dir(exePath)
	} else {
		baseDir, _ = os.Getwd()
	}

	baseDir = filepath.Clean(baseDir)

	// Clean path up to project root if nested
	projectRoot := baseDir
	for {
		baseName := filepath.Base(projectRoot)
		if baseName == "bin" || baseName == "build" || baseName == "rezerv-wails" || baseName == "win_rezerv" || baseName == "rezerv_win" || baseName == "app" {
			projectRoot = filepath.Dir(projectRoot)
		} else {
			break
		}
	}

	projectName := filepath.Base(projectRoot)
	parentFolder := filepath.Dir(projectRoot)

	// Search for rclone.exe
	rcloneExe := "rclone.exe"
	searchDirs := []string{baseDir, filepath.Dir(baseDir), filepath.Dir(filepath.Dir(baseDir)), projectRoot}
	for _, d := range searchDirs {
		p := filepath.Join(d, "rclone.exe")
		if _, err := os.Stat(p); err == nil {
			rcloneExe = p
			break
		}
	}

	// Exclusions file location
	exclusionsFile := filepath.Join(filepath.Dir(rcloneExe), "exclusions.json")
	if _, err := os.Stat(exclusionsFile); err != nil {
		exclusionsFile = filepath.Join(projectRoot, "exclusions.json")
	}

	// Read custom project path if configured in exclusions.json
	type tempSettings struct {
		Settings struct {
			ProjectPath string `json:"projectPath"`
		} `json:"settings"`
	}
	if data, err := os.ReadFile(exclusionsFile); err == nil {
		var ts tempSettings
		if err := json.Unmarshal(data, &ts); err == nil && ts.Settings.ProjectPath != "" {
			if info, err := os.Stat(ts.Settings.ProjectPath); err == nil && info.IsDir() {
				projectRoot = filepath.Clean(ts.Settings.ProjectPath)
				projectName = filepath.Base(projectRoot)
				parentFolder = filepath.Dir(projectRoot)
			}
		}
	}

	return &ProjectConfig{
		ProjectRoot:    projectRoot,
		ProjectName:    projectName,
		ParentFolder:   parentFolder,
		RcloneExe:      rcloneExe,
		ExclusionsFile: exclusionsFile,
	}
}

// Helper: load config arguments for rclone (e.g. local config file)
func (a *App) getRcloneArgs(cfg *ProjectConfig) []string {
	scriptDir := filepath.Dir(cfg.RcloneExe)
	localConf := filepath.Join(scriptDir, "rclone.conf")
	args := []string{"--config", localConf, "--retries", "5", "--low-level-retries", "10", "--drive-chunk-size", "32M"}

	// Try loading settings from exclusions.json
	if data, err := os.ReadFile(cfg.ExclusionsFile); err == nil {
		var exc Exclusions
		if err := json.Unmarshal(data, &exc); err == nil {
			if exc.Settings.Bwlimit != "" && exc.Settings.Bwlimit != "off" {
				args = append(args, "--bwlimit", exc.Settings.Bwlimit)
			}
			if exc.Settings.Transfers > 0 {
				args = append(args, "--transfers", fmt.Sprintf("%d", exc.Settings.Transfers))
			}
		}
	}
	return args
}

// LoadExclusions loads directories and files to exclude
func (a *App) LoadExclusions() (*Exclusions, error) {
	cfg := a.DetectConfig()
	data, err := os.ReadFile(cfg.ExclusionsFile)
	if err != nil {
		return &Exclusions{Dirs: []string{}, Files: []string{}, Retention: RetentionConfig{Enabled: false, MaxBackupCount: 10}}, nil
	}

	var exc Exclusions
	if err := json.Unmarshal(data, &exc); err != nil {
		return nil, err
	}
	if exc.Retention.MaxBackupCount <= 0 {
		exc.Retention.MaxBackupCount = 10
	}
	if exc.Settings.Transfers <= 0 {
		exc.Settings.Transfers = 4
	}
	if exc.Settings.Bwlimit == "" {
		exc.Settings.Bwlimit = "off"
	}
	return &exc, nil
}

// SaveExclusions saves directories and files to exclude
func (a *App) SaveExclusions(exc Exclusions) error {
	cfg := a.DetectConfig()
	data, err := json.MarshalIndent(exc, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(cfg.ExclusionsFile, data, 0644)
}

func (a *App) emitLog(msg string, logType string) {
	runtime.EventsEmit(a.ctx, "log", map[string]string{
		"message": msg,
		"type":    logType,
		"time":    time.Now().Format("15:04:05"),
	})
}

// StartBackup begins the backup process
func (a *App) StartBackup(localOnly bool, compression string) {
	go func() {
		cfg := a.DetectConfig()
		exc, err := a.LoadExclusions()
		if err != nil {
			a.emitLog(fmt.Sprintf("Failed to load exclusions: %s", err), "Error")
			runtime.EventsEmit(a.ctx, "status-text", "Error loading exclusions")
			runtime.EventsEmit(a.ctx, "progress", 100)
			return
		}

		runtime.EventsEmit(a.ctx, "progress", 5)
		runtime.EventsEmit(a.ctx, "status-text", "Step 1/4 Copying files...")
		runtime.EventsEmit(a.ctx, "card-line1", fmt.Sprintf("Source: %s", cfg.ProjectRoot))
		a.emitLog("Copying files with Robocopy...", "Accent")

		timestamp := time.Now().Format("020106_1504")
		backupBaseFolder := filepath.Join(cfg.ParentFolder, "rezerv_"+cfg.ProjectName)
		backupFolder := filepath.Join(backupBaseFolder, timestamp)

		os.MkdirAll(backupBaseFolder, 0755)
		os.MkdirAll(backupFolder, 0755)

		// Run robocopy to copy files to temp folder
		err = a.runRobocopy(cfg.ProjectRoot, backupFolder, exc.Dirs, exc.Files)
		if err != nil {
			a.emitLog(fmt.Sprintf("Robocopy failed: %s", err), "Error")
			runtime.EventsEmit(a.ctx, "status-text", "Robocopy failed")
			runtime.EventsEmit(a.ctx, "progress", 100)
			return
		}

		a.emitLog("Files copied.", "Success")
		runtime.EventsEmit(a.ctx, "progress", 25)

		// Step 2: Compress
		zipFileName := fmt.Sprintf("%s_%s.zip", cfg.ProjectName, timestamp)
		zipFilePath := filepath.Join(backupBaseFolder, zipFileName)
		runtime.EventsEmit(a.ctx, "status-text", fmt.Sprintf("Step 2/4 Compressing (%s)...", compression))
		runtime.EventsEmit(a.ctx, "card-line1", fmt.Sprintf("Creating: %s", zipFileName))
		a.emitLog(fmt.Sprintf("Compressing... (%s mode)", compression), "Accent")

		swStart := time.Now()
		if _, err := os.Stat(zipFilePath); err == nil {
			os.Remove(zipFilePath)
		}

		err = a.zipFolder(backupFolder, zipFilePath, compression)
		swElapsed := time.Since(swStart)
		os.RemoveAll(backupFolder)

		if err != nil {
			a.emitLog(fmt.Sprintf("Compression failed: %s", err), "Error")
			runtime.EventsEmit(a.ctx, "status-text", "Compression failed")
			runtime.EventsEmit(a.ctx, "progress", 100)
			return
		}

		zipInfo, err := os.Stat(zipFilePath)
		var sizeMB float64
		if err == nil {
			sizeMB = float64(zipInfo.Size()) / (1024 * 1024)
		}
		sizeStr := fmt.Sprintf("%.2f MB", sizeMB)

		a.emitLog(fmt.Sprintf("Compressed in %.1fs | %s | Mode: %s", swElapsed.Seconds(), sizeStr, compression), "Success")
		runtime.EventsEmit(a.ctx, "card-line1", fmt.Sprintf("ZIP: %s", zipFileName))
		runtime.EventsEmit(a.ctx, "card-line2", fmt.Sprintf("Size: %s | Mode: %s", sizeStr, compression))
		runtime.EventsEmit(a.ctx, "progress", 50)

		// Step 3: Upload to Cloud
		if !localOnly {
			// Estimate upload time at 10 Mbps
			estSeconds := int(sizeMB / 1.25)
			estMinutes := estSeconds / 60
			estSecRem := estSeconds % 60
			estTime := fmt.Sprintf("%ds", estSeconds)
			if estMinutes > 0 {
				estTime = fmt.Sprintf("%dm %ds", estMinutes, estSecRem)
			}
			runtime.EventsEmit(a.ctx, "card-line2", fmt.Sprintf("Size: %s | Est. upload ~%s (@ 10 Mbps)", sizeStr, estTime))
			runtime.EventsEmit(a.ctx, "status-text", "Step 3/4 Uploading to Google Drive...")
			a.emitLog("Uploading to Google Drive...", "Accent")
			runtime.EventsEmit(a.ctx, "progress", 60)

			remoteDest := fmt.Sprintf("gdrive_new:backups/%s", cfg.ProjectName)
			rcloneArgs := append(a.getRcloneArgs(cfg), "copy", zipFilePath, remoteDest, "--stats-one-line", "--stats", "1s", "-v")

			cmd := exec.Command(cfg.RcloneExe, rcloneArgs...)
			hideConsole(cmd)
			stdout, err := cmd.StdoutPipe()
			if err != nil {
				a.emitLog(fmt.Sprintf("Failed to initialize upload stream: %s", err), "Error")
				runtime.EventsEmit(a.ctx, "status-text", "Upload stream failed")
				runtime.EventsEmit(a.ctx, "progress", 100)
				return
			}
			cmd.Stderr = cmd.Stdout

			if err := cmd.Start(); err != nil {
				a.emitLog(fmt.Sprintf("Failed to start rclone: %s", err), "Error")
				runtime.EventsEmit(a.ctx, "status-text", "Failed to start rclone")
				runtime.EventsEmit(a.ctx, "progress", 100)
				return
			}

			scanner := bufio.NewScanner(stdout)
			for scanner.Scan() {
				line := strings.TrimSpace(scanner.Text())
				if line == "" {
					continue
				}
				if strings.Contains(line, "ETA") || strings.Contains(line, "%") {
					runtime.EventsEmit(a.ctx, "status-text", line)
					runtime.EventsEmit(a.ctx, "card-line2", line)
				} else {
					a.emitLog(line, "Info")
				}
			}

			cmd.Wait()
			a.emitLog("Upload complete.", "Success")
		} else {
			a.emitLog("Cloud upload skipped.", "Dim")
		}

		// Run auto-cleaning if retention policy is enabled
		if err := a.CleanOldBackups(localOnly); err != nil {
			a.emitLog(fmt.Sprintf("Retention cleaning failed: %s", err), "Error")
		}

		runtime.EventsEmit(a.ctx, "progress", 100)
		runtime.EventsEmit(a.ctx, "status-text", "Done!")
		runtime.EventsEmit(a.ctx, "card-line1", fmt.Sprintf("Saved: %s", zipFilePath))
		a.emitLog(fmt.Sprintf("Backup complete: %s", zipFilePath), "Success")
	}()
}

// GetCloudProjects returns all backup folders in Google Drive
func (a *App) GetCloudProjects() ([]string, error) {
	cfg := a.DetectConfig()
	args := append(a.getRcloneArgs(cfg), "lsf", "gdrive_new:backups", "--dirs-only")
	cmd := exec.Command(cfg.RcloneExe, args...)
	hideConsole(cmd)
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var projects []string
	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		line = strings.TrimSuffix(line, "/")
		if line != "" {
			projects = append(projects, line)
		}
	}
	return projects, nil
}

// GetCloudBackups returns the backups for a specific project
func (a *App) GetCloudBackups(projectName string) ([]BackupFile, error) {
	cfg := a.DetectConfig()
	remotePath := fmt.Sprintf("gdrive_new:backups/%s", projectName)
	args := append(a.getRcloneArgs(cfg), "lsjson", remotePath, "--files-only")
	cmd := exec.Command(cfg.RcloneExe, args...)
	hideConsole(cmd)
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var files []RcloneFileObj
	if err := json.Unmarshal(output, &files); err != nil {
		return nil, err
	}

	var backups []BackupFile
	for _, f := range files {
		if strings.HasSuffix(f.Name, ".zip") {
			t, _ := time.Parse(time.RFC3339, f.ModTime)
			backups = append(backups, BackupFile{
				Name: f.Name,
				Size: f.Size,
				Date: t.Local(),
			})
		}
	}

	// Sort backups by date descending
	for i := 0; i < len(backups); i++ {
		for j := i + 1; j < len(backups); j++ {
			if backups[i].Date.Before(backups[j].Date) {
				backups[i], backups[j] = backups[j], backups[i]
			}
		}
	}

	return backups, nil
}

// StartRestore executes download and unzip restore
func (a *App) StartRestore(projectName string, backupFileName string, fullRestore bool) {
	go func() {
		cfg := a.DetectConfig()
		runtime.EventsEmit(a.ctx, "progress", 10)
		runtime.EventsEmit(a.ctx, "status-text", "Downloading from Google Drive...")
		runtime.EventsEmit(a.ctx, "card-line1", fmt.Sprintf("Downloading: %s", backupFileName))
		a.emitLog("Downloading backup archive...", "Accent")

		backupBaseFolder := filepath.Join(cfg.ParentFolder, "rezerv_"+cfg.ProjectName)
		var localZipPath string
		if fullRestore {
			os.MkdirAll(backupBaseFolder, 0755)
			localZipPath = filepath.Join(backupBaseFolder, backupFileName)
		} else {
			localZipPath = filepath.Join(cfg.ProjectRoot, backupFileName)
		}

		remoteFilePath := fmt.Sprintf("gdrive_new:backups/%s/%s", projectName, backupFileName)
		rcloneArgs := append(a.getRcloneArgs(cfg), "copyto", remoteFilePath, localZipPath, "--stats-one-line", "--stats", "1s", "-v")

		cmd := exec.Command(cfg.RcloneExe, rcloneArgs...)
		hideConsole(cmd)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			a.emitLog(fmt.Sprintf("Failed to initialize download: %s", err), "Error")
			runtime.EventsEmit(a.ctx, "status-text", "Download stream failed")
			runtime.EventsEmit(a.ctx, "progress", 100)
			return
		}
		cmd.Stderr = cmd.Stdout

		if err := cmd.Start(); err != nil {
			a.emitLog(fmt.Sprintf("Failed to start rclone: %s", err), "Error")
			runtime.EventsEmit(a.ctx, "status-text", "Failed to start rclone")
			runtime.EventsEmit(a.ctx, "progress", 100)
			return
		}

		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" {
				continue
			}
			if strings.Contains(line, "ETA") || strings.Contains(line, "%") {
				runtime.EventsEmit(a.ctx, "status-text", line)
				runtime.EventsEmit(a.ctx, "card-line2", line)
			} else {
				a.emitLog(line, "Info")
			}
		}

		cmd.Wait()
		a.emitLog("Download complete.", "Success")
		runtime.EventsEmit(a.ctx, "progress", 60)

		if !fullRestore {
			runtime.EventsEmit(a.ctx, "progress", 100)
			runtime.EventsEmit(a.ctx, "status-text", "Done!")
			runtime.EventsEmit(a.ctx, "card-line1", fmt.Sprintf("Saved ZIP to: %s", localZipPath))
			a.emitLog(fmt.Sprintf("ZIP backup downloaded only: %s", localZipPath), "Success")
			// Open explorer to directory
			exec.Command("explorer", "/select,", localZipPath).Start()
			return
		}

		// Full Restore: Extract and copy
		runtime.EventsEmit(a.ctx, "status-text", "Extracting...")
		runtime.EventsEmit(a.ctx, "card-line1", "Extracting ZIP archive...")
		a.emitLog("Extracting archive...", "Accent")
		runtime.EventsEmit(a.ctx, "progress", 75)

		tempExtract := filepath.Join(backupBaseFolder, "temp_restore")
		os.RemoveAll(tempExtract)
		os.MkdirAll(tempExtract, 0755)

		err = a.unzipFolder(localZipPath, tempExtract)
		if err != nil {
			a.emitLog(fmt.Sprintf("Extraction failed: %s", err), "Error")
			runtime.EventsEmit(a.ctx, "status-text", "Extraction failed")
			runtime.EventsEmit(a.ctx, "progress", 100)
			return
		}

		a.emitLog("Extracted. Copying files to project root...", "Accent")
		runtime.EventsEmit(a.ctx, "status-text", "Restoring files...")
		runtime.EventsEmit(a.ctx, "progress", 85)

		// Find the subdirectory inside tempExtract (it will contain the project files)
		subdirs, err := os.ReadDir(tempExtract)
		if err != nil || len(subdirs) == 0 {
			a.emitLog("Failed to locate restored files subdirectory", "Error")
			runtime.EventsEmit(a.ctx, "status-text", "Restore failed")
			runtime.EventsEmit(a.ctx, "progress", 100)
			return
		}

		restoreSource := filepath.Join(tempExtract, subdirs[0].Name())
		err = a.runRobocopy(restoreSource, cfg.ProjectRoot, []string{"node_modules", ".git", "rclone"}, []string{})
		os.RemoveAll(tempExtract)

		if err != nil {
			a.emitLog(fmt.Sprintf("Robocopy restore failed: %s", err), "Error")
			runtime.EventsEmit(a.ctx, "status-text", "Restore copy failed")
			runtime.EventsEmit(a.ctx, "progress", 100)
			return
		}

		runtime.EventsEmit(a.ctx, "progress", 100)
		runtime.EventsEmit(a.ctx, "status-text", "Restore complete!")
		runtime.EventsEmit(a.ctx, "card-line1", fmt.Sprintf("Restored to: %s", cfg.ProjectRoot))
		a.emitLog("Restore complete successfully!", "Success")
	}()
}

// runRobocopy executes robocopy CLI and ignores successful return codes < 8
func (a *App) runRobocopy(src, dst string, excludeDirs, excludeFiles []string) error {
	args := []string{src, dst, "/E", "/NFL", "/NDL", "/NJH", "/NJS"}
	if len(excludeDirs) > 0 {
		args = append(args, "/XD")
		args = append(args, excludeDirs...)
	}
	if len(excludeFiles) > 0 {
		args = append(args, "/XF")
		args = append(args, excludeFiles...)
	}

	cmd := exec.Command("robocopy", args...)
	hideConsole(cmd)
	err := cmd.Run()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			code := exitError.ExitCode()
			if code < 8 {
				return nil
			}
		}
		return err
	}
	return nil
}

// zipFolder creates a zip archive of sourceDir
func (a *App) zipFolder(sourceDir, zipFilePath string, level string) error {
	zipFile, err := os.Create(zipFilePath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	archive := zip.NewWriter(zipFile)
	defer archive.Close()

	err = filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}
		header.Name = filepath.ToSlash(relPath)

		if level == "None" {
			header.Method = zip.Store
		} else {
			header.Method = zip.Deflate
		}

		writer, err := archive.CreateHeader(header)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		_, err = io.Copy(writer, file)
		return err
	})

	return err
}

// unzipFolder extracts a zip archive to destDir
func (a *App) unzipFolder(zipFilePath, destDir string) error {
	r, err := zip.OpenReader(zipFilePath)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		fpath := filepath.Join(destDir, f.Name)

		if f.FileInfo().IsDir() {
			os.MkdirAll(fpath, os.ModePerm)
			continue
		}

		if err = os.MkdirAll(filepath.Dir(fpath), os.ModePerm); err != nil {
			return err
		}

		outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return err
		}

		rc, err := f.Open()
		if err != nil {
			outFile.Close()
			return err
		}

		_, err = io.Copy(outFile, rc)

		outFile.Close()
		rc.Close()

		if err != nil {
			return err
		}
	}
	return nil
}

// IsCloudConfigured checks if gdrive_new is configured
func (a *App) IsCloudConfigured() bool {
	cfg := a.DetectConfig()
	if _, err := os.Stat(cfg.RcloneExe); os.IsNotExist(err) {
		return false
	}
	args := append(a.getRcloneArgs(cfg), "listremotes")
	cmd := exec.Command(cfg.RcloneExe, args...)
	hideConsole(cmd)
	output, err := cmd.Output()
	if err != nil {
		return false
	}

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "gdrive_new:" {
			return true
		}
	}
	return false
}

// ConfigureCloud runs the non-interactive browser authorization
func (a *App) ConfigureCloud() error {
	cfg := a.DetectConfig()
	if _, err := os.Stat(cfg.RcloneExe); os.IsNotExist(err) {
		return fmt.Errorf("rclone.exe not found")
	}

	args := append(a.getRcloneArgs(cfg), "config", "create", "gdrive_new", "drive")
	cmd := exec.Command(cfg.RcloneExe, args...)
	hideConsole(cmd)
	err := cmd.Start()
	if err != nil {
		return err
	}

	a.emitLog("Opening web browser for Google Drive authorization...", "Accent")
	a.emitLog("Please choose your Google Account, allow access, and return to this app.", "Warning")

	go func() {
		err := cmd.Wait()
		if err != nil {
			a.emitLog(fmt.Sprintf("Authorization failed: %s", err), "Error")
			runtime.EventsEmit(a.ctx, "cloud-auth-status", false)
		} else {
			a.emitLog("Google Drive configured successfully as gdrive_new!", "Success")
			runtime.EventsEmit(a.ctx, "cloud-auth-status", true)
		}
	}()

	return nil
}

// CloudQuota structure returned to frontend
type CloudQuota struct {
	Total   int64 `json:"total"`
	Used    int64 `json:"used"`
	Trashed int64 `json:"trashed"`
	Other   int64 `json:"other"`
	Free    int64 `json:"free"`
}

// GetCloudQuota returns Google Drive cloud storage information
func (a *App) GetCloudQuota() (*CloudQuota, error) {
	cfg := a.DetectConfig()
	if _, err := os.Stat(cfg.RcloneExe); os.IsNotExist(err) {
		return nil, fmt.Errorf("rclone.exe not found")
	}

	args := append(a.getRcloneArgs(cfg), "about", "gdrive_new:", "--json")
	cmd := exec.Command(cfg.RcloneExe, args...)
	hideConsole(cmd)
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var quota CloudQuota
	if err := json.Unmarshal(output, &quota); err != nil {
		return nil, err
	}
	return &quota, nil
}

// CleanOldBackups deletes oldest backups exceeding the retention limit
func (a *App) CleanOldBackups(localOnly bool) error {
	cfg := a.DetectConfig()
	exc, err := a.LoadExclusions()
	if err != nil {
		return err
	}

	if !exc.Retention.Enabled {
		return nil
	}

	limit := exc.Retention.MaxBackupCount
	if limit <= 0 {
		limit = 10
	}

	if localOnly {
		// Local retention
		backupBaseFolder := filepath.Join(cfg.ParentFolder, "rezerv_"+cfg.ProjectName)
		files, err := os.ReadDir(backupBaseFolder)
		if err != nil {
			return err
		}

		var zipFiles []os.FileInfo
		for _, f := range files {
			if !f.IsDir() && strings.HasSuffix(strings.ToLower(f.Name()), ".zip") {
				info, err := f.Info()
				if err == nil {
					zipFiles = append(zipFiles, info)
				}
			}
		}

		// Sort by ModTime (oldest first)
		for i := 0; i < len(zipFiles); i++ {
			for j := i + 1; j < len(zipFiles); j++ {
				if zipFiles[i].ModTime().After(zipFiles[j].ModTime()) {
					zipFiles[i], zipFiles[j] = zipFiles[j], zipFiles[i]
				}
			}
		}

		if len(zipFiles) > limit {
			toDelete := len(zipFiles) - limit
			a.emitLog(fmt.Sprintf("Retention active: deleting %d oldest local backup(s)", toDelete), "Warning")
			for i := 0; i < toDelete; i++ {
				delPath := filepath.Join(backupBaseFolder, zipFiles[i].Name())
				if err := os.Remove(delPath); err != nil {
					a.emitLog(fmt.Sprintf("Failed to delete local backup %s: %s", zipFiles[i].Name(), err), "Error")
				} else {
					a.emitLog(fmt.Sprintf("Deleted old local backup: %s", zipFiles[i].Name()), "Info")
				}
			}
		}
	} else {
		// Cloud retention
		backups, err := a.GetCloudBackups(cfg.ProjectName)
		if err != nil {
			return err
		}

		// GetCloudBackups returns backups sorted by date DESCENDING (newest first).
		// So we keep the first N (limit) items, and delete the rest (oldest).
		if len(backups) > limit {
			toDelete := len(backups) - limit
			a.emitLog(fmt.Sprintf("Retention active: deleting %d oldest cloud backup(s)", toDelete), "Warning")
			for i := limit; i < len(backups); i++ {
				fileName := backups[i].Name
				remoteFilePath := fmt.Sprintf("gdrive_new:backups/%s/%s", cfg.ProjectName, fileName)
				a.emitLog(fmt.Sprintf("Deleting old cloud backup: backups/%s/%s", cfg.ProjectName, fileName), "Info")

				args := append(a.getRcloneArgs(cfg), "deletefile", remoteFilePath)
				cmd := exec.Command(cfg.RcloneExe, args...)
				hideConsole(cmd)
				if err := cmd.Run(); err != nil {
					a.emitLog(fmt.Sprintf("Failed to delete cloud backup %s: %s", fileName, err), "Error")
				}
			}
		}
	}
	return nil
}

// SetProjectPath sets a custom project directory and updates configuration
func (a *App) SetProjectPath(path string) (*ProjectConfig, error) {
	info, err := os.Stat(path)
	if err != nil || !info.IsDir() {
		return nil, fmt.Errorf("invalid project path or not a directory")
	}

	exc, err := a.LoadExclusions()
	if err != nil {
		return nil, err
	}

	exc.Settings.ProjectPath = filepath.Clean(path)
	if err := a.SaveExclusions(*exc); err != nil {
		return nil, err
	}

	return a.DetectConfig(), nil
}
