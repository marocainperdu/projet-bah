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
  Delete as DeleteIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DirectorDashboard = () => {
  const [demandLists, setDemandLists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({});
  const [allDemands, setAllDemands] = useState([]);
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
      const [listsRes, categoriesRes, departmentsRes, statsRes, demandsRes] = await Promise.all([
        axios.get('/api/demand-lists', axiosConfig),
        axios.get('/api/categories', axiosConfig),
        axios.get('/api/departments', axiosConfig),
        axios.get('/api/stats', axiosConfig),
        axios.get('/api/demands', axiosConfig)
      ]);

      setDemandLists(listsRes.data);
      setCategories(categoriesRes.data);
      setDepartments(departmentsRes.data);
      setStats(statsRes.data);
      setAllDemands(demandsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showAlert('Erreur lors du chargement des données', 'error');
    }
  };

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  };

  const validateDate = (dateString) => {
    if (!dateString) return true; // Date optionnelle
    
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{2})$/;
    const match = dateString.match(datePattern);
    
    if (!match) return false;
    
    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(`20${year}`, 10);
    
    // Vérifications de base
    if (dayNum < 1 || dayNum > 31) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < 2024 || yearNum > 2099) return false;
    
    // Vérifier que la date est valide
    const date = new Date(yearNum, monthNum - 1, dayNum);
    return date.getFullYear() === yearNum && 
           date.getMonth() === monthNum - 1 && 
           date.getDate() === dayNum;
  };

  const handleCreateList = async () => {
    try {
      // Valider la date si elle est fournie
      if (formData.deadline && !validateDate(formData.deadline)) {
        showAlert('Format de date invalide. Utilisez DD/MM/YY (ex: 25/12/24)', 'error');
        return;
      }
      
      // Convertir la date au format ISO pour l'envoi au serveur
      let deadline = formData.deadline;
      if (deadline) {
        // Si on a une date au format DD/MM/YY, la convertir
        const datePattern = /^(\d{2})\/(\d{2})\/(\d{2})$/;
        const match = deadline.match(datePattern);
        if (match) {
          const [, day, month, year] = match;
          // Convertir YY en YYYY (20YY)
          const fullYear = `20${year}`;
          // Créer la date avec l'heure par défaut 23:59
          deadline = `${fullYear}-${month}-${day}T23:59:00`;
        }
      }
      
      const dataToSend = {
        ...formData,
        deadline: deadline
      };
      
      await axios.post('/api/demand-lists', dataToSend, axiosConfig);
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
        if (error.response && error.response.status === 400) {
          showAlert(error.response.data.error || 'Impossible de supprimer ce département car il contient des utilisateurs', 'error');
        } else {
          showAlert('Erreur lors de la suppression du département', 'error');
        }
      }
    }
  };

  const exportListToExcel = async (listId, listTitle) => {
    try {
      // Récupérer les demandes spécifiques à cette liste
      const response = await axios.get(`/api/demands/export/${listId}`, axiosConfig);
      const exportDemands = response.data;

      if (exportDemands.length === 0) {
        showAlert('Aucune demande à exporter pour cette liste', 'warning');
        return;
      }

      // Créer les données pour l'export
      const exportData = exportDemands.map(demand => ({
        'ID': demand.id,
        'Titre': demand.title,
        'Description': demand.description,
        'Enseignant': demand.teacher_name,
        'Département': demand.department_name || 'Non défini',
        'Catégorie': `${demand.category_code} - ${demand.category_name}`,
        'Quantité': demand.quantity,
        'Prix estimé (FCFA)': new Intl.NumberFormat('fr-FR').format(demand.estimated_price),
        'Prix total (FCFA)': new Intl.NumberFormat('fr-FR').format(demand.quantity * demand.estimated_price),
        'Priorité': demand.priority,
        'Statut': getStatusText(demand.status),
        'Justification': demand.justification || '',
        'Date de création': new Date(demand.created_at).toLocaleDateString('fr-FR'),
        'Dernière modification': new Date(demand.updated_at).toLocaleDateString('fr-FR')
      }));

      // Calculer les statistiques pour cette liste spécifique
      const totalEstimated = exportDemands.reduce((sum, demand) => sum + (demand.quantity * demand.estimated_price), 0);
      const approvedTotal = exportDemands
        .filter(demand => demand.status === 'approved_by_director')
        .reduce((sum, demand) => sum + (demand.quantity * demand.estimated_price), 0);
      const pendingTotal = exportDemands
        .filter(demand => ['pending', 'approved_by_head'].includes(demand.status))
        .reduce((sum, demand) => sum + (demand.quantity * demand.estimated_price), 0);
      const rejectedTotal = exportDemands
        .filter(demand => ['rejected_by_head', 'rejected_by_director'].includes(demand.status))
        .reduce((sum, demand) => sum + (demand.quantity * demand.estimated_price), 0);

      // Grouper par département pour cette liste
      const departmentStats = {};
      exportDemands.forEach(demand => {
        const deptName = demand.department_name || 'Non défini';
        if (!departmentStats[deptName]) {
          departmentStats[deptName] = { count: 0, total: 0 };
        }
        departmentStats[deptName].count++;
        departmentStats[deptName].total += (demand.quantity * demand.estimated_price);
      });

      // Grouper par catégorie pour cette liste
      const categoryStats = {};
      exportDemands.forEach(demand => {
        const catKey = `${demand.category_code} - ${demand.category_name}`;
        if (!categoryStats[catKey]) {
          categoryStats[catKey] = { count: 0, total: 0 };
        }
        categoryStats[catKey].count++;
        categoryStats[catKey].total += (demand.quantity * demand.estimated_price);
      });

      // Créer une feuille de statistiques
      const statsData = [
        ['=== RAPPORT DE LA LISTE ===', ''],
        ['Nom de la liste', listTitle],
        ['Statut de la liste', 'Fermée (définitivement)'],
        ['Date d\'export', new Date().toLocaleDateString('fr-FR')],
        ['Heure d\'export', new Date().toLocaleTimeString('fr-FR')],
        ['', ''],
        ['=== STATISTIQUES GÉNÉRALES ===', ''],
        ['Total des demandes', exportDemands.length],
        ['Demandes approuvées', exportDemands.filter(d => d.status === 'approved_by_director').length],
        ['Demandes en attente', exportDemands.filter(d => ['pending', 'approved_by_head'].includes(d.status)).length],
        ['Demandes rejetées', exportDemands.filter(d => ['rejected_by_head', 'rejected_by_director'].includes(d.status)).length],
        ['', ''],
        ['=== COÛTS EN FCFA ===', ''],
        ['Total estimé toutes demandes', new Intl.NumberFormat('fr-FR').format(totalEstimated)],
        ['Total approuvé par directeur', new Intl.NumberFormat('fr-FR').format(approvedTotal)],
        ['Total en attente d\'approbation', new Intl.NumberFormat('fr-FR').format(pendingTotal)],
        ['Total des demandes rejetées', new Intl.NumberFormat('fr-FR').format(rejectedTotal)],
        ['', ''],
        ['=== RÉPARTITION PAR DÉPARTEMENT ===', ''],
        ...Object.entries(departmentStats).map(([deptName, stats]) => 
          [`${deptName}`, `${stats.count} demandes - ${new Intl.NumberFormat('fr-FR').format(stats.total)} FCFA`]
        ),
        ['', ''],
        ['=== RÉPARTITION PAR CATÉGORIE ===', ''],
        ...Object.entries(categoryStats).map(([catName, stats]) => 
          [`${catName}`, `${stats.count} demandes - ${new Intl.NumberFormat('fr-FR').format(stats.total)} FCFA`]
        ),
        ['', ''],
        ['=== INFORMATIONS D\'EXPORT ===', ''],
        ['Exporté par', 'Directeur'],
        ['Nombre total d\'enregistrements', exportDemands.length],
        ['Liste ID', listId]
      ];

      // Utiliser une solution simple pour créer un CSV (compatible Excel)
      const csvContent = [
        // En-têtes
        Object.keys(exportData[0] || {}).join(';'),
        // Données des demandes
        ...exportData.map(row => Object.values(row).map(val => `"${val || ''}"`).join(';')),
        '',
        // Statistiques
        ...statsData.map(row => row.join(';'))
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const sanitizedTitle = listTitle.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `rapport_liste_${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      showAlert(`Fichier exporté avec succès pour "${listTitle}" (${exportDemands.length} demandes, ${new Intl.NumberFormat('fr-FR').format(totalEstimated)} FCFA total)`, 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      if (error.response && error.response.status === 404) {
        showAlert('Aucune demande trouvée pour cette liste', 'warning');
      } else if (error.response && error.response.status === 403) {
        showAlert('Cette liste n\'est pas encore fermée ou vous n\'avez pas les droits', 'error');
      } else {
        showAlert('Erreur lors de l\'export du fichier', 'error');
      }
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'En attente',
      'approved_by_head': 'Approuvé par chef de département',
      'rejected_by_head': 'Rejeté par chef de département',
      'approved_by_director': 'Approuvé par directeur',
      'rejected_by_director': 'Rejeté par directeur'
    };
    return statusMap[status] || status;
  };

  // Fermer définitivement une liste (plus de réouverture possible)
  const handleToggleListStatus = async (listId, currentStatus) => {
    if (currentStatus !== 'open') return; // Ne jamais rouvrir une liste fermée
    try {
      await axios.put(`/api/demand-lists/${listId}/status`, { status: 'closed' }, axiosConfig);
      showAlert('Liste fermée définitivement avec succès', 'success');
      fetchData();
    } catch (error) {
      showAlert('Erreur lors de la fermeture de la liste', 'error');
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
    // Validation spéciale pour la date limite
    if (field === 'deadline' && value) {
      // Permettre seulement les chiffres et les slashes
      const cleanValue = value.replace(/[^\d\/]/g, '');
      
      // Formatage automatique pendant la saisie
      let formattedValue = cleanValue;
      if (cleanValue.length >= 2 && cleanValue.indexOf('/') === -1) {
        formattedValue = cleanValue.substring(0, 2) + '/' + cleanValue.substring(2);
      }
      if (cleanValue.length >= 5 && cleanValue.split('/').length === 2) {
        const parts = cleanValue.split('/');
        formattedValue = parts[0] + '/' + parts[1].substring(0, 2) + '/' + parts[1].substring(2);
      }
      
      // Limiter à 8 caractères max (DD/MM/YY)
      if (formattedValue.length > 8) {
        formattedValue = formattedValue.substring(0, 8);
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getTimeUntilDeadline = (deadline) => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) {
      return { text: 'Expirée', color: 'error', expired: true };
    } else if (diffHours < 24) {
      return { text: `${diffHours}h restantes`, color: 'error', expired: false };
    } else if (diffDays < 3) {
      return { text: `${diffDays}j restants`, color: 'warning', expired: false };
    } else {
      return { text: `${diffDays}j restants`, color: 'info', expired: false };
    }
  };

  const handleCheckExpiredLists = async () => {
    try {
      await axios.post('/api/demand-lists/check-expired', {}, axiosConfig);
      showAlert('Vérification des listes expirées lancée', 'info');
      // Actualiser les données après quelques secondes
      setTimeout(() => {
        fetchData();
      }, 2000);
    } catch (error) {
      showAlert('Erreur lors de la vérification des listes expirées', 'error');
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
                label="Date limite (DD/MM/YY)"
                value={formData.deadline || ''}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                margin="normal"
                placeholder="25/12/24"
                helperText="Format : DD/MM/YY - L'heure sera automatiquement fixée à 23h59"
                inputProps={{
                  pattern: "^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{2}$",
                  title: "Format requis : DD/MM/YY (ex: 25/12/24)"
                }}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Listes de demandes
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCheckExpiredLists}
              sx={{ ml: 2 }}
            >
              Vérifier les expirations
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Titre</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Date limite</TableCell>
                  <TableCell>Temps restant</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                  <TableCell>Export</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {demandLists.map((list) => {
                  const timeInfo = getTimeUntilDeadline(list.deadline);
                  return (
                    <TableRow key={list.id}>
                      <TableCell>{list.title}</TableCell>
                      <TableCell>{list.description}</TableCell>
                      <TableCell>
                        {list.deadline ? new Date(list.deadline).toLocaleDateString('fr-FR') : 'Non définie'}
                      </TableCell>
                      <TableCell>
                        {timeInfo && (
                          <Chip
                            label={timeInfo.text}
                            color={timeInfo.color}
                            size="small"
                            variant={timeInfo.expired ? 'filled' : 'outlined'}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={list.status === 'open' ? 'Ouverte' : 'Fermée'}
                          color={getStatusColor(list.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {list.status === 'open' ? (
                          <Tooltip title="Fermer définitivement">
                            <IconButton
                              onClick={() => handleToggleListStatus(list.id, list.status)}
                              color="error"
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Gérer les validations de cette liste">
                            <IconButton
                              onClick={() => navigate(`/demands-review/${list.id}`)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={list.status === 'closed' ? 'Exporter les demandes de cette liste' : 'Export disponible après fermeture'}>
                          <span>
                            <IconButton
                              onClick={() => exportListToExcel(list.id, list.title)}
                              color="success"
                              size="small"
                              disabled={list.status !== 'closed'}
                            >
                              <FileDownloadIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                            {department.user_count > 0 && (
                              <Typography variant="caption" color="warning.main" sx={{ display: 'block', fontWeight: 'bold' }}>
                                {department.user_count} utilisateur(s) associé(s)
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
                            title={department.user_count > 0 ? "Impossible de supprimer : utilisateurs associés" : "Supprimer"}
                            disabled={department.user_count > 0}
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
