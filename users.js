// users.js - Database akun Jam'iyyah Tholabah
// ============================================

const users = [
    // ========== SUPER ADMIN ==========
    {
        username: 'superadmin',
        password: 'super123',
        name: 'Super Administrator',
        role: 'superadmin',
        divisiId: 'all',
        avatar: 'admin.jpg',
        redirect: 'dashboard/index.html'
    },

    // ========== DIVISI BAHASA (2 akun) ==========
    {
        username: 'admin_bahasa',
        password: 'admin123',
        name: 'Admin Divisi Bahasa',
        role: 'admin',
        divisiId: 'bahasa',
        avatar: 'admin.jpg',
        redirect: 'divisi/bahasa/pusat_data.html'
    },
    {
        username: 'guru_bahasa',
        password: 'guru123',
        name: 'Ustadz Divisi Bahasa',
        role: 'guru',
        divisiId: 'bahasa',
        avatar: 'guru1.jpg',
        redirect: 'divisi/bahasa/pusat_data.html'
    },

    // ========== DIVISI IBADAH (2 akun) ==========
    {
        username: 'admin_ibadah',
        password: 'admin123',
        name: 'Admin Divisi Ibadah',
        role: 'admin',
        divisiId: 'ibadah',
        avatar: 'admin.jpg',
        redirect: 'divisi/ibadah/pusat_data.html'
    },
    {
        username: 'guru_ibadah',
        password: 'guru123',
        name: 'Ustadz Divisi Ibadah',
        role: 'guru',
        divisiId: 'ibadah',
        avatar: 'guru1.jpg',
        redirect: 'divisi/ibadah/pusat_data.html'
    },

    // ========== DIVISI FANN (1 akun) ==========
    {
        username: 'manager_fann',
        password: 'manager123',
        name: 'Manager Divisi Fann',
        role: 'manager',
        divisiId: 'fann',
        avatar: 'default.jpg',
        redirect: 'divisi/fann/pusat_data.html'
    },

    // ========== DIVISI KONSUMSI (1 akun) ==========
    {
        username: 'manager_konsumsi',
        password: 'manager123',
        name: 'Manager Divisi Konsumsi',
        role: 'manager',
        divisiId: 'konsumsi',
        avatar: 'default.jpg',
        redirect: 'divisi/konsumsi/pusat_data.html'
    },

    // ========== DIVISI KEBERSIHAN (1 akun) ==========
    {
        username: 'manager_kebersihan',
        password: 'manager123',
        name: 'Manager Divisi Kebersihan',
        role: 'manager',
        divisiId: 'kebersihan',
        avatar: 'default.jpg',
        redirect: 'divisi/kebersihan/pusat_data.html'
    },

    // ========== DIVISI OLAHRAGA (1 akun) ==========
    {
        username: 'manager_olahraga',
        password: 'manager123',
        name: 'Manager Divisi Olahraga',
        role: 'manager',
        divisiId: 'olahraga',
        avatar: 'default.jpg',
        redirect: 'divisi/olahraga/pusat_data.html'
    }
];

// Fungsi untuk mencari user berdasarkan username dan password
function findUser(username, password) {
    return users.find(u => u.username === username && u.password === password);
}

// Fungsi untuk mendapatkan redirect URL
function getRedirectUrl(username, password) {
    const user = findUser(username, password);
    return user ? user.redirect : null;
}

// Ekspor (untuk penggunaan di environment browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { users, findUser, getRedirectUrl };
}