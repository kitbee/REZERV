import './style.css';
import './app.css';

// Import Wails bindings
import {
    DetectConfig,
    LoadExclusions,
    SaveExclusions,
    StartBackup,
    GetCloudProjects,
    GetCloudBackups,
    StartRestore,
    IsCloudConfigured,
    ConfigureCloud,
    GetCloudQuota,
    SetProjectPath
} from '../wailsjs/go/main/App';

// Translation dictionary
const translations = {
    ru: {
        "nav-backup-cloud": "Резерв в облако",
        "nav-backup-local": "Локальный бэкап",
        "nav-restore": "Восстановление",
        "nav-exclusions": "Исключения",
        "nav-help": "Помощь",
        "badge-label": "Активный проект",
        "path-label": "Путь к проекту:",
        "theme-text-light": "СВЕТЛАЯ",
        "theme-text-dark": "ТЕМНАЯ",
        "backup-title-cloud": "Бэкап в облако",
        "backup-subtitle-cloud": "Создать сжатый ZIP-архив и загрузить его в Google Drive",
        "backup-title-local": "Локальный бэкап",
        "backup-subtitle-local": "Создать сжатый ZIP-архив локально (без выгрузки)",
        "label-compression": "Сжатие",
        "btn-start-backup-cloud": "НАЧАТЬ ЗАГРУЗКУ",
        "btn-start-backup-local": "НАЧАТЬ ЛОКАЛЬНО",
        "status-ready": "Готов к работе",
        "status-ready-desc": "Настройте параметры и нажмите Старт",
        "status-badge-idle": "Ожидание",
        "status-badge-working": "В процессе",
        "status-badge-success": "Успешно",
        "status-badge-error": "Ошибка",
        "progress-waiting": "Ожидание запуска...",
        "console-title": "Логи выполнения",
        "btn-clear-logs": "Очистить логи",
        "restore-title": "Восстановление проекта",
        "restore-subtitle": "Скачать и восстановить проект из бэкапов в Google Drive",
        "btn-fetch-projects": "Загрузить проекты",
        "step1-title": "1. Выберите папку проекта",
        "step1-desc": "Выберите облачную папку для просмотра бэкапов",
        "step2-title": "2. Выберите архив бэкапа",
        "step2-desc": "Выберите конкретный ZIP-архив для восстановления",
        "restore-loading-folders": "Подключение к облаку...",
        "restore-no-folders": "Папки не найдены. Нажмите Загрузить.",
        "restore-loading-backups": "Загрузка ZIP-архивов...",
        "restore-no-backups": "Архивы не найдены в этой папке.",
        "restore-select-folder-first": "Сначала выберите папку.",
        "restore-selected-label": "Выбранный бэкап:",
        "btn-restore-full": "ПОЛНОЕ ВОССТАНОВЛЕНИЕ (С перезаписью)",
        "btn-restore-download": "ТОЛЬКО СКАЧАТЬ",
        "exclusions-title": "Редактор исключений",
        "exclusions-subtitle": "Настройте файлы и папки, которые будут игнорироваться при копировании",
        "btn-exclusions-reset": "Сбросить по умолчанию",
        "btn-exclusions-save": "СОХРАНИТЬ ИЗМЕНЕНИЯ",
        "exclusions-folders-title": "Игнорируемые папки",
        "exclusions-folders-desc": "Эти директории будут пропущены при резервном копировании",
        "exclusions-files-title": "Игнорируемые файлы",
        "exclusions-files-desc": "Имена файлов или маски (wildcards), которые будут исключены",
        "input-new-folder": "Например, temp_cache",
        "input-new-file": "Например, *.log.bak",
        "auth-warning-title": "Google Drive не авторизован",
        "auth-warning-desc": "Привяжите аккаунт Google для работы с облачными функциями.",
        "btn-authorize": "Авторизовать",
        "confirm-reset": "Сбросить исключения к настройкам по умолчанию?",
        "confirm-restore": "⚠️ ПОЛНОЕ ВОССТАНОВЛЕНИЕ скачает и перезапишет файлы вашего активного проекта!\n\nАрхив: {backup}\n\nВы уверены, что хотите продолжить?",
        "quota-label": "Диск:",
        "retention-title": "Автоочистка старых бэкапов (Ротация)",
        "retention-desc": "Автоматическое удаление старых архивов при превышении лимита",
        "retention-disabled": "Отключено",
        "retention-enabled": "Включено",
        "retention-limit-label": "Хранить не более (копий):",
        "network-settings-title": "Сетевые настройки загрузки",
        "network-settings-desc": "Управление скоростью отдачи и многопоточностью при отправке в облако",
        "label-bwlimit": "Ограничение скорости отдачи",
        "bwlimit-off": "Без ограничений",
        "label-transfers": "Параллельные потоки загрузки (--transfers)",
        "drag-overlay-title": "Перетащите папку проекта сюда",
        "drag-overlay-desc": "Путь проекта автоматически переключится на эту папку",
        
        // Help tab specific translation keys
        "help-title": "Помощь и руководство",
        "help-subtitle": "Подробное описание функций резервного копирования",
        "help-sec-features": "Основные функции",
        "help-sec-visual": "Визуальный гид",
        "help-sec-visual-desc": "Стилизованные схемы элементов интерфейса:",
        "help-feat-cloud-title": "Cloud Backup (Бэкап в облако)",
        "help-feat-cloud-desc": "Копирует файлы проекта (исключая папки из вкладки Exclusions), упаковывает их в ZIP-архив с выбранным уровнем сжатия и выгружает в Google Drive (в папку backups/имя_проекта).",
        "help-feat-local-title": "Local Only (Локальный бэкап)",
        "help-feat-local-desc": "Создает архив проекта на жестком диске в папке «резерв_имя_проекта» на том же уровне диска, где лежит проект, но не отправляет в облако. Не требует интернета.",
        "help-feat-restore-title": "Restore (Восстановление)",
        "help-feat-restore-desc": "Запрашивает из облака список бэкапов. «ПОЛНОЕ ВОССТАНОВЛЕНИЕ» скачивает архив и перезаписывает файлы проекта. «ТОЛЬКО СКАЧАТЬ» просто скачивает архив в корень и открывает его в Проводнике.",
        "help-feat-exclusions-title": "Exclusions (Исключения)",
        "help-feat-exclusions-desc": "Список папок (например, node_modules) и файлов, которые будут пропущены. Это уменьшает размер бэкапа в несколько раз.",
        "help-feat-retention-title": "Ротация и квота диска",
        "help-feat-retention-desc": "Контроль заполнения Google Drive с помощью виджета в шапке. Автоматическое удаление старых бэкапов при превышении лимита.",
        "help-feat-network-title": "Сетевые лимиты и потоки",
        "help-feat-network-desc": "Гибкая настройка скорости отдачи (--bwlimit) и количества параллельных потоков загрузки (--transfers) для экономии вашего интернет-трафика.",
        "help-feat-ux-title": "Трей-агент и Drag-and-Drop",
        "help-feat-ux-desc": "Работа в фоновом режиме в системном трее Windows. Быстрое переключение проекта путем обычного перетаскивания папки из проводника в окно.",
        "mockup-status-title": "Карточка процесса бэкапа:",
        "mockup-exclusions-title": "Редактирование правил:",

        // Logs and alerts
        "log-init": "Инициализация REZERV TOOL v6 завершена. Готов к работе.",
        "log-detect-root": "Определен корень проекта: {root}",
        "log-target-cloud": "Целевая папка в облаке: backups/{name}",
        "log-err-config": "Ошибка определения конфигурации: {err}",
        "log-saved-exclusions": "Исключения успешно сохранены.",
        "log-err-exclusions-save": "Не удалось сохранить исключения: {err}",
        "log-err-exclusions-load": "Ошибка загрузки исключений: {err}",
        "log-reset-exclusions": "Исключения сброшены. Нажмите СОХРАНИТЬ для записи.",
        "log-robocopy-start": "Копирование файлов с помощью Robocopy...",
        "log-robocopy-fail": "Robocopy завершился ошибкой: {err}",
        "log-robocopy-success": "Файлы скопированы.",
        "log-compress-start": "Сжатие... (режим {mode})",
        "log-compress-fail": "Сжатие завершилось ошибкой: {err}",
        "log-compress-success": "Сжато за {time}с | {size} | Режим: {mode}",
        "log-upload-start": "Выгрузка в Google Drive...",
        "log-upload-err-stream": "Не удалось инициализировать поток загрузки: {err}",
        "log-upload-err-rclone": "Не удалось запустить rclone: {err}",
        "log-upload-success": "Загрузка завершена.",
        "log-upload-skipped": "Загрузка в облако пропущена.",
        "log-backup-complete": "Резервное копирование завершено: {path}",
        "log-restore-start": "Начало операции восстановления ({backup})...",
        "log-restore-err": "Ошибка восстановления: {err}",
        "log-download-success": "Загрузка архива завершена.",
        "log-download-only": "Архив ZIP только скачан по пути: {path}",
        "log-extract-start": "Распаковка архива...",
        "log-extract-fail": "Распаковка завершилась ошибкой: {err}",
        "log-extract-success": "Распаковано. Копирование файлов в корень проекта...",
        "log-restore-copy-fail": "Копирование файлов восстановления завершилось ошибкой: {err}",
        "log-restore-success": "Восстановление успешно завершено!",
        "log-auth-start": "Открытие браузера для авторизации Google Drive...",
        "log-auth-warning": "Пожалуйста, выберите Google-аккаунт, разрешите доступ и вернитесь в приложение.",
        "log-auth-fail": "Авторизация Google Drive не удалась: {err}",
        "log-auth-success": "Google Drive успешно подключен как gdrive_new!",
        "log-auth-warning-status": "Google Drive не авторизован. Облачные функции отключены.",
        "log-open-browser-auth": "Открываем браузер..."
    },
    en: {
        "nav-backup-cloud": "Cloud Backup",
        "nav-backup-local": "Local Only",
        "nav-restore": "Restore",
        "nav-exclusions": "Exclusions",
        "nav-help": "Help",
        "badge-label": "Active Project",
        "path-label": "Project Path:",
        "theme-text-light": "LIGHT",
        "theme-text-dark": "DARK",
        "backup-title-cloud": "Cloud Backup",
        "backup-subtitle-cloud": "Create a compressed ZIP archive and upload it to Google Drive",
        "backup-title-local": "Local Backup",
        "backup-subtitle-local": "Create a compressed ZIP archive locally (No Upload)",
        "label-compression": "Compression",
        "btn-start-backup-cloud": "START UPLOAD",
        "btn-start-backup-local": "START LOCAL",
        "status-ready": "Ready",
        "status-ready-desc": "Configure settings and click start",
        "status-badge-idle": "Idle",
        "status-badge-working": "Working",
        "status-badge-success": "Success",
        "status-badge-error": "Error",
        "progress-waiting": "Waiting for input...",
        "console-title": "Execution Logs",
        "btn-clear-logs": "Clear Logs",
        "restore-title": "Restore Project",
        "restore-subtitle": "Download and restore project from Google Drive backups",
        "btn-fetch-projects": "Fetch Projects",
        "step1-title": "1. Select Project Folder",
        "step1-desc": "Choose which cloud folder to list backups from",
        "step2-title": "2. Select Backup Archive",
        "step2-desc": "Choose a specific ZIP backup to restore",
        "restore-loading-folders": "Connecting to cloud...",
        "restore-no-folders": "No folders found. Click Fetch.",
        "restore-loading-backups": "Loading ZIP archives...",
        "restore-no-backups": "No backups found in this folder.",
        "restore-select-folder-first": "Select a folder first.",
        "restore-selected-label": "Selected Backup:",
        "btn-restore-full": "FULL RESTORE (Overwrite Project)",
        "btn-restore-download": "DOWNLOAD ONLY",
        "exclusions-title": "Exclusions Editor",
        "exclusions-subtitle": "Configure folder and file patterns to ignore during backup",
        "btn-exclusions-reset": "Reset to Default",
        "btn-exclusions-save": "SAVE CHANGES",
        "exclusions-folders-title": "Ignored Folders",
        "exclusions-folders-desc": "These directories will be skipped during copy",
        "exclusions-files-title": "Ignored Files",
        "exclusions-files-desc": "These file names or globs will be excluded",
        "input-new-folder": "e.g. temp_cache",
        "input-new-file": "e.g. *.log.bak",
        "auth-warning-title": "Google Drive not authorized",
        "auth-warning-desc": "Connect your Google account to enable cloud features.",
        "btn-authorize": "Authorize",
        "confirm-reset": "Reset exclusions to default rules?",
        "confirm-restore": "⚠️ FULL RESTORE will download and overwrite your active project files!\n\nBackup: {backup}\n\nAre you sure you want to proceed?",
        "quota-label": "Cloud:",
        "retention-title": "Auto-cleaning Old Backups (Retention)",
        "retention-desc": "Automatically delete oldest archives when exceeding count limit",
        "retention-disabled": "Disabled",
        "retention-enabled": "Enabled",
        "retention-limit-label": "Keep maximum (copies):",
        "network-settings-title": "Upload Network Settings",
        "network-settings-desc": "Manage upload speed and concurrent threads when uploading to cloud",
        "label-bwlimit": "Upload Speed Limit",
        "bwlimit-off": "No Limit",
        "label-transfers": "Parallel Upload Threads (--transfers)",
        "drag-overlay-title": "Drop Project Folder Here",
        "drag-overlay-desc": "The active project path will switch to this folder",
        
        // Help tab specific translation keys
        "help-title": "Help & Guide",
        "help-subtitle": "Detailed description of backup and restore functions",
        "help-sec-features": "Core Features",
        "help-sec-visual": "Visual Guide",
        "help-sec-visual-desc": "Styled vector representations of UI components:",
        "help-feat-cloud-title": "Cloud Backup",
        "help-feat-cloud-desc": "Copies project files (excluding folders in Exclusions), compresses them into a ZIP archive with selected level, and uploads to Google Drive (under backups/project_name).",
        "help-feat-local-title": "Local Only",
        "help-feat-local-desc": "Creates a project archive on the hard drive under \"rezerv_project_name\" folder at the same disk level as the project, but does not upload to cloud. Offline.",
        "help-feat-restore-title": "Restore",
        "help-feat-restore-desc": "Requests the list of backups from the cloud. \"FULL RESTORE\" downloads the archive and overwrites active project files. \"DOWNLOAD ONLY\" saves the archive to root and opens explorer.",
        "help-feat-exclusions-title": "Exclusions",
        "help-feat-exclusions-desc": "A list of folders (like node_modules) and files that will be skipped. This reduces the backup size by several times.",
        "help-feat-retention-title": "Retention & Disk Quota",
        "help-feat-retention-desc": "Monitor Google Drive usage using the header widget. Automatically delete oldest backups when exceeding the configured limit.",
        "help-feat-network-title": "Network Limits & Threads",
        "help-feat-network-desc": "Fine-tune upload speed limits (--bwlimit) and concurrent upload transfers (--transfers) to optimize your bandwidth usage.",
        "help-feat-ux-title": "Tray Agent & Drag-and-Drop",
        "help-feat-ux-desc": "Run program in the system tray when window is closed, preventing multi-instance conflicts. Instantly switch projects by dragging and dropping folder in.",
        "mockup-status-title": "Backup Process Card:",
        "mockup-exclusions-title": "Rules Editing:",

        // Logs and alerts
        "log-init": "REZERV TOOL v6 initialized. Ready for backup operations.",
        "log-detect-root": "Detected project root: {root}",
        "log-target-cloud": "Targeting cloud backups to folder: backups/{name}",
        "log-err-config": "Error detecting configuration: {err}",
        "log-saved-exclusions": "Exclusions saved successfully.",
        "log-err-exclusions-save": "Failed to save exclusions: {err}",
        "log-err-exclusions-load": "Error loading exclusions: {err}",
        "log-reset-exclusions": "Exclusions reset to defaults. Click SAVE to persist.",
        "log-robocopy-start": "Copying files with Robocopy...",
        "log-robocopy-fail": "Robocopy failed: {err}",
        "log-robocopy-success": "Files copied.",
        "log-compress-start": "Compressing... ({mode} mode)",
        "log-compress-fail": "Compression failed: {err}",
        "log-compress-success": "Compressed in {time}s | {size} | Mode: {mode}",
        "log-upload-start": "Uploading to Google Drive...",
        "log-upload-err-stream": "Failed to initialize upload stream: {err}",
        "log-upload-err-rclone": "Failed to start rclone: {err}",
        "log-upload-success": "Upload complete.",
        "log-upload-skipped": "Cloud upload skipped.",
        "log-backup-complete": "Backup complete: {path}",
        "log-restore-start": "Starting Restore Operation ({backup})...",
        "log-restore-err": "Restore encountered error: {err}",
        "log-download-success": "Download complete.",
        "log-download-only": "ZIP backup downloaded only: {path}",
        "log-extract-start": "Extracting archive...",
        "log-extract-fail": "Extraction failed: {err}",
        "log-extract-success": "Extracted. Copying files to project root...",
        "log-restore-copy-fail": "Restore copy failed: {err}",
        "log-restore-success": "Restore complete successfully!",
        "log-auth-start": "Opening web browser for Google Drive authorization...",
        "log-auth-warning": "Please choose your Google Account, allow access, and return to this app.",
        "log-auth-fail": "Authorization failed: {err}",
        "log-auth-success": "Google Drive configured successfully as gdrive_new!",
        "log-auth-warning-status": "Google Drive is not authorized. Cloud features are disabled.",
        "log-open-browser-auth": "Opening browser..."
    }
};

