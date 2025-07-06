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
  Visibility as ViewIcon
} from '@mui/icons-material';
import axios from 'axios';

const DirectorDashboard = () => {
  const [demandLists, setDemandLists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'list', 'category', 'department'
  const [formData, setFormData] = useState({});
  const [selectedList, setSelectedList] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

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
    try {
      await axios.post('/api/categories', formData, axiosConfig);
      showAlert('Catégorie créée avec succès', 'success');
      setOpenDialog(false);
      setFormData({});
      fetchData();
    } catch (error) {
      showAlert('Erreur lors de la création de la catégorie', 'error');
    }
  };

  const handleCreateDepartment = async () => {
    try {
      await axios.post('/api/departments', formData, axiosConfig);
      showAlert('Département créé avec succès', 'success');
      setOpenDialog(false);
      setFormData({});
      fetchData();
    } catch (error) {
      showAlert('Erreur lors de la création du département', 'error');
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
    setDialogType(type);
    setFormData({});
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
      'category': 'Créer une nouvelle catégorie',
      'department': 'Créer un nouveau département'
    };

    const handleSubmit = () => {
      switch (dialogType) {
        case 'list': handleCreateList(); break;
        case 'category': handleCreateCategory(); break;
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
          <Button onClick={handleSubmit} variant="contained">Créer</Button>
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
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.approved_cost || 0)}
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
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => openCreateDialog('category')}
            >
              Nouvelle catégorie
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => openCreateDialog('department')}
            >
              Nouveau département
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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Catégories ({categories.length})
              </Typography>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Départements ({departments.length})
              </Typography>
              {departments.map((dept) => (
                <Chip
                  key={dept.id}
                  label={dept.name}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {renderCreateDialog()}
    </Box>
  );
};

export default DirectorDashboard;
