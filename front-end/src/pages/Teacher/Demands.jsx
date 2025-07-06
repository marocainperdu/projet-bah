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
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const TeacherDemands = () => {
  const [demands, setDemands] = useState([]);
  const [demandLists, setDemandLists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [demandHistory, setDemandHistory] = useState([]);
  const [formData, setFormData] = useState({
    demand_list_id: '',
    category_id: '',
    title: '',
    description: '',
    quantity: 1,
    estimated_price: '',
    justification: '',
    priority: 'medium'
  });
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
      const [demandsRes, listsRes, categoriesRes] = await Promise.all([
        axios.get('/api/demands', axiosConfig),
        axios.get('/api/demand-lists', axiosConfig),
        axios.get('/api/categories', axiosConfig)
      ]);

      setDemands(demandsRes.data);
      setDemandLists(listsRes.data.filter(list => list.status === 'open'));
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showAlert('Erreur lors du chargement des données', 'error');
    }
  };

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  };

  const handleCreateDemand = async () => {
    try {
      await axios.post('/api/demands', formData, axiosConfig);
      showAlert('Demande créée avec succès', 'success');
      setCreateDialog(false);
      setFormData({
        demand_list_id: '',
        category_id: '',
        title: '',
        description: '',
        quantity: 1,
        estimated_price: '',
        justification: '',
        priority: 'medium'
      });
      fetchData();
    } catch (error) {
      showAlert('Erreur lors de la création de la demande', 'error');
    }
  };

  const openHistoryDialog = async (demand) => {
    try {
      const response = await axios.get(`/api/demands/${demand.id}/history`, axiosConfig);
      setDemandHistory(response.data);
      setSelectedDemand(demand);
      setHistoryDialog(true);
    } catch (error) {
      showAlert('Erreur lors du chargement de l\'historique', 'error');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved_by_head': return 'info';
      case 'rejected_by_head': return 'error';
      case 'approved_by_director': return 'success';
      case 'rejected_by_director': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente chef département';
      case 'approved_by_head': return 'En attente directeur';
      case 'rejected_by_head': return 'Rejetée par le chef';
      case 'approved_by_director': return 'Approuvée par le directeur';
      case 'rejected_by_director': return 'Rejetée par le directeur';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  };

  const pendingDemands = demands.filter(d => ['pending', 'approved_by_head'].includes(d.status));
  const processedDemands = demands.filter(d => ['approved_by_director', 'rejected_by_director', 'rejected_by_head'].includes(d.status));

  return (
    <Box sx={{ p: 3 }}>
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Mes demandes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
          disabled={demandLists.length === 0}
        >
          Nouvelle demande
        </Button>
      </Box>

      {demandLists.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Aucune liste de demandes ouverte pour le moment. Veuillez attendre qu'une liste soit créée par le directeur.
        </Alert>
      )}

      {/* Demandes en cours */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Demandes en cours ({pendingDemands.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Liste</TableCell>
                  <TableCell>Titre</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Quantité</TableCell>
                  <TableCell>Prix estimé</TableCell>
                  <TableCell>Priorité</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingDemands.map((demand) => (
                  <TableRow key={demand.id}>
                    <TableCell>{demand.list_title}</TableCell>
                    <TableCell>{demand.title}</TableCell>
                    <TableCell>{demand.category_name}</TableCell>
                    <TableCell>{demand.quantity}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(demand.estimated_price)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityLabel(demand.priority)}
                        color={getPriorityColor(demand.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(demand.status)}
                        color={getStatusColor(demand.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Voir l'historique">
                        <IconButton onClick={() => openHistoryDialog(demand)}>
                          <HistoryIcon />
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

      {/* Demandes traitées */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Demandes traitées ({processedDemands.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Liste</TableCell>
                  <TableCell>Titre</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Prix estimé</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedDemands.map((demand) => (
                  <TableRow key={demand.id}>
                    <TableCell>{demand.list_title}</TableCell>
                    <TableCell>{demand.title}</TableCell>
                    <TableCell>{demand.category_name}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(demand.estimated_price)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(demand.status)}
                        color={getStatusColor(demand.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Voir l'historique">
                        <IconButton onClick={() => openHistoryDialog(demand)}>
                          <HistoryIcon />
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

      {/* Dialog de création */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Créer une nouvelle demande</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Liste de demandes</InputLabel>
                  <Select
                    value={formData.demand_list_id}
                    onChange={(e) => handleInputChange('demand_list_id', e.target.value)}
                  >
                    {demandLists.map((list) => (
                      <MenuItem key={list.id} value={list.id}>
                        {list.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Catégorie</InputLabel>
                  <Select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Titre"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
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
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantité"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Prix estimé (€)"
                  value={formData.estimated_price}
                  onChange={(e) => handleInputChange('estimated_price', parseFloat(e.target.value))}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Priorité</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    <MenuItem value="low">Basse</MenuItem>
                    <MenuItem value="medium">Moyenne</MenuItem>
                    <MenuItem value="high">Haute</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Justification"
                  value={formData.justification}
                  onChange={(e) => handleInputChange('justification', e.target.value)}
                  placeholder="Expliquez pourquoi cette demande est nécessaire..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Annuler</Button>
          <Button
            onClick={handleCreateDemand}
            variant="contained"
            disabled={!formData.demand_list_id || !formData.category_id || !formData.title || !formData.estimated_price}
          >
            Créer la demande
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'historique */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historique de la demande</DialogTitle>
        <DialogContent>
          {selectedDemand && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedDemand.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Créée le {new Date(selectedDemand.created_at).toLocaleDateString('fr-FR')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Détails de la demande
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Liste</Typography>
                  <Typography variant="body1">{selectedDemand.list_title}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Catégorie</Typography>
                  <Typography variant="body1">{selectedDemand.category_name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedDemand.description}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Quantité</Typography>
                  <Typography variant="body1">{selectedDemand.quantity}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Prix estimé</Typography>
                  <Typography variant="body1">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedDemand.estimated_price)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Priorité</Typography>
                  <Typography variant="body1">{getPriorityLabel(selectedDemand.priority)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Justification</Typography>
                  <Typography variant="body1">{selectedDemand.justification}</Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Historique des évaluations
              </Typography>
              {demandHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Aucune évaluation pour le moment
                </Typography>
              ) : (
                demandHistory.map((evaluation, index) => (
                  <Box key={evaluation.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(evaluation.evaluated_at).toLocaleString('fr-FR')} - {evaluation.evaluator_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {evaluation.evaluator_role === 'department_head' ? 'Chef de département' : 'Directeur'}
                    </Typography>
                    <Chip
                      label={evaluation.decision === 'approved' ? 'Approuvé' : 'Rejeté'}
                      color={evaluation.decision === 'approved' ? 'success' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                    {evaluation.comments && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Commentaires:</strong> {evaluation.comments}
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherDemands;
