import React from 'react';
import { Container, Typography, Alert, Box, Button, Card, CardContent } from '@mui/material';
import { useNavigate } from "react-router-dom";
import { Warning, ArrowBack } from '@mui/icons-material';

function Register() {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
            <Card sx={{ textAlign: 'center', p: 4 }}>
                <CardContent>
                    <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h4" gutterBottom color="warning.main">
                        Inscription désactivée
                    </Typography>
                    <Typography variant="h6" gutterBottom color="text.secondary">
                        L'inscription publique n'est plus disponible
                    </Typography>
                    <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
                        <Typography variant="body1">
                            Seul le directeur peut créer de nouveaux comptes utilisateurs. 
                            Si vous avez besoin d'un accès, veuillez contacter l'administrateur système.
                        </Typography>
                    </Alert>
                    <Box sx={{ mt: 4 }}>
                        <Button
                            variant="contained"
                            startIcon={<ArrowBack />}
                            onClick={() => navigate('/login')}
                            size="large"
                        >
                            Retour à la connexion
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}

export default Register;