// State variables
let currentLanguage = 'ru'; // Default language
let currentTab = 'backup-cloud'; // backup-cloud, backup-local, restore, exclusions, help
let config = null;
let exclusions = { dirs: [], files: [] };
let selectedCloudFolder = null;
let selectedBackupFile = null;
let isCloudReady = false;
let isOperationRunning = false;

// i18n Translation Helper
function t(key, replacements = {}) {
    let text = translations[currentLanguage][key] || key;
    for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

// Initialize App
initApp();

async function initApp() {
    setupLanguage();
    setupTabNavigation();
    setupThemeToggle();
    setupLogging();
    setupConfig();
    setupExclusions();
    setupBackupControls();
    setupRestoreControls();
    setupCloudAuth();
    setupDragAndDrop();
}

// 0. Language Setup
function setupLanguage() {
    const langToggle = document.getElementById('btn-lang-toggle');
    const langDropdown = document.getElementById('lang-dropdown-menu');
    const langText = langToggle.querySelector('.lang-text');
    const langOptions = document.querySelectorAll('.lang-option');
    
    // Check saved language or browser language
    const savedLang = localStorage.getItem('rezerv_lang');
    if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
        currentLanguage = savedLang;
    } else {
        const isRussianSystem = navigator.language && navigator.language.toLowerCase().startsWith('ru');
        currentLanguage = isRussianSystem ? 'ru' : 'en';
    }

    langText.innerText = currentLanguage.toUpperCase();
    langOptions.forEach(opt => {
        if (opt.getAttribute('data-value') === currentLanguage) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });

    setLanguage(currentLanguage);

    // Toggle dropdown
    langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = langDropdown.classList.toggle('show');
        langToggle.parentElement.classList.toggle('active', isActive);
    });

    // Close dropdown on click outside
    document.addEventListener('click', () => {
        langDropdown.classList.remove('show');
        langToggle.parentElement.classList.remove('active');
    });

    // Option click
    langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const lang = opt.getAttribute('data-value');
            langText.innerText = lang.toUpperCase();
            langOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            setLanguage(lang);
        });
    });
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('rezerv_lang', lang);

    // Translate DOM elements marked with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        const translated = t(key);
        
        if (elem.tagName === 'INPUT') {
            elem.placeholder = translated;
        } else {
            // If the element has internal structure like SVG icons or text-span wrappers
            const textSpan = elem.querySelector('.btn-text, .nav-label, .theme-text, .path-label, .badge-label');
            if (textSpan) {
                textSpan.innerText = translated;
            } else {
                elem.innerText = translated;
            }
        }
    });

    // Update active tab texts and warnings dynamically
    updateTabTexts();

    // Update retention UI to translate switch label
    if (document.getElementById('check-retention-enable')) {
        updateRetentionUI();
    }
}

