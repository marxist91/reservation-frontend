import React, { useState } from 'react';
import { usersAPI } from '@/api/users';
import apiClient from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsAPI } from '@/api/departments';
import toast from 'react-hot-toast';
import type { Department, User } from '@/types';
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
  Skeleton,
  Alert,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  MenuItem,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => usersAPI.getAll(),
  });
  const users: User[] = Array.isArray(usersData?.utilisateurs) ? usersData.utilisateurs : [];

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
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="text" width={300} height={48} sx={{ mb: 3 }} />
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 1, mb: 1 }} />
      ))}
    </Box>
  );

  if (error) return (
    <Box sx={{ p: 3 }}><Alert severity="error" sx={{ borderRadius: 2 }}>Erreur lors du chargement des départements</Alert></Box>
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
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Gestion des Départements</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
            sx={{
              borderRadius: 2, textTransform: 'none', fontWeight: 600,
              ...(viewMode === 'table' ? { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)', '&:hover': { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)' } } : {}),
            }}
          >Table</Button>
          <Button
            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('cards')}
            sx={{
              borderRadius: 2, textTransform: 'none', fontWeight: 600,
              ...(viewMode === 'cards' ? { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)', '&:hover': { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)' } } : {}),
            }}
          >Cartes</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2, textTransform: 'none', fontWeight: 600,
              background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)' },
            }}
          >
            Nouveau Département
          </Button>
        </Box>
      </Box>
      {viewMode === 'table' ? (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: alpha('#0a2463', 0.04), fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>ID</TableCell>
              <TableCell sx={{ bgcolor: alpha('#0a2463', 0.04), fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Nom</TableCell>
              <TableCell sx={{ bgcolor: alpha('#0a2463', 0.04), fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Responsable</TableCell>
              <TableCell sx={{ bgcolor: alpha('#0a2463', 0.04), fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Créé le</TableCell>
              <TableCell sx={{ bgcolor: alpha('#0a2463', 0.04), fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }} align="center">Actions</TableCell>
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
                        {dep.responsable ? `${dep.responsable.prenom} ${dep.responsable.nom}` : (() => {
                          if (!Array.isArray(users)) return '-';
                          const responsable = users.find((u: User) => u.id === dep.responsable_id);
                          return responsable ? `${responsable.prenom} ${responsable.nom}` : '-';
                        })()}
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
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ fontWeight: 700, fontSize: '1.05rem' }}>{dep.name}</Box>
                  {dep.description && <Box sx={{ mt: 1, color: 'text.secondary' }}>{dep.description}</Box>}
                  <Box sx={{ mt: 2, color: 'text.secondary' }}>
                     <strong>Responsable:</strong> {dep.responsable ? `${dep.responsable.prenom} ${dep.responsable.nom}` : (() => {
                       if (!Array.isArray(users)) return '-';
                       const responsable = users.find((u: User) => u.id === dep.responsable_id);
                       return responsable ? `${responsable.prenom} ${responsable.nom}` : '-';
                     })()}
                  </Box>
                  <Box sx={{ mt: 1, color: 'text.secondary' }}>Créé le: {formatDate(dep.created_at ?? (dep as any).createdAt)}</Box>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleOpenDialog(dep)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Modifier</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(dep)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Supprimer</Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>{selected ? 'Modifier Département' : 'Nouveau Département'}</DialogTitle>
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
                 .filter((u: User) => u.role === 'responsable')
                 .map((u: User) => (
                  <MenuItem key={u.id} value={u.id} disabled={u.actif === false}>{u.prenom} {u.nom}{u.actif === false ? ' (inactif)' : ''}</MenuItem>
                ))}
            </TextField>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button size="small" onClick={clearResponsable}>Effacer responsable</Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} sx={{ borderRadius: 2, textTransform: 'none' }}>Annuler</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)', '&:hover': { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)' } }}>Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous supprimer le département « {selected?.name} » ? Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Annuler</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Departments;
