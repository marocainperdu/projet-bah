import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Alert, Box, Grid, Card, CircularProgress } from '@mui/material';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        setError(null);
        setLoading(true);

        try {
            const response = await axios.post('/api/login', {
                email,
                password
            });

            if (response.data.token) {
                // Stocker le token et les informations utilisateur
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                // Rediriger selon le rôle
                const userRole = response.data.user.role;
                switch (userRole) {
                    case 'director':
                        navigate('/director/dashboard');
                        break;
                    case 'department_head':
                        navigate('/department-head/demands');
                        break;
                    case 'teacher':
                        navigate('/teacher/demands');
                        break;
                    default:
                        setError('Rôle utilisateur non reconnu');
                        break;
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || "Une erreur s'est produite lors de la connexion.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <Grid container style={styles.container}>
            <Grid item xs={12} md={6} style={styles.leftSide}>
                <div style={styles.titleContainer}>
                    <span style={styles.titleText}>Gestion des Demandes</span>
                    <span style={styles.sticker}>📋</span>
                </div>

                <Card sx={{ p: 4, borderRadius: 2, boxShadow: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h4" gutterBottom>
                            Connexion
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Plateforme de gestion des demandes institutionnelles
                        </Typography>
                        
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        
                        <TextField
                            label="Email"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                        />
                        <TextField
                            label="Mot de passe"
                            type="password"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleLogin}
                            sx={{ mt: 2 }}
                            disabled={loading || !email || !password}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Se connecter"}
                        </Button>
                    </Box>
                </Card>
            </Grid>
            <Grid item xs={12} md={6} style={styles.rightSide}>
                <div style={styles.rightContent}>
                    <Typography variant="h3" style={styles.rightTitle}>
                        Simplifiez vos demandes
                    </Typography>
                    <Typography variant="h6" style={styles.rightSubtitle}>
                        Une plateforme complète pour gérer les demandes d'approvisionnement
                    </Typography>
                    <div style={styles.features}>
                        <div style={styles.feature}>
                            <span style={styles.featureIcon}>👥</span>
                            <span style={styles.featureText}>Workflow hiérarchique</span>
                        </div>
                        <div style={styles.feature}>
                            <span style={styles.featureIcon}>📊</span>
                            <span style={styles.featureText}>Suivi en temps réel</span>
                        </div>
                        <div style={styles.feature}>
                            <span style={styles.featureIcon}>✅</span>
                            <span style={styles.featureText}>Approbation simplifiée</span>
                        </div>
                    </div>
                </div>
            </Grid>
        </Grid>
    );
}

const styles = {
    container: {
        height: '100vh',
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
        backgroundColor: '#1976d2',
        backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
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
        color: '#1976d2',
        display: 'block',
        marginBottom: '0.5rem',
    },
    sticker: {
        fontSize: '3em',
        display: 'block',
    },
    rightContent: {
        textAlign: 'center',
        maxWidth: '400px',
    },
    rightTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: '1rem',
    },
    rightSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: '2rem',
    },
    features: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    feature: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        borderRadius: '8px',
    },
    featureIcon: {
        fontSize: '2em',
    },
    featureText: {
        fontSize: '1.1em',
        color: 'white',
    },
};

export default Login;