function updateTabTexts() {
    const tabsConfig = {
        'backup-cloud': { 
            title: t('backup-title-cloud'), 
            subtitle: t('backup-subtitle-cloud'), 
            actionText: t('btn-start-backup-cloud') 
        },
        'backup-local': { 
            title: t('backup-title-local'), 
            subtitle: t('backup-subtitle-local'), 
            actionText: t('btn-start-backup-local') 
        }
    };

    const tabConfig = tabsConfig[currentTab];
    if (tabConfig) {
        document.getElementById('backup-title').innerText = tabConfig.title;
        document.getElementById('backup-subtitle').innerText = tabConfig.subtitle;
        document.getElementById('btn-start-backup').querySelector('.btn-text').innerText = tabConfig.actionText;
    }

    // Refresh dynamic texts in status card if it is idle
    const badge = document.getElementById('status-badge');
    const mainText = document.getElementById('card-line1');
    const subText = document.getElementById('card-line2');
    const statusText = document.getElementById('status-text');

    if (badge.innerText === 'Idle' || badge.innerText === 'Ожидание') {
        badge.innerText = t('status-badge-idle');
        mainText.innerText = t('status-ready');
        subText.innerText = t('status-ready-desc');
    } else if (badge.innerText === 'Working' || badge.innerText === 'В процессе') {
        badge.innerText = t('status-badge-working');
    } else if (badge.innerText === 'Success' || badge.innerText === 'Успешно') {
        badge.innerText = t('status-badge-success');
    } else if (badge.innerText === 'Error' || badge.innerText === 'Ошибка') {
        badge.innerText = t('status-badge-error');
    }

    if (statusText.innerText === 'Waiting for input...' || statusText.innerText === 'Ожидание запуска...') {
        statusText.innerText = t('progress-waiting');
    }
}

