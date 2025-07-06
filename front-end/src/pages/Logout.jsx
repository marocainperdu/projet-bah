import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = () => {
      try {
        // Supprimer les données de session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Rediriger vers la page de connexion
        navigate('/login');
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        // Rediriger même en cas d'erreur
        navigate('/login');
      }
    };

    // Délai court pour afficher le message de déconnexion
    const timer = setTimeout(handleLogout, 1000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        gap: 2
      }}
    >
      <CircularProgress />
      <Typography variant="h6">Déconnexion en cours...</Typography>
    </Box>
  );
};

export default Logout;
