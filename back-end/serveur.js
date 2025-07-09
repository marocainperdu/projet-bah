require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
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
    host: '192.168.1.200',
    user: 'momo',
    password: '7RZduvvO1a1rNA',
    database: 'projet-bah',
    port: '3306'
});

// Test de connexion
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        return;
    }
    console.log('Connecté à la base de données MySQL');
});

// Configuration du transporteur email
const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'localhost',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true pour 465, false pour les autres ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Fonction pour envoyer un email de bienvenue
const sendWelcomeEmail = async (userEmail, userName, userRole, temporaryPassword) => {
    const roleNames = {
        'director': 'Directeur',
        'department_head': 'Chef de département',
        'teacher': 'Enseignant'
    };

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Bienvenue sur la plateforme de gestion des demandes',
        html: `
            <h2>Bienvenue sur la plateforme de gestion des demandes</h2>
            <p>Bonjour <strong>${userName}</strong>,</p>
            <p>Votre compte a été créé avec succès sur la plateforme de gestion des demandes.</p>
            <p><strong>Détails de votre compte :</strong></p>
            <ul>
                <li><strong>Email :</strong> ${userEmail}</li>
                <li><strong>Rôle :</strong> ${roleNames[userRole] || userRole}</li>
                <li><strong>Mot de passe :</strong> ${temporaryPassword}</li>
            </ul>
            <p><strong>Prochaines étapes :</strong></p>
            <ol>
                <li>Connectez-vous à la plateforme avec vos identifiants</li>
                <li>Changez votre mot de passe temporaire lors de votre première connexion</li>
                <li>Explorez les fonctionnalités disponibles selon votre rôle</li>
            </ol>
            <p><strong>Lien de connexion :</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">Se connecter</a></p>
            <p>Si vous avez des questions, n'hésitez pas à contacter l'administrateur.</p>
            <p>Cordialement,<br>L'équipe de gestion des demandes</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de bienvenue envoyé à ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        return false;
    }
};

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

// Récupérer toutes les demandes d'une liste pour consultation/validation directeur
app.get("/api/demand-lists/:id/demands", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès réservé au directeur" });
    }
    const listId = req.params.id;
    const query = `
        SELECT d.*, u.name as teacher_name, c.name as category_name, c.code as category_code, dept.name as department_name
        FROM demands d
        JOIN users u ON d.teacher_id = u.id
        JOIN categories c ON d.category_id = c.id
        LEFT JOIN departments dept ON u.department_id = dept.id
        WHERE d.demand_list_id = ?
        ORDER BY d.created_at DESC
    `;
    db.query(query, [listId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results);
    });
});

app.get("/api/demands/export/sum/:listId", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Seuls les directeurs peuvent exporter les demandes" });
    }

    const listId = req.params.listId;
    // On ne filtre que les demandes de la liste, et on groupe par catégorie (code + nom)
    const query = `
        SELECT c.code as category_code, c.name as category_name, 
               SUM(d.estimated_price * d.quantity) as total_cost
        FROM demands d
        JOIN categories c ON d.category_id = c.id
        WHERE d.demand_list_id = ?
        GROUP BY c.code, c.name
        ORDER BY c.code
    `;
    db.query(query, [listId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results);
    });
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
    const query = `
        SELECT d.*, COUNT(u.id) as user_count 
        FROM departments d 
        LEFT JOIN users u ON d.id = u.department_id 
        GROUP BY d.id 
        ORDER BY d.name
    `;
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

app.put("/api/departments/:id", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { name, description } = req.body;
    const query = "UPDATE departments SET name = ?, description = ? WHERE id = ?";
    
    db.query(query, [name, description, req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur lors de la modification du département" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Département non trouvé" });
        }
        res.json({ message: "Département modifié avec succès" });
    });
});

app.delete("/api/departments/:id", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    // Vérifier s'il y a des utilisateurs associés
    const checkUsersQuery = "SELECT COUNT(*) as user_count FROM users WHERE department_id = ?";
    db.query(checkUsersQuery, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        if (results[0].user_count > 0) {
            return res.status(400).json({ error: "Impossible de supprimer un département qui contient des utilisateurs" });
        }

        const deleteQuery = "DELETE FROM departments WHERE id = ?";
        db.query(deleteQuery, [req.params.id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Erreur lors de la suppression du département" });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: "Département non trouvé" });
            }
            res.json({ message: "Département supprimé avec succès" });
        });
    });
});

// Routes pour la gestion des utilisateurs
app.get("/api/users", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const query = `
        SELECT u.id, u.email, u.name, u.role, u.department_id, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        ORDER BY u.name
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results);
    });
});