// 1. Theme Toggle
function setupThemeToggle() {
    const btnToggle = document.getElementById('btn-theme-toggle');
    const icon = btnToggle.querySelector('.theme-icon');
    const text = btnToggle.querySelector('.theme-text');

    btnToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme', !isDark);

        if (isDark) {
            icon.innerText = '☀️';
            text.setAttribute('data-i18n', 'theme-text-light');
            text.innerText = t('theme-text-light');
        } else {
            icon.innerText = '🌙';
            text.setAttribute('data-i18n', 'theme-text-dark');
            text.innerText = t('theme-text-dark');
        }
    });
}

// 2. Tab Navigation
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            currentTab = tabName;

            // Update sidebar buttons
            navItems.forEach(n => n.classList.remove('active'));
            btn.classList.add('active');

            // Hide all tab sections
            document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));

            const sectionMap = {
                'backup-cloud': 'tab-backup',
                'backup-local': 'tab-backup',
                'restore': 'tab-restore',
                'exclusions': 'tab-exclusions',
                'help': 'tab-help'
            };

            const section = document.getElementById(sectionMap[tabName]);
            section.classList.add('active');

            // Apply specific configurations
            updateTabTexts();

            if (tabName === 'backup-cloud') {
                document.getElementById('btn-start-backup').disabled = !isCloudReady;
            } else if (tabName === 'backup-local') {
                document.getElementById('btn-start-backup').disabled = false;
            }

            if (tabName === 'exclusions') {
                loadAndRenderExclusions();
            }

            toggleOperationUI();
        });
    });
}

// 3. Load Project Settings
async function setupConfig() {
    try {
        config = await DetectConfig();
        document.getElementById('badge-project-name').innerText = config.projectName;
        document.getElementById('header-project-path').innerText = config.projectRoot;
        addLogLine(t('log-detect-root', { root: config.projectRoot }), 'dim');
        addLogLine(t('log-target-cloud', { name: config.projectName }), 'dim');
    } catch (err) {
        addLogLine(t('log-err-config', { err: err }), 'error');
    }
}

