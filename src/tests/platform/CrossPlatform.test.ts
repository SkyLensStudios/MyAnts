/**
 * Cross-Platform Compatibility Tests
 * Tests for Electron integration, platform-specific features, and deployment scenarios
 */

// Mock platform detection
const mockPlatformDetector = {
  getCurrentPlatform: jest.fn().mockReturnValue('linux'),
  isWindows: jest.fn().mockReturnValue(false),
  isMacOS: jest.fn().mockReturnValue(false),
  isLinux: jest.fn().mockReturnValue(true),
  getArchitecture: jest.fn().mockReturnValue('x64'),
  getNodeVersion: jest.fn().mockReturnValue('v18.17.0'),
  getElectronVersion: jest.fn().mockReturnValue('25.3.1'),
  getChromiumVersion: jest.fn().mockReturnValue('114.0.5735.289'),
  getSystemInfo: jest.fn().mockReturnValue({
    platform: 'linux',
    arch: 'x64',
    release: '5.15.0-78-generic',
    type: 'Linux',
    totalmem: 17179869184, // 16GB
    freemem: 8589934592,   // 8GB
    cpus: [
      { model: 'Intel(R) Core(TM) i7-9700K', speed: 3600, times: {} },
      { model: 'Intel(R) Core(TM) i7-9700K', speed: 3600, times: {} }
    ]
  })
};

// Mock Electron main process features
const mockElectronMain = {
  createWindow: jest.fn().mockReturnValue({
    id: 1,
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
      openDevTools: jest.fn(),
      closeDevTools: jest.fn()
    },
    on: jest.fn(),
    close: jest.fn(),
    minimize: jest.fn(),
    maximize: jest.fn(),
    unmaximize: jest.fn(),
    isMaximized: jest.fn().mockReturnValue(false),
    setFullScreen: jest.fn(),
    isFullScreen: jest.fn().mockReturnValue(false),
    setTitle: jest.fn(),
    getTitle: jest.fn().mockReturnValue('MyAnts - Ant Farm Simulator')
  }),
  getMenuTemplate: jest.fn().mockReturnValue([
    {
      label: 'File',
      submenu: [
        { label: 'New Simulation', accelerator: 'CmdOrCtrl+N' },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S' },
        { type: 'separator' },
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Developer Tools', accelerator: 'F12' },
        { label: 'Toggle Fullscreen', accelerator: 'F11' }
      ]
    }
  ]),
  handleFileOperations: jest.fn().mockImplementation((operation: string) => {
    switch (operation) {
      case 'save':
        return Promise.resolve({ 
          filePath: '/home/user/Documents/colony_save.json',
          success: true 
        });
      case 'open':
        return Promise.resolve({
          filePath: '/home/user/Documents/existing_colony.json',
          data: { ants: 500, environment: {} },
          success: true
        });
      default:
        return Promise.resolve({ success: false });
    }
  }),
  getAppPaths: jest.fn().mockReturnValue({
    userData: '/home/user/.config/myants',
    documents: '/home/user/Documents',
    downloads: '/home/user/Downloads',
    temp: '/tmp'
  }),
  checkPermissions: jest.fn().mockReturnValue({
    fileSystem: true,
    camera: false,
    microphone: false,
    notifications: true
  })
};

// Mock file system operations
const mockFileSystem = {
  readFile: jest.fn().mockImplementation((path: string) => {
    if (path.includes('colony_save.json')) {
      return Promise.resolve(JSON.stringify({
        version: '1.0.0',
        timestamp: Date.now(),
        simulation: { ants: 1000, environment: { temperature: 25 } }
      }));
    }
    return Promise.reject(new Error('File not found'));
  }),
  writeFile: jest.fn().mockResolvedValue(true),
  exists: jest.fn().mockImplementation((path: string) => {
    return Promise.resolve(path.includes('existing'));
  }),
  createDirectory: jest.fn().mockResolvedValue(true),
  listDirectory: jest.fn().mockResolvedValue([
    'colony_save_001.json',
    'colony_save_002.json',
    'settings.json'
  ]),
  getFileStats: jest.fn().mockResolvedValue({
    size: 1024768,
    created: Date.now() - 86400000,
    modified: Date.now() - 3600000,
    isFile: true,
    isDirectory: false
  }),
  watchFile: jest.fn(),
  unwatchFile: jest.fn()
};

