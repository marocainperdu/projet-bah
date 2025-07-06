require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware pour logger les requêtes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Connexion à MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mbacke-demandes',
    port: process.env.DB_PORT || 3306
});

// Test de connexion
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        return;
    }
    console.log('Connecté à la base de données MySQL');
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token d\'accès requis' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalide' });
        }
        req.user = user;
        next();
    });
};

// Routes d'authentification
app.post("/api/register", async (req, res) => {
    const { email, password, name, role, department_id } = req.body;

    try {
        // Vérifier si l'utilisateur existe déjà
        const checkUserQuery = "SELECT * FROM users WHERE email = ?";
        db.query(checkUserQuery, [email], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Erreur serveur" });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà" });
            }

            // Hacher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insérer le nouvel utilisateur
            const insertQuery = "INSERT INTO users (email, password, name, role, department_id) VALUES (?, ?, ?, ?, ?)";
            db.query(insertQuery, [email, hashedPassword, name, role, department_id], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: "Erreur lors de l'inscription" });
                }

                res.status(201).json({
                    message: "Utilisateur créé avec succès",
                    userId: results.insertId
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    const query = `
        SELECT u.*, d.name as department_name 
        FROM users u 
        LEFT JOIN departments d ON u.department_id = d.id 
        WHERE u.email = ?
    `;

    db.query(query, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }

        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                department_id: user.department_id 
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department_id: user.department_id,
                department_name: user.department_name
            }
        });
    });
});

// Routes pour les départements
app.get("/api/departments", authenticateToken, (req, res) => {
    const query = "SELECT * FROM departments ORDER BY name";
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results);
    });
});

app.post("/api/departments", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { name, description } = req.body;
    const query = "INSERT INTO departments (name, description) VALUES (?, ?)";
    
    db.query(query, [name, description], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur lors de la création du département" });
        }
        res.status(201).json({ message: "Département créé avec succès", id: results.insertId });
    });
});

// Routes pour les catégories
app.get("/api/categories", authenticateToken, (req, res) => {
    const query = "SELECT * FROM categories ORDER BY name";
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results);
    });
});

app.post("/api/categories", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { name, description } = req.body;
    const query = "INSERT INTO categories (name, description, created_by) VALUES (?, ?, ?)";
    
    db.query(query, [name, description, req.user.userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur lors de la création de la catégorie" });
        }
        res.status(201).json({ message: "Catégorie créée avec succès", id: results.insertId });
    });
});

// Routes pour les listes de demandes
app.get("/api/demand-lists", authenticateToken, (req, res) => {
    const query = `
        SELECT dl.*, u.name as created_by_name 
        FROM demand_lists dl 
        JOIN users u ON dl.created_by = u.id 
        ORDER BY dl.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results);
    });
});

app.post("/api/demand-lists", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { title, description, deadline } = req.body;
    const query = "INSERT INTO demand_lists (title, description, created_by, deadline) VALUES (?, ?, ?, ?)";
    
    db.query(query, [title, description, req.user.userId, deadline], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur lors de la création de la liste" });
        }
        res.status(201).json({ message: "Liste créée avec succès", id: results.insertId });
    });
});

app.put("/api/demand-lists/:id/status", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { status } = req.body;
    const query = "UPDATE demand_lists SET status = ? WHERE id = ?";
    
    db.query(query, [status, req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur lors de la mise à jour" });
        }
        res.json({ message: "Statut mis à jour avec succès" });
    });
});

// Routes pour les demandes
app.get("/api/demands", authenticateToken, (req, res) => {
    let query = `
        SELECT d.*, dl.title as list_title, u.name as teacher_name, 
               c.name as category_name, dept.name as department_name
        FROM demands d
        JOIN demand_lists dl ON d.demand_list_id = dl.id
        JOIN users u ON d.teacher_id = u.id
        JOIN categories c ON d.category_id = c.id
        LEFT JOIN departments dept ON u.department_id = dept.id
        WHERE 1=1
    `;
    
    const params = [];

    // Filtrage selon le rôle
    if (req.user.role === 'teacher') {
        query += " AND d.teacher_id = ?";
        params.push(req.user.userId);
    } else if (req.user.role === 'department_head') {
        query += " AND u.department_id = ?";
        params.push(req.user.department_id);
    } else if (req.user.role === 'director') {
        query += " AND d.status NOT IN ('pending', 'rejected_by_head')";
    }

    query += " ORDER BY d.created_at DESC";
    
    db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results);
    });
});

app.post("/api/demands", authenticateToken, (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: "Seuls les enseignants peuvent créer des demandes" });
    }

    const { demand_list_id, category_id, title, description, quantity, estimated_price, justification, priority } = req.body;
    
    // Vérifier que la liste est ouverte
    const checkListQuery = "SELECT status FROM demand_lists WHERE id = ?";
    db.query(checkListQuery, [demand_list_id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ error: "Liste de demandes invalide" });
        }
        
        if (results[0].status !== 'open') {
            return res.status(400).json({ error: "Cette liste de demandes est fermée" });
        }

        const insertQuery = `
            INSERT INTO demands (demand_list_id, teacher_id, category_id, title, description, 
                               quantity, estimated_price, justification, priority) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [demand_list_id, req.user.userId, category_id, title, description, 
                              quantity, estimated_price, justification, priority], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Erreur lors de la création de la demande" });
            }
            res.status(201).json({ message: "Demande créée avec succès", id: results.insertId });
        });
    });
});