// 4. Exclusions Editor
async function setupExclusions() {
    // Save button
    document.getElementById('btn-exclusions-save').addEventListener('click', async () => {
        try {
            await SaveExclusions(exclusions);
            addLogLine(t('log-saved-exclusions'), 'success');
            const saveBtn = document.getElementById('btn-exclusions-save');
            const originalText = saveBtn.querySelector('.btn-text').innerText;
            saveBtn.querySelector('.btn-text').innerText = t('status-badge-success').toUpperCase();
            setTimeout(() => { saveBtn.querySelector('.btn-text').innerText = originalText; }, 1200);
        } catch (err) {
            addLogLine(t('log-err-exclusions-save', { err: err }), 'error');
        }
    });

    // Reset button
    document.getElementById('btn-exclusions-reset').addEventListener('click', async () => {
        if (confirm(t('confirm-reset'))) {
            exclusions.dirs = [
                "node_modules", "build", "dist", "out", ".next", ".nuxt",
                ".vite", ".turbo", ".parcel-cache", ".cache", ".git", ".idea",
                "coverage", ".nyc_output", "logs", "pids", ".npm", "storybook-static",
                "rclone", "win_rezerv", "rezerv2", "rezerv_win", "temp"
            ];
            exclusions.files = [
                "npm-debug.log*", "yarn-debug.log*", "yarn-error.log*",
                ".gitignore.bak", "*.swp", "*.swo", ".DS_Store", "Thumbs.db",
                "*.log", "*.pid", "*.seed", "*.pid.lock", ".node_repl_history",
                "*.tgz", ".yarn-integrity", ".env.local.backup",
                ".env.production.local", ".env.development.local",
                "rezerv.exe", "rezerv.pdb", "Launcher.cs"
            ];
            renderExclusionsLists();
            addLogLine(t('log-reset-exclusions'), 'warning');
        }
    });

    // Add folder
    document.getElementById('btn-add-folder').addEventListener('click', () => {
        const input = document.getElementById('input-new-folder');
        const val = input.value.trim();
        if (val && !exclusions.dirs.includes(val)) {
            exclusions.dirs.push(val);
            renderExclusionsLists();
            input.value = '';
        }
    });

    // Add file
    document.getElementById('btn-add-file').addEventListener('click', () => {
        const input = document.getElementById('input-new-file');
        const val = input.value.trim();
        if (val && !exclusions.files.includes(val)) {
            exclusions.files.push(val);
            renderExclusionsLists();
            input.value = '';
        }
    });

    // Retention enable switch
    const checkRetention = document.getElementById('check-retention-enable');
    checkRetention.addEventListener('change', () => {
        if (!exclusions.retention) {
            exclusions.retention = { enabled: false, maxBackupCount: 10 };
        }
        exclusions.retention.enabled = checkRetention.checked;
        updateRetentionUI();
    });

    // Retention count limit input
    const inputRetentionLimit = document.getElementById('input-retention-limit');
    inputRetentionLimit.addEventListener('input', () => {
        if (!exclusions.retention) {
            exclusions.retention = { enabled: false, maxBackupCount: 10 };
        }
        exclusions.retention.maxBackupCount = parseInt(inputRetentionLimit.value, 10) || 10;
    });

    // Network Settings
    const selectBwlimit = document.getElementById('select-bwlimit');
    selectBwlimit.addEventListener('change', () => {
        if (!exclusions.settings) {
            exclusions.settings = { bwlimit: "off", transfers: 4 };
        }
        exclusions.settings.bwlimit = selectBwlimit.value;
    });

    const selectTransfers = document.getElementById('select-transfers');
    selectTransfers.addEventListener('change', () => {
        if (!exclusions.settings) {
            exclusions.settings = { bwlimit: "off", transfers: 4 };
        }
        exclusions.settings.transfers = parseInt(selectTransfers.value, 10) || 4;
    });
}

async function loadAndRenderExclusions() {
    try {
        exclusions = await LoadExclusions();
        renderExclusionsLists();
        
        // Load retention config into inputs
        if (!exclusions.retention) {
            exclusions.retention = { enabled: false, maxBackupCount: 10 };
        }
        document.getElementById('check-retention-enable').checked = exclusions.retention.enabled;
        document.getElementById('input-retention-limit').value = exclusions.retention.maxBackupCount;
        updateRetentionUI();

        // Load network config into select boxes
        if (!exclusions.settings) {
            exclusions.settings = { bwlimit: "off", transfers: 4 };
        }
        document.getElementById('select-bwlimit').value = exclusions.settings.bwlimit || "off";
        document.getElementById('select-transfers').value = exclusions.settings.transfers || 4;
    } catch (err) {
        addLogLine(t('log-err-exclusions-load', { err: err }), 'error');
    }
}

function renderExclusionsLists() {
    const foldersList = document.getElementById('folders-exclusions-list');
    const filesList = document.getElementById('files-exclusions-list');

    foldersList.innerHTML = '';
    filesList.innerHTML = '';

    exclusions.dirs.forEach(dir => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${dir}</span><button class="remove-pattern-btn" data-val="${dir}" ${isOperationRunning ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>×</button>`;
        foldersList.appendChild(li);
    });

    exclusions.files.forEach(file => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${file}</span><button class="remove-pattern-btn" data-val="${file}" ${isOperationRunning ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>×</button>`;
        filesList.appendChild(li);
    });

    // Add delete listeners
    document.querySelectorAll('.remove-pattern-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            exclusions.dirs = exclusions.dirs.filter(d => d !== val);
            exclusions.files = exclusions.files.filter(f => f !== val);
            renderExclusionsLists();
        });
    });
}

