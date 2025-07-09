import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DirectorDashboard = () => {
  const [demandLists, setDemandLists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'list', 'department'
  const [formData, setFormData] = useState({});
  const [selectedList, setSelectedList] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [listsRes, categoriesRes, departmentsRes, statsRes] = await Promise.all([
        axios.get('/api/demand-lists', axiosConfig),
        axios.get('/api/categories', axiosConfig),
        axios.get('/api/departments', axiosConfig),
        axios.get('/api/stats', axiosConfig)
      ]);

      setDemandLists(listsRes.data);
      setCategories(categoriesRes.data);
      setDepartments(departmentsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showAlert('Erreur lors du chargement des données', 'error');
    }
  };

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  };

  const handleCreateList = async () => {
    try {
      await axios.post('/api/demand-lists', formData, axiosConfig);
      showAlert('Liste créée avec succès', 'success');
      setOpenDialog(false);
      setFormData({});
      fetchData();
    } catch (error) {
      showAlert('Erreur lors de la création de la liste', 'error');
    }
  };

  const handleCreateCategory = async () => {
    // Redirection vers la page de gestion des catégories
    navigate('/category-management');
  };

  const handleCreateDepartment = async () => {
    try {
      if (editingDepartment) {
        await axios.put(`/api/departments/${editingDepartment.id}`, formData, axiosConfig);
        showAlert('Département modifié avec succès', 'success');
      } else {
        await axios.post('/api/departments', formData, axiosConfig);
        showAlert('Département créé avec succès', 'success');
      }
      setOpenDialog(false);
      setEditingDepartment(null);
      setFormData({});
      fetchData();
    } catch (error) {
      showAlert('Erreur lors de la sauvegarde du département', 'error');
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      try {
        await axios.delete(`/api/departments/${departmentId}`, axiosConfig);
        showAlert('Département supprimé avec succès', 'success');
        fetchData();
      } catch (error) {
        showAlert('Erreur lors de la suppression du département', 'error');
      }
    }
  };

  const handleToggleListStatus = async (listId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      await axios.put(`/api/demand-lists/${listId}/status`, { status: newStatus }, axiosConfig);
      showAlert(`Liste ${newStatus === 'open' ? 'ouverte' : 'fermée'} avec succès`, 'success');
      fetchData();
    } catch (error) {
      showAlert('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const openCreateDialog = (type) => {
    if (type === 'category') {
      navigate('/category-management');
      return;
    }
    setDialogType(type);
    setEditingDepartment(null);
    setFormData({});
    setOpenDialog(true);
  };

  const openEditDepartmentDialog = (department) => {
    setDialogType('department');
    setEditingDepartment(department);
    setFormData({
      name: department.name || '',
      description: department.description || ''
    });
    setOpenDialog(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const renderCreateDialog = () => {
    const titles = {
      'list': 'Créer une nouvelle liste de demandes',
      'department': editingDepartment ? 'Modifier le département' : 'Créer un nouveau département'
    };

    const handleSubmit = () => {
      switch (dialogType) {
        case 'list': handleCreateList(); break;
        case 'department': handleCreateDepartment(); break;
        default: break;
      }
    };

    return (
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{titles[dialogType]}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nom/Titre"
              value={formData.title || formData.name || ''}
              onChange={(e) => handleInputChange(dialogType === 'list' ? 'title' : 'name', e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              margin="normal"
            />
            {dialogType === 'list' && (
              <TextField
                fullWidth
                type="datetime-local"
                label="Date limite"
                value={formData.deadline || ''}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDepartment && dialogType === 'department' ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        Tableau de bord - Directeur
      </Typography>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total demandes</Typography>
              <Typography variant="h4" color="primary">{stats.total_demands || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">En attente</Typography>
              <Typography variant="h4" color="warning.main">{stats.approved_by_head || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Approuvées</Typography>
              <Typography variant="h4" color="success.main">{stats.approved_by_director || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Coût approuvé</Typography>
              <Typography variant="h4" color="success.main">
                {new Intl.NumberFormat('fr-FR').format(stats.approved_cost || 0)} FCFA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions rapides */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Actions rapides</Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openCreateDialog('list')}
            >
              Nouvelle liste de demandes
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<CategoryIcon />}
              onClick={() => navigate('/category-management')}
            >
              Gestion des catégories
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/user-management')}
            >
              Gestion des utilisateurs
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Listes de demandes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Listes de demandes
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Titre</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Date limite</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {demandLists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell>{list.title}</TableCell>
                    <TableCell>{list.description}</TableCell>
                    <TableCell>
                      {list.deadline ? new Date(list.deadline).toLocaleDateString('fr-FR') : 'Non définie'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={list.status === 'open' ? 'Ouverte' : 'Fermée'}
                        color={getStatusColor(list.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={list.status === 'open' ? 'Fermer' : 'Ouvrir'}>
                        <IconButton
                          onClick={() => handleToggleListStatus(list.id, list.status)}
                        >
                          {list.status === 'open' ? <CloseIcon /> : <EditIcon />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Catégories et Départements */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/category-management')}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Catégories ({categories.length})
              </Typography>
              {categories.slice(0, 10).map((category) => (
                <Chip
                  key={category.id}
                  label={`${category.code} - ${category.name}`}
                  sx={{ mr: 1, mb: 1 }}
                  size="small"
                />
              ))}
              {categories.length > 10 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  +{categories.length - 10} autres catégories...
                </Typography>
              )}
              <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
                Cliquez pour gérer les catégories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Départements ({departments.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openCreateDialog('department')}
                  size="small"
                >
                  Nouveau
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments.map((department) => (
                      <TableRow key={department.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {department.name}
                            </Typography>
                            {department.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {department.description.length > 30 
                                  ? `${department.description.substring(0, 30)}...` 
                                  : department.description
                                }
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => openEditDepartmentDialog(department)}
                            color="primary"
                            size="small"
                            title="Modifier"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteDepartment(department.id)}
                            color="error"
                            size="small"
                            title="Supprimer"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {departments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Aucun département
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {renderCreateDialog()}
    </Box>
  );
};

export default DirectorDashboard;
