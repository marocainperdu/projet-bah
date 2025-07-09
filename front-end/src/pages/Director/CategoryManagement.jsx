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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    parent_id: null,
    level: 1,
    type: 'ordinaire',
    section: 'fonctionnement',
    is_active: true
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' or 'table'
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories', axiosConfig);
      setCategories(response.data);
      buildHierarchy(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      showAlert('Erreur lors du chargement des catégories', 'error');
    }
  };

  const buildHierarchy = (categoriesData) => {
    const categoryMap = {};
    const rootCategories = [];

    // Créer un map pour un accès rapide
    categoriesData.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    // Construire la hiérarchie
    categoriesData.forEach(cat => {
      if (cat.parent_id && categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
      } else {
        rootCategories.push(categoryMap[cat.id]);
      }
    });

    setHierarchicalCategories(rootCategories);
  };

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  };

  const handleCreateCategory = async () => {
    try {
      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory.id}`, formData, axiosConfig);
        showAlert('Catégorie modifiée avec succès', 'success');
      } else {
        await axios.post('/api/categories', formData, axiosConfig);
        showAlert('Catégorie créée avec succès', 'success');
      }
      setOpenDialog(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (error) {
      showAlert('Erreur lors de la sauvegarde de la catégorie', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await axios.delete(`/api/categories/${categoryId}`, axiosConfig);
        showAlert('Catégorie supprimée avec succès', 'success');
        fetchCategories();
      } catch (error) {
        showAlert('Erreur lors de la suppression de la catégorie', 'error');
      }
    }
  };

  const openCreateDialog = (parentCategory = null) => {
    setEditingCategory(null);
    resetForm();
    if (parentCategory) {
      setFormData(prev => ({
        ...prev,
        parent_id: parentCategory.id,
        level: parentCategory.level + 1,
        type: parentCategory.type,
        section: parentCategory.section
      }));
    }
    setOpenDialog(true);
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setFormData({
      code: category.code || '',
      name: category.name || '',
      description: category.description || '',
      parent_id: category.parent_id,
      level: category.level,
      type: category.type,
      section: category.section,
      is_active: category.is_active
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      parent_id: null,
      level: 1,
      type: 'ordinaire',
      section: 'fonctionnement',
      is_active: true
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTypeColor = (type) => {
    return type === 'ordinaire' ? 'primary' : 'secondary';
  };

  const getSectionColor = (section) => {
    return section === 'fonctionnement' ? 'info' : 'warning';
  };

  const renderCategoryTree = (categoryList, depth = 0) => {
    return categoryList.map((category) => (
      <Card key={category.id} sx={{ ml: depth * 2, mb: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', flex: 1 }}>
              {category.code} - {category.name}
            </Typography>
            <Chip 
              label={category.type} 
              color={getTypeColor(category.type)}
              size="small"
            />
            <Chip 
              label={category.section} 
              color={getSectionColor(category.section)}
              size="small"
            />
            <Box>
              <IconButton
                size="small"
                onClick={() => openCreateDialog(category)}
                title="Ajouter sous-catégorie"
              >
                <AddIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => openEditDialog(category)}
                title="Modifier"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDeleteCategory(category.id)}
                title="Supprimer"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
          {category.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {category.description}
            </Typography>
          )}
          {category.children && category.children.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {renderCategoryTree(category.children, depth + 1)}
            </Box>
          )}
        </CardContent>
      </Card>
    ));
  };

  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Nom</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Section</TableCell>
            <TableCell>Niveau</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.code}</TableCell>
              <TableCell>
                {'—'.repeat(category.level - 1)} {category.name}
              </TableCell>
              <TableCell>
                <Chip 
                  label={category.type} 
                  color={getTypeColor(category.type)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={category.section} 
                  color={getSectionColor(category.section)}
                  size="small"
                />
              </TableCell>
              <TableCell>{category.level}</TableCell>
              <TableCell>
                <Chip 
                  label={category.is_active ? 'Actif' : 'Inactif'} 
                  color={category.is_active ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton onClick={() => openCreateDialog(category)} title="Ajouter sous-catégorie">
                  <AddIcon />
                </IconButton>
                <IconButton onClick={() => openEditDialog(category)} title="Modifier">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteCategory(category.id)} title="Supprimer">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCreateDialog = () => {
    const parentCategories = categories.filter(cat => cat.level < 4); // Limiter la profondeur

    return (
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Modifier la catégorie' : 'Créer une nouvelle catégorie'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Code comptable"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Catégorie parente</InputLabel>
                  <Select
                    value={formData.parent_id || ''}
                    onChange={(e) => handleInputChange('parent_id', e.target.value || null)}
                  >
                    <MenuItem value="">Aucune (catégorie racine)</MenuItem>
                    {parentCategories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.code} - {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    <MenuItem value="ordinaire">Ordinaire</MenuItem>
                    <MenuItem value="extraordinaire">Extraordinaire</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={formData.section}
                    onChange={(e) => handleInputChange('section', e.target.value)}
                  >
                    <MenuItem value="fonctionnement">Fonctionnement</MenuItem>
                    <MenuItem value="investissement">Investissement</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Niveau"
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
                  margin="normal"
                  inputProps={{ min: 1, max: 5 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleCreateCategory} variant="contained">
            {editingCategory ? 'Modifier' : 'Créer'}
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

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <CategoryIcon sx={{ mr: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Gestion des catégories
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openCreateDialog()}
            sx={{ mr: 2 }}
          >
            Nouvelle catégorie
          </Button>
          <Button
            variant="outlined"
            onClick={() => setViewMode(viewMode === 'hierarchy' ? 'table' : 'hierarchy')}
          >
            {viewMode === 'hierarchy' ? 'Vue tableau' : 'Vue hiérarchique'}
          </Button>
        </Box>
        <Typography variant="body1">
          Total: {categories.length} catégories
        </Typography>
      </Box>

      {/* Statistiques rapides */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Ordinaires</Typography>
              <Typography variant="h4" color="primary">
                {categories.filter(c => c.type === 'ordinaire').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Extraordinaires</Typography>
              <Typography variant="h4" color="secondary">
                {categories.filter(c => c.type === 'extraordinaire').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Fonctionnement</Typography>
              <Typography variant="h4" color="info.main">
                {categories.filter(c => c.section === 'fonctionnement').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Investissement</Typography>
              <Typography variant="h4" color="warning.main">
                {categories.filter(c => c.section === 'investissement').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contenu principal */}
      <Card>
        <CardContent>
          {viewMode === 'hierarchy' ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Vue hiérarchique des catégories
              </Typography>
              {renderCategoryTree(hierarchicalCategories)}
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Vue tableau des catégories
              </Typography>
              {renderTableView()}
            </Box>
          )}
        </CardContent>
      </Card>

      {renderCreateDialog()}
    </Box>
  );
};

export default CategoryManagement;
