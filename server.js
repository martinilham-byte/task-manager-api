const express = require('express');
const db = require('./database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

app.use(express.json());

// SECRET KEY (untuk token)
const SECRET_KEY = 'rahasia_backend_santri';

// ==================== MIDDLEWARE ====================
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

// ==================== AUTH ====================
// REGISTER
app.post('/register', async (req, res) => {
  const { nama, email, password } = req.body;
  if (!nama || !email || !password) {
    return res.json({ status: 'gagal', pesan: 'Semua field wajib diisi' });
  }
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

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.json({ status: 'error', pesan: err.message });
    if (!user) return res.json({ status: 'gagal', pesan: 'Email tidak ditemukan' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.json({ status: 'gagal', pesan: 'Password salah' });

    const token = jwt.sign(
      { id: user.id, email: user.email, nama: user.nama },
      SECRET_KEY,
      { expiresIn: '7d' }
    );
    res.json({
      status: 'sukses',
      pesan: 'Login berhasil',
      token,
      user: { id: user.id, nama: user.nama, email: user.email }
    });
  });
});

// ==================== CRUD USERS (dengan proteksi opsional) ====================
// GET all users (tanpa proteksi, hanya untuk contoh)
app.get('/users', (req, res) => {
  db.all('SELECT id, nama, email, created_at FROM users', [], (err, rows) => {
    if (err) return res.json({ status: 'error', pesan: err.message });
    res.json({ status: 'sukses', data: rows });
  });
});

// GET user by id
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  db.get('SELECT id, nama, email, created_at FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.json({ status: 'error', pesan: err.message });
    if (!row) return res.json({ status: 'gagal', pesan: 'User tidak ditemukan' });
    res.json({ status: 'sukses', data: row });
  });
});

// UPDATE user (tanpa proteksi, tapi bisa ditambahkan)
app.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const { nama, email } = req.body;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.json({ status: 'error', pesan: err.message });
    if (!row) return res.json({ status: 'gagal', pesan: 'User tidak ditemukan' });
    const updateNama = nama || row.nama;
    const updateEmail = email || row.email;
    db.run('UPDATE users SET nama = ?, email = ? WHERE id = ?', [updateNama, updateEmail, userId], function(err) {
      if (err) return res.json({ status: 'error', pesan: err.message });
      res.json({ status: 'sukses', pesan: 'User berhasil diupdate', data: { id: userId, nama: updateNama, email: updateEmail } });
    });
  });
});

// DELETE user
app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) return res.json({ status: 'error', pesan: err.message });
    if (this.changes === 0) return res.json({ status: 'gagal', pesan: 'User tidak ditemukan' });
    res.json({ status: 'sukses', pesan: 'User berhasil dihapus' });
  });
});

// ==================== TASK MANAGER (semua butuh token) ====================
// Buat task baru
app.post('/tasks', verifikasiToken, (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id;
  if (!title) return res.json({ status: 'gagal', pesan: 'Judul task wajib diisi' });
  db.run(
    'INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)',
    [userId, title, description || ''],
    function(err) {
      if (err) return res.json({ status: 'error', pesan: err.message });
      res.json({
        status: 'sukses',
        pesan: 'Task berhasil dibuat',
        task: { id: this.lastID, title, description: description || '', completed: 0 }
      });
    }
  );
});

// Ambil semua task milik user (bisa filter ?status=completed / pending)
app.get('/tasks', verifikasiToken, (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;
  let sql = 'SELECT * FROM tasks WHERE user_id = ?';
  let params = [userId];
  if (status === 'completed') {
    sql += ' AND completed = 1';
  } else if (status === 'pending') {
    sql += ' AND completed = 0';
  }
  sql += ' ORDER BY created_at DESC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.json({ status: 'error', pesan: err.message });
    res.json({ status: 'sukses', data: rows });
  });
});

// Update task (hanya pemilik)
app.put('/tasks/:id', verifikasiToken, (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  const { title, description, completed } = req.body;
  db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err, row) => {
    if (err) return res.json({ status: 'error', pesan: err.message });
    if (!row) return res.json({ status: 'gagal', pesan: 'Task tidak ditemukan atau bukan milik Anda' });
    const updateTitle = title !== undefined ? title : row.title;
    const updateDesc = description !== undefined ? description : row.description;
    const updateCompleted = completed !== undefined ? (completed ? 1 : 0) : row.completed;
    db.run(
      'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?',
      [updateTitle, updateDesc, updateCompleted, taskId],
      function(err) {
        if (err) return res.json({ status: 'error', pesan: err.message });
        res.json({
          status: 'sukses',
          pesan: 'Task berhasil diupdate',
          task: { id: taskId, title: updateTitle, description: updateDesc, completed: updateCompleted }
        });
      }
    );
  });
});

// Hapus task
app.delete('/tasks/:id', verifikasiToken, (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], function(err) {
    if (err) return res.json({ status: 'error', pesan: err.message });
    if (this.changes === 0) return res.json({ status: 'gagal', pesan: 'Task tidak ditemukan atau bukan milik Anda' });
    res.json({ status: 'sukses', pesan: 'Task berhasil dihapus' });
  });
});

// Tandai selesai (PATCH)
app.patch('/tasks/:id/complete', verifikasiToken, (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  db.run('UPDATE tasks SET completed = 1 WHERE id = ? AND user_id = ?', [taskId, userId], function(err) {
    if (err) return res.json({ status: 'error', pesan: err.message });
    if (this.changes === 0) return res.json({ status: 'gagal', pesan: 'Task tidak ditemukan atau bukan milik Anda' });
    res.json({ status: 'sukses', pesan: 'Task ditandai selesai' });
  });
});

// ==================== EXTRA ====================
// Profile endpoint (butuh token)
app.get('/profile-saya', verifikasiToken, (req, res) => {
  res.json({ status: 'sukses', user: req.user });
});

// Root
app.get('/', (req, res) => {
  res.send('Backend API berjalan. Gunakan /register, /login, /tasks, dll.');
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});