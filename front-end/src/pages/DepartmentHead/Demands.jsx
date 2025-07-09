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
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import axios from 'axios';

const DepartmentHeadDemands = () => {
  // Fonction utilitaire pour format FCFA
  const formatFCFA = (amount) => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return '';
    return new Intl.NumberFormat('fr-FR').format(Number(amount)) + ' FCFA';
  };

  const [demands, setDemands] = useState([]);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [evaluationDialog, setEvaluationDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [demandHistory, setDemandHistory] = useState([]);
  const [evaluationData, setEvaluationData] = useState({
    decision: '',
    comments: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchDemands();
  }, []);

  const fetchDemands = async () => {
    try {
      const response = await axios.get('/api/demands', axiosConfig);
      setDemands(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      showAlert('Erreur lors du chargement des demandes', 'error');
    }
  };

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  };

  const handleEvaluate = async () => {
    try {
      await axios.put(`/api/demands/${selectedDemand.id}/evaluate`, evaluationData, axiosConfig);
      showAlert('Évaluation enregistrée avec succès', 'success');
      setEvaluationDialog(false);
      setEvaluationData({ decision: '', comments: '' });
      setSelectedDemand(null);
      fetchDemands();
    } catch (error) {
      showAlert('Erreur lors de l\'évaluation', 'error');
    }
  };

  const openEvaluationDialog = (demand, decision) => {
    setSelectedDemand(demand);
    setEvaluationData({ decision, comments: '' });
    setEvaluationDialog(true);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved_by_head': return 'success';
      case 'rejected_by_head': return 'error';
      case 'approved_by_director': return 'success';
      case 'rejected_by_director': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved_by_head': return 'Approuvée';
      case 'rejected_by_head': return 'Rejetée';
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

  const pendingDemands = demands.filter(d => d.status === 'pending');
  const processedDemands = demands.filter(d => d.status !== 'pending');

  return (
    <Box sx={{ p: 3 }}>
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        Gestion des demandes - Chef de département
      </Typography>

      {/* Demandes en attente */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Demandes en attente d'évaluation ({pendingDemands.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Enseignant</TableCell>
                  <TableCell>Titre</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Quantité</TableCell>
                  <TableCell>Prix estimé</TableCell>
                  <TableCell>Priorité</TableCell>
                  <TableCell>Date de création</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingDemands.map((demand) => (
                  <TableRow key={demand.id}>
                    <TableCell>{demand.teacher_name}</TableCell>
                    <TableCell>{demand.title}</TableCell>
                    <TableCell>{demand.category_name}</TableCell>
                    <TableCell>{demand.quantity}</TableCell>
                    <TableCell>
                      {formatFCFA(demand.estimated_price)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityLabel(demand.priority)}
                        color={getPriorityColor(demand.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(demand.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Voir l'historique">
                        <IconButton onClick={() => openHistoryDialog(demand)}>
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approuver">
                        <IconButton
                          color="success"
                          onClick={() => openEvaluationDialog(demand, 'approved')}
                        >
                          <ApproveIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rejeter">
                        <IconButton
                          color="error"
                          onClick={() => openEvaluationDialog(demand, 'rejected')}
                        >
                          <RejectIcon />
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
                  <TableCell>Enseignant</TableCell>
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
                    <TableCell>{demand.teacher_name}</TableCell>
                    <TableCell>{demand.title}</TableCell>
                    <TableCell>{demand.category_name}</TableCell>
                    <TableCell>
                      {formatFCFA(demand.estimated_price)}
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

      {/* Dialog d'évaluation */}
      <Dialog open={evaluationDialog} onClose={() => setEvaluationDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {evaluationData.decision === 'approved' ? 'Approuver' : 'Rejeter'} la demande
        </DialogTitle>
        <DialogContent>
          {selectedDemand && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Détails de la demande
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Enseignant</Typography>
                  <Typography variant="body1">{selectedDemand.teacher_name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Liste</Typography>
                  <Typography variant="body1">{selectedDemand.list_title}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Titre</Typography>
                  <Typography variant="body1">{selectedDemand.title}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedDemand.description}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Catégorie</Typography>
                  <Typography variant="body1">{selectedDemand.category_name}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Quantité</Typography>
                  <Typography variant="body1">{selectedDemand.quantity}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Prix estimé</Typography>
                  <Typography variant="body1">
                    {formatFCFA(selectedDemand.estimated_price)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Priorité</Typography>
                  <Typography variant="body1">{getPriorityLabel(selectedDemand.priority)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Date de création</Typography>
                  <Typography variant="body1">
                    {new Date(selectedDemand.created_at).toLocaleDateString('fr-FR')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Justification</Typography>
                  <Typography variant="body1">{selectedDemand.justification}</Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Commentaires"
                value={evaluationData.comments}
                onChange={(e) => setEvaluationData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Ajoutez vos commentaires sur cette décision..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvaluationDialog(false)}>Annuler</Button>
          <Button
            onClick={handleEvaluate}
            variant="contained"
            color={evaluationData.decision === 'approved' ? 'success' : 'error'}
          >
            {evaluationData.decision === 'approved' ? 'Approuver' : 'Rejeter'}
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
                Par {selectedDemand.teacher_name} - {new Date(selectedDemand.created_at).toLocaleDateString('fr-FR')}
              </Typography>
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
                      {new Date(evaluation.evaluated_at).toLocaleString('fr-FR')} - {evaluation.evaluator_name} ({evaluation.evaluator_role})
                    </Typography>
                    <Chip
                      label={evaluation.decision === 'approved' ? 'Approuvé' : 'Rejeté'}
                      color={evaluation.decision === 'approved' ? 'success' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                    {evaluation.comments && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {evaluation.comments}
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

export default DepartmentHeadDemands;
