import React, { useState } from 'react';
import { usersAPI } from '@/api/users';
import apiClient from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsAPI } from '@/api/departments';
import toast from 'react-hot-toast';
import type { Department } from '@/types';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  MenuItem,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const Departments: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: departments = [], isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => departmentsAPI.getAll(),
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [responsableId, setResponsableId] = useState<number | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => usersAPI.getAll(),
  });

  const { data: meta } = useQuery({
    queryKey: ['meta'],
    queryFn: async () => apiClient.get('/meta').then(r => r.data),
  });
  const [showPurgeNotice, setShowPurgeNotice] = useState(() => {
    try {
      return localStorage.getItem('departmentsPurgedNoticeDismissed') !== 'true';
    } catch (e) {
      return true;
    }
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const createMut = useMutation({
    mutationFn: (payload: { name: string; description?: string; slug?: string; responsable_id?: number | null }) => departmentsAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Département créé');
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Erreur création');
    }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name?: string; description?: string; slug?: string; responsable_id?: number | null } }) => departmentsAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Département mis à jour');
      handleCloseDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur mise à jour'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => departmentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Département supprimé');
      setOpenDelete(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur suppression'),
  });

  const handleOpenDialog = (dep: Department | null = null) => {
    setSelected(dep);
    setName(dep?.name ?? '');
    setDescription(dep?.description ?? '');
    setSlug(dep?.slug ?? '');
    setResponsableId(dep?.responsable_id ?? null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelected(null);
    setName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nom requis');
      return;
    }
    const payload: any = {
      name: name.trim(),
      description: description.trim() || null,
      slug: slug.trim() || null,
      responsable_id: responsableId ?? null,
    };

    if (selected) {
      updateMut.mutate({ id: selected.id, payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const clearResponsable = () => {
    setResponsableId(null);
  };

  const handleDelete = (dep: Department) => {
    setSelected(dep);
    setOpenDelete(true);
  };

  const confirmDelete = () => {
    if (selected) deleteMut.mutate(selected.id);
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  if (isLoading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>
  );

  if (error) return (
    <Box sx={{ p: 3 }}><Alert severity="error">Erreur lors du chargement des départements</Alert></Box>
  );

  // Show notice if meta flags indicate purge and user hasn't dismissed
  const purgedFlag = meta?.flags?.departments_responsables_purged || null;

  const paginated = Array.isArray(departments) ? departments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : [];

  const formatDate = (d?: string | null) => {
    const val = d || (d === '' ? '' : undefined);
    if (!val) return '-';
    const dt = new Date(val);
    if (isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('fr-FR');
  };

  return (
    <Box>
      {purgedFlag && showPurgeNotice && (
        <Box sx={{ mb: 2 }}>
          <Alert
            severity="info"
            action={<Button color="inherit" size="small" onClick={() => { setShowPurgeNotice(false); localStorage.setItem('departmentsPurgedNoticeDismissed','true'); }}>J'ai compris</Button>}
          >
            Les responsables préexistants des départements ont été purgés le {new Date(purgedFlag).toLocaleString('fr-FR')}.
          </Alert>
        </Box>
      )}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestion des Départements</Typography>
        <Box>
          <Button sx={{ mr: 1 }} variant={viewMode === 'table' ? 'contained' : 'outlined'} onClick={() => setViewMode('table')}>Table</Button>
          <Button sx={{ mr: 2 }} variant={viewMode === 'cards' ? 'contained' : 'outlined'} onClick={() => setViewMode('cards')}>Cartes</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Nouveau Département
          </Button>
        </Box>
      </Box>
      {viewMode === 'table' ? (
        <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nom</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Responsable</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Créé le</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">Aucun département</TableCell></TableRow>
            ) : (
              paginated.map((dep) => (
                <TableRow key={dep.id} hover>
                  <TableCell>{dep.id}</TableCell>
                  <TableCell>
                    <Box>
                      <Box sx={{ fontWeight: 600 }}>{dep.name}</Box>
                      {dep.description && <Box sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{dep.description}</Box>}
                      {dep.slug && <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>/{dep.slug}</Box>}
                    </Box>
                  </TableCell>
                      <TableCell>
                        {dep.responsable ? `${dep.responsable.prenom} ${dep.responsable.nom}` : (users.find(u => u.id === dep.responsable_id) ? `${users.find(u => u.id === dep.responsable_id)?.prenom} ${users.find(u => u.id === dep.responsable_id)?.nom}` : '-')}
                      </TableCell>
                  <TableCell>{formatDate(dep.created_at ?? (dep as any).createdAt)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Modifier"><IconButton color="primary" onClick={() => handleOpenDialog(dep)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Supprimer"><IconButton color="error" onClick={() => handleDelete(dep)}><DeleteIcon /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={Array.isArray(departments) ? departments.length : 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        </TableContainer>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {paginated.map((dep) => (
            <Box key={dep.id} sx={{ width: { xs: '100%', sm: '48%', md: '31%' } }}>
              <Card>
                <CardContent>
                  <Box sx={{ fontWeight: 700, fontSize: '1.05rem' }}>{dep.name}</Box>
                  {dep.description && <Box sx={{ mt: 1, color: 'text.secondary' }}>{dep.description}</Box>}
                  <Box sx={{ mt: 2, color: 'text.secondary' }}>
                    <strong>Responsable:</strong> {dep.responsable ? `${dep.responsable.prenom} ${dep.responsable.nom}` : (users.find(u => u.id === dep.responsable_id) ? `${users.find(u => u.id === dep.responsable_id)?.prenom} ${users.find(u => u.id === dep.responsable_id)?.nom}` : '-')}
                  </Box>
                  <Box sx={{ mt: 1, color: 'text.secondary' }}>Créé le: {formatDate(dep.created_at ?? (dep as any).createdAt)}</Box>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleOpenDialog(dep)}>Modifier</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(dep)}>Supprimer</Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <DialogTitle>{selected ? 'Modifier Département' : 'Nouveau Département'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="normal"
              label="Nom"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              margin="normal"
              label="Slug (URL friendly)"
              fullWidth
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              helperText="Optionnel: exemple 'direction-rh'"
            />
            <TextField
              margin="normal"
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TextField
              select
              margin="normal"
              label="Responsable"
              fullWidth
              value={responsableId ?? ''}
              onChange={(e) => setResponsableId(e.target.value ? Number(e.target.value) : null)}
              SelectProps={{
                displayEmpty: true,
              }}
            >
              <MenuItem value="">(Aucun)</MenuItem>
              {users
                .filter(u => u.role === 'responsable')
                .map(u => (
                  <MenuItem key={u.id} value={u.id} disabled={u.actif === false}>{u.prenom} {u.nom}{u.actif === false ? ' (inactif)' : ''}</MenuItem>
                ))}
            </TextField>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button size="small" onClick={clearResponsable}>Effacer responsable</Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained">Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous supprimer le département « {selected?.name} » ? Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Departments;
