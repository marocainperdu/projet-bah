import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Box,
    IconButton,
    Chip
} from '@mui/material';
import { Add, Edit, Delete, PersonAdd } from '@mui/icons-material';
import axios from 'axios';

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        department_id: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log('UserManagement - Token:', localStorage.getItem('token'));
        console.log('UserManagement - User:', localStorage.getItem('user'));
        
        fetchUsers();
        fetchDepartments();
    }, []);

    const fetchUsers = async () => {
        try {
            console.log('Token présent:', !!localStorage.getItem('token'));
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUsers(response.data);
        } catch (err) {
            console.error('Erreur fetchUsers:', err.response || err);
            setError('Erreur lors du chargement des utilisateurs: ' + (err.response?.data?.error || err.message));
        }
    };

    const fetchDepartments = async () => {
        try {
            console.log('Token présent:', !!localStorage.getItem('token'));
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/departments', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setDepartments(response.data);
        } catch (err) {
            console.error('Erreur fetchDepartments:', err.response || err);
            setError('Erreur lors du chargement des départements: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleOpenDialog = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                department_id: user.department_id || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: '',
                department_id: ''
            });
        }
        setOpenDialog(true);
        setError('');
        setSuccess('');
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: '',
            department_id: ''
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            if (editingUser) {
                // Modification
                const updateData = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    department_id: formData.department_id
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await axios.put(`/api/users/${editingUser.id}`, updateData, config);
                setSuccess('Utilisateur modifié avec succès');
            } else {
                // Création
                const response = await axios.post('/api/users', formData, config);
                if (response.data.emailSent) {
                    setSuccess(`Utilisateur créé avec succès. ${response.data.emailMessage}`);
                } else {
                    setSuccess(`Utilisateur créé avec succès. ${response.data.emailMessage || 'Email non envoyé'}`);
                }
            }
            
            fetchUsers();
            handleCloseDialog();
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };
                await axios.delete(`/api/users/${userId}`, config);
                setSuccess('Utilisateur supprimé avec succès');
                fetchUsers();
            } catch (err) {
                setError('Erreur lors de la suppression');
            }
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'director':
                return 'Directeur';
            case 'department_head':
                return 'Chef de département';
            case 'teacher':
                return 'Enseignant';
            default:
                return role;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'director':
                return 'error';
            case 'department_head':
                return 'warning';
            case 'teacher':
                return 'info';
            default:
                return 'default';
        }
    };

    const getDepartmentName = (departmentId) => {
        const dept = departments.find(d => d.id === departmentId);
        return dept ? dept.name : 'Non assigné';
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestion des Utilisateurs
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => handleOpenDialog()}
                    sx={{ mb: 2 }}
                >
                    Ajouter un utilisateur
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Rôle</TableCell>
                            <TableCell>Département</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={getRoleLabel(user.role)} 
                                        color={getRoleColor(user.role)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{getDepartmentName(user.department_id)}</TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => handleOpenDialog(user)}
                                        color="primary"
                                        size="small"
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(user.id)}
                                        color="error"
                                        size="small"
                                    >
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog pour ajouter/modifier un utilisateur */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nom complet"
                        fullWidth
                        variant="outlined"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                    <TextField
                        margin="dense"
                        label="Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                    <TextField
                        margin="dense"
                        label={editingUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <FormControl fullWidth margin="dense" variant="outlined">
                        <InputLabel>Rôle</InputLabel>
                        <Select
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            label="Rôle"
                        >
                            <MenuItem value="director">Directeur</MenuItem>
                            <MenuItem value="department_head">Chef de département</MenuItem>
                            <MenuItem value="teacher">Enseignant</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="dense" variant="outlined">
                        <InputLabel>Département</InputLabel>
                        <Select
                            value={formData.department_id}
                            onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                            label="Département"
                        >
                            <MenuItem value="">Aucun département</MenuItem>
                            {departments.map((dept) => (
                                <MenuItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        disabled={loading || !formData.name || !formData.email || !formData.role || (!editingUser && !formData.password)}
                    >
                        {loading ? 'Enregistrement...' : (editingUser ? 'Modifier' : 'Ajouter')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default UserManagement;