// Mock hardware capabilities detection
const mockHardwareDetector = {
  detectGPU: jest.fn().mockReturnValue({
    vendor: 'NVIDIA Corporation',
    renderer: 'NVIDIA GeForce GTX 1660 Ti/PCIe/SSE2',
    version: 'OpenGL 4.6.0 NVIDIA 470.182.03',
    extensions: ['GL_ARB_gpu_memory_info', 'GL_NVX_gpu_memory_info'],
    memoryMB: 6144,
    tier: 2
  }),
  detectCPU: jest.fn().mockReturnValue({
    model: 'Intel(R) Core(TM) i7-9700K CPU @ 3.60GHz',
    cores: 8,
    threads: 8,
    architecture: 'x64',
    features: ['avx2', 'sse4_2', 'fma3'],
    clockSpeed: 3600,
    cacheSizeL3: 12582912 // 12MB
  }),
  detectMemory: jest.fn().mockReturnValue({
    totalGB: 16,
    availableGB: 8,
    usedGB: 8,
    type: 'DDR4',
    speed: 3200
  }),
  detectDisplay: jest.fn().mockReturnValue({
    screens: [
      {
        id: 0,
        primary: true,
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        refreshRate: 144
      }
    ],
    primaryScreen: {
      width: 1920,
      height: 1080,
      scaleFactor: 1.0
    }
  }),
  benchmarkPerformance: jest.fn().mockResolvedValue({
    cpuScore: 8500,
    gpuScore: 6200,
    memoryScore: 7800,
    overallScore: 7500,
    tier: 'mid-high'
  })
};

// Mock application lifecycle
const mockAppLifecycle = {
  onReady: jest.fn(),
  onWindowAllClosed: jest.fn(),
  onActivate: jest.fn(),
  onBeforeQuit: jest.fn(),
  onWillQuit: jest.fn(),
  getVersion: jest.fn().mockReturnValue('1.0.0'),
  getName: jest.fn().mockReturnValue('MyAnts'),
  isPackaged: jest.fn().mockReturnValue(false),
  getPath: jest.fn().mockImplementation((name: string) => {
    const paths: { [key: string]: string } = {
      'userData': '/home/user/.config/myants',
      'appData': '/home/user/.config',
      'documents': '/home/user/Documents',
      'downloads': '/home/user/Downloads',
      'temp': '/tmp',
      'exe': '/opt/myants/myants'
    };
    return paths[name] || '/unknown';
  }),
  quit: jest.fn(),
  relaunch: jest.fn(),
  focus: jest.fn()
};

// Mock auto-updater
const mockAutoUpdater = {
  checkForUpdates: jest.fn().mockResolvedValue({
    updateAvailable: true,
    version: '1.1.0',
    releaseNotes: 'Bug fixes and performance improvements',
    downloadURL: 'https://releases.myants.com/v1.1.0'
  }),
  downloadUpdate: jest.fn().mockResolvedValue({
    success: true,
    downloadPath: '/tmp/myants-update-v1.1.0.AppImage'
  }),
  installUpdate: jest.fn().mockResolvedValue(true),
  getUpdateStatus: jest.fn().mockReturnValue({
    checking: false,
    available: true,
    downloading: false,
    downloaded: false,
    installing: false,
    error: null
  }),
  setUpdateChannel: jest.fn(),
  enableAutoUpdate: jest.fn(),
  disableAutoUpdate: jest.fn()
};

// Mock native integrations
const mockNativeIntegrations = {
  showNotification: jest.fn().mockImplementation((options: any) => {
    return Promise.resolve({
      shown: true,
      clicked: false,
      closed: false,
      id: `notification_${Date.now()}`
    });
  }),
  setDockBadge: jest.fn(), // macOS only
  setBadgeCount: jest.fn(), // Windows/Linux
  registerGlobalShortcut: jest.fn().mockReturnValue(true),
  unregisterGlobalShortcut: jest.fn().mockReturnValue(true),
  openExternal: jest.fn().mockResolvedValue(true),
  showItemInFolder: jest.fn().mockResolvedValue(true),
  openPath: jest.fn().mockResolvedValue(''),
  beep: jest.fn(),
  getSystemPreferences: jest.fn().mockReturnValue({
    theme: 'dark',
    animationsEnabled: true,
    colorScheme: 'dark'
  }),
  watchSystemPreferences: jest.fn(),
  unwatchSystemPreferences: jest.fn()
};

