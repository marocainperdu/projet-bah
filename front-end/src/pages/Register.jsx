import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Alert, Box, Grid, Card, CircularProgress, MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        department_id: ''
    });
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await axios.get('/api/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des départements:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleRegister = async () => {
        setError(null);
        setLoading(true);

        // Validation
        if (!formData.name || !formData.email || !formData.password || !formData.role) {
            setError('Tous les champs obligatoires doivent être remplis');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            setLoading(false);
            return;
        }

        if ((formData.role === 'teacher' || formData.role === 'department_head') && !formData.department_id) {
            setError('Un département doit être sélectionné pour ce rôle');
            setLoading(false);
            return;
        }

        try {
            const registrationData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                department_id: formData.role === 'director' ? null : formData.department_id
            };

            const response = await axios.post('/api/register', registrationData);
            
            if (response.status === 201) {
                // Inscription réussie, rediriger vers la page de connexion
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.error || "Une erreur s'est produite lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleRegister();
        }
    };

    return (
        <Grid container style={styles.container}>
            <Grid item xs={12} md={6} style={styles.leftSide}>
                <div style={styles.titleContainer}>
                    <span style={styles.titleText}>Inscription</span>
                    <span style={styles.sticker}>📝</span>
                </div>

                <Card sx={{ p: 4, borderRadius: 2, boxShadow: 3, maxWidth: '500px', width: '100%' }}>
                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h4" gutterBottom>
                            Créer un compte
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Rejoignez la plateforme de gestion des demandes
                        </Typography>
                        
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Nom complet"
                                    variant="outlined"
                                    fullWidth
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Email"
                                    variant="outlined"
                                    fullWidth
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Rôle</InputLabel>
                                    <Select
                                        value={formData.role}
                                        onChange={(e) => handleInputChange('role', e.target.value)}
                                        disabled={loading}
                                    >
                                        <MenuItem value="director">Directeur</MenuItem>
                                        <MenuItem value="department_head">Chef de département</MenuItem>
                                        <MenuItem value="teacher">Enseignant</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {(formData.role === 'teacher' || formData.role === 'department_head') && (
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Département</InputLabel>
                                        <Select
                                            value={formData.department_id}
                                            onChange={(e) => handleInputChange('department_id', e.target.value)}
                                            disabled={loading}
                                        >
                                            {departments.map((dept) => (
                                                <MenuItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <TextField
                                    label="Mot de passe"
                                    type="password"
                                    variant="outlined"
                                    fullWidth
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Confirmer le mot de passe"
                                    type="password"
                                    variant="outlined"
                                    fullWidth
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                />
                            </Grid>
                        </Grid>
                        
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleRegister}
                            sx={{ mt: 3 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "S'inscrire"}
                        </Button>
                        <Button
                            variant="text"
                            color="secondary"
                            fullWidth
                            sx={{ mt: 1 }}
                            onClick={() => navigate("/login")}
                            disabled={loading}
                        >
                            Déjà un compte ? Se connecter
                        </Button>
                    </Box>
                </Card>
            </Grid>
            <Grid item xs={12} md={6} style={styles.rightSide}>
                <div style={styles.rightContent}>
                    <Typography variant="h3" style={styles.rightTitle}>
                        Rôles et responsabilités
                    </Typography>
                    <div style={styles.roles}>
                        <div style={styles.role}>
                            <span style={styles.roleIcon}>👑</span>
                            <div>
                                <Typography variant="h6" style={styles.roleTitle}>Directeur</Typography>
                                <Typography variant="body2" style={styles.roleDescription}>
                                    Crée les listes de demandes, gère les catégories et prend les décisions finales
                                </Typography>
                            </div>
                        </div>
                        <div style={styles.role}>
                            <span style={styles.roleIcon}>🏢</span>
                            <div>
                                <Typography variant="h6" style={styles.roleTitle}>Chef de département</Typography>
                                <Typography variant="body2" style={styles.roleDescription}>
                                    Évalue les demandes des enseignants de son département
                                </Typography>
                            </div>
                        </div>
                        <div style={styles.role}>
                            <span style={styles.roleIcon}>👨‍🏫</span>
                            <div>
                                <Typography variant="h6" style={styles.roleTitle}>Enseignant</Typography>
                                <Typography variant="body2" style={styles.roleDescription}>
                                    Soumet des demandes d'équipement et de matériel
                                </Typography>
                            </div>
                        </div>
                    </div>
                </div>
            </Grid>
        </Grid>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
    },
    leftSide: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
    },
    rightSide: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4caf50',
        backgroundImage: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
        color: 'white',
        padding: '2rem',
    },
    titleContainer: {
        textAlign: 'center',
        marginBottom: '2rem',
    },
    titleText: {
        fontSize: '2.5em',
        fontWeight: 'bold',
        color: '#4caf50',
        display: 'block',
        marginBottom: '0.5rem',
    },
    sticker: {
        fontSize: '3em',
        display: 'block',
    },
    rightContent: {
        textAlign: 'left',
        maxWidth: '400px',
    },
    rightTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: '2rem',
        textAlign: 'center',
    },
    roles: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    role: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        borderRadius: '8px',
    },
    roleIcon: {
        fontSize: '2.5em',
        marginTop: '0.5rem',
    },
    roleTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: '0.5rem',
    },
    roleDescription: {
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: '1.4',
    },
};

export default Register;