app.post("/api/users", authenticateToken, async (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { name, email, password, role, department_id } = req.body;
    
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis" });
    }

    // Vérifier si l'email existe déjà
    const checkEmailQuery = "SELECT id FROM users WHERE email = ?";
    db.query(checkEmailQuery, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: "Cette adresse email est déjà utilisée" });
        }

        // Hasher le mot de passe
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertQuery = "INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?)";
            const values = [name, email, hashedPassword, role, department_id || null];
            
            db.query(insertQuery, values, async (err, results) => {
                if (err) {
                    return res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
                }
                
                // Envoyer l'email de bienvenue
                const emailSent = await sendWelcomeEmail(email, name, role, password);
                
                const response = {
                    message: "Utilisateur créé avec succès",
                    id: results.insertId
                };
                
                if (emailSent) {
                    response.emailSent = true;
                    response.emailMessage = "Un email de bienvenue a été envoyé à l'utilisateur";
                } else {
                    response.emailSent = false;
                    response.emailMessage = "Utilisateur créé mais l'email n'a pas pu être envoyé";
                }
                
                res.status(201).json(response);
            });
        } catch (error) {
            return res.status(500).json({ error: "Erreur lors du hashage du mot de passe" });
        }
    });
});

app.put("/api/users/:id", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { name, email, password, role, department_id } = req.body;
    const userId = req.params.id;
    
    if (!name || !email || !role) {
        return res.status(400).json({ error: "Les champs nom, email et rôle sont obligatoires" });
    }

    // Vérifier si l'email existe déjà pour un autre utilisateur
    const checkEmailQuery = "SELECT id FROM users WHERE email = ? AND id != ?";
    db.query(checkEmailQuery, [email, userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: "Cette adresse email est déjà utilisée" });
        }

        // Fonction pour mettre à jour l'utilisateur
        const updateUser = (hashedPassword = null) => {
            let updateQuery = "UPDATE users SET name = ?, email = ?, role = ?, department_id = ?";
            let values = [name, email, role, department_id || null];
            
            if (hashedPassword) {
                updateQuery += ", password = ?";
                values.push(hashedPassword);
            }
            
            updateQuery += " WHERE id = ?";
            values.push(userId);
            
            db.query(updateQuery, values, (err, results) => {
                if (err) {
                    return res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
                }
                if (results.affectedRows === 0) {
                    return res.status(404).json({ error: "Utilisateur non trouvé" });
                }
                res.json({ message: "Utilisateur mis à jour avec succès" });
            });
        };

        // Si un nouveau mot de passe est fourni, le hasher
        if (password) {
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ error: "Erreur lors du hashage du mot de passe" });
                }
                updateUser(hashedPassword);
            });
        } else {
            updateUser();
        }
    });
});

app.delete("/api/users/:id", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const userId = req.params.id;
    
    // Empêcher la suppression de son propre compte
    if (userId == req.user.userId) {
        return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
    }

    const deleteQuery = "DELETE FROM users WHERE id = ?";
    db.query(deleteQuery, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        res.json({ message: "Utilisateur supprimé avec succès" });
    });
});