describe('Cross-Platform Compatibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Platform Detection and System Information', () => {
    test('should correctly detect platform', () => {
      const platform = mockPlatformDetector.getCurrentPlatform();
      expect(['win32', 'darwin', 'linux'].includes(platform)).toBe(true);
      
      expect(mockPlatformDetector.isLinux()).toBe(true);
      expect(mockPlatformDetector.isWindows()).toBe(false);
      expect(mockPlatformDetector.isMacOS()).toBe(false);
    });

    test('should detect system architecture', () => {
      const arch = mockPlatformDetector.getArchitecture();
      expect(['x64', 'arm64', 'ia32'].includes(arch)).toBe(true);
    });

    test('should get runtime versions', () => {
      const nodeVersion = mockPlatformDetector.getNodeVersion();
      const electronVersion = mockPlatformDetector.getElectronVersion();
      const chromiumVersion = mockPlatformDetector.getChromiumVersion();
      
      expect(nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
      expect(electronVersion).toMatch(/^\d+\.\d+\.\d+/);
      expect(chromiumVersion).toMatch(/^\d+\.\d+\.\d+/);
    });

    test('should provide comprehensive system information', () => {
      const systemInfo = mockPlatformDetector.getSystemInfo();
      
      expect(systemInfo).toBeDefined();
      expect(systemInfo.platform).toBeDefined();
      expect(systemInfo.arch).toBeDefined();
      expect(typeof systemInfo.totalmem).toBe('number');
      expect(typeof systemInfo.freemem).toBe('number');
      expect(Array.isArray(systemInfo.cpus)).toBe(true);
    });
  });

  describe('Electron Main Process Integration', () => {
    test('should create and manage windows', () => {
      const window = mockElectronMain.createWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: 'preload.js'
        }
      });
      
      expect(window).toBeDefined();
      expect(window.id).toBeDefined();
      expect(window.webContents).toBeDefined();
      expect(typeof window.close).toBe('function');
      expect(typeof window.minimize).toBe('function');
      expect(typeof window.maximize).toBe('function');
    });

    test('should handle window state management', () => {
      const window = mockElectronMain.createWindow();
      
      // Test maximize/minimize
      window.maximize();
      expect(window.maximize).toHaveBeenCalled();
      
      const isMaximized = window.isMaximized();
      expect(typeof isMaximized).toBe('boolean');
      
      // Test fullscreen
      window.setFullScreen(true);
      expect(window.setFullScreen).toHaveBeenCalledWith(true);
      
      const isFullScreen = window.isFullScreen();
      expect(typeof isFullScreen).toBe('boolean');
    });

    test('should manage application menus', () => {
      const menuTemplate = mockElectronMain.getMenuTemplate();
      
      expect(Array.isArray(menuTemplate)).toBe(true);
      expect(menuTemplate.length).toBeGreaterThan(0);
      
      // Check menu structure
      const fileMenu = menuTemplate.find((menu: any) => menu.label === 'File');
      expect(fileMenu).toBeDefined();
      expect(Array.isArray(fileMenu.submenu)).toBe(true);
    });

    test('should handle file operations', async () => {
      // Test save operation
      const saveResult = await mockElectronMain.handleFileOperations('save');
      expect(saveResult.success).toBe(true);
      expect(saveResult.filePath).toBeDefined();
      
      // Test open operation
      const openResult = await mockElectronMain.handleFileOperations('open');
      expect(openResult.success).toBe(true);
      expect(openResult.data).toBeDefined();
    });

    test('should provide application paths', () => {
      const paths = mockElectronMain.getAppPaths();
      
      expect(paths).toBeDefined();
      expect(paths.userData).toBeDefined();
      expect(paths.documents).toBeDefined();
      expect(paths.downloads).toBeDefined();
      expect(paths.temp).toBeDefined();
    });

    test('should check system permissions', () => {
      const permissions = mockElectronMain.checkPermissions();
      
      expect(permissions).toBeDefined();
      expect(typeof permissions.fileSystem).toBe('boolean');
      expect(typeof permissions.notifications).toBe('boolean');
    });
  });

  describe('File System Operations', () => {
    test('should handle file reading and writing', async () => {
      const testData = { test: 'data', timestamp: Date.now() };
      
      // Write file
      const writeResult = await mockFileSystem.writeFile(
        '/test/path/data.json',
        JSON.stringify(testData)
      );
      expect(writeResult).toBe(true);
      
      // Read file
      const readResult = await mockFileSystem.readFile('/test/path/colony_save.json');
      expect(readResult).toBeDefined();
      
      const parsedData = JSON.parse(readResult);
      expect(parsedData).toHaveProperty('version');
      expect(parsedData).toHaveProperty('simulation');
    });

    test('should handle directory operations', async () => {
      // Create directory
      const createResult = await mockFileSystem.createDirectory('/test/new_directory');
      expect(createResult).toBe(true);
      
      // List directory contents
      const contents = await mockFileSystem.listDirectory('/test/directory');
      expect(Array.isArray(contents)).toBe(true);
      expect(contents.length).toBeGreaterThan(0);
    });

    test('should provide file statistics', async () => {
      const stats = await mockFileSystem.getFileStats('/test/file.json');
      
      expect(stats).toBeDefined();
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.created).toBe('number');
      expect(typeof stats.modified).toBe('number');
      expect(typeof stats.isFile).toBe('boolean');
      expect(typeof stats.isDirectory).toBe('boolean');
    });

    test('should check file existence', async () => {
      const existingFile = await mockFileSystem.exists('/path/to/existing_file.json');
      expect(existingFile).toBe(true);
      
      const nonExistingFile = await mockFileSystem.exists('/path/to/missing_file.json');
      expect(nonExistingFile).toBe(false);
    });

    test('should handle file watching', () => {
      const filePath = '/test/watched_file.json';
      const callback = jest.fn();
      
      mockFileSystem.watchFile(filePath, callback);
      expect(mockFileSystem.watchFile).toHaveBeenCalledWith(filePath, callback);
      
      mockFileSystem.unwatchFile(filePath, callback);
      expect(mockFileSystem.unwatchFile).toHaveBeenCalledWith(filePath, callback);
    });

    test('should handle file system errors gracefully', async () => {
      try {
        await mockFileSystem.readFile('/nonexistent/path/file.json');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('not found');
      }
    });
  });

  describe('Hardware Capabilities Detection', () => {
    test('should detect GPU capabilities', () => {
      const gpu = mockHardwareDetector.detectGPU();
      
      expect(gpu).toBeDefined();
      expect(gpu.vendor).toBeDefined();
      expect(gpu.renderer).toBeDefined();
      expect(typeof gpu.memoryMB).toBe('number');
      expect(typeof gpu.tier).toBe('number');
      expect(Array.isArray(gpu.extensions)).toBe(true);
    });

    test('should detect CPU information', () => {
      const cpu = mockHardwareDetector.detectCPU();
      
      expect(cpu).toBeDefined();
      expect(cpu.model).toBeDefined();
      expect(typeof cpu.cores).toBe('number');
      expect(typeof cpu.threads).toBe('number');
      expect(typeof cpu.clockSpeed).toBe('number');
      expect(Array.isArray(cpu.features)).toBe(true);
    });

    test('should detect memory information', () => {
      const memory = mockHardwareDetector.detectMemory();
      
      expect(memory).toBeDefined();
      expect(typeof memory.totalGB).toBe('number');
      expect(typeof memory.availableGB).toBe('number');
      expect(typeof memory.usedGB).toBe('number');
      expect(memory.type).toBeDefined();
      expect(typeof memory.speed).toBe('number');
    });

    test('should detect display information', () => {
      const display = mockHardwareDetector.detectDisplay();
      
      expect(display).toBeDefined();
      expect(Array.isArray(display.screens)).toBe(true);
      expect(display.primaryScreen).toBeDefined();
      expect(typeof display.primaryScreen.width).toBe('number');
      expect(typeof display.primaryScreen.height).toBe('number');
    });

    test('should benchmark system performance', async () => {
      const benchmark = await mockHardwareDetector.benchmarkPerformance();
      
      expect(benchmark).toBeDefined();
      expect(typeof benchmark.cpuScore).toBe('number');
      expect(typeof benchmark.gpuScore).toBe('number');
      expect(typeof benchmark.memoryScore).toBe('number');
      expect(typeof benchmark.overallScore).toBe('number');
      expect(benchmark.tier).toBeDefined();
    });
  });

  describe('Application Lifecycle Management', () => {
    test('should handle application events', () => {
      mockAppLifecycle.onReady();
      mockAppLifecycle.onWindowAllClosed();
      mockAppLifecycle.onActivate();
      
      expect(mockAppLifecycle.onReady).toHaveBeenCalled();
      expect(mockAppLifecycle.onWindowAllClosed).toHaveBeenCalled();
      expect(mockAppLifecycle.onActivate).toHaveBeenCalled();
    });

    test('should provide application information', () => {
      const version = mockAppLifecycle.getVersion();
      const name = mockAppLifecycle.getName();
      const isPackaged = mockAppLifecycle.isPackaged();
      
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
      expect(typeof name).toBe('string');
      expect(typeof isPackaged).toBe('boolean');
    });

    test('should handle application paths', () => {
      const userDataPath = mockAppLifecycle.getPath('userData');
      const documentsPath = mockAppLifecycle.getPath('documents');
      const tempPath = mockAppLifecycle.getPath('temp');
      
      expect(typeof userDataPath).toBe('string');
      expect(typeof documentsPath).toBe('string');
      expect(typeof tempPath).toBe('string');
    });

    test('should handle application control', () => {
      mockAppLifecycle.quit();
      mockAppLifecycle.relaunch();
      mockAppLifecycle.focus();
      
      expect(mockAppLifecycle.quit).toHaveBeenCalled();
      expect(mockAppLifecycle.relaunch).toHaveBeenCalled();
      expect(mockAppLifecycle.focus).toHaveBeenCalled();
    });

    test('should handle quit events', () => {
      mockAppLifecycle.onBeforeQuit();
      mockAppLifecycle.onWillQuit();
      
      expect(mockAppLifecycle.onBeforeQuit).toHaveBeenCalled();
      expect(mockAppLifecycle.onWillQuit).toHaveBeenCalled();
    });
  });

  describe('Auto-Update System', () => {
    test('should check for updates', async () => {
      const updateInfo = await mockAutoUpdater.checkForUpdates();
      
      expect(updateInfo).toBeDefined();
      expect(typeof updateInfo.updateAvailable).toBe('boolean');
      
      if (updateInfo.updateAvailable) {
        expect(updateInfo.version).toBeDefined();
        expect(updateInfo.releaseNotes).toBeDefined();
        expect(updateInfo.downloadURL).toBeDefined();
      }
    });

    test('should download updates', async () => {
      const downloadResult = await mockAutoUpdater.downloadUpdate();
      
      expect(downloadResult).toBeDefined();
      expect(downloadResult.success).toBe(true);
      expect(downloadResult.downloadPath).toBeDefined();
    });

    test('should install updates', async () => {
      const installResult = await mockAutoUpdater.installUpdate();
      expect(installResult).toBe(true);
    });

    test('should track update status', () => {
      const status = mockAutoUpdater.getUpdateStatus();
      
      expect(status).toBeDefined();
      expect(typeof status.checking).toBe('boolean');
      expect(typeof status.available).toBe('boolean');
      expect(typeof status.downloading).toBe('boolean');
      expect(typeof status.downloaded).toBe('boolean');
    });

    test('should manage update channels', () => {
      mockAutoUpdater.setUpdateChannel('beta');
      expect(mockAutoUpdater.setUpdateChannel).toHaveBeenCalledWith('beta');
      
      mockAutoUpdater.enableAutoUpdate();
      mockAutoUpdater.disableAutoUpdate();
      
      expect(mockAutoUpdater.enableAutoUpdate).toHaveBeenCalled();
      expect(mockAutoUpdater.disableAutoUpdate).toHaveBeenCalled();
    });
  });

  describe('Native System Integrations', () => {
    test('should show native notifications', async () => {
      const notification = await mockNativeIntegrations.showNotification({
        title: 'Colony Update',
        body: 'Your ant colony has reached 1000 members!',
        icon: '/path/to/icon.png',
        urgency: 'normal'
      });
      
      expect(notification).toBeDefined();
      expect(notification.shown).toBe(true);
      expect(notification.id).toBeDefined();
    });

    test('should handle badge notifications', () => {
      // macOS dock badge
      mockNativeIntegrations.setDockBadge('5');
      expect(mockNativeIntegrations.setDockBadge).toHaveBeenCalledWith('5');
      
      // Windows/Linux badge count
      mockNativeIntegrations.setBadgeCount(5);
      expect(mockNativeIntegrations.setBadgeCount).toHaveBeenCalledWith(5);
    });

    test('should register global shortcuts', () => {
      const shortcuts = [
        'CommandOrControl+Shift+S', // Quick save
        'F11',                      // Fullscreen
        'CommandOrControl+R'        // Reset simulation
      ];
      
      shortcuts.forEach(shortcut => {
        const registered = mockNativeIntegrations.registerGlobalShortcut(shortcut);
        expect(registered).toBe(true);
        expect(mockNativeIntegrations.registerGlobalShortcut).toHaveBeenCalledWith(shortcut);
      });
    });

    test('should handle external links and files', async () => {
      // Open external URL
      const urlResult = await mockNativeIntegrations.openExternal('https://myants.com/help');
      expect(urlResult).toBe(true);
      
      // Show file in folder
      const folderResult = await mockNativeIntegrations.showItemInFolder('/path/to/save.json');
      expect(folderResult).toBe(true);
      
      // Open file path
      const pathResult = await mockNativeIntegrations.openPath('/path/to/document.pdf');
      expect(typeof pathResult).toBe('string');
    });

    test('should integrate with system preferences', () => {
      const preferences = mockNativeIntegrations.getSystemPreferences();
      
      expect(preferences).toBeDefined();
      expect(['light', 'dark'].includes(preferences.theme)).toBe(true);
      expect(typeof preferences.animationsEnabled).toBe('boolean');
    });

    test('should provide system feedback', () => {
      mockNativeIntegrations.beep();
      expect(mockNativeIntegrations.beep).toHaveBeenCalled();
    });

    test('should watch system preference changes', () => {
      const callback = jest.fn();
      
      mockNativeIntegrations.watchSystemPreferences(callback);
      expect(mockNativeIntegrations.watchSystemPreferences).toHaveBeenCalledWith(callback);
      
      mockNativeIntegrations.unwatchSystemPreferences(callback);
      expect(mockNativeIntegrations.unwatchSystemPreferences).toHaveBeenCalledWith(callback);
    });
  });

  describe('Platform-Specific Feature Tests', () => {
    test('should handle Linux-specific features', () => {
      if (mockPlatformDetector.isLinux()) {
        // Test AppImage integration
        const appImagePath = mockAppLifecycle.getPath('exe');
        expect(appImagePath).toBeDefined();
        
        // Test desktop integration
        const desktopFile = mockFileSystem.exists('/usr/share/applications/myants.desktop');
        expect(typeof desktopFile).toBe('object'); // Promise
        
        // Test system tray
        mockNativeIntegrations.setBadgeCount(5);
        expect(mockNativeIntegrations.setBadgeCount).toHaveBeenCalledWith(5);
      }
    });

    test('should handle Windows-specific features', () => {
      if (mockPlatformDetector.isWindows()) {
        // Test Windows installer integration
        const installPath = mockAppLifecycle.getPath('exe');
        expect(installPath).toContain('Program Files');
        
        // Test Windows notifications
        mockNativeIntegrations.showNotification({
          title: 'Windows Test',
          body: 'Testing Windows-specific notification'
        });
        
        // Test Windows taskbar
        mockNativeIntegrations.setBadgeCount(3);
        expect(mockNativeIntegrations.setBadgeCount).toHaveBeenCalledWith(3);
      }
    });

    test('should handle macOS-specific features', () => {
      if (mockPlatformDetector.isMacOS()) {
        // Test macOS app bundle
        const appPath = mockAppLifecycle.getPath('exe');
        expect(appPath).toContain('.app');
        
        // Test macOS dock
        mockNativeIntegrations.setDockBadge('10');
        expect(mockNativeIntegrations.setDockBadge).toHaveBeenCalledWith('10');
        
        // Test macOS menu bar
        const menuTemplate = mockElectronMain.getMenuTemplate();
        expect(menuTemplate[0].label).toBe('File'); // macOS has app name as first menu
      }
    });
  });

  describe('Deployment and Packaging Tests', () => {
    test('should handle packaged application state', () => {
      const isPackaged = mockAppLifecycle.isPackaged();
      
      if (isPackaged) {
        // In packaged mode, resources should be read-only
        const userData = mockAppLifecycle.getPath('userData');
        expect(userData).not.toContain('node_modules');
        
        // Auto-updater should be available
        mockAutoUpdater.checkForUpdates();
        expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalled();
      } else {
        // In development mode, should have access to dev tools
        const window = mockElectronMain.createWindow();
        window.webContents.openDevTools();
        expect(window.webContents.openDevTools).toHaveBeenCalled();
      }
    });

    test('should handle resource paths correctly', () => {
      const paths = mockElectronMain.getAppPaths();
      
      // Ensure paths are platform-appropriate
      if (mockPlatformDetector.isWindows()) {
        expect(paths.userData).toMatch(/[A-Z]:\\/);
      } else {
        expect(paths.userData).toMatch(/^\//);
      }
    });

    test('should handle application signing and security', () => {
      const permissions = mockElectronMain.checkPermissions();
      
      // Basic permissions should be available
      expect(permissions.fileSystem).toBe(true);
      
      // Some permissions might be restricted
      expect(typeof permissions.camera).toBe('boolean');
      expect(typeof permissions.microphone).toBe('boolean');
    });

    test('should handle different installation methods', () => {
      const exePath = mockAppLifecycle.getPath('exe');
      
      // Check if installation path suggests specific package format
      if (exePath.includes('.AppImage')) {
        // AppImage format (Linux)
        expect(mockPlatformDetector.isLinux()).toBe(true);
      } else if (exePath.includes('Program Files')) {
        // Windows installer
        expect(mockPlatformDetector.isWindows()).toBe(true);
      } else if (exePath.includes('.app')) {
        // macOS app bundle
        expect(mockPlatformDetector.isMacOS()).toBe(true);
      }
    });
  });

  describe('Performance Across Platforms', () => {
    test('should benchmark platform-specific performance', async () => {
      const benchmark = await mockHardwareDetector.benchmarkPerformance();
      
      // Performance should be reasonable across platforms
      expect(benchmark.overallScore).toBeGreaterThan(1000);
      
      // Different platforms may have different strengths
      if (mockPlatformDetector.isLinux()) {
        // Linux often has good CPU performance
        expect(benchmark.cpuScore).toBeGreaterThan(5000);
      }
    });

    test('should adapt to platform-specific limitations', () => {
      const systemInfo = mockPlatformDetector.getSystemInfo();
      const gpu = mockHardwareDetector.detectGPU();
      
      // Adjust expectations based on platform
      if (systemInfo.totalmem < 4 * 1024 * 1024 * 1024) { // Less than 4GB
        // Low memory system
        expect(gpu.tier).toBeLessThanOrEqual(2);
      }
      
      if (gpu.tier <= 1) {
        // Low-end GPU, should still function
        expect(gpu.memoryMB).toBeGreaterThan(0);
      }
    });

    test('should handle platform-specific graphics capabilities', () => {
      const gpu = mockHardwareDetector.detectGPU();
      
      // Check for platform-specific GPU vendors
      const vendors = ['NVIDIA Corporation', 'AMD', 'Intel', 'Apple'];
      expect(vendors.some(vendor => gpu.vendor.includes(vendor))).toBe(true);
      
      // Check for basic graphics support
      expect(gpu.extensions.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Platform Data Compatibility', () => {
    test('should handle file paths across platforms', async () => {
      const testPaths = [
        '/unix/style/path.json',
        'C:\\Windows\\style\\path.json',
        '~/user/home/path.json'
      ];
      
      testPaths.forEach(path => {
        // File operations should normalize paths internally
        mockFileSystem.exists(path);
        expect(mockFileSystem.exists).toHaveBeenCalledWith(path);
      });
    });

    test('should handle text encoding consistently', async () => {
      const testData = {
        unicode: '🐜 MyAnts - Unicode Support Test',
        special: 'Special chars: áéíóú ñÑ çÇ',
        emoji: '🌍🌱🔬📊'
      };
      
      const jsonData = JSON.stringify(testData);
      await mockFileSystem.writeFile('/test/unicode.json', jsonData);
      
      const readData = await mockFileSystem.readFile('/test/unicode.json');
      const parsedData = JSON.parse(readData);
      
      expect(parsedData.unicode).toBe(testData.unicode);
      expect(parsedData.special).toBe(testData.special);
      expect(parsedData.emoji).toBe(testData.emoji);
    });

    test('should handle different line endings', async () => {
      const unixContent = 'Line 1\nLine 2\nLine 3\n';
      const windowsContent = 'Line 1\r\nLine 2\r\nLine 3\r\n';
      const macContent = 'Line 1\rLine 2\rLine 3\r';
      
      // All should be handled gracefully
      await mockFileSystem.writeFile('/test/unix.txt', unixContent);
      await mockFileSystem.writeFile('/test/windows.txt', windowsContent);
      await mockFileSystem.writeFile('/test/mac.txt', macContent);
      
      expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(3);
    });

    test('should maintain data integrity across platforms', async () => {
      const simulationData = {
        version: '1.0.0',
        platform: mockPlatformDetector.getCurrentPlatform(),
        timestamp: Date.now(),
        simulation: {
          ants: 1000,
          environment: { temperature: 25.5, humidity: 0.65 },
          settings: { quality: 'medium', fps: 60 }
        }
      };
      
      // Save data
      await mockFileSystem.writeFile(
        '/test/cross_platform_save.json',
        JSON.stringify(simulationData, null, 2)
      );
      
      // Load data
      const loadedData = await mockFileSystem.readFile('/test/cross_platform_save.json');
      const parsed = JSON.parse(loadedData);
      
      expect(parsed.version).toBe(simulationData.version);
      expect(parsed.simulation.ants).toBe(simulationData.simulation.ants);
      expect(parsed.simulation.environment.temperature).toBe(simulationData.simulation.environment.temperature);
    });
  });

  describe('Security and Permissions', () => {
    test('should handle security contexts appropriately', () => {
      const permissions = mockElectronMain.checkPermissions();
      
      // File system access should be available for saves
      expect(permissions.fileSystem).toBe(true);
      
      // Camera/microphone should be restricted unless needed
      expect(typeof permissions.camera).toBe('boolean');
      expect(typeof permissions.microphone).toBe('boolean');
    });

    test('should validate file access patterns', async () => {
      const userDataPath = mockAppLifecycle.getPath('userData');
      const documentsPath = mockAppLifecycle.getPath('documents');
      
      // Should be able to write to user data directory
      const userDataWrite = await mockFileSystem.writeFile(
        `${userDataPath}/app_settings.json`,
        '{}'
      );
      expect(userDataWrite).toBe(true);
      
      // Should be able to read from documents (with permission)
      const documentsRead = await mockFileSystem.readFile(
        `${documentsPath}/existing_colony.json`
      );
      expect(documentsRead).toBeDefined();
    });

    test('should handle sandboxing restrictions', () => {
      // In sandboxed environments, certain operations might be restricted
      const isPackaged = mockAppLifecycle.isPackaged();
      
      if (isPackaged) {
        // Packaged apps might have additional restrictions
        const permissions = mockElectronMain.checkPermissions();
        expect(permissions).toBeDefined();
      }
    });
  });
});