// 5. Backup Logging & Progress Listening
function setupLogging() {
    document.getElementById('btn-clear-logs').addEventListener('click', () => {
        document.getElementById('log-box').innerHTML = '';
    });

    // Bind Wails runtime event listeners
    if (window.runtime) {
        window.runtime.EventsOn('log', (data) => {
            // Translate backend log messages to look consistent
            let msg = data.message;
            if (msg.includes("Copying files with Robocopy")) {
                msg = t('log-robocopy-start');
            } else if (msg.includes("Robocopy failed")) {
                msg = t('log-robocopy-fail', { err: msg.split(": ")[1] || "" });
            } else if (msg.includes("Files copied")) {
                msg = t('log-robocopy-success');
            } else if (msg.includes("Compressing...")) {
                const mode = msg.match(/\((.*?) mode\)/);
                msg = t('log-compress-start', { mode: mode ? mode[1] : "" });
            } else if (msg.includes("Compression failed")) {
                msg = t('log-compress-fail', { err: msg.split(": ")[1] || "" });
            } else if (msg.includes("Compressed in")) {
                const parts = msg.split(" | ");
                const time = parts[0].match(/in (.*?)s/);
                const size = parts[1] || "";
                const mode = parts[2].split(": ")[1] || "";
                msg = t('log-compress-success', { time: time ? time[1] : "", size: size, mode: mode });
            } else if (msg.includes("Uploading to Google Drive")) {
                msg = t('log-upload-start');
            } else if (msg.includes("Failed to initialize upload")) {
                msg = t('log-upload-err-stream', { err: msg.split(": ")[1] || "" });
            } else if (msg.includes("Failed to start rclone")) {
                msg = t('log-upload-err-rclone', { err: msg.split(": ")[1] || "" });
            } else if (msg.includes("Upload complete")) {
                msg = t('log-upload-success');
            } else if (msg.includes("Cloud upload skipped")) {
                msg = t('log-upload-skipped');
            } else if (msg.includes("Backup complete")) {
                msg = t('log-backup-complete', { path: msg.split(": ")[1] || "" });
            } else if (msg.includes("Downloading backup archive")) {
                msg = t('log-download-success'); // Triggered internally
            } else if (msg.includes("ZIP backup downloaded only")) {
                msg = t('log-download-only', { path: msg.split(": ")[1] || "" });
            } else if (msg.includes("Extracting archive")) {
                msg = t('log-extract-start');
            } else if (msg.includes("Extraction failed")) {
                msg = t('log-extract-fail', { err: msg.split(": ")[1] || "" });
            } else if (msg.includes("Extracted. Copying files")) {
                msg = t('log-extract-success');
            } else if (msg.includes("Robocopy restore failed")) {
                msg = t('log-restore-copy-fail', { err: msg.split(": ")[1] || "" });
            } else if (msg.includes("Restore complete successfully")) {
                msg = t('log-restore-success');
            }

            addLogLine(`[${data.time}] ${msg}`, data.type.toLowerCase());
        });

        window.runtime.EventsOn('progress', (percent) => {
            const bar = document.getElementById('backup-progress');
            bar.style.width = `${percent}%`;
            document.getElementById('progress-text').innerText = `${percent}%`;
            
            // Badge style updates
            const badge = document.getElementById('status-badge');
            if (percent === 0) {
                badge.innerText = t('status-badge-idle');
                badge.className = 'status-badge';
            } else if (percent === 100) {
                badge.innerText = t('status-badge-success');
                badge.className = 'status-badge success';
            } else {
                badge.innerText = t('status-badge-working');
                badge.className = 'status-badge working';
            }
        });

        window.runtime.EventsOn('status-text', (status) => {
            let displayStatus = status;
            if (status === "Waiting for input...") {
                displayStatus = t('progress-waiting');
            } else if (status === "Step 1/4 Copying files...") {
                displayStatus = t('log-robocopy-start');
            } else if (status.startsWith("Step 2/4 Compressing")) {
                displayStatus = t('log-compress-start', { mode: status.match(/\((.*?)\)/)?.[1] || "" });
            } else if (status === "Step 3/4 Uploading to Google Drive...") {
                displayStatus = t('log-upload-start');
            } else if (status === "Done!") {
                displayStatus = t('status-badge-success');
            }
            document.getElementById('status-text').innerText = displayStatus;
        });

        window.runtime.EventsOn('card-line1', (val) => {
            let displayVal = val;
            if (val === "Ready") {
                displayVal = t('status-ready');
            } else if (val.startsWith("Source:")) {
                displayVal = (currentLanguage === 'ru' ? 'Источник: ' : 'Source: ') + val.split(": ")[1];
            } else if (val.startsWith("Creating:")) {
                displayVal = (currentLanguage === 'ru' ? 'Создание: ' : 'Creating: ') + val.split(": ")[1];
            } else if (val.startsWith("Uploading:")) {
                displayVal = (currentLanguage === 'ru' ? 'Загрузка: ' : 'Uploading: ') + val.split(": ")[1];
            } else if (val.startsWith("Saved:")) {
                displayVal = (currentLanguage === 'ru' ? 'Сохранено: ' : 'Saved: ') + val.split(": ")[1];
            } else if (val.startsWith("Downloading:")) {
                displayVal = (currentLanguage === 'ru' ? 'Скачивание: ' : 'Downloading: ') + val.split(": ")[1];
            } else if (val === "Extracting ZIP archive...") {
                displayVal = t('log-extract-start');
            } else if (val.startsWith("Restored to:")) {
                displayVal = t('log-restore-success');
            }
            document.getElementById('card-line1').innerText = displayVal;
        });

        window.runtime.EventsOn('card-line2', (val) => {
            let displayVal = val;
            if (val === "Configure settings and click start") {
                displayVal = t('status-ready-desc');
            } else if (val.startsWith("Size:")) {
                const parts = val.split(" | ");
                const size = parts[0].split(": ")[1] || "";
                const mode = parts[1]?.split(": ")[1] || "";
                displayVal = `${t('label-compression')}: ${mode} | ${size}`;
            }
            document.getElementById('card-line2').innerText = displayVal;
        });
    }
}

function addLogLine(text, type = 'info') {
    const logBox = document.getElementById('log-box');
    const line = document.createElement('div');
    line.className = `log-line log-${type}`;
    line.innerText = text;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
}

// 6. Backup Operations
function setupBackupControls() {
    const startBtn = document.getElementById('btn-start-backup');
    startBtn.addEventListener('click', async () => {
        const localOnly = (currentTab === 'backup-local');
        const compression = document.getElementById('select-compression').value;

        addLogLine(`--- ${t('backup-title-' + (localOnly ? 'local' : 'cloud')).toUpperCase()} ---`, 'accent');
        
        // Disable actions during work
        isOperationRunning = true;
        toggleOperationUI();

        try {
            await StartBackup(localOnly, compression);
        } catch (err) {
            addLogLine(`Error: ${err}`, 'error');
        }

        // Re-enable actions after process completes
        if (window.runtime) {
            const progressUnsubscribe = window.runtime.EventsOn('progress', (percent) => {
                if (percent === 100) {
                    isOperationRunning = false;
                    toggleOperationUI();
                    if (!localOnly) {
                        updateCloudQuota();
                    }
                    progressUnsubscribe(); // Stop listening
                }
            });
        } else {
            isOperationRunning = false;
            toggleOperationUI();
        }
    });
}