// Routes pour les catégories
app.get("/api/categories", authenticateToken, (req, res) => {
    const query = `
        SELECT c.*, cp.name as parent_name 
        FROM categories c 
        LEFT JOIN categories cp ON c.parent_id = cp.id 
        ORDER BY c.level, c.code, c.name
    `;
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

    const { code, name, description, parent_id, level, type, section, is_active } = req.body;
    
    // Vérifier l'unicité du code
    const checkCodeQuery = "SELECT id FROM categories WHERE code = ?";
    db.query(checkCodeQuery, [code], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: "Ce code comptable existe déjà" });
        }

        const query = `
            INSERT INTO categories (code, name, description, parent_id, level, type, section, created_by, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(query, [code, name, description, parent_id, level || 1, type || 'ordinaire', 
                        section || 'fonctionnement', req.user.userId, is_active !== false], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Erreur lors de la création de la catégorie" });
            }
            res.status(201).json({ message: "Catégorie créée avec succès", id: results.insertId });
        });
    });
});

app.put("/api/categories/:id", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { code, name, description, parent_id, level, type, section, is_active } = req.body;
    
    // Vérifier l'unicité du code (sauf pour la catégorie en cours de modification)
    const checkCodeQuery = "SELECT id FROM categories WHERE code = ? AND id != ?";
    db.query(checkCodeQuery, [code, req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: "Ce code comptable existe déjà" });
        }

        const query = `
            UPDATE categories 
            SET code = ?, name = ?, description = ?, parent_id = ?, level = ?, type = ?, section = ?, is_active = ?
            WHERE id = ?
        `;
        
        db.query(query, [code, name, description, parent_id, level, type, section, 
                        is_active !== false, req.params.id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Erreur lors de la modification de la catégorie" });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: "Catégorie non trouvée" });
            }
            res.json({ message: "Catégorie modifiée avec succès" });
        });
    });
});

app.delete("/api/categories/:id", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Accès non autorisé" });
    }

    // Vérifier s'il y a des sous-catégories
    const checkChildrenQuery = "SELECT COUNT(*) as child_count FROM categories WHERE parent_id = ?";
    db.query(checkChildrenQuery, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        if (results[0].child_count > 0) {
            return res.status(400).json({ error: "Impossible de supprimer une catégorie qui contient des sous-catégories" });
        }

        // Vérifier s'il y a des demandes associées
        const checkDemandsQuery = "SELECT COUNT(*) as demand_count FROM demands WHERE category_id = ?";
        db.query(checkDemandsQuery, [req.params.id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Erreur serveur" });
            }
            
            if (results[0].demand_count > 0) {
                return res.status(400).json({ error: "Impossible de supprimer une catégorie utilisée dans des demandes" });
            }

            const deleteQuery = "DELETE FROM categories WHERE id = ?";
            db.query(deleteQuery, [req.params.id], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: "Erreur lors de la suppression de la catégorie" });
                }
                if (results.affectedRows === 0) {
                    return res.status(404).json({ error: "Catégorie non trouvée" });
                }
                res.json({ message: "Catégorie supprimée avec succès" });
            });
        });
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
app.get("/api/demands/export/:listId", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Seuls les directeurs peuvent exporter les demandes" });
    }

    const listId = req.params.listId;

    // Vérifier d'abord que la liste est fermée
    const checkListQuery = "SELECT status FROM demand_lists WHERE id = ?";
    db.query(checkListQuery, [listId], (err, listResult) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        if (listResult.length === 0) {
            return res.status(404).json({ error: "Liste de demandes non trouvée" });
        }
        
        if (listResult[0].status !== 'closed') {
            return res.status(403).json({ error: "La liste doit être fermée pour permettre l'export" });
        }

        // Récupérer les demandes de cette liste spécifique
        const query = `
            SELECT d.*, dl.title as list_title, u.name as teacher_name, 
                   c.name as category_name, c.code as category_code,
                   dept.name as department_name
            FROM demands d
            JOIN demand_lists dl ON d.demand_list_id = dl.id
            JOIN users u ON d.teacher_id = u.id
            JOIN categories c ON d.category_id = c.id
            LEFT JOIN departments dept ON u.department_id = dept.id
            WHERE d.demand_list_id = ?
            ORDER BY d.created_at DESC
        `;
        
        db.query(query, [listId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Erreur serveur" });
            }
            res.json(results);
        });
    });
});

app.get("/api/demands/export", authenticateToken, (req, res) => {
    if (req.user.role !== 'director') {
        return res.status(403).json({ error: "Seuls les directeurs peuvent exporter toutes les demandes" });
    }

    const query = `
        SELECT d.*, dl.title as list_title, u.name as teacher_name, 
               c.name as category_name, c.code as category_code,
               dept.name as department_name
        FROM demands d
        JOIN demand_lists dl ON d.demand_list_id = dl.id
        JOIN users u ON d.teacher_id = u.id
        JOIN categories c ON d.category_id = c.id
        LEFT JOIN departments dept ON u.department_id = dept.id
        ORDER BY d.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results);
    });
});

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
