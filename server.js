const express = require('express');
const db = require('./database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

app.use(express.json());

// SECRET KEY (untuk tanda tangan token)
const SECRET_KEY = 'rahasia_backend_santri';

// REGISTER - daftar akun baru (password di-hash)
app.post('/register', async (req, res) => {
  const { nama, email, password } = req.body;
  
  if (!nama || !email || !password) {
    return res.json({ status: 'gagal', pesan: 'Semua field wajib diisi' });
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.run(
    'INSERT INTO users (nama, email, password) VALUES (?, ?, ?)',
    [nama, email, hashedPassword],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.json({ status: 'gagal', pesan: 'Email sudah terdaftar!' });
        }
        return res.json({ status: 'error', pesan: err.message });
      }
      res.json({ status: 'sukses', pesan: 'Registrasi berhasil! Silakan login.', id: this.lastID });
    }
  );
});

// LOGIN - dapatkan token JWT
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.json({ status: 'error', pesan: err.message });
    }
    if (!user) {
      return res.json({ status: 'gagal', pesan: 'Email tidak ditemukan' });
    }
    
    // Cek password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.json({ status: 'gagal', pesan: 'Password salah' });
    }
    
    // Buat token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, nama: user.nama },
      SECRET_KEY,
      { expiresIn: '7d' }
    );
    
    res.json({
      status: 'sukses',
      pesan: 'Login berhasil',
      token: token,
      user: { id: user.id, nama: user.nama, email: user.email }
    });
  });
});

// MIDDLEWARE: verifikasi token (buat proteksi endpoint)
const verifikasiToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.json({ status: 'gagal', pesan: 'Token tidak ditemukan. Silakan login.' });
  }
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.json({ status: 'gagal', pesan: 'Token tidak valid atau expired' });
    }
    req.user = decoded;
    next();
  });
};

// ENDPOINT YANG DILINDUNGI (butuh token)
app.get('/profile-saya', verifikasiToken, (req, res) => {
  res.json({
    status: 'sukses',
    user: req.user
  });
});

// ============ ENDPOINT LAMA (masih ada) ============
app.get('/users', (req, res) => {
  db.all('SELECT id, nama, email, created_at FROM users', [], (err, rows) => {
    if (err) {
      res.json({ status: 'error', pesan: err.message });
      return;
    }
    res.json({ status: 'sukses', data: rows });
  });
});

app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  db.get('SELECT id, nama, email, created_at FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      res.json({ status: 'error', pesan: err.message });
      return;
    }
    if (!row) {
      res.json({ status: 'gagal', pesan: 'User dengan id ' + userId + ' tidak ditemukan' });
      return;
    }
    res.json({ status: 'sukses', data: row });
  });
});

app.post('/daftar', (req, res) => {
  const { nama, email } = req.body;
  db.run('INSERT INTO users (nama, email) VALUES (?, ?)', [nama, email], function(err) {
    if (err) {
      res.json({ status: 'gagal', pesan: 'Email sudah terdaftar!' });
      return;
    }
    res.json({ status: 'sukses', pesan: `Halo ${nama}, data tersimpan di database!`, id: this.lastID });
  });
});

app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      res.json({ status: 'error', pesan: err.message });
      return;
    }
    if (this.changes === 0) {
      res.json({ status: 'gagal', pesan: 'User dengan id ' + userId + ' tidak ditemukan' });
      return;
    }
    res.json({ status: 'sukses', pesan: 'User id ' + userId + ' berhasil dihapus' });
  });
});

app.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const { nama, email } = req.body;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      res.json({ status: 'error', pesan: err.message });
      return;
    }
    if (!row) {
      res.json({ status: 'gagal', pesan: 'User dengan id ' + userId + ' tidak ditemukan' });
      return;
    }
    let updateNama = nama ? nama : row.nama;
    let updateEmail = email ? email : row.email;
    db.run('UPDATE users SET nama = ?, email = ? WHERE id = ?', [updateNama, updateEmail, userId], function(err) {
      if (err) {
        res.json({ status: 'error', pesan: err.message });
        return;
      }
      res.json({ status: 'sukses', pesan: 'User id ' + userId + ' berhasil diupdate', data: { id: userId, nama: updateNama, email: updateEmail } });
    });
  });
});

app.get('/about', (req, res) => {
  res.json({ nama: "Santri Backend", umur: 14, hobi: "coding backend" });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});