// 7. Restore Operations
function setupRestoreControls() {
    const btnFetch = document.getElementById('btn-fetch-cloud');
    const listProjects = document.getElementById('cloud-projects-list');
    const listBackups = document.getElementById('cloud-backups-list');

    btnFetch.addEventListener('click', async () => {
        listProjects.innerHTML = `<li class="list-loading">${t('restore-loading-folders')}</li>`;
        listBackups.innerHTML = `<li class="list-loading">${t('restore-select-folder-first')}</li>`;
        document.getElementById('restore-backup-step').classList.add('disabled');
        document.getElementById('restore-actions-card').classList.add('disabled');
        document.getElementById('selected-backup-name').innerText = 'None';
        selectedCloudFolder = null;
        selectedBackupFile = null;

        try {
            const folders = await GetCloudProjects();
            listProjects.innerHTML = '';
            if (folders.length === 0) {
                listProjects.innerHTML = `<li class="list-loading">${t('restore-no-folders')}</li>`;
                return;
            }

            folders.forEach(folder => {
                const li = document.createElement('li');
                li.innerText = folder;
                if (folder === config.projectName) {
                    li.classList.add('selected');
                    selectedCloudFolder = folder;
                    loadBackupsForProject(folder);
                }
                li.addEventListener('click', () => {
                    document.querySelectorAll('#cloud-projects-list li').forEach(item => item.classList.remove('selected'));
                    li.classList.add('selected');
                    selectedCloudFolder = folder;
                    loadBackupsForProject(folder);
                });
                listProjects.appendChild(li);
            });
        } catch (err) {
            listProjects.innerHTML = `<li class="list-loading" style="color:var(--danger)">Error: ${err}</li>`;
        }
    });

    async function loadBackupsForProject(folderName) {
        listBackups.innerHTML = `<li class="list-loading">${t('restore-loading-backups')}</li>`;
        document.getElementById('restore-backup-step').classList.remove('disabled');
        document.getElementById('restore-actions-card').classList.add('disabled');
        document.getElementById('selected-backup-name').innerText = 'None';
        selectedBackupFile = null;

        try {
            const files = await GetCloudBackups(folderName);
            listBackups.innerHTML = '';
            if (files.length === 0) {
                listBackups.innerHTML = `<li class="list-loading">${t('restore-no-backups')}</li>`;
                return;
            }

            files.forEach(file => {
                const li = document.createElement('li');
                const dateFormatted = new Date(file.date).toLocaleString(currentLanguage === 'ru' ? 'ru-RU' : 'en-US', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

                li.innerHTML = `<div style="display:flex; justify-content:space-between; width:100%">
                    <span style="font-weight:500">${file.name}</span>
                    <span style="color:var(--text-muted)">${sizeMB} MB | ${dateFormatted}</span>
                </div>`;

                li.addEventListener('click', () => {
                    document.querySelectorAll('#cloud-backups-list li').forEach(item => item.classList.remove('selected'));
                    li.classList.add('selected');
                    selectedBackupFile = file.name;

                    document.getElementById('selected-backup-name').innerText = file.name;
                    document.getElementById('restore-actions-card').classList.remove('disabled');
                });
                listBackups.appendChild(li);
            });
        } catch (err) {
            listBackups.innerHTML = `<li class="list-loading" style="color:var(--danger)">Error: ${err}</li>`;
        }
    }

    // Full Restore Action
    document.getElementById('btn-restore-full').addEventListener('click', async () => {
        if (!selectedCloudFolder || !selectedBackupFile) return;

        if (confirm(t('confirm-restore', { backup: selectedBackupFile }))) {
            executeRestore(true);
        }
    });

    // Download Only Action
    document.getElementById('btn-restore-download').addEventListener('click', () => {
        if (!selectedCloudFolder || !selectedBackupFile) return;
        executeRestore(false);
    });

    async function executeRestore(fullRestore) {
        // Switch tab to backup to see the execution
        document.getElementById('btn-nav-backup-cloud').click();
        
        // Disable navigation
        isOperationRunning = true;
        toggleOperationUI();

        addLogLine(`--- ${t('restore-title').toUpperCase()} (${selectedBackupFile}) ---`, 'accent');
        
        try {
            await StartRestore(selectedCloudFolder, selectedBackupFile, fullRestore);
        } catch (err) {
            addLogLine(t('log-restore-err', { err: err }), 'error');
        }

        // Wait until completion to restore nav
        if (window.runtime) {
            const progressUnsubscribe = window.runtime.EventsOn('progress', (percent) => {
                if (percent === 100) {
                    isOperationRunning = false;
                    toggleOperationUI();
                    progressUnsubscribe();
                }
            });
        } else {
            isOperationRunning = false;
            toggleOperationUI();
        }
    }
}

// 8. Google Drive Authorization Flow
async function setupCloudAuth() {
    const banner = document.getElementById('cloud-auth-banner');
    const btnAuth = document.getElementById('btn-authorize-cloud');

    btnAuth.addEventListener('click', async () => {
        btnAuth.disabled = true;
        btnAuth.querySelector('.btn-text').innerText = t('log-open-browser-auth');
        try {
            await ConfigureCloud();
        } catch (err) {
            addLogLine(t('log-auth-fail', { err: err }), 'error');
            btnAuth.disabled = false;
            btnAuth.querySelector('.btn-text').innerText = t('btn-authorize');
        }
    });

    if (window.runtime) {
        window.runtime.EventsOn('cloud-auth-status', (success) => {
            btnAuth.disabled = false;
            btnAuth.querySelector('.btn-text').innerText = t('btn-authorize');
            if (success) {
                isCloudReady = true;
                banner.style.display = 'none';
                toggleCloudUI(true);
                addLogLine(t('log-auth-success'), 'success');
                updateCloudQuota();
                if (currentTab === 'restore') {
                    document.getElementById('btn-fetch-cloud').click();
                }
            } else {
                addLogLine(t('log-auth-fail', { err: "" }), 'error');
            }
        });
    }

    // Initial check
    await checkCloudStatus();
}

async function checkCloudStatus() {
    const banner = document.getElementById('cloud-auth-banner');
    try {
        isCloudReady = await IsCloudConfigured();
        if (isCloudReady) {
            banner.style.display = 'none';
            toggleCloudUI(true);
            updateCloudQuota();
        } else {
            banner.style.display = 'flex';
            toggleCloudUI(false);
            addLogLine(t('log-auth-warning-status'), 'warning');
            updateCloudQuota();
        }
    } catch (err) {
        console.error('Error checking cloud status:', err);
    }
}

// Control UI based on cloud availability
function toggleCloudUI(enabled) {
    const startBtn = document.getElementById('btn-start-backup');
    const fetchBtn = document.getElementById('btn-fetch-cloud');

    if (currentTab === 'backup-cloud') {
        startBtn.disabled = !enabled;
    }
    fetchBtn.disabled = !enabled;
}

async function updateCloudQuota() {
    const quotaContainer = document.getElementById('header-quota-container');
    const quotaText = document.getElementById('quota-value-text');
    const quotaBarFill = document.getElementById('quota-bar-fill');
    
    if (!isCloudReady) {
        quotaContainer.style.display = 'none';
        return;
    }
    
    try {
        const quota = await GetCloudQuota();
        if (quota) {
            const usedGB = (quota.used / (1024 * 1024 * 1024)).toFixed(1);
            const totalGB = (quota.total / (1024 * 1024 * 1024)).toFixed(1);
            const percentage = quota.total > 0 ? Math.round((quota.used / quota.total) * 100) : 0;
            
            quotaText.innerText = `${usedGB} GB / ${totalGB} GB (${percentage}%)`;
            quotaBarFill.style.width = `${percentage}%`;
            
            if (percentage > 90) {
                quotaBarFill.style.backgroundColor = 'var(--danger)';
            } else if (percentage > 75) {
                quotaBarFill.style.backgroundColor = 'var(--warning)';
            } else {
                quotaBarFill.style.backgroundColor = 'var(--accent)';
            }
            
            quotaContainer.style.display = 'flex';
        }
    } catch (err) {
        console.error('Failed to get cloud quota:', err);
        quotaContainer.style.display = 'none';
    }
}

function updateRetentionUI() {
    const isEnabled = document.getElementById('check-retention-enable').checked;
    const statusLabel = document.getElementById('retention-status-label');
    const settingsPanel = document.getElementById('retention-settings-panel');
    
    statusLabel.innerText = isEnabled ? t('retention-enabled') : t('retention-disabled');
    statusLabel.style.color = isEnabled ? 'var(--success)' : 'var(--text-muted)';
    settingsPanel.style.display = isEnabled ? 'flex' : 'none';
}

function toggleOperationUI() {
    // Start button
    const startBtn = document.getElementById('btn-start-backup');
    if (startBtn) {
        startBtn.disabled = isOperationRunning || (currentTab === 'backup-cloud' && !isCloudReady);
    }
    const compSelect = document.getElementById('select-compression');
    if (compSelect) {
        compSelect.disabled = isOperationRunning;
    }
    
    // Restore buttons
    const fetchBtn = document.getElementById('btn-fetch-cloud');
    if (fetchBtn) {
        fetchBtn.disabled = isOperationRunning || !isCloudReady;
    }
    const restoreFullBtn = document.getElementById('btn-restore-full');
    if (restoreFullBtn) {
        restoreFullBtn.disabled = isOperationRunning || !selectedCloudFolder || !selectedBackupFile;
    }
    const restoreDownBtn = document.getElementById('btn-restore-download');
    if (restoreDownBtn) {
        restoreDownBtn.disabled = isOperationRunning || !selectedCloudFolder || !selectedBackupFile;
    }
    
    // Exclusions editor controls
    const saveExclusionsBtn = document.getElementById('btn-exclusions-save');
    if (saveExclusionsBtn) {
        saveExclusionsBtn.disabled = isOperationRunning;
    }
    const resetExclusionsBtn = document.getElementById('btn-exclusions-reset');
    if (resetExclusionsBtn) {
        resetExclusionsBtn.disabled = isOperationRunning;
    }
    const addFolderBtn = document.getElementById('btn-add-folder');
    if (addFolderBtn) {
        addFolderBtn.disabled = isOperationRunning;
    }
    const addFileBtn = document.getElementById('btn-add-file');
    if (addFileBtn) {
        addFileBtn.disabled = isOperationRunning;
    }
    const newFolderInput = document.getElementById('input-new-folder');
    if (newFolderInput) {
        newFolderInput.disabled = isOperationRunning;
    }
    const newFileInput = document.getElementById('input-new-file');
    if (newFileInput) {
        newFileInput.disabled = isOperationRunning;
    }
    
    const checkRetention = document.getElementById('check-retention-enable');
    if (checkRetention) {
        checkRetention.disabled = isOperationRunning;
    }
    const inputRetentionLimit = document.getElementById('input-retention-limit');
    if (inputRetentionLimit) {
        inputRetentionLimit.disabled = isOperationRunning;
    }
    const selectBwlimit = document.getElementById('select-bwlimit');
    if (selectBwlimit) {
        selectBwlimit.disabled = isOperationRunning;
    }
    const selectTransfers = document.getElementById('select-transfers');
    if (selectTransfers) {
        selectTransfers.disabled = isOperationRunning;
    }
    
    // Re-render exclusions list to disable/enable 'x' buttons
    renderExclusionsLists();
}

// 9. Drag and Drop Project Folder Selection
function setupDragAndDrop() {
    const overlay = document.getElementById('drag-overlay');
    let dragCounter = 0; // Prevent overlay flashing due to child element events

    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        if (dragCounter === 1) {
            overlay.classList.add('active');
        }
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            overlay.classList.remove('active');
        }
    });

    window.addEventListener('drop', async (e) => {
        e.preventDefault();
        dragCounter = 0;
        overlay.classList.remove('active');

        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const path = file.path; // Absolute folder/file path in Wails/Electron
            if (path) {
                try {
                    const newConfig = await SetProjectPath(path);
                    config = newConfig;
                    
                    // Update UI path labels
                    document.getElementById('badge-project-name').innerText = config.projectName;
                    document.getElementById('header-project-path').innerText = config.projectRoot;
                    
                    // Log success
                    addLogLine(t('log-detect-root', { root: config.projectRoot }), 'success');
                    addLogLine(t('log-target-cloud', { name: config.projectName }), 'dim');
                    
                    // Reload exclusions list for the new project
                    await loadAndRenderExclusions();
                    updateCloudQuota();
                } catch (err) {
                    addLogLine(`Failed to change project path: ${err}`, 'error');
                }
            }
        }
    });
}
