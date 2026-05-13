// src/usbFileManager.js - Multi-divisi version
// Setiap divisi memiliki folder sendiri di dalam root USB.
// File santri_data.json tetap di root.

const usbFileManager = (function() {
    const HANDLE_KEY = 'usb_root_handle';
    const DB_NAME = 'USBFileManagerDB';
    const STORE_NAME = 'handles';
    const DB_VERSION = 2;
    const METADATA_FILE = 'file_metadata.json';

    let metadataCache = null;

    // Helper untuk mendapatkan ID divisi aktif (dari localStorage)
    function getCurrentDivisiId() {
        let divisiId = localStorage.getItem('divisi_aktif');
        if (!divisiId) {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            divisiId = user.divisiId || 'bahasa';
        }
        return divisiId;
    }

    async function saveHandle(handle) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.close();
                    reject(new Error('Object store tidak ditemukan setelah upgrade'));
                    return;
                }
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put(handle, HANDLE_KEY);
                tx.oncomplete = () => {
                    db.close();
                    resolve();
                };
                tx.onerror = (err) => {
                    db.close();
                    reject(err);
                };
            };
            request.onerror = (err) => reject(err);
        });
    }

    async function loadHandle() {
        return new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.close();
                    resolve(null);
                    return;
                }
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const get = store.get(HANDLE_KEY);
                get.onsuccess = () => {
                    const result = get.result;
                    db.close();
                    resolve(result);
                };
                get.onerror = () => {
                    db.close();
                    resolve(null);
                };
            };
            request.onerror = () => resolve(null);
        });
    }

    async function loadMetadata() {
        if (metadataCache !== null) return metadataCache;
        const dirHandle = await getRootHandle();
        if (!dirHandle) return {};
        try {
            const fileHandle = await dirHandle.getFileHandle(METADATA_FILE);
            const file = await fileHandle.getFile();
            const text = await file.text();
            metadataCache = JSON.parse(text);
            return metadataCache;
        } catch {
            metadataCache = {};
            return metadataCache;
        }
    }

    async function saveMetadata() {
        if (metadataCache === null) return;
        const dirHandle = await getRootHandle();
        if (!dirHandle) return;
        try {
            const fileHandle = await dirHandle.getFileHandle(METADATA_FILE, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(metadataCache, null, 2));
            await writable.close();
        } catch (err) {
            console.error('Gagal menyimpan metadata:', err);
        }
    }

    async function setFileCategory(filename, category) {
        await loadMetadata();
        metadataCache[filename] = category;
        await saveMetadata();
    }

    async function getFileCategory(filename) {
        await loadMetadata();
        return metadataCache[filename] || tebakKategori(filename);
    }

    async function removeFileCategory(filename) {
        await loadMetadata();
        delete metadataCache[filename];
        await saveMetadata();
    }

    async function pilihFolder() {
        try {
            const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await saveHandle(dirHandle);
            metadataCache = null;
            return dirHandle;
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Gagal memilih folder:', err);
            return null;
        }
    }

    async function getRootHandle() {
        let handle = await loadHandle();
        if (!handle) return null;
        try {
            await handle.requestPermission({ mode: 'readwrite' });
            return handle;
        } catch {
            return null;
        }
    }

    // Mendapatkan handle folder divisi (buat jika belum ada)
    async function getDivisiFolderHandle(divisiId) {
        const rootHandle = await getRootHandle();
        if (!rootHandle) return null;
        try {
            // Coba akses folder divisi
            return await rootHandle.getDirectoryHandle(divisiId, { create: true });
        } catch (err) {
            console.error('Gagal mengakses folder divisi:', err);
            return null;
        }
    }

    // Baca file JSON dari folder divisi (atau root untuk santri_data.json)
    async function readJSONFile(filename) {
        const rootHandle = await getRootHandle();
        if (!rootHandle) return null;
        
        // Kecuali untuk santri_data.json, baca dari root
        if (filename === 'santri_data.json') {
            try {
                const fileHandle = await rootHandle.getFileHandle(filename);
                const file = await fileHandle.getFile();
                const text = await file.text();
                return JSON.parse(text);
            } catch { return null; }
        }
        
        // Untuk file lain, baca dari folder divisi
        const divisiId = getCurrentDivisiId();
        const divisiFolder = await getDivisiFolderHandle(divisiId);
        if (!divisiFolder) return null;
        try {
            const fileHandle = await divisiFolder.getFileHandle(filename);
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text);
        } catch { return null; }
    }

    // Simpan data JSON ke folder divisi (atau root untuk santri_data.json)
    async function saveData(filename, data) {
        const rootHandle = await getRootHandle();
        if (!rootHandle) return false;
        
        if (filename === 'santri_data.json') {
            try {
                const fileHandle = await rootHandle.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(data, null, 2));
                await writable.close();
                return true;
            } catch (err) {
                console.error('Gagal menyimpan santri_data.json:', err);
                return false;
            }
        }
        
        const divisiId = getCurrentDivisiId();
        const divisiFolder = await getDivisiFolderHandle(divisiId);
        if (!divisiFolder) return false;
        try {
            const fileHandle = await divisiFolder.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
            return true;
        } catch (err) {
            console.error('Gagal menyimpan data di folder divisi:', err);
            return false;
        }
    }

    // List files dari folder divisi (kecuali metadata)
    async function listFiles() {
        const rootHandle = await getRootHandle();
        if (!rootHandle) return [];
        const divisiId = getCurrentDivisiId();
        const divisiFolder = await getDivisiFolderHandle(divisiId);
        if (!divisiFolder) return [];
        
        await loadMetadata();
        const files = [];
        try {
            for await (const entry of divisiFolder.values()) {
                if (entry.kind === 'file' && entry.name !== METADATA_FILE) {
                    const file = await entry.getFile();
                    const category = await getFileCategory(entry.name);
                    files.push({
                        name: entry.name,
                        size: file.size,
                        type: file.type || 'application/octet-stream',
                        lastModified: file.lastModified,
                        handle: entry,
                        category: category
                    });
                }
            }
            files.sort((a, b) => b.lastModified - a.lastModified);
        } catch (err) {
            console.error('Gagal membaca daftar file di divisi:', err);
        }
        return files;
    }

    // Upload file ke folder divisi (atau root jika file khusus?)
    async function uploadFile(file, category) {
        const rootHandle = await getRootHandle();
        if (!rootHandle) throw new Error('Tidak dapat mengakses folder root USB.');
        
        const divisiId = getCurrentDivisiId();
        const divisiFolder = await getDivisiFolderHandle(divisiId);
        if (!divisiFolder) throw new Error('Tidak dapat mengakses folder divisi.');
        
        const fileName = file.name;
        try {
            let fileHandle;
            try {
                fileHandle = await divisiFolder.getFileHandle(fileName);
                const overwrite = confirm(`File "${fileName}" sudah ada di folder ${divisiId}. Timpa?`);
                if (!overwrite) throw new Error('Upload dibatalkan');
            } catch (e) {
                fileHandle = await divisiFolder.getFileHandle(fileName, { create: true });
            }
            const writable = await fileHandle.createWritable();
            await writable.write(file);
            await writable.close();
            await setFileCategory(fileName, category);
            return true;
        } catch (err) {
            console.error('Gagal upload:', err);
            throw new Error(`Gagal upload: ${err.message}`);
        }
    }

    async function deleteFile(fileHandle) {
        const fileName = fileHandle.name;
        try {
            await fileHandle.remove();
            await removeFileCategory(fileName);
            return true;
        } catch (err) {
            console.error('Gagal hapus file:', err);
            return false;
        }
    }

    async function getFileBlob(fileHandle) {
        return await fileHandle.getFile();
    }

    async function deleteAllExcept(exceptions = []) {
        const rootHandle = await getRootHandle();
        if (!rootHandle) return 0;
        const divisiId = getCurrentDivisiId();
        const divisiFolder = await getDivisiFolderHandle(divisiId);
        if (!divisiFolder) return 0;
        
        let deletedCount = 0;
        try {
            for await (const entry of divisiFolder.values()) {
                if (entry.kind === 'file' && !exceptions.includes(entry.name) && entry.name !== METADATA_FILE) {
                    try {
                        await entry.remove();
                        await removeFileCategory(entry.name);
                        deletedCount++;
                    } catch (err) {
                        console.error(`Gagal hapus ${entry.name}:`, err);
                    }
                }
            }
        } catch (err) {
            console.error('Gagal membersihkan folder divisi:', err);
        }
        return deletedCount;
    }

    async function isFolderSelected() {
        const handle = await getRootHandle();
        return handle !== null;
    }

    return {
        isSupported: () => 'showDirectoryPicker' in window,
        pilihFolder,
        listFiles,
        uploadFile,
        deleteFile,
        deleteAllExcept,
        getFileBlob,
        getRootHandle,
        readJSONFile,
        saveData,
        isFolderSelected,
        // tambahan untuk debug
        getCurrentDivisiId
    };
})();