app.put("/api/demands/:id/evaluate", authenticateToken, (req, res) => {
    if (!['department_head', 'director'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { decision, comments } = req.body;
    const demandId = req.params.id;

    // Déterminer le nouveau statut selon le rôle et la décision
    let newStatus;
    if (req.user.role === 'department_head') {
        newStatus = decision === 'approved' ? 'approved_by_head' : 'rejected_by_head';
    } else if (req.user.role === 'director') {
        newStatus = decision === 'approved' ? 'approved_by_director' : 'rejected_by_director';
    }

    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: "Erreur de transaction" });
        }

        // Mettre à jour le statut de la demande
        const updateQuery = "UPDATE demands SET status = ? WHERE id = ?";
        db.query(updateQuery, [newStatus, demandId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: "Erreur lors de la mise à jour" });
                });
            }

            // Ajouter l'évaluation
            const evalQuery = `
                INSERT INTO demand_evaluations (demand_id, evaluator_id, evaluator_role, decision, comments) 
                VALUES (?, ?, ?, ?, ?)
            `;
            db.query(evalQuery, [demandId, req.user.userId, req.user.role, decision, comments], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: "Erreur lors de l'évaluation" });
                    });
                }

                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: "Erreur de validation" });
                        });
                    }
                    res.json({ message: "Évaluation enregistrée avec succès" });
                });
            });
        });
    });
});

// Route pour obtenir l'historique d'une demande
app.get("/api/demands/:id/history", authenticateToken, (req, res) => {
    const query = `
        SELECT de.*, u.name as evaluator_name
        FROM demand_evaluations de
        JOIN users u ON de.evaluator_id = u.id
        WHERE de.demand_id = ?
        ORDER BY de.evaluated_at ASC
    `;
    
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results);
    });
});

// Routes pour les statistiques
app.get("/api/stats", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const statsQuery = `
        SELECT 
            COUNT(*) as total_demands,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_demands,
            COUNT(CASE WHEN status = 'approved_by_head' THEN 1 END) as approved_by_head,
            COUNT(CASE WHEN status = 'rejected_by_head' THEN 1 END) as rejected_by_head,
            COUNT(CASE WHEN status = 'approved_by_director' THEN 1 END) as approved_by_director,
            COUNT(CASE WHEN status = 'rejected_by_director' THEN 1 END) as rejected_by_director,
            SUM(estimated_price) as total_estimated_cost,
            SUM(CASE WHEN status = 'approved_by_director' THEN estimated_price ELSE 0 END) as approved_cost
        FROM demands
    `;
    
    db.query(statsQuery, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results[0]);
    });
});

// Route de test
app.get("/api/test", (req, res) => {
    res.json({ message: "Serveur de gestion de demandes fonctionnel" });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;
